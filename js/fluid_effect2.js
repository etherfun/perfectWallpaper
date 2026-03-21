/**
 * FluidEffect2 - 流体视觉效果类
 * 创建基于SVG滤镜和Canvas的流体变形效果
 * @class
 */
class FluidEffect2 {
    /**
     * 构造函数
     * @param {HTMLElement} container - 容器元素，效果将应用到此元素内
     * @param {Object} options - 配置选项
     * @param {number} [options.resolution=512] - 每个Canvas的分辨率（像素），影响图像质量
     * @param {number} [options.blurAmount=5] - Canvas模糊程度（像素），值越大越模糊
     * @param {number} [options.displacementScale=400] - SVG置换图缩放系数，控制变形强度
     * @param {number} [options.turbulenceSeed] - 湍流效果种子值，用于生成随机噪声模式
     * @param {number} [options.turbulenceFrequency=0.005] - 湍流频率，控制噪声的细节程度
     * @param {number} [options.turbulenceOctaves=1] - 湍流八度，控制噪声的复杂度
     * @param {number} [options.canvasDisplacementAmplitude=200] - Canvas位移幅度（像素），控制四个Canvas的随机偏移
     */
    constructor(container, options = {}) {
        this.container = container;
        this.options = {
            // 基础配置
            resolution: options.resolution || 512, // 每个canvas的分辨率（像素），默认512
            blurAmount: options.blurAmount || 5, // canvas模糊程度（像素），默认5
            displacementScale: options.displacementScale || 400, // SVG置换图缩放系数，默认400
            turbulenceSeed: options.turbulenceSeed || Math.floor(Math.random() * 1000), // 湍流种子，默认随机
            turbulenceFrequency: options.turbulenceFrequency || 0.005, // 湍流频率，默认0.005
            turbulenceOctaves: options.turbulenceOctaves || 1, // 湍流八度，默认1
            // canvas 位移幅度（像素）
            canvasDisplacementAmplitude: options.canvasDisplacementAmplitude || 200, // Canvas位移幅度，默认200像素
            ...options
        };


        debugLogger.info('FluidEffect2 构造函数调用', {
            container: container ? container.tagName : 'null',
            options: this.options
        });

        // 4个canvas元素
        this.canvases = [];
        this.canvasContexts = [];

        // SVG滤镜元素
        this.svgFilter = null;
        this.feTurbulence = null;
        this.feDisplacementMap = null;

        // 容器元素（两层结构）
        // this.fluidWrapper: 父容器（应用 SVG 滤镜）
        // this.fluidRect: 子容器（包含 canvas 集合与 overlay）
        this.fluidWrapper = null;
        this.fluidRect = null;

        // 状态
        this.isRunning = false;
        this.animationId = null;
        this.currentImage = null;
        this.currentImageUrl = null;

        // 音频相关
        this.playState = true;

        // 初始化
        this.init();
    }

    /**
     * 初始化效果
     * 创建SVG滤镜、Canvas元素，设置容器样式和事件监听
     */
    init() {

        debugLogger.info('FluidEffect2 初始化开始');

        // 创建SVG滤镜
        this.createSVGFilter();

        // 创建4个canvas
        this.createCanvases();

        // 设置容器样式
        this.setupContainer();

        // 监听窗口大小变化
        window.addEventListener('resize', () => this.onResize());
        this.onResize();


        debugLogger.info('FluidEffect2 初始化完成');
    }

    /**
     * 创建SVG滤镜
     * 创建包含湍流和置换图效果的SVG滤镜
     */
    createSVGFilter() {
        // 创建SVG元素
        const svgNS = "http://www.w3.org/2000/svg";
        const svg = document.createElementNS(svgNS, "svg");
        svg.setAttribute("width", "0");
        svg.setAttribute("height", "0");
        svg.style.position = 'absolute';

        // 创建滤镜
        const filter = document.createElementNS(svgNS, "filter");
        filter.setAttribute("id", "fluid-filter-2");
        filter.setAttribute("x", "-20%");
        filter.setAttribute("y", "-20%");
        filter.setAttribute("width", "140%");
        filter.setAttribute("height", "140%");
        filter.setAttribute("filterUnits", "objectBoundingBox");
        filter.setAttribute("primitiveUnits", "userSpaceOnUse");
        filter.setAttribute("color-interpolation-filters", "sRGB");

        // 创建湍流效果
        this.feTurbulence = document.createElementNS(svgNS, "feTurbulence");
        this.feTurbulence.setAttribute("type", "fractalNoise");
        // 使用传入的湍流频率
        this.feTurbulence.setAttribute("baseFrequency", this.options.turbulenceFrequency.toString());
        this.feTurbulence.setAttribute("numOctaves", this.options.turbulenceOctaves.toString());
        this.feTurbulence.setAttribute("seed", this.options.turbulenceSeed.toString());

        // 创建置换图
        this.feDisplacementMap = document.createElementNS(svgNS, "feDisplacementMap");
        this.feDisplacementMap.setAttribute("in", "SourceGraphic");
        this.feDisplacementMap.setAttribute("scale", this.options.displacementScale.toString());

        // 组装
        filter.appendChild(this.feTurbulence);
        filter.appendChild(this.feDisplacementMap);
        svg.appendChild(filter);

        // 添加到文档
        document.body.appendChild(svg);
        this.svgFilter = filter;
    }

