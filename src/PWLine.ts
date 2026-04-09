// PWLine.ts - Audio line visualizer module
// This module provides line-based audio visualization effects

import { config } from './utils/config';

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
    const canvasEl = document.querySelector("#CanLine") as HTMLCanvasElement | null;
    if (!canvasEl) {
        return;
    }
    CanLine = canvasEl;
    CTXLine = canvasEl.getContext("2d")!;

    CanLine.width = w = window.innerWidth;
    CanLine.height = h = window.innerHeight;
    minW = Math.min(w, h);
    maxW = Math.max(w, h);
    CTXLine.lineWidth = config.runtime.PWLineParam.lineWidth;
    CTXLine.shadowBlur = config.runtime.PWLineParam.shadowBlur;
}

/**
 * Set the canvas context style based on color mode
 */
export function setCTXLine(): void {
    switch (config.runtime.PWLineParam.ColorMode) {
        case 1:
            CTXLine.strokeStyle = config.runtime.PWLineParam.color;
            CTXLine.shadowColor = config.runtime.PWLineParam.blurColor;
            break;
        case 2:
            if (hue > 255) { config.runtime.PWLineParam.TagNow *= -1; hue = 255; }
            if (hue < 0) { config.runtime.PWLineParam.TagNow *= -1; hue = 0; }
            color = `hsl(${hue},90%,50%)`;
            hue += config.runtime.PWLineParam.TagNow / config.runtime.PWLineParam.GradientRate;

            if (config.runtime.PWLineParam.SolidColorGradient) {
                CTXLine.strokeStyle = color;
            } else {
                CTXLine.strokeStyle = config.runtime.PWLineParam.color;
            }
            if (config.runtime.PWLineParam.BlurColorGradient) {
                CTXLine.shadowColor = color as string;
            } else {
                CTXLine.shadowColor = config.runtime.PWLineParam.blurColor;
            }
            break;
        case 3:
            {
            originX = maxW * config.runtime.PWLineParam.LineX;
            originY = minW * config.runtime.PWLineParam.LineY;
            const rainbow = CTXLine.createRadialGradient(originX, originY, 0, originX, originY, lineR);

            if (config.runtime.PWLineParam.ColorRhythm) {
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
            color = rainbow;
            CTXLine.fillStyle = color;
            CTXLine.strokeStyle = color;
            CTXLine.shadowColor = config.runtime.PWLineParam.blurColor;
            }
            break;
    }
}

/**
 * Get color based on case value for color rhythm effect
 */
export function getColor(casev: number): string {
    let colornow: string = "";
    switch (casev) {
        case 1:
            colornow = `hsl(${hue1},90%,50%)`;
            hue1 += config.runtime.PWLineParam.TagNow / config.runtime.PWLineParam.GradientRate;
            hue1 = hue1 % 255;
            break;
        case 2:
            colornow = `hsl(${hue2},90%,50%)`;
            hue2 += config.runtime.PWLineParam.TagNow / config.runtime.PWLineParam.GradientRate;
            hue2 = hue2 % 255;
            break;
        case 3:
            colornow = `hsl(${hue3},90%,50%)`;
            hue3 += config.runtime.PWLineParam.TagNow / config.runtime.PWLineParam.GradientRate;
            hue3 = hue3 % 255;
            break;
        case 4:
            colornow = `hsl(${hue4},90%,50%)`;
            hue4 += config.runtime.PWLineParam.TagNow / config.runtime.PWLineParam.GradientRate;
            hue4 = hue4 % 255;
            break;
        case 5:
            colornow = `hsl(${hue5},90%,50%)`;
            hue5 += config.runtime.PWLineParam.TagNow / config.runtime.PWLineParam.GradientRate;
            hue5 = hue5 % 255;
            break;
        case 6:
            colornow = `hsl(${hue6},90%,50%)`;
            hue6 += config.runtime.PWLineParam.TagNow / config.runtime.PWLineParam.GradientRate;
            hue6 = hue6 % 255;
            break;
        case 7:
            colornow = `hsl(${hue7},90%,50%)`;
            hue7 += config.runtime.PWLineParam.TagNow / config.runtime.PWLineParam.GradientRate;
            hue7 = hue7 % 255;
            break;
        case 8:
            colornow = `hsl(${hue8},90%,50%)`;
            hue8 += config.runtime.PWLineParam.TagNow / config.runtime.PWLineParam.GradientRate;
            hue8 = hue8 % 255;
            break;
        case 9:
            colornow = `hsl(${hue9},90%,50%)`;
            hue9 += config.runtime.PWLineParam.TagNow / config.runtime.PWLineParam.GradientRate;
            hue9 = hue9 % 255;
            break;
        case 10:
            colornow = `hsl(${hue10},90%,50%)`;
            hue10 += config.runtime.PWLineParam.TagNow / config.runtime.PWLineParam.GradientRate;
            hue10 = hue10 % 255;
            break;
    }
    return colornow;
}

/**
 * Create line visualization points based on audio data
 */
export function PWLineCreatePoint(arr: number[]): void {
    config.runtime.PWLineParam.arr1 = [];
    config.runtime.PWLineParam.arr2 = [];
    const iv = (120 - config.runtime.PWLineParam.LineDensity) / 2;

    if (config.runtime.PWLineParam.LinePosition === 1) {
        sw = (maxW - config.runtime.PWLineParam.LineDensity * CTXLine.lineWidth) / (config.runtime.PWLineParam.LineDensity - 1) * config.runtime.PWLineParam.sw;
    } else {
        sw = (minW - config.runtime.PWLineParam.LineDensity * CTXLine.lineWidth) / (config.runtime.PWLineParam.LineDensity - 1) * config.runtime.PWLineParam.sw;
    }

    for (let i = iv, j = 0; i < (config.runtime.PWLineParam.LineDensity + iv); i++, j++) {
        let w1 = arr[i] ? arr[i] : 0;
        let w2: number;
        if (config.runtime.PWLineParam.waveArr[i]) {
            w2 = config.runtime.PWLineParam.waveArr[i] - 0.1;
        } else {
            w2 = 0;
        }
        w1 = Math.max(w1, w2);
        config.runtime.PWLineParam.waveArr[i] = w1 = Math.min(w1, 1.2);
        const waveHeight = w1 * config.runtime.PWLineParam.range * 100;

        let Deviation1: number;
        let Deviation2: number;
        switch (config.runtime.PWLineParam.Direction) {
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

        config.runtime.PWLineParam.arr1.push({ x: p1.x, y: p1.y });
        config.runtime.PWLineParam.arr2.push({ x: p2.x, y: p2.y });
    }

    if (config.runtime.PWLineParam.LinePosition === 1) {
        lineR = config.runtime.PWLineParam.arr1[(config.runtime.PWLineParam.LineDensity) / 2 - 1].x - config.runtime.PWLineParam.arr1[0].x;
    } else {
        lineR = config.runtime.PWLineParam.arr1[(config.runtime.PWLineParam.LineDensity) / 2 - 1].y - config.runtime.PWLineParam.arr1[0].y;
    }
}

/**
 * Calculate XY coordinates for a line point
 */
export function getLineXY(Deviation: number, i: number): { x: number; y: number } {
    if (config.runtime.PWLineParam.LinePosition === 1) {
        const x = maxW * config.runtime.PWLineParam.LineX + (i + 0.5 - config.runtime.PWLineParam.LineDensity / 2) * sw + (i + 0.5 - config.runtime.PWLineParam.LineDensity / 2) * CTXLine.lineWidth;
        const y = minW * config.runtime.PWLineParam.LineY;
        return { x: x, y: y + Deviation };
    } else {
        const x = minW * config.runtime.PWLineParam.LineY + (i + 0.5 - config.runtime.PWLineParam.LineDensity / 2) * sw + (i + 0.5 - config.runtime.PWLineParam.LineDensity / 2) * CTXLine.lineWidth;
        const y = maxW * config.runtime.PWLineParam.LineX;
        return { x: y + Deviation, y: x };
    }
}

/**
 * Draw style 1 - Lines with optional middle line
 */
export function PWLineStyle1(): void {
    // Draw lines
    CTXLine.beginPath();
    for (let i = 0; i < config.runtime.PWLineParam.LineDensity; i++) {
        CTXLine.moveTo(config.runtime.PWLineParam.arr1[i].x, config.runtime.PWLineParam.arr1[i].y);
        CTXLine.lineTo(config.runtime.PWLineParam.arr2[i].x, config.runtime.PWLineParam.arr2[i].y);
    }
    CTXLine.stroke();

    // Top middle line
    if (config.runtime.PWLineParam.Direction === 1 && config.runtime.PWLineParam.MiddleLine) {
        CTXLine.beginPath();
        CTXLine.moveTo(config.runtime.PWLineParam.arr2[0].x, config.runtime.PWLineParam.arr2[0].y);
        CTXLine.lineTo(config.runtime.PWLineParam.arr2[config.runtime.PWLineParam.LineDensity - 1].x, config.runtime.PWLineParam.arr2[config.runtime.PWLineParam.LineDensity - 1].y);
        CTXLine.stroke();
    }

    // Bottom middle line
    if (config.runtime.PWLineParam.Direction === 2 && config.runtime.PWLineParam.MiddleLine) {
        CTXLine.beginPath();
        CTXLine.moveTo(config.runtime.PWLineParam.arr1[0].x, config.runtime.PWLineParam.arr1[0].y);
        CTXLine.lineTo(config.runtime.PWLineParam.arr1[config.runtime.PWLineParam.LineDensity - 1].x, config.runtime.PWLineParam.arr1[config.runtime.PWLineParam.LineDensity - 1].y);
        CTXLine.stroke();
    }

    // Bidirectional middle line
    if (config.runtime.PWLineParam.Direction === 3 && config.runtime.PWLineParam.MiddleLine) {
        CTXLine.beginPath();
        CTXLine.moveTo((config.runtime.PWLineParam.arr2[0].x + config.runtime.PWLineParam.arr1[0].x) / 2, (config.runtime.PWLineParam.arr2[0].y + config.runtime.PWLineParam.arr1[0].y) / 2);
        CTXLine.lineTo((config.runtime.PWLineParam.arr2[config.runtime.PWLineParam.LineDensity - 1].x + config.runtime.PWLineParam.arr1[config.runtime.PWLineParam.LineDensity - 1].x) / 2, (config.runtime.PWLineParam.arr2[config.runtime.PWLineParam.LineDensity - 1].y + config.runtime.PWLineParam.arr1[config.runtime.PWLineParam.LineDensity - 1].y) / 2);
        CTXLine.stroke();
    }
}

/**
 * Draw style 2 - Filled shapes with connecting lines
 */
export function PWLineStyle2(): void {
    // Top line
    if (config.runtime.PWLineParam.Direction !== 2 || (config.runtime.PWLineParam.Direction === 2 && config.runtime.PWLineParam.MiddleLine)) {
        CTXLine.beginPath();
        CTXLine.moveTo(config.runtime.PWLineParam.arr1[0].x, config.runtime.PWLineParam.arr1[0].y);
        for (let i = 0; i < config.runtime.PWLineParam.LineDensity; i++) {
            CTXLine.lineTo(config.runtime.PWLineParam.arr1[i].x, config.runtime.PWLineParam.arr1[i].y);
        }
        CTXLine.stroke();
    }

    // Bottom line
    if (config.runtime.PWLineParam.Direction !== 1 || (config.runtime.PWLineParam.Direction === 1 && config.runtime.PWLineParam.MiddleLine)) {
        CTXLine.beginPath();
        CTXLine.moveTo(config.runtime.PWLineParam.arr2[0].x, config.runtime.PWLineParam.arr2[0].y);
        for (let i = 0; i < config.runtime.PWLineParam.LineDensity; i++) {
            CTXLine.lineTo(config.runtime.PWLineParam.arr2[i].x, config.runtime.PWLineParam.arr2[i].y);
        }
        CTXLine.stroke();
    }

    // Bidirectional middle line
    if (config.runtime.PWLineParam.Direction === 3 && config.runtime.PWLineParam.MiddleLine) {
        CTXLine.beginPath();
        CTXLine.moveTo((config.runtime.PWLineParam.arr2[0].x + config.runtime.PWLineParam.arr1[0].x) / 2, (config.runtime.PWLineParam.arr2[0].y + config.runtime.PWLineParam.arr1[0].y) / 2);
        CTXLine.lineTo((config.runtime.PWLineParam.arr2[config.runtime.PWLineParam.LineDensity - 1].x + config.runtime.PWLineParam.arr1[config.runtime.PWLineParam.LineDensity - 1].x) / 2, (config.runtime.PWLineParam.arr2[config.runtime.PWLineParam.LineDensity - 1].y + config.runtime.PWLineParam.arr1[config.runtime.PWLineParam.LineDensity - 1].y) / 2);
        CTXLine.stroke();
    }

    // Connecting lines
    CTXLine.beginPath();
    for (let i = 0; i < config.runtime.PWLineParam.LineDensity; i++) {
        CTXLine.moveTo(config.runtime.PWLineParam.arr1[i].x, config.runtime.PWLineParam.arr1[i].y);
        CTXLine.lineTo(config.runtime.PWLineParam.arr2[i].x, config.runtime.PWLineParam.arr2[i].y);
    }
    CTXLine.stroke();
}

/**
 * Draw style 3 - Separate top and bottom lines
 */
export function PWLineStyle3(): void {
    // Top line
    if (config.runtime.PWLineParam.Direction !== 2 || (config.runtime.PWLineParam.Direction === 2 && config.runtime.PWLineParam.MiddleLine)) {
        CTXLine.beginPath();
        CTXLine.moveTo(config.runtime.PWLineParam.arr1[0].x, config.runtime.PWLineParam.arr1[0].y);
        for (let i = 0; i < config.runtime.PWLineParam.LineDensity; i++) {
            CTXLine.lineTo(config.runtime.PWLineParam.arr1[i].x, config.runtime.PWLineParam.arr1[i].y);
        }
        CTXLine.stroke();
    }

    // Bottom line
    if (config.runtime.PWLineParam.Direction !== 1 || (config.runtime.PWLineParam.Direction === 1 && config.runtime.PWLineParam.MiddleLine)) {
        CTXLine.beginPath();
        CTXLine.moveTo(config.runtime.PWLineParam.arr2[0].x, config.runtime.PWLineParam.arr2[0].y);
        for (let i = 0; i < config.runtime.PWLineParam.LineDensity; i++) {
            CTXLine.lineTo(config.runtime.PWLineParam.arr2[i].x, config.runtime.PWLineParam.arr2[i].y);
        }
        CTXLine.stroke();
    }

    // Bidirectional middle line
    if (config.runtime.PWLineParam.Direction === 3 && config.runtime.PWLineParam.MiddleLine) {
        CTXLine.beginPath();
        CTXLine.moveTo((config.runtime.PWLineParam.arr2[0].x + config.runtime.PWLineParam.arr1[0].x) / 2, (config.runtime.PWLineParam.arr2[0].y + config.runtime.PWLineParam.arr1[0].y) / 2);
        CTXLine.lineTo((config.runtime.PWLineParam.arr2[config.runtime.PWLineParam.LineDensity - 1].x + config.runtime.PWLineParam.arr1[config.runtime.PWLineParam.LineDensity - 1].x) / 2, (config.runtime.PWLineParam.arr2[config.runtime.PWLineParam.LineDensity - 1].y + config.runtime.PWLineParam.arr1[config.runtime.PWLineParam.LineDensity - 1].y) / 2);
        CTXLine.stroke();
    }
}

