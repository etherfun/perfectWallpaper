// PWCircle.ts - Audio circle visualizer module
// This module provides circular audio visualization effects

import { appConfig } from './utils/config';

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
        ctx.lineWidth = appConfig.runtime.param.lineWidth;
        ctx.shadowBlur = appConfig.runtime.param.shadowBlur;
    }
    rainRad = Math.sqrt(Math.pow(h, 2) + Math.pow(w, 2));
}

/**
 * Set canvas context style based on color mode
 */
export function setCan(): void {
    if (!ctx) return;

    switch (appConfig.runtime.param.ColorMode) {
        case 1:
            ctx.strokeStyle = appConfig.runtime.param.color;
            ctx.shadowColor = appConfig.runtime.param.blurColor;
            break;
        case 2:
            if (hue > 255) { appConfig.runtime.param.TagNow *= -1; hue = 255; }
            if (hue < 0) { appConfig.runtime.param.TagNow *= -1; hue = 0; }
            const color = `hsl(${hue},90%,50%)`;
            hue += appConfig.runtime.param.TagNow / appConfig.runtime.param.GradientRate;

            if (appConfig.runtime.param.SolidColorGradient) {
                ctx.strokeStyle = color;
            } else {
                ctx.strokeStyle = appConfig.runtime.param.color;
            }
            if (appConfig.runtime.param.BlurColorGradient) {
                ctx.shadowColor = color;
            } else {
                ctx.shadowColor = appConfig.runtime.param.blurColor;
            }
            break;
        case 3:
            const ranX = rainRad / 3 * Math.cos(roh) + w;
            const ranY = rainRad / 3 * Math.sin(roh) + h;
            roh = (roh + (Math.PI / 300)) % (2 * Math.PI);
            circleX = w * appConfig.runtime.param.cX;
            circleY = h * appConfig.runtime.param.cY;
            const rainbow = ctx.createRadialGradient(circleX, circleY, 0, ranX / 2, ranY / 2, w / 3);

            if (appConfig.runtime.param.ColorRhythm) {
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
            ctx.shadowColor = appConfig.runtime.param.blurColor;
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
            hue1 += appConfig.runtime.param.TagNow / appConfig.runtime.param.GradientRate;
            hue1 = hue1 % 255;
            break;
        case 2:
            colornow = `hsl(${hue2},90%,50%)`;
            hue2 += appConfig.runtime.param.TagNow / appConfig.runtime.param.GradientRate;
            hue2 = hue2 % 255;
            break;
        case 3:
            colornow = `hsl(${hue3},90%,50%)`;
            hue3 += appConfig.runtime.param.TagNow / appConfig.runtime.param.GradientRate;
            hue3 = hue3 % 255;
            break;
        case 4:
            colornow = `hsl(${hue4},90%,50%)`;
            hue4 += appConfig.runtime.param.TagNow / appConfig.runtime.param.GradientRate;
            hue4 = hue4 % 255;
            break;
        case 5:
            colornow = `hsl(${hue5},90%,50%)`;
            hue5 += appConfig.runtime.param.TagNow / appConfig.runtime.param.GradientRate;
            hue5 = hue5 % 255;
            break;
        case 6:
            colornow = `hsl(${hue6},90%,50%)`;
            hue6 += appConfig.runtime.param.TagNow / appConfig.runtime.param.GradientRate;
            hue6 = hue6 % 255;
            break;
        case 7:
            colornow = `hsl(${hue7},90%,50%)`;
            hue7 += appConfig.runtime.param.TagNow / appConfig.runtime.param.GradientRate;
            hue7 = hue7 % 255;
            break;
        case 8:
            colornow = `hsl(${hue8},90%,50%)`;
            hue8 += appConfig.runtime.param.TagNow / appConfig.runtime.param.GradientRate;
            hue8 = hue8 % 255;
            break;
        case 9:
            colornow = `hsl(${hue9},90%,50%)`;
            hue9 += appConfig.runtime.param.TagNow / appConfig.runtime.param.GradientRate;
            hue9 = hue9 % 255;
            break;
        case 10:
            colornow = `hsl(${hue10},90%,50%)`;
            hue10 += appConfig.runtime.param.TagNow / appConfig.runtime.param.GradientRate;
            hue10 = hue10 % 255;
            break;
    }
    return colornow;
}

/**
 * Create circle visualization points based on audio data
 */
let _createPointLogged = false;
export function createPoint(arr: number[]): void {
    appConfig.runtime.param.arr1 = [];
    appConfig.runtime.param.arr2 = [];

    if (!_createPointLogged) {
        _createPointLogged = true;
        console.log('[PWCircle.createPoint] w:', w, 'h:', h, 'minW:', minW);
        console.log('[PWCircle.createPoint] param.r:', appConfig.runtime.param.r, 'param.cX:', appConfig.runtime.param.cX, 'param.cY:', appConfig.runtime.param.cY);
        console.log('[PWCircle.createPoint] showSemiCircle:', appConfig.runtime.param.showSemiCircle, 'SemiCircledirection:', appConfig.runtime.param.SemiCircledirection, 'PolygonAngle:', appConfig.runtime.param.Polygon, 'offsetAngle:', appConfig.runtime.param.offsetAngle);
        console.log('[PWCircle.createPoint] arr sample:', arr.slice(0, 10));
    }

    for (let i = 0; i < 120; i++) {
        let deg: number;
        if (appConfig.runtime.param.showSemiCircle) {
            switch (appConfig.runtime.param.SemiCircledirection) {
                case 1: // Top
                    deg = Math.PI / 120 * (i + appConfig.runtime.param.offsetAngle + 0.5) * -1;
                    break;
                case 2: // Bottom
                    deg = Math.PI / 120 * (i + appConfig.runtime.param.offsetAngle + 0.5);
                    break;
                case 3: // Left
                    deg = Math.PI / 120 * (i + appConfig.runtime.param.offsetAngle - 179.5);
                    break;
                case 4: // Right
                    deg = Math.PI / 120 * (i + appConfig.runtime.param.offsetAngle + 180.5);
                    break;
                default:
                    deg = Math.PI / 120 * (i + appConfig.runtime.param.offsetAngle + 0.5) * -1;
            }
        } else {
            // 全圆角度: 与原始 JS 版本一致
            deg = Math.PI / appConfig.runtime.param.PolygonAngle * (i + appConfig.runtime.param.offsetAngle) * 3;
        }

        let w1 = arr[i] ? arr[i] : 0;
        let w2: number;
        if (appConfig.runtime.param.waveArr[i]) {
            w2 = appConfig.runtime.param.waveArr[i] - (appConfig.runtime.param.waveArr[i] * 0.25);
        } else {
            w2 = 0;
        }
        w1 = Math.max(w1, w2);
        appConfig.runtime.param.waveArr[i] = w1 = Math.min(w1, 1.2);
        const waveHeight = w1 * appConfig.runtime.param.range * 100;

        let offset1: number;
        let offset2: number;
        switch (appConfig.runtime.param.direction) {
            case 1:
                offset1 = appConfig.runtime.param.r * minW / 2 + waveHeight + 1;
                offset2 = appConfig.runtime.param.r * minW / 2;
                break;
            case 2:
                offset1 = appConfig.runtime.param.r * minW / 2;
                offset2 = appConfig.runtime.param.r * minW / 2 - waveHeight - 1;
                break;
            case 3:
                offset1 = appConfig.runtime.param.r * minW / 2 + waveHeight + 1;
                offset2 = appConfig.runtime.param.r * minW / 2 - waveHeight - 1;
                break;
            default:
                offset1 = appConfig.runtime.param.r * minW / 2 + waveHeight + 1;
                offset2 = appConfig.runtime.param.r * minW / 2 - waveHeight - 1;
        }

        const p1 = getXY(offset1, deg);
        const p2 = getXY(offset2, deg);

        if (!_createPointLogged && i < 3) {
            console.log('[PWCircle.createPoint] i:', i, 'offset1:', offset1, 'offset2:', offset2, 'deg:', deg);
            console.log('[PWCircle.createPoint] p1:', p1, 'p2:', p2);
        }

        appConfig.runtime.param.arr1.push({ x: p1.x, y: p1.y });
        appConfig.runtime.param.arr2.push({ x: p2.x, y: p2.y });
    }

    if (appConfig.runtime.param.rotation) {
        appConfig.runtime.param.offsetAngle += appConfig.runtime.param.rotation / appConfig.runtime.param.Polygon;
        if (appConfig.runtime.param.offsetAngle >= 360) {
            appConfig.runtime.param.offsetAngle = 0;
        } else if (appConfig.runtime.param.offsetAngle <= 0) {
            appConfig.runtime.param.offsetAngle = 360;
        }
    }
}

/**
 * Calculate XY coordinates for a circle point
 */
let _getXYLogged = false;
export function getXY(offset: number, deg: number): { x: number; y: number } {
    const x = Math.cos(deg) * offset + appConfig.runtime.param.cX * w;
    const y = Math.sin(deg) * offset + appConfig.runtime.param.cY * h;

    if (!_getXYLogged) {
        _getXYLogged = true;
        console.log('[PWCircle.getXY] offset:', offset, 'deg:', deg);
        console.log('[PWCircle.getXY] cos(deg):', Math.cos(deg), 'sin(deg):', Math.sin(deg));
        console.log('[PWCircle.getXY] cX:', appConfig.runtime.param.cX, 'cY:', appConfig.runtime.param.cY, 'w:', w, 'h:', h);
        console.log('[PWCircle.getXY] result x:', x, 'y:', y);
    }

    return { x, y };
}

/**
 * Draw style 1 - Radial lines from center
 */
let _style1Logged = false;
export function style1(): void {
    if (!ctx) return;
    if (!_style1Logged) {
        _style1Logged = true;
        console.log('[PWCircle.style1] Drawing! arr1[0]:', appConfig.runtime.param.arr1[0]);
    }
    ctx.beginPath();
    for (let i = 0; i < 120; i++) {
        ctx.moveTo(appConfig.runtime.param.arr1[i].x, appConfig.runtime.param.arr1[i].y);
        ctx.lineTo(appConfig.runtime.param.arr2[i].x, appConfig.runtime.param.arr2[i].y);
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
    ctx.moveTo(appConfig.runtime.param.arr1[0].x, appConfig.runtime.param.arr1[0].y);
    for (let i = 0; i < 120; i++) {
        ctx.lineTo(appConfig.runtime.param.arr1[i].x, appConfig.runtime.param.arr1[i].y);
    }
    if (!appConfig.runtime.param.showSemiCircle) {
        ctx.closePath();
    }
    ctx.stroke();

    // Inner circle
    ctx.beginPath();
    if (appConfig.runtime.param.showSemiCircle) {
        ctx.moveTo(appConfig.runtime.param.arr2[0].x, appConfig.runtime.param.arr2[0].y);
        for (let i = 0; i < 120; i++) {
            ctx.lineTo(appConfig.runtime.param.arr2[i].x, appConfig.runtime.param.arr2[i].y);
        }
    } else {
        ctx.moveTo(appConfig.runtime.param.arr2[0].x, appConfig.runtime.param.arr2[0].y);
        for (let i = 0; i < 120; i++) {
            ctx.lineTo(appConfig.runtime.param.arr2[i].x, appConfig.runtime.param.arr2[i].y);
        }
    }
    if (!appConfig.runtime.param.showSemiCircle) {
        ctx.closePath();
    }
    ctx.stroke();

    // Connecting lines
    ctx.beginPath();
    for (let i = 0; i < 120; i++) {
        ctx.moveTo(appConfig.runtime.param.arr1[i].x, appConfig.runtime.param.arr1[i].y);
        ctx.lineTo(appConfig.runtime.param.arr2[i].x, appConfig.runtime.param.arr2[i].y);
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
    ctx.moveTo(appConfig.runtime.param.arr1[0].x, appConfig.runtime.param.arr1[0].y);
    for (let i = 0; i < 120; i++) {
        ctx.lineTo(appConfig.runtime.param.arr1[i].x, appConfig.runtime.param.arr1[i].y);
    }
    if (!appConfig.runtime.param.showSemiCircle) {
        ctx.closePath();
    }
    ctx.stroke();

    // Inner circle
    ctx.beginPath();
    if (appConfig.runtime.param.showSemiCircle) {
        ctx.moveTo(appConfig.runtime.param.arr2[0].x, appConfig.runtime.param.arr2[0].y);
        for (let i = 0; i < 120; i++) {
            ctx.lineTo(appConfig.runtime.param.arr2[i].x, appConfig.runtime.param.arr2[i].y);
        }
    } else {
        ctx.moveTo(appConfig.runtime.param.arr2[0].x, appConfig.runtime.param.arr2[0].y);
        for (let i = 0; i < 120; i++) {
            ctx.lineTo(appConfig.runtime.param.arr2[i].x, appConfig.runtime.param.arr2[i].y);
        }
    }
    if (!appConfig.runtime.param.showSemiCircle) {
        ctx.closePath();
    }
    ctx.stroke();
}

