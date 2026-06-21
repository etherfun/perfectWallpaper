/**
 * 三层回退 composable — localStorage 持久化层
 *
 * 启动时读取 localStorage.perfectwall_user_properties（key 形如 { value: ... }），
 * 把值合并进 useConfigStore（中优先级）。
 *
 * 失败时静默 — 调用方继续使用 project.json defaults。
 */

import { useConfigStore } from '@/stores/config';

const STORAGE_KEY = 'perfectwall_user_properties';

export async function useStoredProperties(): Promise<void> {
    const store = useConfigStore();
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) {
            return;
        }
        const parsed = JSON.parse(raw) as Record<string, { value: unknown }>;
        store.applyStoredProperties(parsed);
        console.log(`[Stored] localStorage properties merged: ${Object.keys(parsed).length} keys`);
    } catch (err) {
        console.warn('[Stored] failed to read localStorage', err);
    }
}
