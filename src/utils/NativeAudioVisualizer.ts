/**
 * Native AudioVisualizer - jQuery-free audio visualizer
 *
 * Based on:
 * jQuery AudioVisualizer plugin v0.0.1
 * Original author: Alice
 * Project: http://steamcommunity.com/sharedfiles/filedetails/?id=921617616&searchtext=
 * Copyright (c) 2017 Alice
 * Licensed under the MIT License
 *
 * Refactored to TypeScript and modified by etherfun
 */

interface AudioVisualizerOptions {
    opacity: number;
    color: string;
    shadowColor: string;
    shadowBlur: number;
    offsetX: number;
    offsetY: number;
    isClickOffset: boolean;
    amplitude: number;
    decline: number;
    isRing: boolean;
    isStaticRing: boolean;
    isInnerRing: boolean;
    isOuterRing: boolean;
    radius: number;
    ringRotation: number;
    isLineTo: boolean;
    firstPoint: number;
    secondPoint: number;
    pointNum: number;
    distance: number;
    lineWidth: number;
    isBall: boolean;
    ballSpacer: number;
    ballSize: number;
    ballRotation: number;
}

const DEFAULTS: AudioVisualizerOptions = {
    opacity: 0.9,
    color: '255,255,255',
    shadowColor: '255,255,255',
    shadowBlur: 15,
    offsetX: 0.5,
    offsetY: 0.5,
    isClickOffset: false,
    amplitude: 5,
    decline: 0.2,
    isRing: true,
    isStaticRing: false,
    isInnerRing: true,
    isOuterRing: true,
    radius: 0.5,
    ringRotation: 0,
    isLineTo: false,
    firstPoint: 2,
    secondPoint: 3,
    pointNum: 120,
    distance: 0,
    lineWidth: 5,
    isBall: true,
    ballSpacer: 3,
    ballSize: 3,
    ballRotation: 0,
};

export class NativeAudioVisualizer {
    private canvas!: HTMLCanvasElement;
    private context!: CanvasRenderingContext2D;
    private canvasWidth = 0;
    private canvasHeight = 0;
    private originX = 0;
    private originY = 0;
    private minLength = 300;

    private pointArray1: { x: number; y: number }[] = [];
    private pointArray2: { x: number; y: number }[] = [];
    private staticPointsArray: { x: number; y: number }[] = [];
    private ballPointArray: { x: number; y: number }[] = [];

    private lastAudioSamples: number[] = Array(128).fill(0);
    private rotationAngle1 = 0;
    private rotationAngle2 = 0;

    // Options
    opacity = DEFAULTS.opacity;
    color = DEFAULTS.color;
    shadowColor = DEFAULTS.shadowColor;
    shadowBlur = DEFAULTS.shadowBlur;
    offsetX = DEFAULTS.offsetX;
    offsetY = DEFAULTS.offsetY;
    isClickOffset = DEFAULTS.isClickOffset;
    amplitude = DEFAULTS.amplitude;
    decline = DEFAULTS.decline;
    isRing = DEFAULTS.isRing;
    isStaticRing = DEFAULTS.isStaticRing;
    isInnerRing = DEFAULTS.isInnerRing;
    isOuterRing = DEFAULTS.isOuterRing;
    radius = DEFAULTS.radius;
    ringRotation = DEFAULTS.ringRotation;
    isLineTo = DEFAULTS.isLineTo;
    firstPoint = DEFAULTS.firstPoint;
    secondPoint = DEFAULTS.secondPoint;
    pointNum = DEFAULTS.pointNum;
    distance = DEFAULTS.distance;
    lineWidth = DEFAULTS.lineWidth;
    isBall = DEFAULTS.isBall;
    ballSpacer = DEFAULTS.ballSpacer;
    ballSize = DEFAULTS.ballSize;
    ballRotation = DEFAULTS.ballRotation;

    constructor(container: HTMLElement, options: Partial<AudioVisualizerOptions> = {}) {
        Object.assign(this, DEFAULTS, options);

        this.initCanvas(container);
        this.setupPointerEvents();
    }

    private initCanvas(container: HTMLElement): void {
        this.canvas = document.getElementById('canvas-audio') as HTMLCanvasElement;
        if (!this.canvas) {
            this.canvas = document.createElement('canvas');
            this.canvas.id = 'canvas-audio';
            container.appendChild(this.canvas);
        }

        Object.assign(this.canvas.style, {
            position: 'absolute',
            top: '0',
            left: '0',
            'z-index': '2',
            opacity: String(this.opacity),
        });

        this.canvasWidth =
            window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth;
        this.canvasHeight =
            window.innerHeight ||
            document.documentElement.clientHeight ||
            document.body.clientHeight;
        this.canvas.width = this.canvasWidth;
        this.canvas.height = this.canvasHeight;

        this.minLength = Math.min(this.canvasWidth, this.canvasHeight);
        this.originX = this.canvasWidth * this.offsetX;
        this.originY = this.canvasHeight * this.offsetY;

        this.context = this.canvas.getContext('2d')!;
        this.context.fillStyle = `rgb(${this.color})`;
        this.context.lineWidth = this.lineWidth;
        this.context.strokeStyle = `rgb(${this.color})`;
        this.context.shadowColor = `rgb(${this.color})`;
        this.context.shadowBlur = this.shadowBlur;
    }

