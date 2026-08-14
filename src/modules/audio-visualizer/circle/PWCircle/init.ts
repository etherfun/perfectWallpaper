/**
 * PWCircle 初始化逻辑
 *
 * 从 `circle/PWCircle.ts` 拆出的 resize。
 */

import { rt, state } from './state';

/**
 * Handle window resize
 */
export function resize(): void {
    const canvasEl = document.querySelector('#can') as HTMLCanvasElement | null;
    if (!canvasEl) {
        return;
    }
    state.ctx = canvasEl.getContext('2d');

    state.w = window.innerWidth;
    state.h = window.innerHeight;
    state.minW = Math.min(state.w, state.h);

    // Set canvas dimensions
    canvasEl.width = state.w;
    canvasEl.height = state.h;

    if (state.ctx) {
        state.ctx.lineWidth = rt().param.lineWidth;
        state.ctx.shadowBlur = rt().param.shadowBlur;
    }
    state.rainRad = Math.sqrt(Math.pow(state.h, 2) + Math.pow(state.w, 2));
}
