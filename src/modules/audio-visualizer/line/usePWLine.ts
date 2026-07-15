/**
 * usePWLine — Vue 3 composable wrapper for src/PWLine.ts
 *
 * Stage 5-B (deep-replace PWLine): wraps the imperative Canvas 2D
 * line visualizer into a reactive composable that:
 *   - Auto-binds window resize listener (instead of manual main.ts call)
 *   - Exposes PWLineInit / setCTXLine / createPoint / style1-3 / getXY methods
 *     that internally delegate to the legacy exports.
 *   - getColor stays internal to PWLine.ts (only used by PWLineStyle1-3).
 *
 * Mirror of usePWCircle (Stage 5-A). The lifecycle is owned by the Vue
 * component tree, audioVisualizer keeps calling PWLineStyle1-3 via the
 * legacy PWLine.ts module exports.
 */

import { onBeforeUnmount, onMounted } from 'vue';

import { useConfigStore } from '@/stores/config';

import {
    getLineXY as pwLineGetLineXY,
    PWLineCreatePoint as pwLineCreatePoint,
    PWLineInit as pwLineInitFn,
    PWLineStyle1 as pwLineStyle1,
    PWLineStyle2 as pwLineStyle2,
    PWLineStyle3 as pwLineStyle3,
    setCTXLine as pwLineSetCTX,
} from './PWLine';

export interface UsePWLineApi {
    /** Initialize canvas context for the #CanLine element. */
    init: () => void;
    /** Re-apply line width + shadow blur to the current ctx. */
    setCtx: () => void;
    /** Write line point arrays from current audio data. */
    createPoint: (arr: number[]) => void;
    style1: () => void;
    style2: () => void;
    style3: () => void;
    getXY: (deviation: number, i: number) => { x: number; y: number };
}

/**
 * Mount the PWLine lifecycle: bind resize listener, expose drawing methods.
 *
 * Usage in PWLine.vue:
 *   const line = usePWLine();
 *   onMounted(() => line.init());
 *
 * audioVisualizer.ts (legacy) continues to call PWLineStyle1/2/3 directly via
 * the PWLine.ts module exports — no behavior change.
 */
export function usePWLine(): UsePWLineApi {
    const _config = useConfigStore();

    const handleResize = (): void => {
        // PWLineInit re-resolves the canvas context and re-applies geometry.
        // setCTXLine re-applies line width + shadow blur from current config.
        pwLineInitFn();
        pwLineSetCTX();
    };

    onMounted(() => {
        window.addEventListener('resize', handleResize);
        handleResize();
    });

    onBeforeUnmount(() => {
        window.removeEventListener('resize', handleResize);
    });

    return {
        init: handleResize,
        setCtx: () => pwLineSetCTX(),
        createPoint: (arr: number[]) => pwLineCreatePoint(arr),
        style1: () => pwLineStyle1(),
        style2: () => pwLineStyle2(),
        style3: () => pwLineStyle3(),
        getXY: (deviation: number, i: number) => pwLineGetLineXY(deviation, i),
    };
}
