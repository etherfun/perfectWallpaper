// PWCircle.ts - Audio circle visualizer module
// This module provides circular audio visualization effects

import { useRuntimeStore } from '@/stores/runtime';

const runtimeStore = useRuntimeStore();

// Global canvas and context - initialized in resize()
let ctx: CanvasRenderingContext2D | null = null;
let w: number = 0;
let h: number = 0;
let minW: number = 0;
let circleX: number = 0;
let circleY: number = 0;
let roh: number = 0;
let rainRad: number = 0;

// Color rhythm hue value
let hue = 0;

// Color rhythm hue values
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

/**
 * Handle window resize
 */
export function resize(): void {
    const canvasEl = document.querySelector('#can') as HTMLCanvasElement | null;
    if (!canvasEl) {
        return;
    }
    ctx = canvasEl.getContext('2d');

    w = window.innerWidth;
    h = window.innerHeight;
    minW = Math.min(w, h);

    // Set canvas dimensions
    canvasEl.width = w;
    canvasEl.height = h;

    if (ctx) {
        ctx.lineWidth = runtimeStore.param.lineWidth;
        ctx.shadowBlur = runtimeStore.param.shadowBlur;
    }
    rainRad = Math.sqrt(Math.pow(h, 2) + Math.pow(w, 2));
}

/**
 * Set canvas context style based on color mode
 */
