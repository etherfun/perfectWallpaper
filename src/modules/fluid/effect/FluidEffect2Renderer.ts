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
    private _cachedBlur: number = -1;
    private _cachedFreq: number = -1;
    private _cachedOctaves: number = -1;
    private _cachedScale: number = -1;
    private resizeHandler: (() => void) | null = null;

    constructor(container: HTMLElement, options: FluidEffectOptions = {}) {
        this.container = container;
        const d = DEFAULT_FLUID_EFFECT_OPTIONS;
        this.options = {
            resolution: options.resolution ?? d.resolution,
            blurAmount: options.blurAmount ?? d.blurAmount,
            displacementScale: options.displacementScale ?? d.displacementScale,
            turbulenceSeed: options.turbulenceSeed ?? (Math.random() * 1000 | 0),
            turbulenceFrequency: options.turbulenceFrequency ?? d.turbulenceFrequency,
            turbulenceOctaves: options.turbulenceOctaves ?? d.turbulenceOctaves,
            canvasDisplacementAmplitude:
                options.canvasDisplacementAmplitude ?? d.canvasDisplacementAmplitude,
            fullscreen: options.fullscreen ?? d.fullscreen,
        };
        this._cachedBlur = this.options.blurAmount;
        this._cachedFreq = this.options.turbulenceFrequency;
        this._cachedOctaves = this.options.turbulenceOctaves;
        this._cachedScale = this.options.displacementScale;
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
        // 尺寸未变化则跳过重绘，避免多余的 drawImage 切片与 blur 滤镜写入
        if (displaySize === this._lastDisplaySize && dpr === this._lastDpr) return;
        this._lastDisplaySize = displaySize;
        this._lastDpr = dpr;

        // 仅在已有图像时触发切片重绘，避免首次 layout 的空图像 draw
        if (this.currentImage?.complete) {
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
        // 同 URL 且已有缓存尺寸则直接跳过 — onResize 已保证 displaySize 一致，无需再读 canvas.width
        if (imageUrl === this._currentImageUrl && this._currentImageUrl !== '') {
            return;
        }

        this.currentImage = image;
        this._currentImageUrl = imageUrl;

        drawImageToCanvasGrid(this.grid.contexts, this.grid.canvases, image, this._lastDisplaySize);

        if (this.feTurbulence) {
            this.feTurbulence.setAttribute('seed', String((Math.random() * 1000) | 0));
        }
    }

    setSourceFromUrl(url: string): void {
        loadImageFromUrl(url, image => this.setSourceFromImage(image));
    }

    setDisplacementScale(scale: number): void {
        if (!this.feDisplacementMap) return;
        if (scale === this._cachedScale) return;
        // 缓存 + 直接写入，避免 parseFloat + 插值带来的额外样式抖动
        this._cachedScale = scale;
        this.options.displacementScale = scale;
        this.feDisplacementMap.setAttribute('scale', String(scale));
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
        if (this.playState === playing) return;
        this.playState = playing;
        if (this.grid) {
            setAnimationPlayState(this.grid.rect, this.grid.canvases, playing);
        }
    }

    updateOptions(newOptions: Partial<FluidEffectOptions>): void {
        if (!this.grid) return;

        // 逐项对比写入，避免 {...spread} 分配与无变化时的多余 DOM 操作
        if (newOptions.blurAmount !== undefined && newOptions.blurAmount !== this._cachedBlur) {
            const v = newOptions.blurAmount;
            this._cachedBlur = v;
            this.options.blurAmount = v;
            const filter = `blur(${v}px)`;
            const ctxs = this.grid.contexts;
            for (let i = 0; i < ctxs.length; i++) ctxs[i]!.filter = filter;
            if (v === 0) {
                const canvases = this.grid.canvases;
                for (let i = 0; i < canvases.length; i++) canvases[i]!.style.filter = '';
            }
        }

        if (
            newOptions.turbulenceFrequency !== undefined &&
            newOptions.turbulenceFrequency !== this._cachedFreq
        ) {
            const v = newOptions.turbulenceFrequency;
            this._cachedFreq = v;
            this.options.turbulenceFrequency = v;
            this.feTurbulence?.setAttribute('baseFrequency', String(v));
        }

        if (
            newOptions.turbulenceOctaves !== undefined &&
            newOptions.turbulenceOctaves !== this._cachedOctaves
        ) {
            const v = newOptions.turbulenceOctaves;
            this._cachedOctaves = v;
            this.options.turbulenceOctaves = v;
            this.feTurbulence?.setAttribute('numOctaves', String(v));
        }

        if (
            newOptions.displacementScale !== undefined &&
            newOptions.displacementScale !== this._cachedScale
        ) {
            const v = newOptions.displacementScale;
            this._cachedScale = v;
            this.options.displacementScale = v;
            this.feDisplacementMap?.setAttribute('scale', String(v));
        }

        if (newOptions.canvasDisplacementAmplitude !== undefined) {
            const amp = newOptions.canvasDisplacementAmplitude as number;
            // parseFloat 仅在可能为字符串时需要，此处已为 number，直接比较
            if (amp !== this.options.canvasDisplacementAmplitude) {
                this.options.canvasDisplacementAmplitude = amp;
                this.grid.offsets = randomizeCanvasOffsets(this.grid, amp);
                this.onResize();
            }
        }

        if (newOptions.resolution !== undefined && newOptions.resolution !== this.options.resolution) {
            const res = newOptions.resolution;
            this.options.resolution = res;
            const canvases = this.grid.canvases;
            for (let i = 0; i < canvases.length; i++) {
                canvases[i]!.width = res;
                canvases[i]!.height = res;
            }
            if (this.currentImage) {
                this.setSourceFromImage(this.currentImage);
            }
        }

        // 合并剩余未显式处理的字段（turbulenceSeed/fullscreen 等低频项）
        if (newOptions.turbulenceSeed !== undefined) this.options.turbulenceSeed = newOptions.turbulenceSeed;
        if (newOptions.fullscreen !== undefined) this.options.fullscreen = newOptions.fullscreen;
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
