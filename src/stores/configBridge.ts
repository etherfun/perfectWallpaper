/**
 * ConfigStoreBridge
 *
 * 轻量桥接：把 `src/utils/config`（AppConfig 单例）的每次 setter 写入，
 * 镜像到 Pinia store。这样：
 *   - Vue 组件用 `useConfigStore()` 自动响应（深替换 4 个叶子组件已经在用）
 *   - 旧 .ts 命令式模块继续用 `config.xxx = ...` 写入，双状态自动同步
 *
 * 解决 plan-ex.md R10（Pinia store 与 config 单例双状态不同步）。
 *
 * 调用顺序：
 *   1. `createPinia()` + `app.use(pinia)`（在 Vue 应用中）
 *   2. `installConfigStoreBridge()` — 拿到 store 引用挂到模块级变量
 *   3. 此后任何 `config.xxx = y` 都会自动 `$patch({ [xxx]: y })`
 *
 * 注：必须在 `useConfigStore()` 首次被调用**之后**安装（即 Pinia 已 active）。
 *     main.ts 的 bootstrap() 已经满足这个顺序（先 app.use(pinia) 再 mount）。
 *
 * ────────────────────────────────────────────────────────────────────────
 * Stage 3.5-B 架构边界（已锁定，不要破坏）：
 *
 *   1. Pinia store 覆盖范围：`src/stores/config.ts` 的 BUILTIN_DEFAULTS
 *      全部字段（user-tweakable 设置），以及 `src/stores/runtime.ts` 的
 *      hitokoto 这种**低频** reactive 字段。
 *
 *   2. **不**通过 Pinia 管理的内容（明确保留为命令式单例）：
 *      - `config.runtime.wallpaper`       — WallpaperEffectController（粒子 RAF）
 *      - `config.runtime.param / PWLineParam` — PWCircle/PWLine 渲染参数（RAF）
 *      - `config.runtime.FluidEffect / fluidEffect / FluidEffect2`
 *                                       — WebGL 流体实例（GPU context）
 *      - `config.runtime.playerInfo.audioArray`
 *                                       — 60 Hz 音频频谱（Float32Array 120）
 *      - `config.runtime.playerInfo.colorGroup`
 *                                       — 高频颜色采样数组
 *
 *      上述字段被 WebGL / RAF / 音频 FFT 循环以 60 Hz 频率写入；
 *      若 Pinia 化会让 Vue reactivity 在每帧触发 → 性能崩溃。
 *
 *   3. `appConfig` 单例保留为 `Object.defineProperty` getter/setter 模式，
 *      通过本 bridge 自动镜像单字段写入 → Vue 组件仍可响应式订阅。
 *
 *   4. Vue 组件如需读取 `runtime.*` 的高/低频字段，应通过
 *      `useConfigStore()`（写过的字段）+ 命令式 `appConfig.runtime.xxx`
 *      （未 Pinia 化的字段）混合访问；不要尝试整体 Pinia 化 runtime。
 * ────────────────────────────────────────────────────────────────────────
 */

import { useConfigStore } from './config';

let bridgeInstalled = false;

/**
 * 安装桥接。从此刻起，所有 AppConfig setter 会镜像到 Pinia store。
 *
 * 重复调用幂等。
 */
export function installConfigStoreBridge(): void {
    if (bridgeInstalled) return;
    bridgeInstalled = true;
    // 触发一次 useConfigStore() 确保 store 实例化（不会写入，只是激活）
    useConfigStore();
    console.log('[ConfigStoreBridge] installed (config.xxx → useConfigStore mirror active)');
}

/**
 * config 到 Pinia store 的键名映射。
 *
 * 两套系统的键名风格不同：
 *   - config (SYNC_DEFAULTS)：snake_case（如 `show_sakura`）
 *   - Pinia store (ConfigStoreState)：camelCase（如 `showSakura`）
 *
 * bridge 用 config key 写入 store 时，若 store 中不存在同名声明字段，
 * $patch 会创建非响应式的未声明属性，导致 Vue 组件无法响应变化。
 *
 * 本映射表将 config key 翻译为 store 的声明字段名。
 * 映射表未覆盖的 key：如果 store 中有同名声明字段则正常写入，
 * 否则跳过（由调用方 store.$patch 处理）。
 */
const CONFIG_TO_STORE_KEY_MAP: Record<string, string> = {
    show_sakura: 'showSakura',
};

/**
 * 把单个 key/value 镜像到 Pinia store。
 *
 * 在 AppConfig setter 内调用。如果 bridge 还没安装（pinia 还没 active），
 * 则静默跳过 —— setupWallpaperPropertyListener 在 main.ts 顶层调用时
 * Pinia 还没创建，但它的 propertyHandler 也会在 bootstrap 之后再写入，
 * 所以桥接安装后所有写入都会被捕获。
 *
 * @param key 属性名（如 'show_time'）
 * @param value 新值
 */
export function patchStoreFromConfig(key: string, value: unknown): void {
    if (!bridgeInstalled) return;
    try {
        const store = useConfigStore();
        const storeKey = CONFIG_TO_STORE_KEY_MAP[key] ?? key;
        // 只写入 store 中已声明的字段，避免创建非响应式未声明属性
        if (storeKey in store.$state) {
            (store as unknown as { $patch: (p: Record<string, unknown>) => void }).$patch({
                [storeKey]: value,
            });
        }
    } catch {
        // Pinia 已被销毁（卸载 Vue 应用）或其他异常，吞掉
    }
}

/**
 * 测试用：检查桥接是否已安装
 */
export function isConfigStoreBridgeInstalled(): boolean {
    return bridgeInstalled;
}