    /**
     * 创建Canvas元素
     * 创建4个Canvas元素并设置两级容器结构
     */
    createCanvases() {
        // 创建两级容器：父容器（应用 SVG 滤镜），子容器（包含 canvases 与 overlay）
        this.fluidWrapper = document.createElement('div');
        this.fluidWrapper.className = 'fluid-effect-wrapper';

        // 子容器：实际放置 canvas 的区域
        this.fluidRect = document.createElement('div');
        this.fluidRect.className = 'fluid-effect-rect';

        // 创建4个canvas，放入子容器
        // 初始化每个 canvas 的位移偏移数组
        this._canvasOffsets = [];
        for (let i = 0; i < 4; i++) {
            const canvas = document.createElement('canvas');
            canvas.className = 'fluid-effect-canvas';
            canvas.setAttribute('canvasID', (i + 1).toString());
            canvas.width = this.options.resolution;
            canvas.height = this.options.resolution;

            // 设置canvas样式（通过CSS类）
            // 获取上下文并设置模糊
            const ctx = canvas.getContext('2d');
            //ctx.filter = `blur(${this.options.blurAmount}px)`;

            this.canvases.push(canvas);
            this.canvasContexts.push(ctx);

            // 初始化随机位移（像素）
            const amp = parseFloat(this.options.canvasDisplacementAmplitude) || 200;
            this._canvasOffsets.push({
                dx: (Math.random() * 2 - 1) * amp,
                dy: (Math.random() * 2 - 1) * amp
            });

            const _delays = [0, -5, -10, -15];
            const randDelay = _delays[i];
            canvas.style.animationDelay = `${randDelay}s`;

            this.fluidRect.appendChild(canvas);
        }

        this.fluidWrapper.appendChild(this.fluidRect);
        this.container.appendChild(this.fluidWrapper);
    }

    setupContainer() {
        // 为容器添加流体效果容器类
        this.container.classList.add('fluid-effect-container');
    }

