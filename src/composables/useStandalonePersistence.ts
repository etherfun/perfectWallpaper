/**
 * 三层回退 composable — Pinia store → localStorage 自动持久化
 *
 * 监听 useConfigStore 变化，把变更写入 localStorage.perfectwall_user_properties。
 *
 * 设计目的：
 *   - Wallpaper Engine 模式下，wallpaperPropertyListener.applyUserProperties 在
 *     wallpaperPropertyListener.ts 内手动 savePropertiesToLocalStorage（已存在）。
 *   - 独立浏览器模式下没有 WE 推送，但用户在 Vue 组件/控制台手动改 store 时
 *     也需要持久化到 localStorage，下次刷新能恢复。
 *
 * 实现：
 *   - 用 store.$subscribe 监听 state 变化
 *   - 合并成 { key: { value } } 形式写入 localStorage
 *   - debounce 100ms 避免高频写入
 *
 * 与 useStoredProperties 是反向关系：
 *   - useStoredProperties: localStorage → store（启动时读）
 *   - useStandalonePersistence: store → localStorage（运行时写）
 */

import { useConfigStore } from '@/stores/config';

const STORAGE_KEY = 'perfectwall_user_properties';
const DEBOUNCE_MS = 100;

export function useStandalonePersistence(): () => void {
    if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
        return () => {};
    }

    const store = useConfigStore();

    let timer: number | null = null;

    const flush = (): void => {
        timer = null;
        try {
            const existing = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}') as Record<
                string,
                { value: unknown }
            >;
            const state = store.$state;
            for (const [key, value] of Object.entries(state)) {
                if (value === null || value === undefined) continue;
                if (typeof value === 'function') continue;
                if (typeof value === 'object') {
                    // NOTE: do NOT use structuredClone() here — Pinia wraps state
                    // values in Vue Proxy objects that structuredClone rejects
                    // with DataCloneError. JSON round-trip goes through Vue's
                    // reactive proxy and produces a plain serializable object.
                    existing[key] = { value: JSON.parse(JSON.stringify(value)) };
                } else {
                    existing[key] = { value };
                }
            }
            localStorage.setItem(STORAGE_KEY, JSON.stringify(existing));
        } catch (err) {
            console.warn('[StandalonePersistence] failed to write localStorage', err);
        }
    };

    // store.$subscribe 在 Pinia 中是同步的，debounce 避免高频写入
    const unsub = store.$subscribe(() => {
        if (timer !== null) {
            clearTimeout(timer);
        }
        timer = window.setTimeout(flush, DEBOUNCE_MS);
    });

    // 立即写一次当前状态（确保 localStorage 与 store 初始一致）
    flush();

    return unsub;
}
