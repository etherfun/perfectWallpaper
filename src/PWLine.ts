// PWLine.ts - Audio line visualizer module
// This module provides line-based audio visualization effects

import { useRuntimeStore } from '@/stores/runtime';
import { useConfigStore } from "@/stores/config";

const config = useConfigStore();

const runtimeStore = useRuntimeStore();

// Global canvas and context
let w: number;
let h: number;
let minW: number;
let maxW: number;
let CanLine: HTMLCanvasElement;
let CTXLine: CanvasRenderingContext2D;
let color: string | CanvasGradient;
let originX: number;
let originY: number;
let lineR: number;
let sw: number;
let hue1 = 0;
let hue2 = 25;
let hue3 = 50;
let hue4 = 75;
let hue5 = 100;
let hue6 = 125;
let hue7 = 150;
let hue8 = 175;
let hue9 = 200;
let hue10 = 225;
let hue = 0;

/**
 * Initialize the PWLine canvas and context
 */
export function PWLineInit(): void {
    const canvasEl = document.querySelector('#CanLine') as HTMLCanvasElement | null;
    if (!canvasEl) {
        return;
    }
    CanLine = canvasEl;
    CTXLine = canvasEl.getContext('2d')!;

    CanLine.width = w = window.innerWidth;
    CanLine.height = h = window.innerHeight;
    minW = Math.min(w, h);
    maxW = Math.max(w, h);
    CTXLine.lineWidth = runtimeStore.PWLineParam.lineWidth;
    CTXLine.shadowBlur = runtimeStore.PWLineParam.shadowBlur;
}

/**
 * Set the canvas context style based on color mode
 */
