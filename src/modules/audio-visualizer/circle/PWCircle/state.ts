/**
 * PWCircle 共享模块状态
 *
 * 从 `circle/PWCircle.ts` 拆出的模块级变量与惰性 store 访问器，
 * 由同目录其他模块 import 共享（对象属性可写，行为与拆分前一致）。
 */

import { useRuntimeStore } from '@/stores/runtime';

/** Lazy accessor — defers store resolution until first use (avoids Pinia init order issues). */
export function rt() {
    return useRuntimeStore();
}

// Global canvas and context - initialized in resize()
export const state: {
    ctx: CanvasRenderingContext2D | null;
    w: number;
    h: number;
    minW: number;
    circleX: number;
    circleY: number;
    roh: number;
    rainRad: number;
    hue: number;
    hue1: number;
    hue2: number;
    hue3: number;
    hue4: number;
    hue5: number;
    hue6: number;
    hue7: number;
    hue8: number;
    hue9: number;
    hue10: number;
} = {
    ctx: null,
    w: 0,
    h: 0,
    minW: 0,
    circleX: 0,
    circleY: 0,
    roh: 0,
    rainRad: 0,
    hue: 0,
    hue1: 0,
    hue2: 25,
    hue3: 50,
    hue4: 75,
    hue5: 100,
    hue6: 125,
    hue7: 150,
    hue8: 175,
    hue9: 200,
    hue10: 225,
};
