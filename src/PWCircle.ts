// PWCircle.ts - Audio circle visualizer module
// This module provides circular audio visualization effects

import { config } from './utils/config';

// Global canvas and context - initialized in resize()
let can: HTMLCanvasElement | null = null;
let ctx: CanvasRenderingContext2D | null = null;
let w: number = 0;
let h: number = 0;
let minW: number = 0;
let circleX: number = 0;
let circleY: number = 0;
let roh: number = 0;
let rainRad: number = 0;

// PWCircle parameters
interface ParamType {
    arr1: { x: number; y: number }[];
    arr2: { x: number; y: number }[];
    waveArr: number[];
    showCircle: boolean;
    style: number;
    ColorMode: number;
    color: string;
    blurColor: string;
    TagNow: number;
    GradientRate: number;
    SolidColorGradient: boolean;
    BlurColorGradient: boolean;
    ColorRhythm: boolean;
    rotation: number;
    PolygonAngle: number;
    offsetAngle: number;
    range: number;
    r: number;
    cX: number;
    cY: number;
    direction: number;
    showSemiCircle: boolean;
    SemiCircledirection: number;
    lineWidth: number;
    shadowBlur: number;
}

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
    const canvasEl = document.querySelector("#can") as HTMLCanvasElement;
    can = canvasEl;
    ctx = canvasEl.getContext("2d");

    w = window.innerWidth;
    h = window.innerHeight;
    minW = Math.min(w, h);

    // Set canvas dimensions
    canvasEl.width = w;
    canvasEl.height = h;

    if (ctx) {
        ctx.lineWidth = config.runtime.param.lineWidth;
        ctx.shadowBlur = config.runtime.param.shadowBlur;
    }
    rainRad = Math.sqrt(Math.pow(h, 2) + Math.pow(w, 2));
}

/**
 * Set canvas context style based on color mode
 */
export function setCan(): void {
    if (!ctx) return;

    switch (config.runtime.param.ColorMode) {
        case 1:
            ctx.strokeStyle = config.runtime.param.color;
            ctx.shadowColor = config.runtime.param.blurColor;
            break;
        case 2:
            if (hue > 255) { config.runtime.param.TagNow *= -1; hue = 255; }
            if (hue < 0) { config.runtime.param.TagNow *= -1; hue = 0; }
            const color = `hsl(${hue},90%,50%)`;
            hue += config.runtime.param.TagNow / config.runtime.param.GradientRate;

            if (config.runtime.param.SolidColorGradient) {
                ctx.strokeStyle = color;
            } else {
                ctx.strokeStyle = config.runtime.param.color;
            }
            if (config.runtime.param.BlurColorGradient) {
                ctx.shadowColor = color;
            } else {
                ctx.shadowColor = config.runtime.param.blurColor;
            }
            break;
        case 3:
            const ranX = rainRad / 3 * Math.cos(roh) + w;
            const ranY = rainRad / 3 * Math.sin(roh) + h;
            roh = (roh + (Math.PI / 300)) % (2 * Math.PI);
            circleX = w * config.runtime.param.cX;
            circleY = h * config.runtime.param.cY;
            const rainbow = ctx.createRadialGradient(circleX, circleY, 0, ranX / 2, ranY / 2, w / 3);

            if (config.runtime.param.ColorRhythm) {
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
                rainbow.addColorStop(0, "magenta");
                rainbow.addColorStop(0.25, "blue");
                rainbow.addColorStop(0.5, "green");
                rainbow.addColorStop(0.75, "yellow");
                rainbow.addColorStop(1.0, "red");
            }
            ctx.fillStyle = rainbow;
            ctx.strokeStyle = rainbow;
            ctx.shadowColor = config.runtime.param.blurColor;
            break;
    }
}

/**
 * Get color based on case value for color rhythm effect
 */
