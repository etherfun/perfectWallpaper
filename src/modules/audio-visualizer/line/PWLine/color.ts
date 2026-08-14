/**
 * PWLine 颜色逻辑：颜色模式样式设置与节奏色获取
 *
 * 从 `line/PWLine.ts` 拆出的 setCTXLine / getColor。
 */

import { rt, state } from './state';

/**
 * Set the canvas context style based on color mode
 */
export function setCTXLine(): void {
    switch (rt().PWLineParam.ColorMode) {
        case 1:
            state.CTXLine.strokeStyle = rt().PWLineParam.color;
            state.CTXLine.shadowColor = rt().PWLineParam.blurColor;
            break;
        case 2:
            if (state.hue > 255) {
                rt().PWLineParam.TagNow *= -1;
                state.hue = 255;
            }
            if (state.hue < 0) {
                rt().PWLineParam.TagNow *= -1;
                state.hue = 0;
            }
            state.color = `hsl(${state.hue},90%,50%)`;
            state.hue += rt().PWLineParam.TagNow / rt().PWLineParam.GradientRate;

            if (rt().PWLineParam.SolidColorGradient) {
                state.CTXLine.strokeStyle = state.color;
            } else {
                state.CTXLine.strokeStyle = rt().PWLineParam.color;
            }
            if (rt().PWLineParam.BlurColorGradient) {
                state.CTXLine.shadowColor = state.color as string;
            } else {
                state.CTXLine.shadowColor = rt().PWLineParam.blurColor;
            }
            break;
        case 3:
            {
                state.originX = state.maxW * rt().PWLineParam.LineX;
                state.originY = state.minW * rt().PWLineParam.LineY;
                const gradientRadius = state.lineR > 0 ? state.lineR : state.minW / 2;
                const rainbow = state.CTXLine.createRadialGradient(
                    state.originX,
                    state.originY,
                    0,
                    state.originX,
                    state.originY,
                    gradientRadius
                );

                if (rt().PWLineParam.ColorRhythm) {
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
                state.color = rainbow;
                state.CTXLine.fillStyle = state.color;
                state.CTXLine.strokeStyle = state.color;
                state.CTXLine.shadowColor = rt().PWLineParam.blurColor;
            }
            break;
    }
}

/**
 * Get color based on case value for color rhythm effect
 */
export function getColor(casev: number): string {
    let colornow: string = '';
    switch (casev) {
        case 1:
            colornow = `hsl(${state.hue1},90%,50%)`;
            state.hue1 += rt().PWLineParam.TagNow / rt().PWLineParam.GradientRate;
            state.hue1 = state.hue1 % 255;
            break;
        case 2:
            colornow = `hsl(${state.hue2},90%,50%)`;
            state.hue2 += rt().PWLineParam.TagNow / rt().PWLineParam.GradientRate;
            state.hue2 = state.hue2 % 255;
            break;
        case 3:
            colornow = `hsl(${state.hue3},90%,50%)`;
            state.hue3 += rt().PWLineParam.TagNow / rt().PWLineParam.GradientRate;
            state.hue3 = state.hue3 % 255;
            break;
        case 4:
            colornow = `hsl(${state.hue4},90%,50%)`;
            state.hue4 += rt().PWLineParam.TagNow / rt().PWLineParam.GradientRate;
            state.hue4 = state.hue4 % 255;
            break;
        case 5:
            colornow = `hsl(${state.hue5},90%,50%)`;
            state.hue5 += rt().PWLineParam.TagNow / rt().PWLineParam.GradientRate;
            state.hue5 = state.hue5 % 255;
            break;
        case 6:
            colornow = `hsl(${state.hue6},90%,50%)`;
            state.hue6 += rt().PWLineParam.TagNow / rt().PWLineParam.GradientRate;
            state.hue6 = state.hue6 % 255;
            break;
        case 7:
            colornow = `hsl(${state.hue7},90%,50%)`;
            state.hue7 += rt().PWLineParam.TagNow / rt().PWLineParam.GradientRate;
            state.hue7 = state.hue7 % 255;
            break;
        case 8:
            colornow = `hsl(${state.hue8},90%,50%)`;
            state.hue8 += rt().PWLineParam.TagNow / rt().PWLineParam.GradientRate;
            state.hue8 = state.hue8 % 255;
            break;
        case 9:
            colornow = `hsl(${state.hue9},90%,50%)`;
            state.hue9 += rt().PWLineParam.TagNow / rt().PWLineParam.GradientRate;
            state.hue9 = state.hue9 % 255;
            break;
        case 10:
            colornow = `hsl(${state.hue10},90%,50%)`;
            state.hue10 += rt().PWLineParam.TagNow / rt().PWLineParam.GradientRate;
            state.hue10 = state.hue10 % 255;
            break;
    }
    return colornow;
}
