// PWParticles.ts - Audio particle visualizer module
// This module provides particle-based audio visualization effects

// Typedef for requestAnimFrame
type RequestAnimFrameCallback = (time: number) => void;

// Polyfill requestAnimFrame - assign to window with type assertion
const requestAnimFramePolyfill: RequestAnimFrameCallback = (function() {
    return (window as any).requestAnimationFrame ||
        (window as any).webkitRequestAnimationFrame ||
        (window as any).mozRequestAnimationFrame ||
        function(callback: RequestAnimFrameCallback) {
            window.setTimeout(callback, 1000 / 60);
        };
})();

// Use the polyfill
const requestAnimFrame = requestAnimFramePolyfill;

// Audio data array (shared with other modules)
declare let audioArrayPar: number[];

// Canvas and context - initialized in wResize() which is called at module load
let CanPar!: HTMLCanvasElement;
let CXTPar!: CanvasRenderingContext2D;

// Configuration options
let ratio: number = 0;
let isShowLine: boolean = false;
let isShowPoint: boolean = false;
let isMoveFollow: boolean = false;
let numLevel: number = 0;
let equalize: number = 0;
let pStyle: number = 0;
let usePColor: boolean = false;
let pColor: string = '';
let isBlur: boolean = false;
let blurColor: string = '';

// Point state
let points: {
    num: number;
    maxSize: number;
    mRadius: number;
    distance: number;
    arr: Point[];
} = { num: 0, maxSize: 0, mRadius: 0, distance: 0, arr: [] };
let num: number = 0;
let sum: number = 0;
let mouse: { x: number; y: number } = { x: 0, y: 0 };

/**
 * Point class representing a particle
 */
class Point {
    random: number;
    alpha: number;
    radius: number;
    x: number;
    y: number;
    speedX: number;
    speedY: number;
    color: Color;
    index: number;
    r: number;

    constructor() {
        this.random = Math.floor(Math.random() * 90) * 0.01 + 0.1;
        this.alpha = 1 - this.random + 0.05;
        this.radius = this.random * points.maxSize;
        this.x = Math.random() * CanPar.width;
        this.y = Math.random() * CanPar.height;
        this.speedX = -0.5 + Math.random();
        this.speedY = -0.5 + Math.random();
        this.color = new Color();
        this.index = pNum++;
        pNum %= 32;
        this.r = 0;
    }
}

/**
 * Color class for particles
 */
class Color {
    r: number;
    g: number;
    b: number;
    all: string;

    constructor() {
        this.r = ranColor();
        this.g = ranColor();
        this.b = ranColor();
        this.all = addColor(this.r, this.g, this.b, 0.75);
    }
}

// Point counter
let pNum = 0;

/**
 * Generate random color component
 */
function ranColor(): number {
    return Math.floor(Math.random() * 250 + 5);
}

/**
 * Create RGBA color string
 */
function addColor(r: number, g: number, b: number, a: number): string {
    return `rgba(${r},${g},${b},${a})`;
}

/**
 * Mix two colors based on radius weights
 */
function mixColor(point1: Point, point2: Point, a: number): string {
    const r = Math.floor((point1.color.r * point1.radius + point2.color.r * point2.radius) / (point1.radius + point2.radius));
    const g = Math.floor((point1.color.g * point1.radius + point2.color.g * point2.radius) / (point1.radius + point2.radius));
    const b = Math.floor((point1.color.b * point1.radius + point2.color.b * point2.radius) / (point1.radius + point2.radius));
    return addColor(r, g, b, a);
}

/**
 * Handle window resize
 */
export function wResize(): void {
    const canEl = document.querySelector("#canvas-particles") as HTMLCanvasElement;
    if (!canEl) {
        return;
    }
    CanPar = canEl;
    CXTPar = CanPar.getContext("2d")!;
    CanPar.width = window.innerWidth;
    CanPar.height = window.innerHeight;
}

/**
 * Create particle points
 */
export function PWParcreatePoint(): void {
    points.arr = [];
    num = Math.floor(points.num * numLevel / 4);
    for (let i = 0; i < num; i++) {
        points.arr.push(new Point());
    }
}

