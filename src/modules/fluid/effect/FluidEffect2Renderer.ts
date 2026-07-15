/**
 * 流体效果渲染器
 *
 * 单一职责：基于 SVG feTurbulence + feDisplacementMap 滤镜和 2x2 canvas 网格，
 * 把源图片绘制成有流体变形视觉的画面。状态机协调由 `FluidEffect` 处理。
 *
 * 叶子逻辑（SVG 滤镜、画布网格布局、图片切片绘制）已抽到独立模块，
 * 本类只负责持有状态并把这些能力串起来。
 */

import { debugLogger } from '@/utils/logger';

import type { FluidEffectOptions } from '../types';
import { DEFAULT_FLUID_EFFECT_OPTIONS } from '../types';
import {
    type CanvasGrid,
    createCanvasGrid,
    layoutCanvasGrid,
    randomizeCanvasOffsets,
    unmountCanvasGrid,
} from './canvasLayout';
import { drawImageToCanvasGrid, loadImageFromUrl } from './imageSource';
import { setAnimationPlayState } from './playbackState';
import { mountSvgFilter, unmountSvgFilter } from './svgFilter';

/**
 * 渲染器类 - 创建基于 SVG 滤镜和 Canvas 的流体变形效果
 */
export class FluidEffect2Renderer {
    container: HTMLElement;
    options: Required<FluidEffectOptions>;

    private grid: CanvasGrid | null = null;
    private svg: SVGElement | null = null;
    private feTurbulence: SVGFETurbulenceElement | null = null;
    private feDisplacementMap: SVGFEDisplacementMapElement | null = null;
    private isRunning = false;
    private currentImage: HTMLImageElement | null = null;
    private playState = true;
    private _currentImageUrl: string = '';
    private _lastDisplaySize = 0;
    private _lastDpr = 1;
    private resizeHandler: (() => void) | null = null;

    constructor(container: HTMLElement, options: FluidEffectOptions = {}) {
        this.container = container;
        this.options = {
            resolution: options.resolution ?? DEFAULT_FLUID_EFFECT_OPTIONS.resolution,
            blurAmount: options.blurAmount ?? DEFAULT_FLUID_EFFECT_OPTIONS.blurAmount,
            displacementScale:
                options.displacementScale ?? DEFAULT_FLUID_EFFECT_OPTIONS.displacementScale,
            turbulenceSeed: options.turbulenceSeed ?? Math.floor(Math.random() * 1000),
            turbulenceFrequency:
                options.turbulenceFrequency ?? DEFAULT_FLUID_EFFECT_OPTIONS.turbulenceFrequency,
            turbulenceOctaves:
                options.turbulenceOctaves ?? DEFAULT_FLUID_EFFECT_OPTIONS.turbulenceOctaves,
            canvasDisplacementAmplitude:
                options.canvasDisplacementAmplitude ??
                DEFAULT_FLUID_EFFECT_OPTIONS.canvasDisplacementAmplitude,
            fullscreen: options.fullscreen ?? DEFAULT_FLUID_EFFECT_OPTIONS.fullscreen,
        };
        this.init();
    }

    private init(): void {
        debugLogger.info('[FluidEffect2] 流体效果初始化中...');
        try {
            const filterBundle = mountSvgFilter(this.options);
            this.svg = filterBundle.svg;
            this.feTurbulence = filterBundle.feTurbulence;
            this.feDisplacementMap = filterBundle.feDisplacementMap;

            this.grid = createCanvasGrid(
                this.container,
                this.options.resolution,
                this.options.canvasDisplacementAmplitude,
                this.options.fullscreen
            );

            this.resizeHandler = () => this.onResize();
            window.addEventListener('resize', this.resizeHandler);
            this.onResize();
            debugLogger.info('[FluidEffect2] 流体效果初始化完成');
        } catch (error) {
            debugLogger.error('FluidEffect2 初始化出错', { error });
        }
    }

    private onResize(): void {
        if (!this.grid) return;

        const { displaySize, dpr } = layoutCanvasGrid(
            this.grid,
            this.container,
            this.options.blurAmount
        );
        this._lastDisplaySize = displaySize;
        this._lastDpr = dpr;

        if (this.currentImage) {
            this.setSourceFromImage(this.currentImage);
        }
    }

