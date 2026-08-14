/**
 * PWLine 绘制逻辑：三种折线样式
 *
 * 从 `line/PWLine.ts` 拆出的 PWLineStyle1 / PWLineStyle2 / PWLineStyle3。
 */

import { rt, state } from './state';

/**
 * Draw style 1 - Lines with optional middle line
 */
export function PWLineStyle1(): void {
    const arr1 = rt().PWLineParam.arr1;
    const arr2 = rt().PWLineParam.arr2;
    const last = rt().PWLineParam.LineDensity - 1;

    // Draw lines
    state.CTXLine.beginPath();
    for (let i = 0; i < rt().PWLineParam.LineDensity; i++) {
        const a1 = arr1[i];
        const a2 = arr2[i];
        if (!a1 || !a2) continue;
        state.CTXLine.moveTo(a1.x, a1.y);
        state.CTXLine.lineTo(a2.x, a2.y);
    }
    state.CTXLine.stroke();

    // Top middle line
    if (rt().PWLineParam.Direction === 1 && rt().PWLineParam.MiddleLine) {
        const a0 = arr2[0];
        const aLast = arr2[last];
        if (a0 && aLast) {
            state.CTXLine.beginPath();
            state.CTXLine.moveTo(a0.x, a0.y);
            state.CTXLine.lineTo(aLast.x, aLast.y);
            state.CTXLine.stroke();
        }
    }

    // Bottom middle line
    if (rt().PWLineParam.Direction === 2 && rt().PWLineParam.MiddleLine) {
        const a0 = arr1[0];
        const aLast = arr1[last];
        if (a0 && aLast) {
            state.CTXLine.beginPath();
            state.CTXLine.moveTo(a0.x, a0.y);
            state.CTXLine.lineTo(aLast.x, aLast.y);
            state.CTXLine.stroke();
        }
    }

    // Bidirectional middle line
    if (rt().PWLineParam.Direction === 3 && rt().PWLineParam.MiddleLine) {
        const a1First = arr1[0];
        const a2First = arr2[0];
        const a1Last = arr1[last];
        const a2Last = arr2[last];
        if (a1First && a2First && a1Last && a2Last) {
            state.CTXLine.beginPath();
            state.CTXLine.moveTo((a2First.x + a1First.x) / 2, (a2First.y + a1First.y) / 2);
            state.CTXLine.lineTo((a2Last.x + a1Last.x) / 2, (a2Last.y + a1Last.y) / 2);
            state.CTXLine.stroke();
        }
    }
}

/**
 * Draw style 2 - Filled shapes with connecting lines
 */
export function PWLineStyle2(): void {
    const arr1 = rt().PWLineParam.arr1;
    const arr2 = rt().PWLineParam.arr2;
    const last = rt().PWLineParam.LineDensity - 1;

    // Top line
    if (
        rt().PWLineParam.Direction !== 2 ||
        (rt().PWLineParam.Direction === 2 && rt().PWLineParam.MiddleLine)
    ) {
        const first = arr1[0];
        if (first) {
            state.CTXLine.beginPath();
            state.CTXLine.moveTo(first.x, first.y);
            for (let i = 0; i < rt().PWLineParam.LineDensity; i++) {
                const p = arr1[i];
                if (!p) continue;
                state.CTXLine.lineTo(p.x, p.y);
            }
            state.CTXLine.stroke();
        }
    }

    // Bottom line
    if (
        rt().PWLineParam.Direction !== 1 ||
        (rt().PWLineParam.Direction === 1 && rt().PWLineParam.MiddleLine)
    ) {
        const first = arr2[0];
        if (first) {
            state.CTXLine.beginPath();
            state.CTXLine.moveTo(first.x, first.y);
            for (let i = 0; i < rt().PWLineParam.LineDensity; i++) {
                const p = arr2[i];
                if (!p) continue;
                state.CTXLine.lineTo(p.x, p.y);
            }
            state.CTXLine.stroke();
        }
    }

    // Bidirectional middle line
    if (rt().PWLineParam.Direction === 3 && rt().PWLineParam.MiddleLine) {
        const a1First = arr1[0];
        const a2First = arr2[0];
        const a1Last = arr1[last];
        const a2Last = arr2[last];
        if (a1First && a2First && a1Last && a2Last) {
            state.CTXLine.beginPath();
            state.CTXLine.moveTo((a2First.x + a1First.x) / 2, (a2First.y + a1First.y) / 2);
            state.CTXLine.lineTo((a2Last.x + a1Last.x) / 2, (a2Last.y + a1Last.y) / 2);
            state.CTXLine.stroke();
        }
    }

    // Connecting lines
    state.CTXLine.beginPath();
    for (let i = 0; i < rt().PWLineParam.LineDensity; i++) {
        const a1 = arr1[i];
        const a2 = arr2[i];
        if (!a1 || !a2) continue;
        state.CTXLine.moveTo(a1.x, a1.y);
        state.CTXLine.lineTo(a2.x, a2.y);
    }
    state.CTXLine.stroke();
}

/**
 * Draw style 3 - Separate top and bottom lines
 */
export function PWLineStyle3(): void {
    const arr1 = rt().PWLineParam.arr1;
    const arr2 = rt().PWLineParam.arr2;
    const last = rt().PWLineParam.LineDensity - 1;

    // Top line
    if (
        rt().PWLineParam.Direction !== 2 ||
        (rt().PWLineParam.Direction === 2 && rt().PWLineParam.MiddleLine)
    ) {
        const first = arr1[0];
        if (first) {
            state.CTXLine.beginPath();
            state.CTXLine.moveTo(first.x, first.y);
            for (let i = 0; i < rt().PWLineParam.LineDensity; i++) {
                const p = arr1[i];
                if (!p) continue;
                state.CTXLine.lineTo(p.x, p.y);
            }
            state.CTXLine.stroke();
        }
    }

    // Bottom line
    if (
        rt().PWLineParam.Direction !== 1 ||
        (rt().PWLineParam.Direction === 1 && rt().PWLineParam.MiddleLine)
    ) {
        const first = arr2[0];
        if (first) {
            state.CTXLine.beginPath();
            state.CTXLine.moveTo(first.x, first.y);
            for (let i = 0; i < rt().PWLineParam.LineDensity; i++) {
                const p = arr2[i];
                if (!p) continue;
                state.CTXLine.lineTo(p.x, p.y);
            }
            state.CTXLine.stroke();
        }
    }

    // Bidirectional middle line
    if (rt().PWLineParam.Direction === 3 && rt().PWLineParam.MiddleLine) {
        const a1First = arr1[0];
        const a2First = arr2[0];
        const a1Last = arr1[last];
        const a2Last = arr2[last];
        if (a1First && a2First && a1Last && a2Last) {
            state.CTXLine.beginPath();
            state.CTXLine.moveTo((a2First.x + a1First.x) / 2, (a2First.y + a1First.y) / 2);
            state.CTXLine.lineTo((a2Last.x + a1Last.x) / 2, (a2Last.y + a1Last.y) / 2);
            state.CTXLine.stroke();
        }
    }
}
