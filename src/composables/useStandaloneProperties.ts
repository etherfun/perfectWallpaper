/**
 * 三层回退 composable — 独立浏览器模式属性推送层
 *
 * Wallpaper Engine 模式下，`window.wallpaperPropertyListener.applyUserProperties(p)`
 * 由 WE 主动调用，旧 14 个 propertyHandler 收到完整 properties 后触发命令式
 * 模块（sakura/PWCircle/weather/...）渲染。
 *
 * 独立模式（无 WE）下没有 WE 调用 applyUserProperties，旧 handler 不触发，
 * → 樱花/天气/DockBar 等薄壳组件的 DOM 由 propertyHandler 创建，渲染不出来。
 *
 * 本 composable 模拟 WE 的角色：在 Pinia store 三层回退完成 + 桥接安装后，
 * 把当前 store 里的全部字段构造为 `Record<key, { value }>` 形态，调用一次
 * `applyUserProperties(p)`（走 wallpaperPropertyListener 的包装函数）。
 * 14 个旧 handler 收到 properties 后正常触发，所有薄壳组件渲染。
 *
 * 注：
 *   - 必须 installConfigStoreBridge 之后调用（handler 写 config.xxx 会触发 store $patch）
 *   - 必须 useWallpaperProperties 之后调用（确保 window.wallpaperPropertyListener 已挂）
 *   - 与 WE 并存：WE 存在时不调用本函数（避免重复触发），WE 不存在时才调用
 */

import { useConfigStore } from '@/stores/config';

import { setStandaloneFallbackCanceller } from './useWallpaperProperties';

const WE_TIMEOUT_MS = 5000;

/**
 * 检查当前是否处于独立模式（无 Wallpaper Engine 注入）。
 *
 * 判定逻辑：WE 启动后通常 5 秒内会注入 wallpaperPropertyListener.applyUserProperties。
 * 我们不在 hook 阶段直接判定（因为 standalone fallback 已经挂上去了），
 * 而是在调用 useStandaloneProperties 时直接构造 properties 推送一次 —
 * WE 模式下因为 wallpaperPropertyListener.applyUserProperties 已被包装，
 * 重叠调用也安全（重复设置相同值）。
 *
 * 因此本函数不返回值，直接 push 一份完整 properties 到现有 listener。
 */
export function useStandaloneProperties(): void {
    if (typeof window === 'undefined') return;

    const store = useConfigStore();
    const state = store.$state;

    // 把 Pinia store 当前 state 转成 WallpaperProperties 形态。
    // 14 个 handler 都用 `if (properties.xxx)` 做防御，且读 `properties.xxx.value`，
    // 所以任意字段缺失/为 undefined 都不会崩 — 跳过即可。
    const properties: Record<string, { value: unknown }> = {};
    for (const [key, value] of Object.entries(state)) {
        // 跳过 runtime 子对象（不是 WE property 字段）和非 plain 值
        if (value === null || value === undefined) continue;
        if (typeof value === 'object') {
            // date_format 是嵌套对象，深拷贝为 { value: {...} }
            // NOTE: 不能用 structuredClone() — Pinia 把 state 用 Vue Proxy 包装，
            // structuredClone 会抛 DataCloneError。改用 JSON 走一遍会经过
            // reactive proxy 的 toJSON 转换，输出纯可序列化对象。
            properties[key] = { value: JSON.parse(JSON.stringify(value)) };
        } else if (typeof value === 'function') {
            continue;
        } else {
            properties[key] = { value };
        }
    }

    // 补充 global_settings_language（wallpaperPropertyListener 依赖此键触发 loadI18n）
    if (!properties.global_settings_language) {
        properties.global_settings_language = { value: store.language || 'zh-CN' };
    }

    // ===== 独立模式开启/默认值 =====
    // 以下字段在 WE 模式下由 settings panel 推送，但在独立模式下从不存在于 store.$state
    // 中（因为它们不在 BUILTIN_DEFAULTS 内）。不加默认值会导致对应 handler 永远
    // 收不到这些属性，功能无法启用。此处统一注入独立模式的合理默认值。

    // server_mode — 插件服务模式（系统监控/播放器控制等功能依赖）
    if (!properties.server_mode) {
        properties.server_mode = { value: true };
    }
    // dockbar_enabled — Dock 栏
    if (!properties.dockbar_enabled) {
        properties.dockbar_enabled = { value: true };
    }
    // sysmon_enabled — 系统监控
    if (!properties.sysmon_enabled) {
        properties.sysmon_enabled = { value: true };
    }
    // wallpaper_updata_open_on_update — 更新日志自动打开
    if (!properties.wallpaper_updata_open_on_update) {
        properties.wallpaper_updata_open_on_update = { value: true };
    }
    // wallpaper_updata — 触发一次更新日志打开（FirstLoad 不会触发，需要额外处理）
    if (!properties.wallpaper_updata) {
        properties.wallpaper_updata = { value: 1 };
    }

    // 调用现有 listener（WE 模式也会走到这里 — 重叠调用安全）
    const listener = (
        window as unknown as {
            wallpaperPropertyListener?: { applyUserProperties?: (p: Record<string, { value: unknown }>) => void };
        }
    ).wallpaperPropertyListener;

    if (listener && typeof listener.applyUserProperties === 'function') {
        try {
            // FirstLoad=true 让每个 handler 跑完整初始化逻辑（不仅是设置 config）
            // 类型为 Record<string, any> 与 wallpaperPropertyListener.applyUserProperties
            // 形参签名一致（见 src/propertyHandlers/wallpaperPropertyListener.ts:189）
            (listener.applyUserProperties as (p: Record<string, { value: unknown }>) => void)(properties);
            console.log(
                `[StandaloneProperties] pushed ${Object.keys(properties).length} keys (FirstLoad=true)`
            );
        } catch (err) {
            console.warn('[StandaloneProperties] failed to push', err);
        }
    } else {
        console.warn('[StandaloneProperties] no wallpaperPropertyListener available');
    }
}

/**
 * 等待 Wallpaper Engine 注入指定毫秒数后仍未触发 → 触发 standalone 推送。
 *
 * WE 模式下 setTimeout 会在 WE 注入后被 cancel（由外部调用方决定）；
 * 如果 WE 始终未注入，超时后本函数会调用一次 useStandaloneProperties()，
 * 让独立浏览器模式也能渲染所有薄壳组件。
 */
export function armStandaloneFallback(timeoutMs: number = WE_TIMEOUT_MS): () => void {
    let fired = false;
    const timer = setTimeout(() => {
        if (fired) return;
        fired = true;
        console.log(`[StandaloneProperties] no WE injection within ${timeoutMs}ms — arming standalone fallback`);
        useStandaloneProperties();
    }, timeoutMs);

    // 返回 cancel 函数：WE 注入成功后调用，避免重复触发
    const cancel = (): void => {
        fired = true;
        clearTimeout(timer);
    };

    // 注册取消函数到 useWallpaperProperties — 真实 WE 注入时它会自动调用
    setStandaloneFallbackCanceller(cancel);

    return cancel;
}