    /**
     * 响应窗口大小变化
     * 重新计算Canvas位置和大小，适应新的容器尺寸
     */
    onResize() {
        const rect = this.container.getBoundingClientRect();
        const width = rect.width;
        const height = rect.height;
        const viewSize = Math.max(width, height);
        const canvasSize = viewSize * 0.707; // 0.707 ≈ 1/√2

        // 更新每个canvas的位置和大小（同时同步高 DPI backing buffer），保证 drawImage 按显示尺寸绘制
        const displaySize = Math.max(1, Math.round(canvasSize));
        const dpr = window.devicePixelRatio || 1;
        // 保存当前 display size / dpr 以供绘制使用
        this._lastDisplaySize = displaySize;
        this._lastDpr = dpr;
        for (let x = 0; x <= 1; x++) {
            for (let y = 0; y <= 1; y++) {
                const index = y * 2 + x;
                const canvas = this.canvases[index];
                if (!canvas) continue;

                // 设置显示尺寸（CSS）
                canvas.style.width = `${canvasSize}px`;
                canvas.style.height = `${canvasSize}px`;

                // 计算并设置 backing buffer 大小（考虑 devicePixelRatio）
                const backing = displaySize * dpr;
                if (canvas.width !== backing || canvas.height !== backing) {
                    canvas.width = backing;
                    canvas.height = backing;
                    const ctx = canvas.getContext('2d');
                    if (ctx) {
                        // 将绘图坐标系缩放到 CSS 像素单位，后续 drawImage 使用 displaySize 作为目标尺寸
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

        // 将位移应用到每个 canvas（基于初始化的随机偏移）
        for (let x = 0; x <= 1; x++) {
            for (let y = 0; y <= 1; y++) {
                const index = y * 2 + x;
                const canvas = this.canvases[index];
                if (!canvas) continue;
                const offset = (this._canvasOffsets && this._canvasOffsets[index]) || { dx: 0, dy: 0 };
                // 解析当前 left/top 并添加偏移（保持像素单位）
                const leftPx = parseFloat(canvas.style.left || '0');
                const topPx = parseFloat(canvas.style.top || '0');
                canvas.style.left = `${leftPx + offset.dx}px`;
                canvas.style.top = `${topPx + offset.dy}px`;
            }
        }

        // 重新绘制当前图片以适应新的像素尺寸
        if (this.currentImage) {
            this.setSourceFromImage(this.currentImage);
        }
    }

    /**
     * 设置图像源
     * 将图像分割为4个象限，分别绘制到4个Canvas上
     * @param {HTMLImageElement} image - 源图像元素
     */
    setSourceFromImage(image) {
        if (!image || !image.complete) {
            debugLogger.warn('setSourceFromImage: 图像无效或未加载完成', {
                image: image ? 'exists' : 'null',
                complete: image ? image.complete : 'N/A'
            });
            return;
        }


        debugLogger.info('设置 FluidEffect2 图像源', {
            naturalWidth: image.naturalWidth,
            naturalHeight: image.naturalHeight
        });

        this.currentImage = image;
        this.currentImageUrl = image.src;

        // 使用 naturalWidth/naturalHeight 获取图片真实像素尺寸，避免使用被 CSS 缩放后的 width/height
        const width = image.naturalWidth || image.width || (image.clientWidth || 0);
        const height = image.naturalHeight || image.height || (image.clientHeight || 0);
        const sWidth = Math.floor(width / 2);
        const sHeight = Math.floor(height / 2);

        for (let i = 0; i < 4; i++) {
            const ctx = this.canvasContexts[i];
            const canvas = this.canvases[i];
            if (!ctx || !canvas) continue;

            // 清空目标 canvas
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            // 计算源图像象限坐标
            const sx = (i % 2 === 0) ? 0 : sWidth;
            const sy = (i < 2) ? 0 : sHeight;

            // 直接从原图裁切并缩放到目标 canvas 大小（使用 display 尺寸，ctx 已按 dpr 缩放）
            const displaySize = this._lastDisplaySize || Math.round(canvas.width / (window.devicePixelRatio || 1));
            // 调试信息：输出绘制参数
            ctx.drawImage(
                image,
                sx, sy, sWidth, sHeight,
                0, 0, displaySize, displaySize
            );
        }

        // 更新湍流种子
        if (this.feTurbulence) {
            this.feTurbulence.setAttribute('seed', Math.floor(Math.random() * 1000));
        }
    }

    /**
     * 通过URL设置图像源
     * 从指定URL加载图像，然后应用到效果中
     * @param {string} url - 图像URL
     */
    setSourceFromUrl(url) {

        debugLogger.info('从URL加载 FluidEffect2 图像源', {
            url: url
        });

        const image = new Image();
        image.crossOrigin = 'Anonymous';
        image.onload = () => this.setSourceFromImage(image);
        image.onerror = (error) => {
            debugLogger.error('加载 FluidEffect2 图像失败', {
                url: url,
                error: error
            });
        };
        image.src = url;
    }

    /**
     * 设置置换图缩放系数
     * 控制流体变形效果的强度，值越大变形越明显
     * @param {number} scale - 新的缩放系数
     */
    setDisplacementScale(scale) {
        if (!this.feDisplacementMap) return;
        const currentScale = parseFloat(this.feDisplacementMap.getAttribute('scale') || this.options.displacementScale);
        const newScale = currentScale + (scale - currentScale) * 0.1; // 平滑过渡
        this.feDisplacementMap.setAttribute('scale', newScale.toString());
    }

    // 动画循环
    animate() {
        if (!this.isRunning) return;

        this.animationId = requestAnimationFrame(() => this.animate());
    }

    // 公共方法
    /**
     * 启动效果
     * 开始动画循环，使效果生效
     */
    start() {
        if (this.isRunning) {
            debugLogger.warn('FluidEffect2 已经运行中，跳过启动');
            return;
        }


        debugLogger.info('FluidEffect2 启动');

        this.isRunning = true;
        this.animate();

        // 音频响应已移除
    }

    /**
     * 停止效果
     * 停止动画循环，暂停效果
     */
    stop() {
        if (!this.isRunning && !this.animationId) {
            debugLogger.warn('FluidEffect2 已经停止，无需再次停止');
            return;
        }


        debugLogger.info('FluidEffect2 停止');

        this.isRunning = false;
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
    }

    /**
     * 设置播放状态
     * 控制CSS动画的播放/暂停状态
     * @param {boolean} playing - true为播放，false为暂停
     */
    setPlayState(playing) {

        debugLogger.info('设置 FluidEffect2 播放状态', {
            current: this.playState,
            new: playing
        });

        this.playState = playing;
        // 按新的两层结构，控制父容器的暂停类
        if (this.fluidRect) {
            this.fluidRect.style.animationPlayState = playing ? 'running' : 'paused';
        }

        // 同步 canvas 的 CSS 动画播放状态
        this.canvases.forEach(canvas => {
            if (canvas) {
                canvas.style.animationPlayState = playing ? 'running' : 'paused';
            }
        });
    }

    /**
     * 更新配置选项
     * 动态修改效果的各项参数
     * @param {Object} newOptions - 新的配置选项
     * @param {number} [newOptions.blurAmount] - 新的模糊程度
     * @param {number} [newOptions.turbulenceFrequency] - 新的湍流频率
     * @param {number} [newOptions.turbulenceOctaves] - 新的湍流八度
     * @param {number} [newOptions.displacementScale] - 新的置换图缩放
     * @param {number} [newOptions.canvasDisplacementAmplitude] - 新的Canvas位移幅度
     * @param {number} [newOptions.resolution] - 新的Canvas分辨率
     */
    updateOptions(newOptions) {

        debugLogger.info('更新 FluidEffect2 选项', {
            oldOptions: this.options,
            newOptions: newOptions
        });

        this.options = { ...this.options, ...newOptions };

        // 更新模糊
        if (newOptions.blurAmount !== undefined) {
            this.canvasContexts.forEach(ctx => {
                ctx.filter = `blur(${newOptions.blurAmount}px)`;
            });
        }

        // 更新湍流
        // 更新湍流频率
        if (newOptions.turbulenceFrequency !== undefined) {
            this.feTurbulence.setAttribute('baseFrequency', newOptions.turbulenceFrequency.toString());
        }

        if (newOptions.turbulenceOctaves !== undefined) {
            this.feTurbulence.setAttribute('numOctaves', newOptions.turbulenceOctaves.toString());
        }

        // 更新置换图缩放
        if (newOptions.displacementScale !== undefined) {
            this.feDisplacementMap.setAttribute('scale', newOptions.displacementScale.toString());
        }

        // 更新 canvas 位移幅度（重新生成偏移）
        if (newOptions.canvasDisplacementAmplitude !== undefined) {
            const amp = parseFloat(newOptions.canvasDisplacementAmplitude) || 0;
            this.options.canvasDisplacementAmplitude = amp;
            // 重新计算偏移
            this._canvasOffsets = this.canvases.map(() => ({
                dx: (Math.random() * 2 - 1) * amp,
                dy: (Math.random() * 2 - 1) * amp
            }));
            // 触发一次布局更新
            this.onResize();
        }

        // 更新分辨率
        if (newOptions.resolution !== undefined) {
            this.canvases.forEach(canvas => {
                canvas.width = newOptions.resolution;
                canvas.height = newOptions.resolution;
            });

            // 重新绘制图像
            if (this.currentImage) {
                this.setSourceFromImage(this.currentImage);
            }
        }
    }

    /**
     * 销毁效果
     * 清理所有DOM元素和资源，移除事件监听器
     */
    destroy() {

        debugLogger.info('FluidEffect2 销毁开始');

        this.stop();

        // 移除canvas
        if (this.fluidWrapper && this.fluidWrapper.parentNode) {
            this.fluidWrapper.parentNode.removeChild(this.fluidWrapper);
        }

        // 移除SVG滤镜
        if (this.svgFilter && this.svgFilter.parentNode) {
            // this.svgFilter 是 <filter> 节点，其 parentNode 是 <svg>
            const svgElem = this.svgFilter.parentNode;
            if (svgElem && svgElem.parentNode) {
                svgElem.parentNode.removeChild(svgElem);
            }
        }

        // 清理引用
        this.canvases = [];
        this.canvasContexts = [];
        this.svgFilter = null;
        this.feTurbulence = null;
        this.feDisplacementMap = null;
        this.fluidRect = null;
        this.fluidWrapper = null;
        this.currentImage = null;


        debugLogger.info('FluidEffect2 销毁完成');
    }
}

// 模块导出 - 用于Node.js/CommonJS环境
if (typeof module !== 'undefined' && module.exports) {
    module.exports = FluidEffect2;
}

// 全局导出 - 用于浏览器环境
if (typeof window !== 'undefined') {
    window.FluidEffect2 = FluidEffect2;
}