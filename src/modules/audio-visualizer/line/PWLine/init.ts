/**
 * PWLine 初始化逻辑
 *
 * 从 `line/PWLine.ts` 拆出的 PWLineInit。
 */

import { rt, state } from './state';

/**
 * Initialize the PWLine canvas and context
 */
export function PWLineInit(): void {
    const canvasEl = document.querySelector('#CanLine') as HTMLCanvasElement | null;
    if (!canvasEl) {
        return;
    }
    state.CanLine = canvasEl;
    state.CTXLine = canvasEl.getContext('2d')!;

    state.CanLine.width = state.w = window.innerWidth;
    state.CanLine.height = state.h = window.innerHeight;
    state.minW = Math.min(state.w, state.h);
    state.maxW = Math.max(state.w, state.h);
    state.CTXLine.lineWidth = rt().PWLineParam.lineWidth;
    state.CTXLine.shadowBlur = rt().PWLineParam.shadowBlur;
}
