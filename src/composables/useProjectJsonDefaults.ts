/**
 * 三层回退 composable — project.json 默认值层
 *
 * 启动时 fetch('./project.json')，读取 general.properties 对象，
 * 把每个有 value 字段的 key 构造为 { [key]: { value: prop.value } } 形式，
 * 注入 useConfigStore（最低优先级层）。
 *
 * 失败时静默 — 调用方继续使用内置 BUILTIN_DEFAULTS。
 */

import { useConfigStore } from '@/stores/config';

interface ProjectJsonShape {
    general?: {
        properties?: Record<string, { value?: unknown } | undefined>;
    };
}

export async function useProjectJsonDefaults(): Promise<void> {
    const store = useConfigStore();
    try {
        const res = await fetch('./project.json');
        if (!res.ok) {
            console.warn(`[project.json] fetch returned ${res.status}, skipping`);
            return;
        }
        const data = (await res.json()) as ProjectJsonShape;
        const props = data.general?.properties;
        if (!props || typeof props !== 'object') {
            console.warn('[project.json] general.properties missing, skipping');
            return;
        }
        const values: Record<string, { value: unknown }> = {};
        for (const [k, v] of Object.entries(props)) {
            if (v && typeof v === 'object' && 'value' in v) {
                values[k] = { value: v.value };
            }
        }
        store.applyProjectJsonDefaults(values);
    } catch (err) {
        console.warn('[project.json] failed to load', err);
    }
}
