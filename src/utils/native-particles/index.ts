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
 *
 * 拆分说明：类型/常量 → ./types，运动逻辑 → ./motion，绘制逻辑 → ./render。
 * 类私有方法改为委托外部函数，行为与拆分前完全一致。
 */

import * as motion from './motion';
import * as render from './render';
import type { Direction, MoveOutMode, Particle, ParticlesOptions, ShapeType } from './types';
import { DEFAULTS } from './types';

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
            this.canvasWidth =
                window.innerWidth ||
                document.documentElement.clientWidth ||
                document.body.clientWidth;
            this.canvasHeight =
                window.innerHeight ||
                document.documentElement.clientHeight ||
                document.body.clientHeight;
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

    private initParticlesArray(): void {
        this.particlesArray = motion.initParticlesArray(
            this.number,
            this.canvasWidth,
            this.canvasHeight,
            this
        );
    }

    private addParticlesInternal(num: number): void {
        const old = this.number;
        motion.addParticlesInternal(
            this.particlesArray,
            num,
            old,
            this.canvasWidth,
            this.canvasHeight,
            this
        );
        this.number = this.particlesArray.length;
    }

    private setParticlesGlobalValue(): void {
        motion.setParticlesGlobalValue(
            this.particlesArray,
            this.opacity,
            this.opacityRandom,
            this.color,
            this.shadowColor,
            this.shadowBlur
        );
    }

    private setParticlesSizeValue(): void {
        motion.setParticlesSizeValue(
            this.particlesArray,
            this.shapeType,
            this.sizeValue,
            this.sizeRandom
        );
    }

    private setParticlesMoveValue(): void {
        motion.setParticlesMoveValue(
            this.particlesArray,
            this.speed,
            this.speedRandom,
            this.direction,
            this.isStraight
        );
    }

    private updateParticlesArray(): void {
        motion.updateParticlesArray(
            this.particlesArray,
            this.isMove,
            this.isBounce,
            this.moveOutMode,
            this.canvasWidth,
            this.canvasHeight
        );
    }

    private runTimer = (): void => {
        const animate = (): void => {
            this.updateParticlesArray();
            this.context.clearRect(0, 0, this.canvasWidth, this.canvasHeight);
            for (let i = 0; i < this.particlesArray.length; i++) {
                render.drawParticles(this.context, this.currantCanvas, this.particlesArray[i]!);
                if (this.linkEnable) {
                    render.drawLine(
                        this.context,
                        this.particlesArray,
                        i,
                        this.linkDistance,
                        this.linkWidth,
                        this.linkColor,
                        this.linkOpacity
                    );
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
            let scaling: number;
            if (this.img.width > this.imgHeight || this.img.height > this.imgHeight) {
                if (this.img.width > this.img.height) {
                    scaling = this.imgWidth / this.img.width;
                } else {
                    scaling = this.imgHeight / this.img.height;
                }
                this.currantCanvas.width = this.img.width * scaling;
                this.currantCanvas.height = this.img.height * scaling;
                this.currantContext.drawImage(
                    this.img,
                    0,
                    0,
                    this.currantCanvas.width,
                    this.currantCanvas.height
                );
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
