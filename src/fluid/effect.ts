/**
 * FluidEffect - 流体效果统一类
 * 合并渲染器(FluidEffect2)与控制器(FluidEffectConfig)
 */

import { config } from '../utils/config';
import { elements } from '../utils/elementManager';
import { debugLogger } from '../utils/logger';
import { hasPlaybackContent } from '../utils/playback';
import { timerManager } from '../utils/timer';
import type { FluidEffectOptions, FluidEffectState } from './types';
import {
    DEFAULT_FLUID_EFFECT_CONFIG,
    DEFAULT_FLUID_EFFECT_OPTIONS,
    FluidEffectState as FluidEffectStateEnum,
} from './types';

// ============================================================
// 渲染器类 (原 FluidEffect2)
// ============================================================

/**
 * 渲染器类 - 创建基于SVG滤镜和Canvas的流体变形效果
 */
class FluidEffect2Renderer {
    container: HTMLElement;
    options: Required<FluidEffectOptions>;

    private canvases: HTMLCanvasElement[] = [];
    private canvasContexts: CanvasRenderingContext2D[] = [];
    private svgFilter: SVGFilterElement | null = null;
    private feTurbulence: SVGFETurbulenceElement | null = null;
    private feDisplacementMap: SVGFEDisplacementMapElement | null = null;
    private fluidWrapper: HTMLElement | null = null;
    private fluidRect: HTMLElement | null = null;
    private isRunning = false;
    private currentImage: HTMLImageElement | null = null;
    private playState = true;
    private _currentImageUrl: string = '';
    private _canvasOffsets: { dx: number; dy: number }[] = [];
    private _lastDisplaySize = 0;
    // @ts-ignore - 保留用于将来可能的高DPI支持
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
            this.createSVGFilter();
            this.createCanvases();
            this.setupContainer();

