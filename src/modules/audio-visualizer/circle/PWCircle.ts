// PWCircle.ts - Audio circle visualizer module
// This module provides circular audio visualization effects

import { useRuntimeStore } from '@/stores/runtime';

/** Lazy accessor — defers store resolution until first use (avoids Pinia init order issues). */
function rt() { return useRuntimeStore(); }

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
        ctx.lineWidth = rt().param.lineWidth;
        ctx.shadowBlur = rt().param.shadowBlur;
    }
    rainRad = Math.sqrt(Math.pow(h, 2) + Math.pow(w, 2));
}

/**
 * Set canvas context style based on color mode
 */
export function setCan(): void {
    if (!ctx) return;

    switch (rt().param.ColorMode) {
        case 1:
            ctx.strokeStyle = rt().param.color;
            ctx.shadowColor = rt().param.blurColor;
            break;
        case 2:
            {
                if (hue > 255) {
                    rt().param.TagNow *= -1;
                    hue = 255;
                }
                if (hue < 0) {
                    rt().param.TagNow *= -1;
                    hue = 0;
                }
                const color = `hsl(${hue},90%,50%)`;
                hue += rt().param.TagNow / rt().param.GradientRate;

                if (rt().param.SolidColorGradient) {
                    ctx.strokeStyle = color;
                } else {
                    ctx.strokeStyle = rt().param.color;
                }
                if (rt().param.BlurColorGradient) {
                    ctx.shadowColor = color;
                } else {
                    ctx.shadowColor = rt().param.blurColor;
                }
            }
            break;
        case 3:
            {
                const ranX = (rainRad / 3) * Math.cos(roh) + w;
                const ranY = (rainRad / 3) * Math.sin(roh) + h;
                roh = (roh + Math.PI / 300) % (2 * Math.PI);
                circleX = w * rt().param.cX;
                circleY = h * rt().param.cY;
                const rainbow = ctx.createRadialGradient(
                    circleX,
                    circleY,
                    0,
                    ranX / 2,
                    ranY / 2,
                    w / 3
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
                ctx.fillStyle = rainbow;
                ctx.strokeStyle = rainbow;
                ctx.shadowColor = rt().param.blurColor;
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
            hue1 += rt().param.TagNow / rt().param.GradientRate;
            hue1 = hue1 % 255;
            break;
        case 2:
            colornow = `hsl(${hue2},90%,50%)`;
            hue2 += rt().param.TagNow / rt().param.GradientRate;
            hue2 = hue2 % 255;
            break;
        case 3:
            colornow = `hsl(${hue3},90%,50%)`;
            hue3 += rt().param.TagNow / rt().param.GradientRate;
            hue3 = hue3 % 255;
            break;
        case 4:
            colornow = `hsl(${hue4},90%,50%)`;
            hue4 += rt().param.TagNow / rt().param.GradientRate;
            hue4 = hue4 % 255;
            break;
        case 5:
            colornow = `hsl(${hue5},90%,50%)`;
            hue5 += rt().param.TagNow / rt().param.GradientRate;
            hue5 = hue5 % 255;
            break;
        case 6:
            colornow = `hsl(${hue6},90%,50%)`;
            hue6 += rt().param.TagNow / rt().param.GradientRate;
            hue6 = hue6 % 255;
            break;
        case 7:
            colornow = `hsl(${hue7},90%,50%)`;
            hue7 += rt().param.TagNow / rt().param.GradientRate;
            hue7 = hue7 % 255;
            break;
        case 8:
            colornow = `hsl(${hue8},90%,50%)`;
            hue8 += rt().param.TagNow / rt().param.GradientRate;
            hue8 = hue8 % 255;
            break;
        case 9:
            colornow = `hsl(${hue9},90%,50%)`;
            hue9 += rt().param.TagNow / rt().param.GradientRate;
            hue9 = hue9 % 255;
            break;
        case 10:
            colornow = `hsl(${hue10},90%,50%)`;
            hue10 += rt().param.TagNow / rt().param.GradientRate;
            hue10 = hue10 % 255;
            break;
    }
    return colornow;
}

/**
 * Create circle visualization points based on audio data
 */
export function createPoint(arr: number[]): void {
    rt().param.arr1 = [];
    rt().param.arr2 = [];

    for (let i = 0; i < 128; i++) {
        let deg: number;
        if (rt().param.showSemiCircle) {
            switch (rt().param.SemiCircledirection) {
                case 1: // Top
                    deg = (Math.PI / 128) * (i + rt().param.offsetAngle + 0.5) * -1;
                    break;
                case 2: // Bottom
                    deg = (Math.PI / 128) * (i + rt().param.offsetAngle + 0.5);
                    break;
                case 3: // Left
                    deg = (Math.PI / 128) * (i + rt().param.offsetAngle - 179.5);
                    break;
                case 4: // Right
                    deg = (Math.PI / 128) * (i + rt().param.offsetAngle + 180.5);
                    break;
                default:
                    deg = (Math.PI / 128) * (i + rt().param.offsetAngle + 0.5) * -1;
            }
        } else {
            // 全圆角度: 与原始 JS 版本一致
            deg =
                (Math.PI / rt().param.PolygonAngle) *
                (i + rt().param.offsetAngle) *
                3;
        }

        const arrI = arr[i] ?? 0;
        let w1 = arrI ? arrI : 0;
        const prevWave = rt().param.waveArr[i];
        const w2: number =
            prevWave !== undefined && prevWave !== 0 ? prevWave - prevWave * 0.25 : 0;
        w1 = Math.max(w1, w2);
        rt().param.waveArr[i] = w1 = Math.min(w1, 1.2);
        const waveHeight = w1 * rt().param.range * 100;

        let offset1: number;
        let offset2: number;
        switch (rt().param.direction) {
            case 1:
                offset1 = (rt().param.r * minW) / 2 + waveHeight + 1;
                offset2 = (rt().param.r * minW) / 2;
                break;
            case 2:
                offset1 = (rt().param.r * minW) / 2;
                offset2 = (rt().param.r * minW) / 2 - waveHeight - 1;
                break;
            case 3:
                offset1 = (rt().param.r * minW) / 2 + waveHeight + 1;
                offset2 = (rt().param.r * minW) / 2 - waveHeight - 1;
                break;
            default:
                offset1 = (rt().param.r * minW) / 2 + waveHeight + 1;
                offset2 = (rt().param.r * minW) / 2 - waveHeight - 1;
        }

        const p1 = getXY(offset1, deg);
        const p2 = getXY(offset2, deg);

        rt().param.arr1.push({ x: p1.x, y: p1.y });
        rt().param.arr2.push({ x: p2.x, y: p2.y });
    }

    if (rt().param.rotation) {
        rt().param.offsetAngle +=
            rt().param.rotation / rt().param.Polygon;
        if (rt().param.offsetAngle >= 360) {
            rt().param.offsetAngle = 0;
        } else if (rt().param.offsetAngle <= 0) {
            rt().param.offsetAngle = 360;
        }
    }
}

/**
 * Calculate XY coordinates for a circle point
 */
export function getXY(offset: number, deg: number): { x: number; y: number } {
    const x = Math.cos(deg) * offset + rt().param.cX * w;
    const y = Math.sin(deg) * offset + rt().param.cY * h;

    return { x, y };
}

/**
 * Draw style 1 - Radial lines from center
 */
export function style1(): void {
    if (!ctx) return;
    const arr1 = rt().param.arr1;
    const arr2 = rt().param.arr2;
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
    const arr1 = rt().param.arr1;
    const arr2 = rt().param.arr2;

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
    if (!rt().param.showSemiCircle) {
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
    if (!rt().param.showSemiCircle) {
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
    const arr1 = rt().param.arr1;
    const arr2 = rt().param.arr2;

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
    if (!rt().param.showSemiCircle) {
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
    if (!rt().param.showSemiCircle) {
        ctx.closePath();
    }
    ctx.stroke();
}