    private setupPointerEvents(): void {
        this.canvas.addEventListener('click', e => {
            if (this.isClickOffset) {
                this.offsetX = e.clientX / this.canvasWidth;
                this.offsetY = e.clientY / this.canvasHeight;
            }
        });

        window.addEventListener('resize', () => {
            this.canvasWidth =
                window.innerWidth ||
                document.documentElement.clientWidth ||
                document.body.clientWidth;
            this.canvasHeight =
                window.innerHeight ||
                document.documentElement.clientHeight ||
                document.body.clientHeight;
            this.minLength = Math.min(this.canvasWidth, this.canvasHeight);
            this.originX = this.canvasWidth * this.offsetX;
            this.originY = this.canvasHeight * this.offsetY;
            // 更新画布分辨率
            this.canvas.width = this.canvasWidth;
            this.canvas.height = this.canvasHeight;
        });
    }

    private getRingArray(audioSamples: number[], num: number): number[] {
        const AudioArray = [...(audioSamples || [])];
        const max = AudioArray.length - num;
        let isFirst = true;
        for (let i = 0; i < max; i++) {
            if (isFirst) {
                AudioArray.shift();
                isFirst = false;
            } else {
                AudioArray.pop();
                isFirst = true;
            }
        }
        return AudioArray;
    }

    private getBallArray(audioSamples: number[], num: number): number[] {
        const AudioArray: number[] = [];
        for (let i = 0; i < 120; i += num) {
            AudioArray.push(audioSamples[i] || 0);
        }
        return AudioArray;
    }

    private getAudioSamples(
        audioSamples: number[],
        index: number,
        decline: number,
        isChange: boolean
    ): number {
        let audioValue = audioSamples[index] ? audioSamples[index] : 0;
        audioValue = Math.max(audioValue, (this.lastAudioSamples[index] || 0) - decline || 0.1);
        audioValue = Math.min(audioValue, 1.5);
        if (isChange) {
            this.lastAudioSamples[index] = audioValue;
        }
        return audioValue;
    }

    private rotation(angle: number, deg: number): number {
        angle += (Math.PI / 180) * deg;
        angle = angle % (2 * Math.PI);
        return angle;
    }

    private getDeg(point: number, index: number, angle: number): number {
        return (Math.PI / 180) * (360 / point) * (index + angle / 3);
    }

    private getXY(radius: number, deg: number, x: number, y: number): { x: number; y: number } {
        return {
            x: Math.cos(deg) * radius + x,
            y: Math.sin(deg) * radius + y,
        };
    }

    private setPoint(
        audioSamples: number[],
        direction: number,
        isChange: boolean
    ): { x: number; y: number }[] {
        const pointArray: { x: number; y: number }[] = [];
        const ringArray = this.getRingArray(audioSamples, this.pointNum);
        this.rotationAngle1 = this.rotation(this.rotationAngle1, this.ringRotation);

        for (let i = 0; i < ringArray.length; i++) {
            const deg = this.getDeg(ringArray.length, i, this.rotationAngle1);
            const audioValue = this.getAudioSamples(audioSamples, i, this.decline, isChange);
            const radius =
                this.radius * (this.minLength / 2) +
                direction * (this.distance + audioValue * (this.amplitude * 15));
            const point = this.getXY(radius, deg, this.originX, this.originY);
            pointArray.push({ x: point.x, y: point.y });
        }
        return pointArray;
    }

    private setStaticPoint(audioSamples: number[]): { x: number; y: number }[] {
        const pointArray: { x: number; y: number }[] = [];
        const ringArray = this.getRingArray(audioSamples, this.pointNum);
        this.rotationAngle1 = this.rotation(this.rotationAngle1, this.ringRotation);

        for (let i = 0; i < ringArray.length; i++) {
            const deg = this.getDeg(ringArray.length, i, this.rotationAngle1);
            const radius = this.radius * (this.minLength / 2);
            const point = this.getXY(radius, deg, this.originX, this.originY);
            pointArray.push({ x: point.x, y: point.y });
        }
        return pointArray;
    }