            this.resizeHandler = () => this.onResize();
            window.addEventListener('resize', this.resizeHandler);
            this.onResize();
            debugLogger.info('[FluidEffect2] 流体效果初始化完成');
        } catch (error) {
            debugLogger.error('FluidEffect2 初始化出错', { error });
        }
    }

    private createSVGFilter(): void {
        const svgNS = 'http://www.w3.org/2000/svg';
        const svg = document.createElementNS(svgNS, 'svg');
        svg.setAttribute('width', '0');
        svg.setAttribute('height', '0');
        svg.style.position = 'absolute';

        const filter = document.createElementNS(svgNS, 'filter');
        filter.setAttribute('id', 'fluid-filter-2');
        filter.setAttribute('x', '-10%');
        filter.setAttribute('y', '-10%');
        filter.setAttribute('width', '120%');
        filter.setAttribute('height', '120%');
        filter.setAttribute('filterUnits', 'objectBoundingBox');
        filter.setAttribute('primitiveUnits', 'userSpaceOnUse');
        filter.setAttribute('color-interpolation-filters', 'sRGB');

        this.feTurbulence = document.createElementNS(svgNS, 'feTurbulence');
        this.feTurbulence.setAttribute('type', 'fractalNoise');
        this.feTurbulence.setAttribute(
            'baseFrequency',
            this.options.turbulenceFrequency.toString()
        );
        this.feTurbulence.setAttribute('numOctaves', this.options.turbulenceOctaves.toString());
        this.feTurbulence.setAttribute('seed', this.options.turbulenceSeed.toString());

        this.feDisplacementMap = document.createElementNS(svgNS, 'feDisplacementMap');
        this.feDisplacementMap.setAttribute('in', 'SourceGraphic');
        this.feDisplacementMap.setAttribute('scale', this.options.displacementScale.toString());

        filter.appendChild(this.feTurbulence);
        filter.appendChild(this.feDisplacementMap);
        svg.appendChild(filter);

        document.body.appendChild(svg);
        this.svgFilter = filter;
    }

    private createCanvases(): void {
        this.fluidWrapper = document.createElement('div');
        this.fluidWrapper.className = 'fluid-effect-wrapper';
        if (this.options.fullscreen) {
            this.fluidWrapper.classList.add('fullscreen');
        }

        this.fluidRect = document.createElement('div');
        this.fluidRect.className = 'fluid-effect-rect';

        this._canvasOffsets = [];
        for (let i = 0; i < 4; i++) {
            const canvas = document.createElement('canvas');
            canvas.className = 'fluid-effect-canvas';
            canvas.setAttribute('canvasID', (i + 1).toString());
            canvas.width = this.options.resolution;
            canvas.height = this.options.resolution;

            const ctx = canvas.getContext('2d')!;
            this.canvases.push(canvas);
            this.canvasContexts.push(ctx);

            const amp = parseFloat(String(this.options.canvasDisplacementAmplitude)) || 200;
            this._canvasOffsets.push({
                dx: (Math.random() * 2 - 1) * amp,
                dy: (Math.random() * 2 - 1) * amp,
            });

            const delays = [0, -5, -10, -15];
            canvas.style.animationDelay = `${delays[i]}s`;

            this.fluidRect.appendChild(canvas);
        }

        this.fluidWrapper.appendChild(this.fluidRect);
        this.container.appendChild(this.fluidWrapper);
    }

    private setupContainer(): void {
        this.container.classList.add('fluid-effect-container');
    }

    private onResize(): void {
        const rect = this.container.getBoundingClientRect();
        const width = rect.width;
        const height = rect.height;
        const viewSize = Math.max(width, height);
        const canvasSize = viewSize * 0.707;

        const displaySize = Math.max(1, Math.round(canvasSize));
        const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
        this._lastDisplaySize = displaySize;
        this._lastDpr = dpr;

        // Single loop: compute position + offset together
        for (let x = 0; x <= 1; x++) {
            for (let y = 0; y <= 1; y++) {
                const index = y * 2 + x;
                const canvas = this.canvases[index];
                if (!canvas) continue;

                const signX = x === 0 ? -1 : 1;
                const signY = y === 0 ? -1 : 1;
                const offset = this._canvasOffsets[index] ?? { dx: 0, dy: 0 };

                const baseLeft = width / 2 + signX * canvasSize * 0.35 - canvasSize / 2;
                const baseTop = height / 2 + signY * canvasSize * 0.35 - canvasSize / 2;

                canvas.style.width = `${canvasSize}px`;
                canvas.style.height = `${canvasSize}px`;
                canvas.style.left = `${baseLeft + offset.dx}px`;
                canvas.style.top = `${baseTop + offset.dy}px`;

                const backing = displaySize * dpr;
                if (canvas.width !== backing || canvas.height !== backing) {
                    canvas.width = backing;
                    canvas.height = backing;
                    const ctx = canvas.getContext('2d');
                    if (ctx) {
                        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
                        ctx.filter = `blur(${this.options.blurAmount}px)`;
                    }
                }
            }
        }

        if (this.currentImage) {
            this.setSourceFromImage(this.currentImage);
        }
    }

    setSourceFromImage(image: HTMLImageElement): void {
        if (!image || !image.complete) {
            debugLogger.warn('setSourceFromImage: 图像无效或未加载完成', {
                image: image ? 'exists' : 'null',
                complete: image ? image.complete : 'N/A',
            });
            return;
        }

        const imageUrl = image.src || (image as any).currentSrc || '';

        // Skip redraw if image URL hasn't changed and displaySize is the same
        if (imageUrl === this._currentImageUrl && this._lastDisplaySize > 0) {
            const firstCanvas = this.canvases[0];
            const currentDisplaySize = firstCanvas
                ? Math.round(firstCanvas.width / (window.devicePixelRatio || 1))
                : 0;
            if (currentDisplaySize === this._lastDisplaySize) {
                return;
            }
        }

        this.currentImage = image;
        this._currentImageUrl = imageUrl;

        const width = image.naturalWidth || image.width || image.clientWidth || 0;
        const height = image.naturalHeight || image.height || image.clientHeight || 0;
        const sWidth = Math.floor(width / 2);
        const sHeight = Math.floor(height / 2);

        for (let i = 0; i < 4; i++) {
            const ctx = this.canvasContexts[i];
            const canvas = this.canvases[i];
            if (!ctx || !canvas) continue;

            ctx.clearRect(0, 0, canvas.width, canvas.height);

            const sx = i % 2 === 0 ? 0 : sWidth;
            const sy = i < 2 ? 0 : sHeight;

            const displaySize =
                this._lastDisplaySize || Math.round(canvas.width / (window.devicePixelRatio || 1));
            ctx.drawImage(image, sx, sy, sWidth, sHeight, 0, 0, displaySize, displaySize);
        }

        if (this.feTurbulence) {
            this.feTurbulence.setAttribute('seed', String(Math.floor(Math.random() * 1000)));
        }
    }

    setSourceFromUrl(url: string): void {
        const image = new Image();
        image.crossOrigin = 'Anonymous';
        image.onload = () => this.setSourceFromImage(image);
        image.onerror = error => {
            debugLogger.error('加载 FluidEffect2 图像失败', { url, error });
        };
        image.src = url;
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
        if (this.fluidRect) {
            this.fluidRect.style.animationPlayState = playing ? 'running' : 'paused';
        }
        this.canvases.forEach(canvas => {
            if (canvas) {
                canvas.style.animationPlayState = playing ? 'running' : 'paused';
            }
        });
    }

    updateOptions(newOptions: Partial<FluidEffectOptions>): void {
        this.options = { ...this.options, ...newOptions };

        if (newOptions.blurAmount !== undefined) {
            this.canvasContexts.forEach(ctx => {
                ctx.filter = `blur(${newOptions.blurAmount}px)`;
            });
            // Also update canvas style filter if blurAmount is 0 (remove CSS filter)
            this.canvases.forEach(canvas => {
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
            this._canvasOffsets = this.canvases.map(() => ({
                dx: (Math.random() * 2 - 1) * amp,
                dy: (Math.random() * 2 - 1) * amp,
            }));
            this.onResize();
        }

        if (newOptions.resolution !== undefined) {
            this.canvases.forEach(canvas => {
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

        if (this.fluidWrapper?.parentNode) {
            this.fluidWrapper.parentNode.removeChild(this.fluidWrapper);
        }

        if (this.svgFilter?.parentNode) {
            const svgElem = this.svgFilter.parentNode;
            if (svgElem?.parentNode) {
                svgElem.parentNode.removeChild(svgElem);
            }
        }

        this.canvases = [];
        this.canvasContexts = [];
        this.svgFilter = null;
        this.feTurbulence = null;
        this.feDisplacementMap = null;
        this.fluidRect = null;
        this.fluidWrapper = null;
        this.currentImage = null;
    }
}

// ============================================================
// 统一 FluidEffect 类 (合并控制器 + 渲染器)
// ============================================================

/**
 * 流体效果统一类
 * 合并配置状态管理与渲染逻辑
 */
export class FluidEffect {
    // 配置状态 - 使用状态机
    private _state: FluidEffectState = FluidEffectStateEnum.DISABLED;
    resolution: number = DEFAULT_FLUID_EFFECT_CONFIG.resolution;
    blurAmount: number = DEFAULT_FLUID_EFFECT_CONFIG.blurAmount;
    displacementScale: number = DEFAULT_FLUID_EFFECT_CONFIG.displacementScale;
    turbulenceFrequency: number = DEFAULT_FLUID_EFFECT_CONFIG.turbulenceFrequency;
    turbulenceOctaves: number = DEFAULT_FLUID_EFFECT_CONFIG.turbulenceOctaves;
    canvasDisplacementAmplitude: number = DEFAULT_FLUID_EFFECT_CONFIG.canvasDisplacementAmplitude;

    // 渲染器实例
    private _normalEffect: FluidEffect2Renderer | null = null;
    private _fullscreenEffect: FluidEffect2Renderer | null = null;

    // 状态访问器
    get state(): FluidEffectState {
        return this._state;
    }

    get enabled(): boolean {
        return this._state !== FluidEffectStateEnum.DISABLED;
    }

    get fullscreenEnabled(): boolean {
        return this._state === FluidEffectStateEnum.FULLSCREEN;
    }

    /**
     * 创建流体效果统一实例
     */
    static create(): FluidEffect {
        return new FluidEffect();
    }

    enable(): this {
        if (this._state === FluidEffectStateEnum.FULLSCREEN) {
            return this;
        }
        if (this._state === FluidEffectStateEnum.NORMAL) {
            return this;
        }
        this._state = FluidEffectStateEnum.NORMAL;
        this.initNormalEffect();
        return this;
    }

    disable(): this {
        if (this._state === FluidEffectStateEnum.DISABLED) {
            return this;
        }
        if (this._state === FluidEffectStateEnum.FULLSCREEN) {
            this.destroyFullscreenEffect();
            this._state = FluidEffectStateEnum.DISABLED;
            return this;
        } else if (this._state === FluidEffectStateEnum.NORMAL) {
            this.destroyNormalEffect();
            this._state = FluidEffectStateEnum.DISABLED;
        }
        return this;
    }

    enableFullscreen(): this {
        if (this._state === FluidEffectStateEnum.FULLSCREEN) {
            return this;
        }
        // 清理普通效果，确保状态干净
        if (this._state === FluidEffectStateEnum.NORMAL) {
            this.destroyNormalEffect();
        }
        // 强制清理任何残留的普通效果
        if (this._normalEffect) {
            this._normalEffect.destroy();
            this._normalEffect = null;
        }
        this._state = FluidEffectStateEnum.FULLSCREEN;
        this.initFullscreenEffect();
        return this;
    }

    disableFullscreen(): this {
        if (this._state !== FluidEffectStateEnum.FULLSCREEN) {
            return this;
        }
        this.destroyFullscreenEffect();
        // 切换到普通模式并初始化播放器效果
        this._state = FluidEffectStateEnum.NORMAL;
        this.initNormalEffect();
        return this;
    }

    toggle(): boolean {
        if (this._state === FluidEffectStateEnum.FULLSCREEN) {
            return this.enabled;
        }
        if (this._state === FluidEffectStateEnum.NORMAL) {
            this.disable();
        } else {
            this.enable();
        }
        return this.enabled;
    }

    toggleFullscreen(): boolean {
        if (this._state === FluidEffectStateEnum.FULLSCREEN) {
            this.disableFullscreen();
        } else {
            this.enableFullscreen();
        }
        return this.fullscreenEnabled;
    }

    /**
     * 设置配置属性
     */
    set(key: string, value: unknown): this {
        if (key === 'fullscreenEnabled') {
            if (value) {
                this.enableFullscreen();
            } else {
                this.disableFullscreen();
            }
            return this;
        }

        if (key === 'enabled') {
            if (value) {
                this.enable();
            } else {
                this.disable();
            }
            return this;
        }

        // 更新普通模式渲染器选项
        if (this._state === FluidEffectStateEnum.NORMAL && this._normalEffect) {
            this._updateEffectOptions(this._normalEffect, key, value);
        }

        // 更新全屏模式渲染器选项
        if (this._state === FluidEffectStateEnum.FULLSCREEN && this._fullscreenEffect) {
            this._updateEffectOptions(this._fullscreenEffect, key, value);
        }

        return this;
    }

    private _updateEffectOptions(effect: FluidEffect2Renderer, key: string, value: unknown): void {
        const numValue = Number(value);
        if (key === 'resolution') {
            effect.updateOptions({ resolution: numValue });
            const thumbnail = elements.playerControl.thumbnail;
            if (thumbnail instanceof HTMLImageElement && thumbnail.complete) {
                effect.setSourceFromImage(thumbnail);
            }
        } else if (key === 'blurAmount') {
            effect.updateOptions({ blurAmount: numValue });
        } else if (key === 'displacementScale') {
            effect.updateOptions({ displacementScale: numValue });
        } else if (key === 'turbulenceFrequency') {
            effect.updateOptions({ turbulenceFrequency: numValue });
        } else if (key === 'turbulenceOctaves') {
            effect.updateOptions({ turbulenceOctaves: numValue });
        } else if (key === 'canvasDisplacementAmplitude') {
            effect.updateOptions({ canvasDisplacementAmplitude: numValue });
        }
    }

    // ==================== 生命周期方法 ====================

    initNormalEffect(): void {
        // 状态守卫：全屏模式下不允许初始化普通效果
        if (this._state === FluidEffectStateEnum.FULLSCREEN) {
            return;
        }

        if (this._normalEffect) {
            return;
        }

        if (typeof hasPlaybackContent !== 'function' || !hasPlaybackContent()) {
            return;
        }

        const container = document.querySelector(
            '#player_control .background'
        ) as HTMLElement | null;
        if (!container) {
            return;
        }

        try {
            const effect = new FluidEffect2Renderer(container, {
                resolution: this.resolution,
                blurAmount: this.blurAmount,
                displacementScale: this.displacementScale,
                turbulenceFrequency: this.turbulenceFrequency,
                turbulenceOctaves: this.turbulenceOctaves,
                canvasDisplacementAmplitude: this.canvasDisplacementAmplitude,
            });
            this._normalEffect = effect;

            const thumbnail = elements.playerControl.thumbnail as HTMLImageElement | undefined;
            if (thumbnail?.complete && effect.setSourceFromImage) {
                effect.setSourceFromImage(thumbnail);
                const wrapper = document.querySelector(
                    '.fluid-effect-wrapper'
                ) as HTMLElement | null;
                if (wrapper && thumbnail.src) {
                    wrapper.style.backgroundImage = `url('${thumbnail.src}')`;
                }
            }

            if (effect.start) {
                effect.start();
            }

            container.style.background = 'none';
            container.style.overflow = 'hidden';
        } catch (_error) {
            return;
        }
    }

    destroyNormalEffect(): void {
        if (this._normalEffect) {
            this._normalEffect.destroy();
            this._normalEffect = null;

            const background = elements.playerControl.background;
            if (background) {
                background.style.background = '';
            }
        }
    }

    initFullscreenEffect(): void {
        // 状态守卫：只有全屏模式才能初始化全屏效果
        if (this._state !== FluidEffectStateEnum.FULLSCREEN) {
            if (this._fullscreenEffect) {
                this._fullscreenEffect.destroy();
                this._fullscreenEffect = null;
            }
            return;
        }

        if (this._fullscreenEffect) {
            return;
        }

        if (typeof hasPlaybackContent === 'function' && !hasPlaybackContent()) {
            return;
        }

        config.runtime.fullscreenFluidEnabled = true;
        this._addPictureInfoHideStyle();

        const container = document.body;

        try {
            const effect = new FluidEffect2Renderer(container, {
                resolution: this.resolution,
                blurAmount: this.blurAmount,
                displacementScale: this.displacementScale,
                turbulenceFrequency: this.turbulenceFrequency,
                turbulenceOctaves: this.turbulenceOctaves,
                canvasDisplacementAmplitude: this.canvasDisplacementAmplitude,
                fullscreen: true,
            });
            this._fullscreenEffect = effect;
            effect.start();

            const thumbnail = elements.playerControl.thumbnail as HTMLImageElement | undefined;
            const imgSrc = thumbnail?.src;

            if (imgSrc && imgSrc !== '') {
                const img = new Image();
                img.crossOrigin = 'Anonymous';
                img.onload = () => {
                    if (this._fullscreenEffect) {
                        this._fullscreenEffect.setSourceFromImage(img);
                        const wrapper = document.querySelector(
                            '.fluid-effect-wrapper'
                        ) as HTMLElement | null;
                        if (wrapper) {
                            wrapper.style.backgroundImage = `url('${imgSrc}')`;
                            wrapper.style.backgroundSize = 'cover';
                            wrapper.style.backgroundPosition = 'center';
                            wrapper.style.backgroundRepeat = 'no-repeat';
                        }
                    }
                };
                img.src = imgSrc;
            } else {
                const wrapper = document.querySelector(
                    '.fluid-effect-wrapper'
                ) as HTMLElement | null;
                if (wrapper) {
                    wrapper.style.backgroundImage = "url('imgs/1.jpg')";
                    wrapper.style.backgroundSize = 'cover';
                    wrapper.style.backgroundPosition = 'center';
                    wrapper.style.backgroundRepeat = 'no-repeat';
                }
            }
        } catch (error) {
            debugLogger.error('Failed to initialize fullscreen fluid effect:', { msg: error });
        }
    }

    destroyFullscreenEffect(): void {
        if (this._fullscreenEffect) {
            this._fullscreenEffect.destroy();
            this._fullscreenEffect = null;
            timerManager.resume('backgroundChange');
        }

        config.runtime.fullscreenFluidEnabled = false;
        this._removePictureInfoHideStyle();

        const fluidWrapper = document.querySelector('.fluid-effect-wrapper') as HTMLElement | null;
        if (fluidWrapper) {
            fluidWrapper.style.backgroundImage = 'none';
        }
    }

    /**
     * 更新全屏流体效果图片源
     */
    updateFullscreenSource(): void {
        if (!this.fullscreenEnabled) {
            return;
        }

        if (!this._fullscreenEffect) {
            this.initFullscreenEffect();
        }

        const thumbnail = elements.playerControl.thumbnail as HTMLImageElement | undefined;
        if (!thumbnail?.src || thumbnail.src === '') {
            return;
        }

        const img = new Image();
        img.crossOrigin = 'Anonymous';
        img.onload = () => {
            if (this._fullscreenEffect?.setSourceFromImage) {
                this._fullscreenEffect.setSourceFromImage(img);
                const fluidWrapper = document.querySelector(
                    '.fluid-effect-wrapper'
                ) as HTMLElement | null;
                if (fluidWrapper) {
                    fluidWrapper.style.backgroundImage = `url('${thumbnail.src}')`;
                    fluidWrapper.style.backgroundSize = 'cover';
                    fluidWrapper.style.backgroundPosition = 'center';
                    fluidWrapper.style.backgroundRepeat = 'no-repeat';
                }
            }
        };
        img.src = thumbnail.src;
    }

    private _addPictureInfoHideStyle(): void {
        const pictureInfo = elements.slide.picture_info;
        if (pictureInfo) {
            pictureInfo.classList.add('fluid-hidden');
        }
        config.runtime.pictureInfoHideStyleAdded = true;
    }

    private _removePictureInfoHideStyle(): void {
        const pictureInfo = elements.slide.picture_info;
        if (pictureInfo) {
            pictureInfo.classList.remove('fluid-hidden');
        }
        config.runtime.pictureInfoHideStyleAdded = false;
    }

    // 公开渲染器实例访问
    get normalEffect(): FluidEffect2Renderer | null {
        return this._normalEffect;
    }

    get fullscreenEffect(): FluidEffect2Renderer | null {
        return this._fullscreenEffect;
    }
}

// ============================================================
// 初始化
// ============================================================

// 初始化运行时状态
config.runtime.fluidEffect = null;
config.runtime.fullscreenFluidEffect = null;
config.runtime.fullscreenFluidEnabled = false;
config.runtime.pictureInfoHideStyleAdded = false;
