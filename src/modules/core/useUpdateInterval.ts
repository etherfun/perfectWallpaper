/**
 * setInterval 封装 — Vue 风格
 *
 * 用法：
 *   useUpdateInterval(1000, () => tick(), { immediate: true });
 *   useUpdateInterval(computed(() => ms.value), () => tick());  // 响应式间隔
 *
 * 组件卸载自动停止；immediate=false 时首次不触发（由调用方控制）。
 * `ms` 支持 ref/computed —— restart() 时会读取最新值。
 */

import type { MaybeRef } from 'vue';
import { onBeforeUnmount, toValue } from 'vue';

export interface UseUpdateIntervalOptions {
    immediate?: boolean;
}

export function useUpdateInterval(
    ms: MaybeRef<number>,
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
        id = setInterval(fn, toValue(ms));
    };

    const restart = (): void => {
        start();
    };

    start();
    onBeforeUnmount(stop);

    return { stop, restart };
}