    private setBall(audioSamples: number[]): { x: number; y: number }[] {
        const pointArray: { x: number; y: number }[] = [];
        const ballArray = this.getBallArray(audioSamples, this.ballSpacer);
        this.rotationAngle2 = this.rotation(this.rotationAngle2, this.ballRotation);

        for (let i = 0; i < ballArray.length; i++) {
            const deg = this.getDeg(ballArray.length, i, this.rotationAngle2);
            const audioValue = Math.min(audioSamples[i] ? audioSamples[i] : 0, 1);
            const radius =
                this.radius * (this.minLength / 2) + (this.distance + 50) + audioValue * 75;
            const point = this.getXY(radius, deg, this.originX, this.originY);
            pointArray.push({ x: point.x, y: point.y });
        }
        return pointArray;
    }

    private getPointArray(num: number): { x: number; y: number }[] {
        switch (num) {
            case 1:
                return this.staticPointsArray;
            case 2:
                return this.pointArray1;
            case 3:
                return this.pointArray2;
            default:
                return [];
        }
    }

    private drawRing(pointArray: { x: number; y: number }[]): void {
        if (pointArray.length === 0) return;
        this.context.beginPath();
        this.context.moveTo(pointArray[0].x, pointArray[0].y);
        for (let i = 0; i < pointArray.length; i++) {
            this.context.lineTo(pointArray[i].x, pointArray[i].y);
        }
        this.context.closePath();
        this.context.stroke();
    }

    private drawBall(pointArray: { x: number; y: number }[], ballSize: number): void {
        for (let i = 0; i < pointArray.length; i++) {
            this.context.beginPath();
            this.context.arc(pointArray[i].x - 0.5, pointArray[i].y - 0.5, ballSize, 0, 360, false);
            this.context.closePath();
            this.context.fill();
        }
    }

    private drawLine(
        pointArray1: { x: number; y: number }[],
        pointArray2: { x: number; y: number }[]
    ): void {
        this.context.beginPath();
        const max = Math.min(pointArray1.length, pointArray2.length);
        for (let i = 0; i < max; i++) {
            this.context.moveTo(pointArray1[i].x, pointArray1[i].y);
            this.context.lineTo(pointArray2[i].x, pointArray2[i].y);
        }
        this.context.closePath();
        this.context.stroke();
    }

    // Public API
    clearCanvas(): void {
        this.context.clearRect(0, 0, this.canvasWidth, this.canvasHeight);
    }

    drawCanvas(audioSamples: number[]): void {
        this.clearCanvas();
        this.originX = this.canvasWidth * this.offsetX;
        this.originY = this.canvasHeight * this.offsetY;

        this.pointArray1 = this.setPoint(audioSamples, -1, true);
        this.pointArray2 = this.setPoint(audioSamples, 1, false);
        this.staticPointsArray = this.setStaticPoint(audioSamples);
        this.ballPointArray = this.setBall(audioSamples);

        // Draw rings
        if (this.isRing) {
            if (this.isStaticRing) {
                this.drawRing(this.staticPointsArray);
            }
            if (this.isInnerRing) {
                this.drawRing(this.pointArray1);
            }
            if (this.isOuterRing) {
                this.drawRing(this.pointArray2);
            }
        }

        // Draw lines
        const firstArray = this.getPointArray(this.firstPoint);
        const secondArray = this.getPointArray(this.secondPoint);
        if (this.isLineTo && this.firstPoint !== this.secondPoint) {
            this.drawLine(firstArray, secondArray);
        }

        // Draw balls
        if (this.isBall) {
            this.drawBall(this.ballPointArray, this.ballSize);
        }
    }

    set(property: string, value: unknown): void {
        switch (property) {
            case 'opacity':
                this.canvas.style.opacity = String(value);
                break;
            case 'color':
                this.color = value as string;
                this.context.fillStyle = `rgb(${value})`;
                this.context.strokeStyle = `rgb(${value})`;
                break;
            case 'shadowColor':
                this.shadowColor = value as string;
                this.context.shadowColor = `rgb(${value})`;
                break;
            case 'shadowBlur':
                this.shadowBlur = value as number;
                this.context.shadowBlur = this.shadowBlur;
                break;
            case 'lineWidth':
                this.lineWidth = value as number;
                this.context.lineWidth = this.lineWidth;
                break;
            case 'offsetX':
            case 'offsetY':
            case 'isClickOffset':
            case 'isRing':
            case 'isStaticRing':
            case 'isInnerRing':
            case 'isOuterRing':
            case 'ringRotation':
            case 'radius':
            case 'amplitude':
            case 'decline':
            case 'distance':
            case 'isLineTo':
            case 'firstPoint':
            case 'secondPoint':
            case 'pointNum':
            case 'isBall':
            case 'ballSpacer':
            case 'ballSize':
            case 'ballRotation':
                (this as unknown as Record<string, unknown>)[property] = value;
                break;
        }
    }

    destroy(): void {
        this.canvas.remove();
    }
}
