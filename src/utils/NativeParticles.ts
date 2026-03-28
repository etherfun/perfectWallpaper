/**
 * jQuery Particles plugin v0.0.2
 *
 * Based on:
 * particles.js by Vincent Garreau
 * Project: http://github.com/VincentGarreau/particles.js
 * Original author: Vincent Garreau
 * Copyright (c) 2015 Vincent Garreau
 * Licensed under the MIT License
 *
 * Distributed via Steam by Alice
 * Project: http://steamcommunity.com/sharedfiles/filedetails/?id=921617616&searchtext=
 * Copyright (c) 2017 Alice
 *
 * Refactored to TypeScript and modified by etherfun
 */

type Direction = 'none' | 'top' | 'top-right' | 'right' | 'bottom-right' | 'bottom' | 'bottom-left' | 'left' | 'top-left';
type MoveOutMode = 'out' | 'bounce';
type ShapeType = 'circle' | 'edge' | 'triangle' | 'star' | 'image';

interface Particle {
    opacity: number;
    color: string;
    shadowColor: string;
    shadowBlur: number;
    shapeType: ShapeType;
    radius: number;
    x: number;
    y: number;
    speed: number;
    vx: number;
    vy: number;
}

interface ParticlesOptions {
    number: number;
    opacity: number;
    opacityRandom: boolean;
    color: string;
    shadowColor: string;
    shadowBlur: number;
    shapeType: ShapeType;
    sizeValue: number;
    sizeRandom: boolean;
    linkEnable: boolean;
    linkDistance: number;
    linkWidth: number;
    linkColor: string;
    linkOpacity: number;
    isMove: boolean;
    speed: number;
    speedRandom: boolean;
    direction: Direction;
    isStraight: boolean;
    isBounce: boolean;
    moveOutMode: MoveOutMode;
}

const DEFAULTS: ParticlesOptions = {
    number: 100,
    opacity: 0.75,
    opacityRandom: false,
    color: '255,255,255',
    shadowColor: '255,255,255',
    shadowBlur: 0,
    shapeType: 'circle',
    sizeValue: 5,
    sizeRandom: true,
    linkEnable: false,
    linkDistance: 100,
    linkWidth: 2,
    linkColor: '255,255,255',
    linkOpacity: 0.75,
    isMove: true,
    speed: 2,
    speedRandom: true,
    direction: 'bottom',
    isStraight: false,
    isBounce: false,
    moveOutMode: 'out'
};

export class NativeParticles {
    private canvas!: HTMLCanvasElement;
    private context!: CanvasRenderingContext2D;
    private canvasWidth = 0;
    private canvasHeight = 0;

    private img = new Image();
    private imgWidth = 500;
    private imgHeight = 500;
    private currantCanvas!: HTMLCanvasElement;
    private currantContext!: CanvasRenderingContext2D;

    private particlesArray: Particle[] = [];
    private timer: number | null = null;
    private resizeHandler: (() => void) | null = null;

    // Options
    number = DEFAULTS.number;
    opacity = DEFAULTS.opacity;
    opacityRandom = DEFAULTS.opacityRandom;
    color = DEFAULTS.color;
    shadowColor = DEFAULTS.shadowColor;
    shadowBlur = DEFAULTS.shadowBlur;
    shapeType: ShapeType = DEFAULTS.shapeType;
    sizeValue = DEFAULTS.sizeValue;
    sizeRandom = DEFAULTS.sizeRandom;
    linkEnable = DEFAULTS.linkEnable;
    linkDistance = DEFAULTS.linkDistance;
    linkWidth = DEFAULTS.linkWidth;
    linkColor = DEFAULTS.linkColor;
    linkOpacity = DEFAULTS.linkOpacity;
    isMove = DEFAULTS.isMove;
    speed = DEFAULTS.speed;
    speedRandom = DEFAULTS.speedRandom;
    direction: Direction = DEFAULTS.direction;
    isStraight = DEFAULTS.isStraight;
    isBounce = DEFAULTS.isBounce;
    moveOutMode: MoveOutMode = DEFAULTS.moveOutMode;

