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
        // 类型擦除：useConfigStore() 返回类型包含具体字段，
        // 但 AppConfig 的字段是动态的（来自 SYNC_DEFAULTS 合并），
        // 用 unknown 容器 + $patch 注入单 key
        (store as unknown as { $patch: (p: Record<string, unknown>) => void }).$patch({
            [key]: value,
        });
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