    setSourceFromImage(image: HTMLImageElement): void {
        if (!this.grid) return;

        if (!image || !image.complete) {
            debugLogger.warn('setSourceFromImage: 图像无效或未加载完成', {
                image: image ? 'exists' : 'null',
                complete: image ? image.complete : 'N/A',
            });
            return;
        }

        const imageUrl = image.src || image.currentSrc || '';

        // Skip redraw if image URL hasn't changed and displaySize is the same
        if (imageUrl === this._currentImageUrl && this._lastDisplaySize > 0) {
            const firstCanvas = this.grid.canvases[0];
            const currentDisplaySize = firstCanvas
                ? Math.round(firstCanvas.width / (window.devicePixelRatio || 1))
                : 0;
            if (currentDisplaySize === this._lastDisplaySize) {
                return;
            }
        }

        this.currentImage = image;
        this._currentImageUrl = imageUrl;

        drawImageToCanvasGrid(this.grid.contexts, this.grid.canvases, image, this._lastDisplaySize);

        if (this.feTurbulence) {
            this.feTurbulence.setAttribute('seed', String(Math.floor(Math.random() * 1000)));
        }
    }

    setSourceFromUrl(url: string): void {
        loadImageFromUrl(url, image => this.setSourceFromImage(image));
    }

    setDisplacementScale(scale: number): void {
        if (!this.feDisplacementMap) return;
        const currentScale = parseFloat(
            this.feDisplacementMap.getAttribute('scale') || String(this.options.displacementScale)
        );
        const newScale = currentScale + (scale - currentScale) * 0.1;
        this.feDisplacementMap.setAttribute('scale', String(newScale));
    }

    start(): void {
        if (this.isRunning) {
            debugLogger.warn('FluidEffect2 已经运行中，跳过启动');
            return;
        }
        this.isRunning = true;
        debugLogger.info('[FluidEffect2] 流体效果已启动');
    }

    stop(): void {
        if (!this.isRunning) {
            debugLogger.warn('FluidEffect2 已经停止，无需再次停止');
            return;
        }
        this.isRunning = false;
        debugLogger.info('[FluidEffect2] 流体效果已停止');
    }

    setPlayState(playing: boolean): void {
        this.playState = playing;
        if (this.grid) {
            setAnimationPlayState(this.grid.rect, this.grid.canvases, playing);
        }
    }

    updateOptions(newOptions: Partial<FluidEffectOptions>): void {
        if (!this.grid) return;
        this.options = { ...this.options, ...newOptions };

        if (newOptions.blurAmount !== undefined) {
            this.grid.contexts.forEach(ctx => {
                ctx.filter = `blur(${newOptions.blurAmount}px)`;
            });
            // Also update canvas style filter if blurAmount is 0 (remove CSS filter)
            this.grid.canvases.forEach(canvas => {
                if (newOptions.blurAmount === 0) {
                    canvas.style.filter = '';
                }
            });
        }

        if (newOptions.turbulenceFrequency !== undefined) {
            this.feTurbulence?.setAttribute(
                'baseFrequency',
                String(newOptions.turbulenceFrequency)
            );
        }

        if (newOptions.turbulenceOctaves !== undefined) {
            this.feTurbulence?.setAttribute('numOctaves', String(newOptions.turbulenceOctaves));
        }

        if (newOptions.displacementScale !== undefined) {
            this.feDisplacementMap?.setAttribute('scale', String(newOptions.displacementScale));
        }

        if (newOptions.canvasDisplacementAmplitude !== undefined) {
            const amp = parseFloat(String(newOptions.canvasDisplacementAmplitude)) || 0;
            this.options.canvasDisplacementAmplitude = amp;
            this.grid.offsets = randomizeCanvasOffsets(this.grid, amp);
            this.onResize();
        }

        if (newOptions.resolution !== undefined) {
            this.grid.canvases.forEach(canvas => {
                canvas.width = newOptions.resolution!;
                canvas.height = newOptions.resolution!;
            });
            if (this.currentImage) {
                this.setSourceFromImage(this.currentImage);
            }
        }
    }

    destroy(): void {
        this.stop();

        if (this.resizeHandler) {
            window.removeEventListener('resize', this.resizeHandler);
            this.resizeHandler = null;
        }

        if (this.grid) {
            unmountCanvasGrid(this.grid);
        }

        unmountSvgFilter(this.svg);

        this.grid = null;
        this.svg = null;
        this.feTurbulence = null;
        this.feDisplacementMap = null;
        this.currentImage = null;
    }
}