    constructor(container: HTMLElement, options: Partial<ParticlesOptions> = {}) {
        // Merge defaults with options
        Object.assign(this, DEFAULTS, options);

        this.initCanvas(container);
        this.initParticlesArray();
        this.setupPointerEvents();
        // Note: animation does NOT auto-start. Call startParticles() explicitly.
    }

    private initCanvas(container: HTMLElement): void {
        this.canvas = document.getElementById('canvas-particles') as HTMLCanvasElement;
        if (!this.canvas) {
            this.canvas = document.createElement('canvas');
            this.canvas.id = 'canvas-particles';
            container.appendChild(this.canvas);
        }

        Object.assign(this.canvas.style, {
            position: 'absolute',
            top: '0',
            left: '0',
            'z-index': '1',
            opacity: String(this.opacity)
        });

        this.canvasWidth = window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth;
        this.canvasHeight = window.innerHeight || document.documentElement.clientHeight || document.body.clientHeight;
        this.canvas.width = this.canvasWidth;
        this.canvas.height = this.canvasHeight;

        this.context = this.canvas.getContext('2d')!;
        this.context.fillStyle = `rgb(${this.color})`;
        this.context.shadowColor = `rgb(${this.shadowColor})`;
        this.context.shadowBlur = this.shadowBlur;
        this.context.lineWidth = this.linkWidth;
        this.context.strokeStyle = `rgba(${this.linkColor}, 1)`;

        // Off-screen canvas for image particles
        this.currantCanvas = document.createElement('canvas');
        this.currantCanvas.width = this.canvasWidth;
        this.currantCanvas.height = this.canvasHeight;
        this.currantContext = this.currantCanvas.getContext('2d')!;

        // Initialize image
        this.img.id = 'particles-img';
        this.img.src = 'map/1.png';
        this.particlesImage('');
    }

    private setupPointerEvents(): void {
        this.resizeHandler = () => {
            this.canvasWidth = window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth;
            this.canvasHeight = window.innerHeight || document.documentElement.clientHeight || document.body.clientHeight;
        };
        window.addEventListener('resize', this.resizeHandler);
    }

    destroy(): void {
        this.stopParticles();
        if (this.resizeHandler) {
            window.removeEventListener('resize', this.resizeHandler);
            this.resizeHandler = null;
        }
        if (this.canvas?.parentNode) {
            this.canvas.parentNode.removeChild(this.canvas);
        }
    }

    private getDist(x1: number, y1: number, x2: number, y2: number): number {
        const dx = x1 - x2;
        const dy = y1 - y2;
        return Math.sqrt(dx * dx + dy * dy);
    }

    private checkOverlap(index: number): void {
        for (let i = 0; i < this.particlesArray.length; i++) {
            if (i === index) continue;
            const p1 = this.particlesArray[index];
            const p2 = this.particlesArray[i];
            const dist = this.getDist(p1.x, p1.y, p2.x, p2.y);
            if (dist <= p1.radius + p2.radius) {
                p1.x = Math.random() * this.canvasWidth;
                p1.y = Math.random() * this.canvasHeight;
                this.checkOverlap(index);
            }
        }
    }

    private directionVector(direction: Direction): { x: number; y: number } {
        switch (direction) {
            case 'none': return { x: 0, y: 0 };
            case 'top': return { x: 0, y: -1 };
            case 'top-right': return { x: 0.5, y: -0.5 };
            case 'right': return { x: 1, y: 0 };
            case 'bottom-right': return { x: 0.5, y: 0.5 };
            case 'bottom': return { x: 0, y: 1 };
            case 'bottom-left': return { x: -0.5, y: 1 };
            case 'left': return { x: -1, y: 0 };
            case 'top-left': return { x: -0.5, y: -0.5 };
            default: return { x: 0, y: 0 };
        }
    }

    private moveStraight(particles: Particle): void {
        const dir = this.directionVector(this.direction);
        if (this.isStraight) {
            particles.vx = dir.x;
            particles.vy = dir.y;
        } else {
            particles.vx = dir.x + Math.random() - 0.5;
            particles.vy = dir.y + Math.random() - 0.5;
        }
    }

