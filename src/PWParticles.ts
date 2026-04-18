// PWParticles.ts - Audio particle visualizer module
// This module provides particle-based audio visualization effects

// Typedef for requestAnimFrame
type RequestAnimFrameCallback = (time: number) => void;

// Polyfill requestAnimFrame
const requestAnimFramePolyfill: RequestAnimFrameCallback = (function () {
    const vendors = ['webkit', 'moz'];
    const win = window as typeof window & Record<string, any>;
    for (let i = 0; i < vendors.length; i++) {
        const vp = vendors[i] + 'RequestAnimationFrame';
        if (win[vp]) {
            return win[vp].bind(win);
        }
    }
    return function (callback: RequestAnimFrameCallback) {
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

// Precompiled regex for color alpha replacement (performance optimization)
const COLOR_ALPHA_REGEX = /0\.8/g;

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
let pAutoTimer: number | null = null;
let pAutoRunning = false;

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
    const r = Math.floor(
        (point1.color.r * point1.radius + point2.color.r * point2.radius) /
            (point1.radius + point2.radius)
    );
    const g = Math.floor(
        (point1.color.g * point1.radius + point2.color.g * point2.radius) /
            (point1.radius + point2.radius)
    );
    const b = Math.floor(
        (point1.color.b * point1.radius + point2.color.b * point2.radius) /
            (point1.radius + point2.radius)
    );
    return addColor(r, g, b, a);
}

/**
 * Handle window resize
 */
export function wResize(): void {
    const canEl = document.querySelector('#canvas-particles') as HTMLCanvasElement;
    if (!canEl) {
        return;
    }
    CanPar = canEl;
    CXTPar = CanPar.getContext('2d')!;
    CanPar.width = window.innerWidth;
    CanPar.height = window.innerHeight;
}

/**
 * Create particle points
 */
export function PWParcreatePoint(): void {
    points.arr = [];
    num = Math.floor((points.num * numLevel) / 4);
    for (let i = 0; i < num; i++) {
        points.arr.push(new Point());
    }
}

/**
 * Draw a single particle
 */
export function drawP(point: Point): void {
    let l = (audioArrayPar?.[point.index] ?? 0) / 20;
    if (!l || l < 1) l = 1;
    let radius = Math.min(point.radius * l, 4) * ratio;
    if (point.r && equalize !== 1) radius = radius * equalize + point.r * (1 - equalize);

    CXTPar.beginPath();
    const pointColor = usePColor
        ? pColor.replace(COLOR_ALPHA_REGEX, String(point.alpha))
        : point.color.all;
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
        sum =
            arr.reduce(function (a: number, b: number) {
                return a + b;
            }, 0) * 0.12;
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
 * Optimized: pre-filter particles within mouse radius, avoid duplicate pair checks
 */
export function connect(): void {
    CXTPar.save();
    CXTPar.lineWidth = 1;

    // Pre-filter particles within mouse radius (O(n) instead of checking in inner loop)
    const particlesInRadius: Point[] = [];
    for (let i = 0; i < num; i++) {
        const pointI = points.arr[i];
        if (
            Math.abs(pointI.x - mouse.x) <= points.mRadius &&
            Math.abs(pointI.y - mouse.y) <= points.mRadius
        ) {
            particlesInRadius.push(pointI);
        }
    }

    // Pre-compute distance threshold squared (avoid sqrt in inner loop)
    const distThreshold = points.distance;
    const distThresholdSq = distThreshold * distThreshold;

    // Only process particles within mouse radius (k = particlesInRadius.length, typically k << n)
    // Use j = i + 1 to skip self-checks and duplicate pair checks (50% reduction)
    const len = particlesInRadius.length;
    for (let i = 0; i < len; i++) {
        const pointI = particlesInRadius[i];
        for (let j = i + 1; j < len; j++) {
            const pointJ = particlesInRadius[j];
            const dx = pointI.x - pointJ.x;
            const dy = pointI.y - pointJ.y;
            // Use squared distance comparison (avoids sqrt)
            if (dx * dx + dy * dy <= distThresholdSq) {
                const x = pointI.x - mouse.x;
                const y = pointI.y - mouse.y;
                let lineC = 10 / Math.sqrt(x * x + y * y);
                lineC = Math.min(lineC, 1);
                CXTPar.beginPath();
                const lColor = usePColor
                    ? pColor.replace(COLOR_ALPHA_REGEX, String(lineC))
                    : mixColor(pointI, pointJ, lineC);
                CXTPar.strokeStyle = lColor;
                CXTPar.moveTo(pointI.x, pointI.y);
                CXTPar.lineTo(pointJ.x, pointJ.y);
                CXTPar.closePath();
                CXTPar.stroke();
            }
        }
    }

    CXTPar.restore();
}

/**
 * Main animation loop
 */
export function auto(): void {
    if (pAutoRunning) return;
    pAutoRunning = true;
    const loop = (): void => {
        CXTPar.clearRect(0, 0, CanPar.width, CanPar.height);
        drawPoint();
        if (isShowLine) connect();
        pAutoTimer = (requestAnimFrame as any)(loop);
    };
    loop();
}

/** Stop the PWParticles animation loop */
export function stopAuto(): void {
    pAutoRunning = false;
    if (pAutoTimer !== null) {
        cancelAnimationFrame(pAutoTimer);
        pAutoTimer = null;
    }
}

/** Start the PWParticles animation loop */
export function startAuto(): void {
    if (!pAutoRunning) {
        auto();
    }
}

// Initialize
wResize();
PWParcreatePoint();