export function setCan(): void {
    if (!ctx) return;

    switch (runtimeStore.param.ColorMode) {
        case 1:
            ctx.strokeStyle = runtimeStore.param.color;
            ctx.shadowColor = runtimeStore.param.blurColor;
            break;
        case 2:
            {
                if (hue > 255) {
                    runtimeStore.param.TagNow *= -1;
                    hue = 255;
                }
                if (hue < 0) {
                    runtimeStore.param.TagNow *= -1;
                    hue = 0;
                }
                const color = `hsl(${hue},90%,50%)`;
                hue += runtimeStore.param.TagNow / runtimeStore.param.GradientRate;

                if (runtimeStore.param.SolidColorGradient) {
                    ctx.strokeStyle = color;
                } else {
                    ctx.strokeStyle = runtimeStore.param.color;
                }
                if (runtimeStore.param.BlurColorGradient) {
                    ctx.shadowColor = color;
                } else {
                    ctx.shadowColor = runtimeStore.param.blurColor;
                }
            }
            break;
        case 3:
            {
                const ranX = (rainRad / 3) * Math.cos(roh) + w;
                const ranY = (rainRad / 3) * Math.sin(roh) + h;
                roh = (roh + Math.PI / 300) % (2 * Math.PI);
                circleX = w * runtimeStore.param.cX;
                circleY = h * runtimeStore.param.cY;
                const rainbow = ctx.createRadialGradient(
                    circleX,
                    circleY,
                    0,
                    ranX / 2,
                    ranY / 2,
                    w / 3
                );

                if (runtimeStore.param.ColorRhythm) {
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
                ctx.fillStyle = rainbow;
                ctx.strokeStyle = rainbow;
                ctx.shadowColor = runtimeStore.param.blurColor;
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
            colornow = `hsl(${hue1},90%,50%)`;
            hue1 += runtimeStore.param.TagNow / runtimeStore.param.GradientRate;
            hue1 = hue1 % 255;
            break;
        case 2:
            colornow = `hsl(${hue2},90%,50%)`;
            hue2 += runtimeStore.param.TagNow / runtimeStore.param.GradientRate;
            hue2 = hue2 % 255;
            break;
        case 3:
            colornow = `hsl(${hue3},90%,50%)`;
            hue3 += runtimeStore.param.TagNow / runtimeStore.param.GradientRate;
            hue3 = hue3 % 255;
            break;
        case 4:
            colornow = `hsl(${hue4},90%,50%)`;
            hue4 += runtimeStore.param.TagNow / runtimeStore.param.GradientRate;
            hue4 = hue4 % 255;
            break;
        case 5:
            colornow = `hsl(${hue5},90%,50%)`;
            hue5 += runtimeStore.param.TagNow / runtimeStore.param.GradientRate;
            hue5 = hue5 % 255;
            break;
        case 6:
            colornow = `hsl(${hue6},90%,50%)`;
            hue6 += runtimeStore.param.TagNow / runtimeStore.param.GradientRate;
            hue6 = hue6 % 255;
            break;
        case 7:
            colornow = `hsl(${hue7},90%,50%)`;
            hue7 += runtimeStore.param.TagNow / runtimeStore.param.GradientRate;
            hue7 = hue7 % 255;
            break;
        case 8:
            colornow = `hsl(${hue8},90%,50%)`;
            hue8 += runtimeStore.param.TagNow / runtimeStore.param.GradientRate;
            hue8 = hue8 % 255;
            break;
        case 9:
            colornow = `hsl(${hue9},90%,50%)`;
            hue9 += runtimeStore.param.TagNow / runtimeStore.param.GradientRate;
            hue9 = hue9 % 255;
            break;
        case 10:
            colornow = `hsl(${hue10},90%,50%)`;
            hue10 += runtimeStore.param.TagNow / runtimeStore.param.GradientRate;
            hue10 = hue10 % 255;
            break;
    }
    return colornow;
}

/**
 * Create circle visualization points based on audio data
 */
export function createPoint(arr: number[]): void {
    runtimeStore.param.arr1 = [];
    runtimeStore.param.arr2 = [];

    for (let i = 0; i < 128; i++) {
        let deg: number;
        if (runtimeStore.param.showSemiCircle) {
            switch (runtimeStore.param.SemiCircledirection) {
                case 1: // Top
                    deg = (Math.PI / 128) * (i + runtimeStore.param.offsetAngle + 0.5) * -1;
                    break;
                case 2: // Bottom
                    deg = (Math.PI / 128) * (i + runtimeStore.param.offsetAngle + 0.5);
                    break;
                case 3: // Left
                    deg = (Math.PI / 128) * (i + runtimeStore.param.offsetAngle - 179.5);
                    break;
                case 4: // Right
                    deg = (Math.PI / 128) * (i + runtimeStore.param.offsetAngle + 180.5);
                    break;
                default:
                    deg = (Math.PI / 128) * (i + runtimeStore.param.offsetAngle + 0.5) * -1;
            }
        } else {
            // 全圆角度: 与原始 JS 版本一致
            deg =
                (Math.PI / runtimeStore.param.PolygonAngle) *
                (i + runtimeStore.param.offsetAngle) *
                3;
        }

        const arrI = arr[i] ?? 0;
        let w1 = arrI ? arrI : 0;
        const prevWave = runtimeStore.param.waveArr[i];
        const w2: number =
            prevWave !== undefined && prevWave !== 0 ? prevWave - prevWave * 0.25 : 0;
        w1 = Math.max(w1, w2);
        runtimeStore.param.waveArr[i] = w1 = Math.min(w1, 1.2);
        const waveHeight = w1 * runtimeStore.param.range * 100;

        let offset1: number;
        let offset2: number;
        switch (runtimeStore.param.direction) {
            case 1:
                offset1 = (runtimeStore.param.r * minW) / 2 + waveHeight + 1;
                offset2 = (runtimeStore.param.r * minW) / 2;
                break;
            case 2:
                offset1 = (runtimeStore.param.r * minW) / 2;
                offset2 = (runtimeStore.param.r * minW) / 2 - waveHeight - 1;
                break;
            case 3:
                offset1 = (runtimeStore.param.r * minW) / 2 + waveHeight + 1;
                offset2 = (runtimeStore.param.r * minW) / 2 - waveHeight - 1;
                break;
            default:
                offset1 = (runtimeStore.param.r * minW) / 2 + waveHeight + 1;
                offset2 = (runtimeStore.param.r * minW) / 2 - waveHeight - 1;
        }

        const p1 = getXY(offset1, deg);
        const p2 = getXY(offset2, deg);

        runtimeStore.param.arr1.push({ x: p1.x, y: p1.y });
        runtimeStore.param.arr2.push({ x: p2.x, y: p2.y });
    }

    if (runtimeStore.param.rotation) {
        runtimeStore.param.offsetAngle +=
            runtimeStore.param.rotation / runtimeStore.param.Polygon;
        if (runtimeStore.param.offsetAngle >= 360) {
            runtimeStore.param.offsetAngle = 0;
        } else if (runtimeStore.param.offsetAngle <= 0) {
            runtimeStore.param.offsetAngle = 360;
        }
    }
}

/**
 * Calculate XY coordinates for a circle point
 */
export function getXY(offset: number, deg: number): { x: number; y: number } {
    const x = Math.cos(deg) * offset + runtimeStore.param.cX * w;
    const y = Math.sin(deg) * offset + runtimeStore.param.cY * h;

    return { x, y };
}

/**
 * Draw style 1 - Radial lines from center
 */
export function style1(): void {
    if (!ctx) return;
    const arr1 = runtimeStore.param.arr1;
    const arr2 = runtimeStore.param.arr2;
    ctx.beginPath();
    for (let i = 0; i < 128; i++) {
        const a1 = arr1[i];
        const a2 = arr2[i];
        if (!a1 || !a2) continue;
        ctx.moveTo(a1.x, a1.y);
        ctx.lineTo(a2.x, a2.y);
    }
    ctx.closePath();
    ctx.stroke();
}

/**
 * Draw style 2 - Two concentric circles with connecting lines
 */
export function style2(): void {
    if (!ctx) return;
    const arr1 = runtimeStore.param.arr1;
    const arr2 = runtimeStore.param.arr2;

    // Outer circle
    ctx.beginPath();
    const outerFirst = arr1[0];
    if (outerFirst) {
        ctx.moveTo(outerFirst.x, outerFirst.y);
        for (let i = 0; i < 128; i++) {
            const p = arr1[i];
            if (!p) continue;
            ctx.lineTo(p.x, p.y);
        }
    }
    if (!runtimeStore.param.showSemiCircle) {
        ctx.closePath();
    }
    ctx.stroke();

    // Inner circle
    ctx.beginPath();
    const innerFirst = arr2[0];
    if (innerFirst) {
        ctx.moveTo(innerFirst.x, innerFirst.y);
        for (let i = 0; i < 128; i++) {
            const p = arr2[i];
            if (!p) continue;
            ctx.lineTo(p.x, p.y);
        }
    }
    if (!runtimeStore.param.showSemiCircle) {
        ctx.closePath();
    }
    ctx.stroke();

    // Connecting lines
    ctx.beginPath();
    for (let i = 0; i < 128; i++) {
        const a1 = arr1[i];
        const a2 = arr2[i];
        if (!a1 || !a2) continue;
        ctx.moveTo(a1.x, a1.y);
        ctx.lineTo(a2.x, a2.y);
    }
    ctx.closePath();
    ctx.stroke();
}

/**
 * Draw style 3 - Two concentric circles without connecting lines
 */
export function style3(): void {
    if (!ctx) return;
    const arr1 = runtimeStore.param.arr1;
    const arr2 = runtimeStore.param.arr2;

    // Outer circle
    ctx.beginPath();
    const outerFirst = arr1[0];
    if (outerFirst) {
        ctx.moveTo(outerFirst.x, outerFirst.y);
        for (let i = 0; i < 128; i++) {
            const p = arr1[i];
            if (!p) continue;
            ctx.lineTo(p.x, p.y);
        }
    }
    if (!runtimeStore.param.showSemiCircle) {
        ctx.closePath();
    }
    ctx.stroke();

    // Inner circle
    ctx.beginPath();
    const innerFirst = arr2[0];
    if (innerFirst) {
        ctx.moveTo(innerFirst.x, innerFirst.y);
        for (let i = 0; i < 128; i++) {
            const p = arr2[i];
            if (!p) continue;
            ctx.lineTo(p.x, p.y);
        }
    }
    if (!runtimeStore.param.showSemiCircle) {
        ctx.closePath();
    }
    ctx.stroke();
}