    private moveParticles(particles: Particle): void {
        if (this.isMove) {
            particles.x += particles.vx * particles.speed;
            particles.y += particles.vy * particles.speed;
        }
    }

    private bounceParticles(index: number): void {
        if (!this.isBounce) return;
        for (let i = 0; i < this.particlesArray.length; i++) {
            if (i === index) continue;
            const p1 = this.particlesArray[index];
            const p2 = this.particlesArray[i];
            const dist = this.getDist(p1.x, p1.y, p2.x, p2.y);
            const distP = p1.radius + p2.radius;
            if (dist <= distP) {
                p1.vx = -p1.vx;
                p1.vy = -p1.vy;
                p2.vx = -p2.vx;
                p2.vy = -p2.vy;
            }
        }
    }

    private marginalCheck(particles: Particle): void {
        let newPos: { x_left: number; x_right: number; y_top: number; y_bottom: number };

        if (this.moveOutMode === 'bounce') {
            newPos = {
                x_left: particles.radius,
                x_right: this.canvasWidth,
                y_top: particles.radius,
                y_bottom: this.canvasHeight
            };
        } else {
            newPos = {
                x_left: -particles.radius,
                x_right: this.canvasWidth + particles.radius,
                y_top: -particles.radius,
                y_bottom: this.canvasHeight + particles.radius
            };
        }

        // Check bounds and reposition
        if (particles.x - particles.radius > this.canvasWidth) {
            particles.x = newPos.x_left;
            particles.y = Math.random() * this.canvasHeight;
        } else if (particles.x + particles.radius < 0) {
            particles.x = newPos.x_right;
            particles.y = Math.random() * this.canvasHeight;
        }

        if (particles.y - particles.radius > this.canvasHeight) {
            particles.y = newPos.y_top;
            particles.x = Math.random() * this.canvasWidth;
        } else if (particles.y + particles.radius < 0) {
            particles.y = newPos.y_bottom;
            particles.x = Math.random() * this.canvasWidth;
        }

        // Bounce direction
        if (this.moveOutMode === 'bounce') {
            if (particles.x + particles.radius > this.canvasWidth) particles.vx = -particles.vx;
            else if (particles.x - particles.radius < 0) particles.vx = -particles.vx;
            if (particles.y + particles.radius > this.canvasHeight) particles.vy = -particles.vy;
            else if (particles.y - particles.radius < 0) particles.vy = -particles.vy;
        }
    }

    private initParticlesArray(): void {
        for (let i = 0; i < this.number; i++) {
            const x = Math.floor(0.5 + Math.random() * this.canvasWidth);
            const y = Math.floor(0.5 + Math.random() * this.canvasHeight);
            this.particlesArray.push({
                opacity: this.opacity,
                color: this.color,
                shadowColor: this.shadowColor,
                shadowBlur: this.shadowBlur,
                shapeType: this.shapeType,
                radius: this.sizeValue,
                x, y,
                speed: 0,
                vx: 0,
                vy: 0
            });
        }

        for (let i = 0; i < this.particlesArray.length; i++) {
            const p = this.particlesArray[i];
            p.opacity = this.opacityRandom ? Math.min(Math.random(), this.opacity) : this.opacity;
            p.radius = (this.sizeRandom ? Math.random() : 1) * this.sizeValue;
            p.speed = Math.max(1, (this.speedRandom ? Math.random() : 1) * this.speed);
            this.moveStraight(p);
            this.checkOverlap(i);
        }
    }

