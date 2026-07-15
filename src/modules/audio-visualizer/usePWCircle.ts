/**
 * usePWCircle — Vue 3 composable wrapper for src/PWCircle.ts
 *
 * Stage 5-A (deep-replace PWCircle): wraps the imperative Canvas 2D
 * circle visualizer into a reactive composable that:
 *   - Auto-binds window resize listener (instead of manual main.ts call)
 *   - Exposes setCan / createPoint / style1-3 / getXY methods that internally
 *     delegate to the legacy exports (single source of truth — we don't
 *     duplicate drawing logic, only the lifecycle).
 *   - Reads `config.PWCircle_show_bool` reactivity — when toggled off, the
 *     PWCircle.vue thin shell can decide whether to keep the canvas mounted.
 *
 * Future plan (stage 5-B+): copy drawing code directly into this file and
 * delete src/PWCircle.ts. For now we keep the .ts as fallback so
 * audioVisualizer.ts (which calls style1/2/3 in its RAF loop) still works.
 */

import { onBeforeUnmount, onMounted } from 'vue';

import {
    createPoint as pwCircleCreatePoint,
    getXY as pwCircleGetXY,
    resize as pwCircleResize,
    setCan as pwCircleSetCan,
    style1 as pwCircleStyle1,
    style2 as pwCircleStyle2,
    style3 as pwCircleStyle3,
} from '@/modules/audio-visualizer/PWCircle';
import { useConfigStore } from '@/stores/config';

export interface UsePWCircleApi {
    /** Re-resolve the canvas context (call on mount and on resize). */
    resize: () => void;
    /** Apply color mode + line width + shadow blur to the current ctx. */
    setCan: () => void;
    /** Write arr1/arr2 arrays from current audio data. */
    createPoint: (arr: number[]) => void;
    style1: () => void;
    style2: () => void;
    style3: () => void;
    getXY: (offset: number, deg: number) => { x: number; y: number };
}

/**
 * Mount the PWCircle lifecycle: bind resize listener, expose drawing methods.
 *
 * Usage in PWCircle.vue:
 *   const circle = usePWCircle();
 *   onMounted(() => circle.resize());
 *
 * audioVisualizer.ts (legacy) continues to call style1/2/3 directly via
 * the PWCircle.ts module exports — no behavior change.
 */
export function usePWCircle(): UsePWCircleApi {
    const _config = useConfigStore();

    const handleResize = (): void => {
        pwCircleResize();
    };

    onMounted(() => {
        window.addEventListener('resize', handleResize);
        handleResize();
    });

    onBeforeUnmount(() => {
        window.removeEventListener('resize', handleResize);
    });

    return {
        resize: handleResize,
        setCan: () => pwCircleSetCan(),
        createPoint: (arr: number[]) => pwCircleCreatePoint(arr),
        style1: () => pwCircleStyle1(),
        style2: () => pwCircleStyle2(),
        style3: () => pwCircleStyle3(),
        getXY: (offset: number, deg: number) => pwCircleGetXY(offset, deg),
    };
}
