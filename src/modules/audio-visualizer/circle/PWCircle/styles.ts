/**
 * PWCircle 绘制逻辑：三种圆圈样式
 *
 * 从 `circle/PWCircle.ts` 拆出的 style1 / style2 / style3。
 */

import { rt, state } from './state';

/**
 * Draw style 1 - Radial lines from center
 */
export function style1(): void {
    if (!state.ctx) return;
    const param = rt().param;
    const arr1 = param.arr1;
    const arr2 = param.arr2;
    state.ctx.beginPath();
    for (let i = 0; i < 128; i++) {
        const a1 = arr1[i];
        const a2 = arr2[i];
        if (!a1 || !a2) continue;
        state.ctx.moveTo(a1.x, a1.y);
        state.ctx.lineTo(a2.x, a2.y);
    }
    state.ctx.closePath();
    state.ctx.stroke();
}

/**
 * Draw style 2 - Two concentric circles with connecting lines
 */
export function style2(): void {
    if (!state.ctx) return;
    const param = rt().param;
    const arr1 = param.arr1;
    const arr2 = param.arr2;
    const showSemiCircle = param.showSemiCircle;

    // Outer circle
    state.ctx.beginPath();
    const outerFirst = arr1[0];
    if (outerFirst) {
        state.ctx.moveTo(outerFirst.x, outerFirst.y);
        for (let i = 0; i < 128; i++) {
            const p = arr1[i];
            if (!p) continue;
            state.ctx.lineTo(p.x, p.y);
        }
    }
    if (!showSemiCircle) {
        state.ctx.closePath();
    }
    state.ctx.stroke();

    // Inner circle
    state.ctx.beginPath();
    const innerFirst = arr2[0];
    if (innerFirst) {
        state.ctx.moveTo(innerFirst.x, innerFirst.y);
        for (let i = 0; i < 128; i++) {
            const p = arr2[i];
            if (!p) continue;
            state.ctx.lineTo(p.x, p.y);
        }
    }
    if (!showSemiCircle) {
        state.ctx.closePath();
    }
    state.ctx.stroke();

    // Connecting lines
    state.ctx.beginPath();
    for (let i = 0; i < 128; i++) {
        const a1 = arr1[i];
        const a2 = arr2[i];
        if (!a1 || !a2) continue;
        state.ctx.moveTo(a1.x, a1.y);
        state.ctx.lineTo(a2.x, a2.y);
    }
    state.ctx.closePath();
    state.ctx.stroke();
}

/**
 * Draw style 3 - Two concentric circles without connecting lines
 */
export function style3(): void {
    if (!state.ctx) return;
    const param = rt().param;
    const arr1 = param.arr1;
    const arr2 = param.arr2;
    const showSemiCircle = param.showSemiCircle;

    // Outer circle
    state.ctx.beginPath();
    const outerFirst = arr1[0];
    if (outerFirst) {
        state.ctx.moveTo(outerFirst.x, outerFirst.y);
        for (let i = 0; i < 128; i++) {
            const p = arr1[i];
            if (!p) continue;
            state.ctx.lineTo(p.x, p.y);
        }
    }
    if (!showSemiCircle) {
        state.ctx.closePath();
    }
    state.ctx.stroke();

    // Inner circle
    state.ctx.beginPath();
    const innerFirst = arr2[0];
    if (innerFirst) {
        state.ctx.moveTo(innerFirst.x, innerFirst.y);
        for (let i = 0; i < 128; i++) {
            const p = arr2[i];
            if (!p) continue;
            state.ctx.lineTo(p.x, p.y);
        }
    }
    if (!showSemiCircle) {
        state.ctx.closePath();
    }
    state.ctx.stroke();
}