    private addParticlesInternal(num: number): void {
        const old = this.number;
        if (num > old) {
            const n = num - old;
            for (let i = 0; i < n; i++) {
                const x = Math.floor(0.5 + Math.random() * this.canvasWidth);
                const y = Math.floor(0.5 + Math.random() * this.canvasHeight);
                this.particlesArray.push({
                    opacity: this.opacity,
                    color: this.color,
                    shadowColor: this.shadowColor,
                    shadowBlur: this.shadowBlur,
                    shapeType: this.shapeType,
                    radius: this.sizeValue,
                    x, y,
                    speed: 0,
                    vx: 0,
                    vy: 0
                });
            }
            for (let i = 0; i < this.particlesArray.length; i++) {
                const p = this.particlesArray[i];
                p.opacity = this.opacityRandom ? Math.random() : this.opacity;
                p.radius = (this.sizeRandom ? Math.random() : 1) * this.sizeValue;
                p.speed = (this.speedRandom ? Math.random() : 1) * this.speed;
                this.moveStraight(p);
            }
            for (let i = 0; i < this.particlesArray.length; i++) {
                this.checkOverlap(i);
            }
        } else if (num >= 0 && num < old) {
            const n = old - num;
            for (let i = 0; i < n; i++) {
                this.particlesArray.pop();
            }
        }
        this.number = this.particlesArray.length;
    }

    private setParticlesGlobalValue(): void {
        for (const p of this.particlesArray) {
            p.opacity = this.opacityRandom ? Math.min(Math.random(), this.opacity) : this.opacity;
            p.color = this.color;
            p.shadowColor = this.shadowColor;
            p.shadowBlur = this.shadowBlur;
        }
    }

    private setParticlesSizeValue(): void {
        for (const p of this.particlesArray) {
            p.shapeType = this.shapeType;
            p.radius = (this.sizeRandom ? Math.random() : 1) * this.sizeValue;
        }
    }

    private setParticlesMoveValue(): void {
        for (const p of this.particlesArray) {
            p.speed = Math.max(1, (this.speedRandom ? Math.random() : 1) * this.speed);
            this.moveStraight(p);
        }
    }

    private drawShape(ctx: CanvasRenderingContext2D, startX: number, startY: number, sideLength: number, sideCountNumerator: number, sideCountDenominator: number): void {
        const sideCount = sideCountNumerator * sideCountDenominator;
        const decimalSides = sideCountNumerator / sideCountDenominator;
        const interiorAngleDegrees = (180 * (decimalSides - 2)) / decimalSides;
        const interiorAngle = Math.PI - Math.PI * interiorAngleDegrees / 180;
        ctx.translate(startX, startY);
        ctx.moveTo(0, 0);
        for (let i = 0; i < sideCount; i++) {
            ctx.lineTo(sideLength, 0);
            ctx.translate(sideLength, 0);
            ctx.rotate(interiorAngle);
        }
    }

    private drawParticles(particles: Particle): void {
        this.context.save();
        this.context.fillStyle = `rgb(${particles.color})`;
        this.context.shadowColor = `rgb(${particles.shadowColor})`;
        this.context.shadowBlur = particles.shadowBlur;
        this.context.globalAlpha = particles.opacity;
        this.context.beginPath();

        switch (particles.shapeType) {
            case 'circle':
                this.context.arc(particles.x, particles.y, particles.radius, 0, Math.PI * 2, false);
                break;
            case 'edge':
                this.context.rect(particles.x - particles.radius, particles.y - particles.radius, particles.radius * 2, particles.radius * 2);
                break;
            case 'triangle':
                this.drawShape(this.context, particles.x - particles.radius, particles.y + particles.radius / 1.66, particles.radius * 2, 3, 2);
                break;
            case 'star':
                this.drawShape(
                    this.context,
                    particles.x - particles.radius * 2 / (5 / 4),
                    particles.y - particles.radius / (2 * 2.66 / 3.5),
                    particles.radius * 2 * 2.66 / (5 / 3),
                    5,
                    2
                );
                break;
            case 'image':
                if (this.currantCanvas.width > particles.radius * 10 || this.currantCanvas.height > particles.radius * 10) {
                    let scaling = 0.5;
                    let width: number, height: number;
                    if (this.currantCanvas.width > this.currantCanvas.height) {
                        scaling = particles.radius * 10 / this.currantCanvas.width;
                    } else {
                        scaling = particles.radius * 10 / this.currantCanvas.height;
                    }
                    width = this.currantCanvas.width * scaling;
                    height = this.currantCanvas.height * scaling;
                    this.context.drawImage(this.currantCanvas, particles.x, particles.y, width, height);
                }
                break;
        }

        this.context.closePath();
        this.context.fill();
        this.context.restore();
    }

