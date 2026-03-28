/**
 * FluidEffect2 - 流体视觉效果类
 * 创建基于SVG滤镜和Canvas的流体变形效果
 * @class
 */

import { debugLogger } from './utils/logger';
import { appConfig } from './utils/config';

export class FluidEffect2 {
    /** 容器元素 */
    private container: HTMLElement;

    /** 配置选项 */
    private options: {
        resolution: number;
        blurAmount: number;
        displacementScale: number;
        turbulenceSeed: number;
        turbulenceFrequency: number;
        turbulenceOctaves: number;
        canvasDisplacementAmplitude: number;
        fullscreen?: boolean;
    };

    /** 4个canvas元素 */
    private canvases: HTMLCanvasElement[] = [];
    private canvasContexts: CanvasRenderingContext2D[] = [];

    /** SVG滤镜元素 */
    private svgFilter: SVGFilterElement | null = null;
    private feTurbulence: SVGFETurbulenceElement | null = null;
    private feDisplacementMap: SVGFEDisplacementMapElement | null = null;

    /** 容器元素（两层结构）
     * fluidWrapper: 父容器（应用SVG滤镜）
     * fluidRect: 子容器（包含canvas集合）
     */
    private fluidWrapper: HTMLElement | null = null;
    private fluidRect: HTMLElement | null = null;

    /** 状态 */
    private isRunning = false;
    private currentImage: HTMLImageElement | null = null;

    /** 音频相关 */
    private playState = true;

    /** 当前图片URL - 用于防止重复更新 */
    private _currentImageUrl: string = '';

    /** Canvas偏移量 */
    private _canvasOffsets: { dx: number; dy: number }[] = [];
    private _lastDisplaySize = 0;
    // @ts-ignore - 保留用于将来可能的高DPI支持
    private _lastDpr = 1;

    /**
     * 构造函数
     * @param container - 容器元素，效果将应用到此元素内
     * @param options - 配置选项
     */
    constructor(container: HTMLElement, options: {
        resolution?: number;
        blurAmount?: number;
        displacementScale?: number;
        turbulenceSeed?: number;
        turbulenceFrequency?: number;
        turbulenceOctaves?: number;
        canvasDisplacementAmplitude?: number;
        fullscreen?: boolean;
    } = {}) {
        this.container = container;
        this.options = {
            resolution: options.resolution ?? 512,
            blurAmount: options.blurAmount ?? 5,
            displacementScale: options.displacementScale ?? 400,
            turbulenceSeed: options.turbulenceSeed ?? Math.floor(Math.random() * 1000),
            turbulenceFrequency: options.turbulenceFrequency ?? 0.005,
            turbulenceOctaves: options.turbulenceOctaves ?? 1,
            canvasDisplacementAmplitude: options.canvasDisplacementAmplitude ?? 200,
        };

        this.init();
    }

    /**
     * 初始化效果
     */
    private init(): void {
        debugLogger.info('[FluidEffect2] 流体效果初始化中...');
        try {
            this.createSVGFilter();
            this.createCanvases();
            this.setupContainer();

            window.addEventListener('resize', () => this.onResize());
            this.onResize();
            debugLogger.info('[FluidEffect2] 流体效果初始化完成');
        } catch (error) {
            debugLogger.error('FluidEffect2 初始化出错', { error });
        }

    }

    /**
     * 创建SVG滤镜
     */
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
        this.feTurbulence.setAttribute('baseFrequency', this.options.turbulenceFrequency.toString());
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

    /**
     * 创建Canvas元素
     */
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
                dy: (Math.random() * 2 - 1) * amp
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

    /**
     * 响应窗口大小变化
     */
    private onResize(): void {
        const rect = this.container.getBoundingClientRect();
        const width = rect.width;
        const height = rect.height;
        const viewSize = Math.max(width, height);
        const canvasSize = viewSize * 0.707;

        const displaySize = Math.max(1, Math.round(canvasSize));
        // Limit DPR to max 1.5 to reduce GPU pixel fill rate while maintaining visual quality
        const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
        this._lastDisplaySize = displaySize;
        this._lastDpr = dpr;

        for (let x = 0; x <= 1; x++) {
            for (let y = 0; y <= 1; y++) {
                const index = y * 2 + x;
                const canvas = this.canvases[index];
                if (!canvas) continue;

                canvas.style.width = `${canvasSize}px`;
                canvas.style.height = `${canvasSize}px`;

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

                const signX = x === 0 ? -1 : 1;
                const signY = y === 0 ? -1 : 1;

                const left = (width / 2 + signX * canvasSize * 0.35) - canvasSize / 2;
                const top = (height / 2 + signY * canvasSize * 0.35) - canvasSize / 2;

                canvas.style.left = `${left}px`;
                canvas.style.top = `${top}px`;
            }
        }

        for (let x = 0; x <= 1; x++) {
            for (let y = 0; y <= 1; y++) {
                const index = y * 2 + x;
                const canvas = this.canvases[index];
                if (!canvas) continue;
                const offset = this._canvasOffsets[index] ?? { dx: 0, dy: 0 };
                const leftPx = parseFloat(canvas.style.left || '0');
                const topPx = parseFloat(canvas.style.top || '0');
                canvas.style.left = `${leftPx + offset.dx}px`;
                canvas.style.top = `${topPx + offset.dy}px`;
            }
        }

        if (this.currentImage) {
            this.setSourceFromImage(this.currentImage);
        }
    }

