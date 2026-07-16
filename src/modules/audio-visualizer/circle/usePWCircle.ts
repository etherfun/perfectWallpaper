import { onBeforeUnmount, onMounted } from 'vue';

import { useConfigStore } from '@/stores/config';

import {
    createPoint as pwCircleCreatePoint,
    getXY as pwCircleGetXY,
    resize as pwCircleResize,
    setCan as pwCircleSetCan,
    style1 as pwCircleStyle1,
    style2 as pwCircleStyle2,
    style3 as pwCircleStyle3,
} from './PWCircle';

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
