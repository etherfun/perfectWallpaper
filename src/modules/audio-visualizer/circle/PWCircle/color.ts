/**
 * PWCircle 颜色逻辑：颜色模式样式设置与节奏色获取
 *
 * 从 `circle/PWCircle.ts` 拆出的 setCan（getColor 为模块私有）。
 */

import { rt, state } from './state';

/**
 * Set canvas context style based on color mode
 */
export function setCan(): void {
    if (!state.ctx) return;

    switch (rt().param.ColorMode) {
        case 1:
            state.ctx.strokeStyle = rt().param.color;
            state.ctx.shadowColor = rt().param.blurColor;
            break;
        case 2:
            {
                if (state.hue > 255) {
                    rt().param.TagNow *= -1;
                    state.hue = 255;
                }
                if (state.hue < 0) {
                    rt().param.TagNow *= -1;
                    state.hue = 0;
                }
                const color = `hsl(${state.hue},90%,50%)`;
                state.hue += rt().param.TagNow / rt().param.GradientRate;

                if (rt().param.SolidColorGradient) {
                    state.ctx.strokeStyle = color;
                } else {
                    state.ctx.strokeStyle = rt().param.color;
                }
                if (rt().param.BlurColorGradient) {
                    state.ctx.shadowColor = color;
                } else {
                    state.ctx.shadowColor = rt().param.blurColor;
                }
            }
            break;
        case 3:
            {
                const ranX = (state.rainRad / 3) * Math.cos(state.roh) + state.w;
                const ranY = (state.rainRad / 3) * Math.sin(state.roh) + state.h;
                state.roh = (state.roh + Math.PI / 300) % (2 * Math.PI);
                state.circleX = state.w * rt().param.cX;
                state.circleY = state.h * rt().param.cY;
                const rainbow = state.ctx.createRadialGradient(
                    state.circleX,
                    state.circleY,
                    0,
                    ranX / 2,
                    ranY / 2,
                    state.w / 3
                );

                if (rt().param.ColorRhythm) {
                    rainbow.addColorStop(0.1, getColor(10));
                    rainbow.addColorStop(0.2, getColor(9));
                    rainbow.addColorStop(0.3, getColor(8));
                    rainbow.addColorStop(0.4, getColor(7));
                    rainbow.addColorStop(0.5, getColor(6));
                    rainbow.addColorStop(0.6, getColor(5));
                    rainbow.addColorStop(0.7, getColor(4));
                    rainbow.addColorStop(0.8, getColor(3));
                    rainbow.addColorStop(0.9, getColor(2));
                    rainbow.addColorStop(1.0, getColor(1));
                } else {
                    rainbow.addColorStop(0, 'magenta');
                    rainbow.addColorStop(0.25, 'blue');
                    rainbow.addColorStop(0.5, 'green');
                    rainbow.addColorStop(0.75, 'yellow');
                    rainbow.addColorStop(1.0, 'red');
                }
                state.ctx.fillStyle = rainbow;
                state.ctx.strokeStyle = rainbow;
                state.ctx.shadowColor = rt().param.blurColor;
            }
            break;
    }
}

/**
 * Get color based on case value for color rhythm effect
 */
function getColor(casev: number): string {
    let colornow: string = '';
    switch (casev) {
        case 1:
            colornow = `hsl(${state.hue1},90%,50%)`;
            state.hue1 += rt().param.TagNow / rt().param.GradientRate;
            state.hue1 = state.hue1 % 255;
            break;
        case 2:
            colornow = `hsl(${state.hue2},90%,50%)`;
            state.hue2 += rt().param.TagNow / rt().param.GradientRate;
            state.hue2 = state.hue2 % 255;
            break;
        case 3:
            colornow = `hsl(${state.hue3},90%,50%)`;
            state.hue3 += rt().param.TagNow / rt().param.GradientRate;
            state.hue3 = state.hue3 % 255;
            break;
        case 4:
            colornow = `hsl(${state.hue4},90%,50%)`;
            state.hue4 += rt().param.TagNow / rt().param.GradientRate;
            state.hue4 = state.hue4 % 255;
            break;
        case 5:
            colornow = `hsl(${state.hue5},90%,50%)`;
            state.hue5 += rt().param.TagNow / rt().param.GradientRate;
            state.hue5 = state.hue5 % 255;
            break;
        case 6:
            colornow = `hsl(${state.hue6},90%,50%)`;
            state.hue6 += rt().param.TagNow / rt().param.GradientRate;
            state.hue6 = state.hue6 % 255;
            break;
        case 7:
            colornow = `hsl(${state.hue7},90%,50%)`;
            state.hue7 += rt().param.TagNow / rt().param.GradientRate;
            state.hue7 = state.hue7 % 255;
            break;
        case 8:
            colornow = `hsl(${state.hue8},90%,50%)`;
            state.hue8 += rt().param.TagNow / rt().param.GradientRate;
            state.hue8 = state.hue8 % 255;
            break;
        case 9:
            colornow = `hsl(${state.hue9},90%,50%)`;
            state.hue9 += rt().param.TagNow / rt().param.GradientRate;
            state.hue9 = state.hue9 % 255;
            break;
        case 10:
            colornow = `hsl(${state.hue10},90%,50%)`;
            state.hue10 += rt().param.TagNow / rt().param.GradientRate;
            state.hue10 = state.hue10 % 255;
            break;
    }
    return colornow;
}