/**
 * Draw a single particle
 */
export function drawP(point: Point): void {
    let l = audioArrayPar[point.index] / 20;
    if (!l || l < 1) l = 1;
    let radius = Math.min(point.radius * l, 4) * ratio;
    if (point.r && equalize !== 1) radius = radius * equalize + point.r * (1 - equalize);

    CXTPar.beginPath();
    const pointColor = usePColor ? pColor.replace(/0\.8/, String(point.alpha)) : point.color.all;
    if (pStyle) {
        CXTPar.fillStyle = pointColor;
    } else {
        CXTPar.strokeStyle = pointColor;
    }
    CXTPar.arc(point.x, point.y, radius, 0, 2 * Math.PI, false);
    if (pStyle) {
        CXTPar.fill();
    } else {
        CXTPar.stroke();
    }
    if (equalize !== 1) point.r = radius;
}

/**
 * Move a particle
 */
export function moveP(point: Point, moveSum: number): void {
    point.x += point.speedX * moveSum;
    point.y += point.speedY * moveSum;

    if (point.x >= CanPar.width) {
        point.x = CanPar.width;
        point.speedX = -point.speedX;
    } else if (point.x <= 0) {
        point.x = 0;
        point.speedX = -point.speedX;
    }

    if (point.y >= CanPar.height) {
        point.y = CanPar.height;
        point.speedY = -point.speedY;
    } else if (point.y <= 0) {
        point.y = 0;
        point.speedY = -point.speedY;
    }
}

/**
 * Draw all particles
 */
export function drawPoint(): void {
    CXTPar.shadowBlur = isBlur ? 10 : 0;
    if (isBlur) CXTPar.shadowColor = blurColor;

    if (isMoveFollow) {
        const arr = audioArrayPar.slice(1, 6);
        sum = arr.reduce(function(a: number, b: number) { return a + b; }, 0) * 0.12;
        if (!sum || sum < 0.5) sum = 0.5;
        sum = Math.min(sum, 5);
    } else {
        sum = 1.5;
    }

    CXTPar.lineWidth = 1.5;

    for (let i = 0; i < num; i++) {
        const point = points.arr[i];
        moveP(point, sum);
        if (isShowPoint) drawP(point);
    }
}

/**
 * Connect particles with lines based on proximity
 */
export function connect(): void {
    CXTPar.save();
    CXTPar.lineWidth = 1;

    for (let i = 0; i < num; i++) {
        const pointI = points.arr[i];
        for (let j = 0; j < num; j++) {
            const pointJ = points.arr[j];
            if (Math.abs(pointI.x - mouse.x) <= points.mRadius && Math.abs(pointI.y - mouse.y) <= points.mRadius) {
                if (Math.abs(pointI.x - pointJ.x) <= points.distance && Math.abs(pointI.y - pointJ.y) <= points.distance) {
                    const x = pointI.x - mouse.x;
                    const y = pointI.y - mouse.y;
                    let lineC = 10 / Math.pow((x * x + y * y), 0.5);
                    lineC = Math.min(lineC, 1);
                    CXTPar.beginPath();
                    const lColor = usePColor ? pColor.replace(/0\.8/, String(lineC)) : mixColor(pointI, pointJ, lineC);
                    CXTPar.strokeStyle = lColor;
                    CXTPar.moveTo(pointI.x, pointI.y);
                    CXTPar.lineTo(pointJ.x, pointJ.y);
                    CXTPar.closePath();
                    CXTPar.stroke();
                }
            }
        }
    }

    CXTPar.restore();
}

/**
 * Main animation loop
 */
export function auto(): void {
    CXTPar.clearRect(0, 0, CanPar.width, CanPar.height);
    drawPoint();
    if (isShowLine) connect();
    (requestAnimFrame as any)(auto);
}

// Initialize
wResize();
PWParcreatePoint();
auto();

// Global exports for backward compatibility
(window as any).wResize = wResize;
(window as any).PWParcreatePoint = PWParcreatePoint;
(window as any).drawP = drawP;
(window as any).moveP = moveP;
(window as any).drawPoint = drawPoint;
(window as any).connect = connect;
(window as any).auto = auto;