    /**
     * 设置图像源
     */
    setSourceFromImage(image: HTMLImageElement): void {
        if (!image || !image.complete) {
            debugLogger.warn('setSourceFromImage: 图像无效或未加载完成', {
                image: image ? 'exists' : 'null',
                complete: image ? image.complete : 'N/A'
            });
            return;
        }

        // 获取图片 URL（优先使用 src 属性）
        const imageUrl = image.src || (image as any).currentSrc || '';

        this.currentImage = image;

        const width = image.naturalWidth || image.width || (image.clientWidth || 0);
        const height = image.naturalHeight || image.height || (image.clientHeight || 0);
        const sWidth = Math.floor(width / 2);
        const sHeight = Math.floor(height / 2);

        for (let i = 0; i < 4; i++) {
            const ctx = this.canvasContexts[i];
            const canvas = this.canvases[i];
            if (!ctx || !canvas) continue;

            ctx.clearRect(0, 0, canvas.width, canvas.height);

            const sx = (i % 2 === 0) ? 0 : sWidth;
            const sy = (i < 2) ? 0 : sHeight;

            const displaySize = this._lastDisplaySize || Math.round(canvas.width / (window.devicePixelRatio || 1));
            ctx.drawImage(
                image,
                sx, sy, sWidth, sHeight,
                0, 0, displaySize, displaySize
            );
        }

        // 只有当图片 URL 改变时才更新 seed（避免每次换歌都重新生成湍流导致抖动）
        if (this.feTurbulence && imageUrl !== this._currentImageUrl) {
            this.feTurbulence.setAttribute('seed', String(Math.floor(Math.random() * 1000)));
            this._currentImageUrl = imageUrl;
        }
    }

    /**
     * 通过URL设置图像源
     */
    setSourceFromUrl(url: string): void {
        const image = new Image();
        image.crossOrigin = 'Anonymous';
        image.onload = () => this.setSourceFromImage(image);
        image.onerror = (error) => {
            debugLogger.error('加载 FluidEffect2 图像失败', { url, error });
        };
        image.src = url;
    }

    /**
     * 设置置换图缩放系数
     */
    setDisplacementScale(scale: number): void {
        if (!this.feDisplacementMap) return;
        const currentScale = parseFloat(this.feDisplacementMap.getAttribute('scale') || String(this.options.displacementScale));
        const newScale = currentScale + (scale - currentScale) * 0.1;
        this.feDisplacementMap.setAttribute('scale', String(newScale));
    }

    /**
     * 启动效果
     * 注意: 动画效果由CSS animation处理，无需RAF循环
     */
    start(): void {
        if (this.isRunning) {
            debugLogger.warn('FluidEffect2 已经运行中，跳过启动');
            return;
        }

        this.isRunning = true;
        debugLogger.info('[FluidEffect2] 流体效果已启动');
    }

    /**
     * 停止效果
     */
    stop(): void {
        if (!this.isRunning) {
            debugLogger.warn('FluidEffect2 已经停止，无需再次停止');
            return;
        }

        this.isRunning = false;
        debugLogger.info('[FluidEffect2] 流体效果已停止');
    }

    /**
     * 设置播放状态
     */
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

    /**
     * 更新配置选项
     */
    updateOptions(newOptions: {
        resolution?: number;
        blurAmount?: number;
        displacementScale?: number;
        turbulenceFrequency?: number;
        turbulenceOctaves?: number;
        canvasDisplacementAmplitude?: number;
    }): void {
        this.options = { ...this.options, ...newOptions };

        if (newOptions.blurAmount !== undefined) {
            this.canvasContexts.forEach(ctx => {
                ctx.filter = `blur(${newOptions.blurAmount}px)`;
            });
        }

        if (newOptions.turbulenceFrequency !== undefined) {
            this.feTurbulence?.setAttribute('baseFrequency', String(newOptions.turbulenceFrequency));
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
                dy: (Math.random() * 2 - 1) * amp
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

    /**
     * 销毁效果
     */
    destroy(): void {
        this.stop();

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

// 挂载到 appConfig.runtime
appConfig.runtime.FluidEffect2 = FluidEffect2;