export function setCTXLine(): void {
    switch (runtimeStore.PWLineParam.ColorMode) {
        case 1:
            CTXLine.strokeStyle = runtimeStore.PWLineParam.color;
            CTXLine.shadowColor = runtimeStore.PWLineParam.blurColor;
            break;
        case 2:
            if (hue > 255) {
                runtimeStore.PWLineParam.TagNow *= -1;
                hue = 255;
            }
            if (hue < 0) {
                runtimeStore.PWLineParam.TagNow *= -1;
                hue = 0;
            }
            color = `hsl(${hue},90%,50%)`;
            hue += runtimeStore.PWLineParam.TagNow / runtimeStore.PWLineParam.GradientRate;

            if (runtimeStore.PWLineParam.SolidColorGradient) {
                CTXLine.strokeStyle = color;
            } else {
                CTXLine.strokeStyle = runtimeStore.PWLineParam.color;
            }
            if (runtimeStore.PWLineParam.BlurColorGradient) {
                CTXLine.shadowColor = color as string;
            } else {
                CTXLine.shadowColor = runtimeStore.PWLineParam.blurColor;
            }
            break;
        case 3:
            {
                originX = maxW * runtimeStore.PWLineParam.LineX;
                originY = minW * runtimeStore.PWLineParam.LineY;
                const gradientRadius = lineR > 0 ? lineR : minW / 2;
                const rainbow = CTXLine.createRadialGradient(
                    originX,
                    originY,
                    0,
                    originX,
                    originY,
                    gradientRadius
                );

                if (runtimeStore.PWLineParam.ColorRhythm) {
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
                color = rainbow;
                CTXLine.fillStyle = color;
                CTXLine.strokeStyle = color;
                CTXLine.shadowColor = runtimeStore.PWLineParam.blurColor;
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
            colornow = `hsl(${hue1},90%,50%)`;
            hue1 += runtimeStore.PWLineParam.TagNow / runtimeStore.PWLineParam.GradientRate;
            hue1 = hue1 % 255;
            break;
        case 2:
            colornow = `hsl(${hue2},90%,50%)`;
            hue2 += runtimeStore.PWLineParam.TagNow / runtimeStore.PWLineParam.GradientRate;
            hue2 = hue2 % 255;
            break;
        case 3:
            colornow = `hsl(${hue3},90%,50%)`;
            hue3 += runtimeStore.PWLineParam.TagNow / runtimeStore.PWLineParam.GradientRate;
            hue3 = hue3 % 255;
            break;
        case 4:
            colornow = `hsl(${hue4},90%,50%)`;
            hue4 += runtimeStore.PWLineParam.TagNow / runtimeStore.PWLineParam.GradientRate;
            hue4 = hue4 % 255;
            break;
        case 5:
            colornow = `hsl(${hue5},90%,50%)`;
            hue5 += runtimeStore.PWLineParam.TagNow / runtimeStore.PWLineParam.GradientRate;
            hue5 = hue5 % 255;
            break;
        case 6:
            colornow = `hsl(${hue6},90%,50%)`;
            hue6 += runtimeStore.PWLineParam.TagNow / runtimeStore.PWLineParam.GradientRate;
            hue6 = hue6 % 255;
            break;
        case 7:
            colornow = `hsl(${hue7},90%,50%)`;
            hue7 += runtimeStore.PWLineParam.TagNow / runtimeStore.PWLineParam.GradientRate;
            hue7 = hue7 % 255;
            break;
        case 8:
            colornow = `hsl(${hue8},90%,50%)`;
            hue8 += runtimeStore.PWLineParam.TagNow / runtimeStore.PWLineParam.GradientRate;
            hue8 = hue8 % 255;
            break;
        case 9:
            colornow = `hsl(${hue9},90%,50%)`;
            hue9 += runtimeStore.PWLineParam.TagNow / runtimeStore.PWLineParam.GradientRate;
            hue9 = hue9 % 255;
            break;
        case 10:
            colornow = `hsl(${hue10},90%,50%)`;
            hue10 += runtimeStore.PWLineParam.TagNow / runtimeStore.PWLineParam.GradientRate;
            hue10 = hue10 % 255;
            break;
    }
    return colornow;
}

/**
 * Create line visualization points based on audio data
 */
export function PWLineCreatePoint(arr: number[]): void {
    runtimeStore.PWLineParam.arr1 = [];
    runtimeStore.PWLineParam.arr2 = [];
    const iv = (120 - runtimeStore.PWLineParam.LineDensity) / 2;

    if (runtimeStore.PWLineParam.LinePosition === 1) {
        sw =
            ((maxW - runtimeStore.PWLineParam.LineDensity * CTXLine.lineWidth) /
                (runtimeStore.PWLineParam.LineDensity - 1)) *
            runtimeStore.PWLineParam.sw;
    } else {
        sw =
            ((minW - runtimeStore.PWLineParam.LineDensity * CTXLine.lineWidth) /
                (runtimeStore.PWLineParam.LineDensity - 1)) *
            runtimeStore.PWLineParam.sw;
    }

    for (let i = iv, j = 0; i < runtimeStore.PWLineParam.LineDensity + iv; i++, j++) {
        const arrI = arr[i] ?? 0;
        let w1 = arrI ? arrI : 0;
        const prevWave = runtimeStore.PWLineParam.waveArr[i];
        const w2: number = prevWave !== undefined && prevWave !== 0 ? prevWave - 0.1 : 0;
        w1 = Math.max(w1, w2);
        runtimeStore.PWLineParam.waveArr[i] = w1 = Math.min(w1, 1.2);
        const waveHeight = w1 * runtimeStore.PWLineParam.range * 100;

        let Deviation1: number;
        let Deviation2: number;
        switch (runtimeStore.PWLineParam.Direction) {
            case 1:
                Deviation1 = -waveHeight - 1;
                Deviation2 = 1;
                break;
            case 2:
                Deviation1 = -1;
                Deviation2 = waveHeight + 1;
                break;
            case 3:
                Deviation1 = -waveHeight - 1;
                Deviation2 = waveHeight + 1;
                break;
            default:
                Deviation1 = -waveHeight - 1;
                Deviation2 = waveHeight + 1;
        }

        const p1 = getLineXY(Deviation1, j);
        const p2 = getLineXY(Deviation2, j);

        runtimeStore.PWLineParam.arr1.push({ x: p1.x, y: p1.y });
        runtimeStore.PWLineParam.arr2.push({ x: p2.x, y: p2.y });
    }

    if (runtimeStore.PWLineParam.LinePosition === 1) {
        const mid = runtimeStore.PWLineParam.arr1[runtimeStore.PWLineParam.LineDensity / 2 - 1];
        const first = runtimeStore.PWLineParam.arr1[0];
        if (mid && first) {
            lineR = mid.x - first.x;
        }
    } else {
        const mid = runtimeStore.PWLineParam.arr1[runtimeStore.PWLineParam.LineDensity / 2 - 1];
        const first = runtimeStore.PWLineParam.arr1[0];
        if (mid && first) {
            lineR = mid.y - first.y;
        }
    }
}

/**
 * Calculate XY coordinates for a line point
 */
export function getLineXY(Deviation: number, i: number): { x: number; y: number } {
    if (runtimeStore.PWLineParam.LinePosition === 1) {
        const x =
            maxW * runtimeStore.PWLineParam.LineX +
            (i + 0.5 - runtimeStore.PWLineParam.LineDensity / 2) * sw +
            (i + 0.5 - runtimeStore.PWLineParam.LineDensity / 2) * CTXLine.lineWidth;
        const y = minW * runtimeStore.PWLineParam.LineY;
        return { x: x, y: y + Deviation };
    } else {
        const x =
            minW * runtimeStore.PWLineParam.LineY +
            (i + 0.5 - runtimeStore.PWLineParam.LineDensity / 2) * sw +
            (i + 0.5 - runtimeStore.PWLineParam.LineDensity / 2) * CTXLine.lineWidth;
        const y = maxW * runtimeStore.PWLineParam.LineX;
        return { x: y + Deviation, y: x };
    }
}

/**
 * Draw style 1 - Lines with optional middle line
 */
export function PWLineStyle1(): void {
    const arr1 = runtimeStore.PWLineParam.arr1;
    const arr2 = runtimeStore.PWLineParam.arr2;
    const last = runtimeStore.PWLineParam.LineDensity - 1;

    // Draw lines
    CTXLine.beginPath();
    for (let i = 0; i < runtimeStore.PWLineParam.LineDensity; i++) {
        const a1 = arr1[i];
        const a2 = arr2[i];
        if (!a1 || !a2) continue;
        CTXLine.moveTo(a1.x, a1.y);
        CTXLine.lineTo(a2.x, a2.y);
    }
    CTXLine.stroke();

    // Top middle line
    if (runtimeStore.PWLineParam.Direction === 1 && runtimeStore.PWLineParam.MiddleLine) {
        const a0 = arr2[0];
        const aLast = arr2[last];
        if (a0 && aLast) {
            CTXLine.beginPath();
            CTXLine.moveTo(a0.x, a0.y);
            CTXLine.lineTo(aLast.x, aLast.y);
            CTXLine.stroke();
        }
    }

    // Bottom middle line
    if (runtimeStore.PWLineParam.Direction === 2 && runtimeStore.PWLineParam.MiddleLine) {
        const a0 = arr1[0];
        const aLast = arr1[last];
        if (a0 && aLast) {
            CTXLine.beginPath();
            CTXLine.moveTo(a0.x, a0.y);
            CTXLine.lineTo(aLast.x, aLast.y);
            CTXLine.stroke();
        }
    }

    // Bidirectional middle line
    if (runtimeStore.PWLineParam.Direction === 3 && runtimeStore.PWLineParam.MiddleLine) {
        const a1First = arr1[0];
        const a2First = arr2[0];
        const a1Last = arr1[last];
        const a2Last = arr2[last];
        if (a1First && a2First && a1Last && a2Last) {
            CTXLine.beginPath();
            CTXLine.moveTo((a2First.x + a1First.x) / 2, (a2First.y + a1First.y) / 2);
            CTXLine.lineTo((a2Last.x + a1Last.x) / 2, (a2Last.y + a1Last.y) / 2);
            CTXLine.stroke();
        }
    }
}

/**
 * Draw style 2 - Filled shapes with connecting lines
 */
export function PWLineStyle2(): void {
    const arr1 = runtimeStore.PWLineParam.arr1;
    const arr2 = runtimeStore.PWLineParam.arr2;
    const last = runtimeStore.PWLineParam.LineDensity - 1;

    // Top line
    if (
        runtimeStore.PWLineParam.Direction !== 2 ||
        (runtimeStore.PWLineParam.Direction === 2 && runtimeStore.PWLineParam.MiddleLine)
    ) {
        const first = arr1[0];
        if (first) {
            CTXLine.beginPath();
            CTXLine.moveTo(first.x, first.y);
            for (let i = 0; i < runtimeStore.PWLineParam.LineDensity; i++) {
                const p = arr1[i];
                if (!p) continue;
                CTXLine.lineTo(p.x, p.y);
            }
            CTXLine.stroke();
        }
    }

    // Bottom line
    if (
        runtimeStore.PWLineParam.Direction !== 1 ||
        (runtimeStore.PWLineParam.Direction === 1 && runtimeStore.PWLineParam.MiddleLine)
    ) {
        const first = arr2[0];
        if (first) {
            CTXLine.beginPath();
            CTXLine.moveTo(first.x, first.y);
            for (let i = 0; i < runtimeStore.PWLineParam.LineDensity; i++) {
                const p = arr2[i];
                if (!p) continue;
                CTXLine.lineTo(p.x, p.y);
            }
            CTXLine.stroke();
        }
    }

    // Bidirectional middle line
    if (runtimeStore.PWLineParam.Direction === 3 && runtimeStore.PWLineParam.MiddleLine) {
        const a1First = arr1[0];
        const a2First = arr2[0];
        const a1Last = arr1[last];
        const a2Last = arr2[last];
        if (a1First && a2First && a1Last && a2Last) {
            CTXLine.beginPath();
            CTXLine.moveTo((a2First.x + a1First.x) / 2, (a2First.y + a1First.y) / 2);
            CTXLine.lineTo((a2Last.x + a1Last.x) / 2, (a2Last.y + a1Last.y) / 2);
            CTXLine.stroke();
        }
    }

    // Connecting lines
    CTXLine.beginPath();
    for (let i = 0; i < runtimeStore.PWLineParam.LineDensity; i++) {
        const a1 = arr1[i];
        const a2 = arr2[i];
        if (!a1 || !a2) continue;
        CTXLine.moveTo(a1.x, a1.y);
        CTXLine.lineTo(a2.x, a2.y);
    }
    CTXLine.stroke();
}

/**
 * Draw style 3 - Separate top and bottom lines
 */
export function PWLineStyle3(): void {
    const arr1 = runtimeStore.PWLineParam.arr1;
    const arr2 = runtimeStore.PWLineParam.arr2;
    const last = runtimeStore.PWLineParam.LineDensity - 1;

    // Top line
    if (
        runtimeStore.PWLineParam.Direction !== 2 ||
        (runtimeStore.PWLineParam.Direction === 2 && runtimeStore.PWLineParam.MiddleLine)
    ) {
        const first = arr1[0];
        if (first) {
            CTXLine.beginPath();
            CTXLine.moveTo(first.x, first.y);
            for (let i = 0; i < runtimeStore.PWLineParam.LineDensity; i++) {
                const p = arr1[i];
                if (!p) continue;
                CTXLine.lineTo(p.x, p.y);
            }
            CTXLine.stroke();
        }
    }

    // Bottom line
    if (
        runtimeStore.PWLineParam.Direction !== 1 ||
        (runtimeStore.PWLineParam.Direction === 1 && runtimeStore.PWLineParam.MiddleLine)
    ) {
        const first = arr2[0];
        if (first) {
            CTXLine.beginPath();
            CTXLine.moveTo(first.x, first.y);
            for (let i = 0; i < runtimeStore.PWLineParam.LineDensity; i++) {
                const p = arr2[i];
                if (!p) continue;
                CTXLine.lineTo(p.x, p.y);
            }
            CTXLine.stroke();
        }
    }

    // Bidirectional middle line
    if (runtimeStore.PWLineParam.Direction === 3 && runtimeStore.PWLineParam.MiddleLine) {
        const a1First = arr1[0];
        const a2First = arr2[0];
        const a1Last = arr1[last];
        const a2Last = arr2[last];
        if (a1First && a2First && a1Last && a2Last) {
            CTXLine.beginPath();
            CTXLine.moveTo((a2First.x + a1First.x) / 2, (a2First.y + a1First.y) / 2);
            CTXLine.lineTo((a2Last.x + a1Last.x) / 2, (a2Last.y + a1Last.y) / 2);
            CTXLine.stroke();
        }
    }
}