function getColor(casev: number): string {
    let colornow: string = "";
    switch (casev) {
        case 1:
            colornow = `hsl(${hue1},90%,50%)`;
            hue1 += config.runtime.param.TagNow / config.runtime.param.GradientRate;
            hue1 = hue1 % 255;
            break;
        case 2:
            colornow = `hsl(${hue2},90%,50%)`;
            hue2 += config.runtime.param.TagNow / config.runtime.param.GradientRate;
            hue2 = hue2 % 255;
            break;
        case 3:
            colornow = `hsl(${hue3},90%,50%)`;
            hue3 += config.runtime.param.TagNow / config.runtime.param.GradientRate;
            hue3 = hue3 % 255;
            break;
        case 4:
            colornow = `hsl(${hue4},90%,50%)`;
            hue4 += config.runtime.param.TagNow / config.runtime.param.GradientRate;
            hue4 = hue4 % 255;
            break;
        case 5:
            colornow = `hsl(${hue5},90%,50%)`;
            hue5 += config.runtime.param.TagNow / config.runtime.param.GradientRate;
            hue5 = hue5 % 255;
            break;
        case 6:
            colornow = `hsl(${hue6},90%,50%)`;
            hue6 += config.runtime.param.TagNow / config.runtime.param.GradientRate;
            hue6 = hue6 % 255;
            break;
        case 7:
            colornow = `hsl(${hue7},90%,50%)`;
            hue7 += config.runtime.param.TagNow / config.runtime.param.GradientRate;
            hue7 = hue7 % 255;
            break;
        case 8:
            colornow = `hsl(${hue8},90%,50%)`;
            hue8 += config.runtime.param.TagNow / config.runtime.param.GradientRate;
            hue8 = hue8 % 255;
            break;
        case 9:
            colornow = `hsl(${hue9},90%,50%)`;
            hue9 += config.runtime.param.TagNow / config.runtime.param.GradientRate;
            hue9 = hue9 % 255;
            break;
        case 10:
            colornow = `hsl(${hue10},90%,50%)`;
            hue10 += config.runtime.param.TagNow / config.runtime.param.GradientRate;
            hue10 = hue10 % 255;
            break;
    }
    return colornow;
}

/**
 * Create circle visualization points based on audio data
 */
export function createPoint(arr: number[]): void {
    config.runtime.param.arr1 = [];
    config.runtime.param.arr2 = [];

    for (let i = 0; i < 128; i++) {
        let deg: number;
        if (config.runtime.param.showSemiCircle) {
            switch (config.runtime.param.SemiCircledirection) {
                case 1: // Top
                    deg = Math.PI / 128 * (i + config.runtime.param.offsetAngle + 0.5) * -1;
                    break;
                case 2: // Bottom
                    deg = Math.PI / 128 * (i + config.runtime.param.offsetAngle + 0.5);
                    break;
                case 3: // Left
                    deg = Math.PI / 128 * (i + config.runtime.param.offsetAngle - 179.5);
                    break;
                case 4: // Right
                    deg = Math.PI / 128 * (i + config.runtime.param.offsetAngle + 180.5);
                    break;
                default:
                    deg = Math.PI / 128 * (i + config.runtime.param.offsetAngle + 0.5) * -1;
            }
        } else {
            // 全圆角度: 与原始 JS 版本一致
            deg = Math.PI / config.runtime.param.PolygonAngle * (i + config.runtime.param.offsetAngle) * 3;
        }

        let w1 = arr[i] ? arr[i] : 0;
        let w2: number;
        if (config.runtime.param.waveArr[i]) {
            w2 = config.runtime.param.waveArr[i] - (config.runtime.param.waveArr[i] * 0.25);
        } else {
            w2 = 0;
        }
        w1 = Math.max(w1, w2);
        config.runtime.param.waveArr[i] = w1 = Math.min(w1, 1.2);
        const waveHeight = w1 * config.runtime.param.range * 100;

        let offset1: number;
        let offset2: number;
        switch (config.runtime.param.direction) {
            case 1:
                offset1 = config.runtime.param.r * minW / 2 + waveHeight + 1;
                offset2 = config.runtime.param.r * minW / 2;
                break;
            case 2:
                offset1 = config.runtime.param.r * minW / 2;
                offset2 = config.runtime.param.r * minW / 2 - waveHeight - 1;
                break;
            case 3:
                offset1 = config.runtime.param.r * minW / 2 + waveHeight + 1;
                offset2 = config.runtime.param.r * minW / 2 - waveHeight - 1;
                break;
            default:
                offset1 = config.runtime.param.r * minW / 2 + waveHeight + 1;
                offset2 = config.runtime.param.r * minW / 2 - waveHeight - 1;
        }

        const p1 = getXY(offset1, deg);
        const p2 = getXY(offset2, deg);

        config.runtime.param.arr1.push({ x: p1.x, y: p1.y });
        config.runtime.param.arr2.push({ x: p2.x, y: p2.y });
    }

    if (config.runtime.param.rotation) {
        config.runtime.param.offsetAngle += config.runtime.param.rotation / config.runtime.param.Polygon;
        if (config.runtime.param.offsetAngle >= 360) {
            config.runtime.param.offsetAngle = 0;
        } else if (config.runtime.param.offsetAngle <= 0) {
            config.runtime.param.offsetAngle = 360;
        }
    }
}

