/**
 * setInterval 封装 — Vue 风格
 *
 * 用法：
 *   useUpdateInterval(1000, () => tick(), { immediate: true });
 *
 * 组件卸载自动停止；immediate=false 时首次不触发（由调用方控制）。
 */

import { onBeforeUnmount } from 'vue';

export interface UseUpdateIntervalOptions {
    immediate?: boolean;
}

export function useUpdateInterval(
    ms: number,
    fn: () => void,
    options: UseUpdateIntervalOptions = { immediate: true }
): { stop: () => void; restart: () => void } {
    let id: ReturnType<typeof setInterval> | null = null;

    const stop = (): void => {
        if (id !== null) {
            clearInterval(id);
            id = null;
        }
    };

    const start = (): void => {
        stop();
        if (options.immediate) {
            fn();
        }
        id = setInterval(fn, ms);
    };

    const restart = (): void => {
        start();
    };

    start();
    onBeforeUnmount(stop);

    return { stop, restart };
}