    private drawLine(index: number): void {
        for (let i = 0; i < this.particlesArray.length; i++) {
            if (i === index) continue;
            const p1 = this.particlesArray[index];
            const p2 = this.particlesArray[i];
            const dist = this.getDist(p1.x, p1.y, p2.x, p2.y);
            if (dist <= this.linkDistance) {
                const d = (this.linkDistance - dist) / this.linkDistance;
                this.context.save();
                this.context.lineWidth = d * this.linkWidth;
                this.context.strokeStyle = `rgba(${this.linkColor}, ${Math.min(d, this.linkOpacity)})`;
                this.context.beginPath();
                this.context.moveTo(p1.x, p1.y);
                this.context.lineTo(p2.x, p2.y);
                this.context.closePath();
                this.context.stroke();
                this.context.restore();
            }
        }
    }

    private updateParticlesArray(): void {
        for (let i = 0; i < this.particlesArray.length; i++) {
            this.moveParticles(this.particlesArray[i]);
            this.bounceParticles(i);
            this.marginalCheck(this.particlesArray[i]);
        }
    }

    private runTimer = (): void => {
        const animate = (): void => {
            this.updateParticlesArray();
            this.context.clearRect(0, 0, this.canvasWidth, this.canvasHeight);
            for (let i = 0; i < this.particlesArray.length; i++) {
                this.drawParticles(this.particlesArray[i]);
                if (this.linkEnable) {
                    this.drawLine(i);
                }
            }
            this.timer = requestAnimationFrame(animate);
        };
        animate();
    };

    // Public API
    clearCanvas(): void {
        this.context.clearRect(0, 0, this.canvasWidth, this.canvasHeight);
    }

    addParticles(num: number): void {
        this.addParticlesInternal(num);
    }

    particlesImage(imgSrc: string, blnDefault?: string): void {
        if (imgSrc) {
            this.img.src = blnDefault === 'true' ? imgSrc : 'file:///' + imgSrc;
        } else {
            this.img.src = 'map/1.png';
        }
        this.img.onload = () => {
            let scaling = 0.5;
            if (this.img.width > this.imgHeight || this.img.height > this.imgHeight) {
                if (this.img.width > this.img.height) {
                    scaling = this.imgWidth / this.img.width;
                } else {
                    scaling = this.imgHeight / this.img.height;
                }
                this.currantCanvas.width = this.img.width * scaling;
                this.currantCanvas.height = this.img.height * scaling;
                this.currantContext.drawImage(this.img, 0, 0, this.currantCanvas.width, this.currantCanvas.height);
            } else {
                this.currantCanvas.width = this.img.width;
                this.currantCanvas.height = this.img.height;
                this.currantContext.drawImage(this.img, 0, 0);
            }
        };
    }

    startParticles(): void {
        this.stopParticles();
        this.runTimer();
    }

    stopParticles(): void {
        if (this.timer !== null) {
            cancelAnimationFrame(this.timer);
            this.timer = null;
        }
    }

    set(property: string, value: unknown): void {
        switch (property) {
            case 'number':
            case 'linkEnable':
            case 'linkDistance':
            case 'linkWidth':
            case 'linkColor':
            case 'linkOpacity':
            case 'isMove':
            case 'isBounce':
            case 'moveOutMode':
                (this as unknown as Record<string, unknown>)[property] = value;
                break;
            case 'color':
            case 'opacity':
            case 'opacityRandom':
            case 'shadowColor':
            case 'shadowBlur':
                (this as unknown as Record<string, unknown>)[property] = value;
                this.setParticlesGlobalValue();
                break;
            case 'shapeType':
            case 'sizeValue':
            case 'sizeRandom':
                (this as unknown as Record<string, unknown>)[property] = value;
                this.setParticlesSizeValue();
                break;
            case 'speed':
            case 'speedRandom':
            case 'direction':
            case 'isStraight':
                (this as unknown as Record<string, unknown>)[property] = value;
                this.setParticlesMoveValue();
                break;
        }
    }
}