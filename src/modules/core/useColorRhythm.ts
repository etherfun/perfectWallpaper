/**
 * 彩色律动 RAF 循环 composable
 *
 * 替换原 `startTimeColorRhythmLoop` / `stopTimeColorRhythmLoop` /
 * `startDateColorRhythmLoop` / `stopDateColorRhythmLoop` 等 4 个并列函数。
 *
 * 用法：
 *   useColorRhythm(() => store.time_color_rhythm, (color) => {
 *     el.style.color = color;
 *   });
 *
 * 内部维护一个 RAF id，自动随组件卸载停止。
 */

import { onBeforeUnmount, watch, type WatchSource } from 'vue';

const STEP = 1;
const HUE_MIN = 0;
const HUE_MAX = 255;
const SATURATION = '90%';
const LIGHTNESS = '50%';

export interface UseColorRhythmOptions {
    /** 步长（每帧 HUE 增量），默认 1 */
    step?: number;
}

export function useColorRhythm(
    enabled: WatchSource<boolean>,
    apply: (color: string) => void,
    options: UseColorRhythmOptions = {}
): { stop: () => void } {
    const step = options.step ?? STEP;
    let rafId: number | null = null;
    let hue = HUE_MIN;
    let direction: 1 | -1 = 1;

    const tick = (): void => {
        hue += direction * step;
        if (hue > HUE_MAX) {
            hue = HUE_MAX;
            direction = -1;
        } else if (hue < HUE_MIN) {
            hue = HUE_MIN;
            direction = 1;
        }
        apply(`hsl(${hue},${SATURATION},${LIGHTNESS})`);
        rafId = requestAnimationFrame(tick);
    };

    const stop = (): void => {
        if (rafId !== null) {
            cancelAnimationFrame(rafId);
            rafId = null;
        }
    };

    const start = (): void => {
        stop();
        rafId = requestAnimationFrame(tick);
    };

    watch(
        enabled,
        on => {
            if (on) {
                start();
            } else {
                stop();
                apply('');
            }
        },
        { immediate: true }
    );

    onBeforeUnmount(stop);

    return { stop };
}