/**
 * Calculate XY coordinates for a circle point
 */
export function getXY(offset: number, deg: number): { x: number; y: number } {
    const x = Math.cos(deg) * offset + config.runtime.param.cX * w;
    const y = Math.sin(deg) * offset + config.runtime.param.cY * h;

    return { x, y };
}

/**
 * Draw style 1 - Radial lines from center
 */
export function style1(): void {
    if (!ctx) return;
    ctx.beginPath();
    for (let i = 0; i < 128; i++) {
        ctx.moveTo(config.runtime.param.arr1[i].x, config.runtime.param.arr1[i].y);
        ctx.lineTo(config.runtime.param.arr2[i].x, config.runtime.param.arr2[i].y);
    }
    ctx.closePath();
    ctx.stroke();
}

/**
 * Draw style 2 - Two concentric circles with connecting lines
 */
export function style2(): void {
    if (!ctx) return;
    // Outer circle
    ctx.beginPath();
    ctx.moveTo(config.runtime.param.arr1[0].x, config.runtime.param.arr1[0].y);
    for (let i = 0; i < 128; i++) {
        ctx.lineTo(config.runtime.param.arr1[i].x, config.runtime.param.arr1[i].y);
    }
    if (!config.runtime.param.showSemiCircle) {
        ctx.closePath();
    }
    ctx.stroke();

    // Inner circle
    ctx.beginPath();
    if (config.runtime.param.showSemiCircle) {
        ctx.moveTo(config.runtime.param.arr2[0].x, config.runtime.param.arr2[0].y);
        for (let i = 0; i < 128; i++) {
            ctx.lineTo(config.runtime.param.arr2[i].x, config.runtime.param.arr2[i].y);
        }
    } else {
        ctx.moveTo(config.runtime.param.arr2[0].x, config.runtime.param.arr2[0].y);
        for (let i = 0; i < 128; i++) {
            ctx.lineTo(config.runtime.param.arr2[i].x, config.runtime.param.arr2[i].y);
        }
    }
    if (!config.runtime.param.showSemiCircle) {
        ctx.closePath();
    }
    ctx.stroke();

    // Connecting lines
    ctx.beginPath();
    for (let i = 0; i < 128; i++) {
        ctx.moveTo(config.runtime.param.arr1[i].x, config.runtime.param.arr1[i].y);
        ctx.lineTo(config.runtime.param.arr2[i].x, config.runtime.param.arr2[i].y);
    }
    ctx.closePath();
    ctx.stroke();
}

/**
 * Draw style 3 - Two concentric circles without connecting lines
 */
export function style3(): void {
    if (!ctx) return;
    // Outer circle
    ctx.beginPath();
    ctx.moveTo(config.runtime.param.arr1[0].x, config.runtime.param.arr1[0].y);
    for (let i = 0; i < 128; i++) {
        ctx.lineTo(config.runtime.param.arr1[i].x, config.runtime.param.arr1[i].y);
    }
    if (!config.runtime.param.showSemiCircle) {
        ctx.closePath();
    }
    ctx.stroke();

    // Inner circle
    ctx.beginPath();
    if (config.runtime.param.showSemiCircle) {
        ctx.moveTo(config.runtime.param.arr2[0].x, config.runtime.param.arr2[0].y);
        for (let i = 0; i < 128; i++) {
            ctx.lineTo(config.runtime.param.arr2[i].x, config.runtime.param.arr2[i].y);
        }
    } else {
        ctx.moveTo(config.runtime.param.arr2[0].x, config.runtime.param.arr2[0].y);
        for (let i = 0; i < 128; i++) {
            ctx.lineTo(config.runtime.param.arr2[i].x, config.runtime.param.arr2[i].y);
        }
    }
    if (!config.runtime.param.showSemiCircle) {
        ctx.closePath();
    }
    ctx.stroke();
}

