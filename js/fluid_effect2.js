// 流体效果2 - 基于React组件逻辑的纯JavaScript实现
// 使用4个canvas和SVG滤镜实现平滑流体效果

class FluidEffect2 {
    constructor(container, options = {}) {
        this.container = container;
        this.options = {
            // 基础配置
            resolution: options.resolution || 512, // 每个canvas的分辨率
            blurAmount: options.blurAmount || 5, // canvas模糊程度
            displacementScale: options.displacementScale || 400, // SVG置换图缩放
            turbulenceSeed: options.turbulenceSeed || Math.floor(Math.random() * 1000),
            turbulenceFrequency: options.turbulenceFrequency || 0.010,
            turbulenceOctaves: options.turbulenceOctaves || 1,
            // 动画配置
            animationSpeed: options.animationSpeed || 0.1,
            // 湍流变化模式：'sine'（正弦周期，默认）或 'drift'（无周期的平滑随机目标）
            turbulenceMode: options.turbulenceMode || 'sine',
            // 如果使用非周期模式，这个范围决定每次目标变化的间隔（秒）
            turbulenceChangeIntervalRange: options.turbulenceChangeIntervalRange || [1.5, 4.0],
            // 平滑系数，越大变化越快
            turbulenceSmoothing: options.turbulenceSmoothing || 1.5,
            // 旋转动画配置
            rotationEnabled: options.rotationEnabled !== undefined ? options.rotationEnabled : true,
            rotationDirections: options.rotationDirections || [1, -1, 1, -1], // 1:顺时针, -1:逆时针
            rotationDelays: options.rotationDelays || [0, 0.5, 1.0, 1.5], // 动画延迟（秒）
            // canvas 位移幅度（像素）
            canvasDisplacementAmplitude: options.canvasDisplacementAmplitude || 20,
            // 音频响应配置（已移除）
            ...options
        };

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

        // 旋转动画状态
        this.rotationAngles = [0, 0, 0, 0];
        this.rotationStartTimes = [0, 0, 0, 0];
        this.lastAnimationTime = 0;

        // 音频相关
        this.playState = true;

        // 初始化
        this.init();
    }

    init() {
        // 创建SVG滤镜
        this.createSVGFilter();

        // 创建4个canvas
        this.createCanvases();

        // 设置容器样式
        this.setupContainer();

        // 监听窗口大小变化
        window.addEventListener('resize', () => this.onResize());
        this.onResize();

        console.log('FluidEffect2 initialized');
    }

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
        // 固定 baseFrequency 为 0.005
        this.feTurbulence.setAttribute("baseFrequency", '0.005');
        this.feTurbulence.setAttribute("numOctaves", this.options.turbulenceOctaves.toString());
        this.feTurbulence.setAttribute("seed", this.options.turbulenceSeed.toString());
        // 强制使用固定基频 0.005
        this._baseTurbulenceFrequency = 0.005;
        // 初始化用于内部状态（保持与固定值同步）
        this._turbulenceTarget = this._baseTurbulenceFrequency;
        this._turbulenceCurrent = this._baseTurbulenceFrequency;
        this._turbulenceLastUpdateTime = performance.now() / 1000;
        const rng = this.options.turbulenceChangeIntervalRange || [1.5, 4.0];
        this._turbulenceNextChange = this._turbulenceLastUpdateTime + (rng[0] + Math.random() * (rng[1] - rng[0]));

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

    createCanvases() {
        // 创建两级容器：父容器（应用 SVG 滤镜），子容器（包含 canvases 与 overlay）
        this.fluidWrapper = document.createElement('div');
        this.fluidWrapper.className = 'fluid-effect-wrapper';
        this.fluidWrapper.style.position = 'absolute';
        this.fluidWrapper.style.top = '0';
        this.fluidWrapper.style.left = '0';
        this.fluidWrapper.style.width = '100%';
        this.fluidWrapper.style.height = '100%';
        this.fluidWrapper.style.pointerEvents = 'none';

        // 子容器：实际放置 canvas 的区域
        this.fluidRect = document.createElement('div');
        this.fluidRect.className = 'fluid-effect-rect';
        this.fluidRect.style.position = 'absolute';
        this.fluidRect.style.top = '0';
        this.fluidRect.style.left = '0';
        this.fluidRect.style.width = '100%';
        this.fluidRect.style.height = '100%';
        this.fluidRect.style.pointerEvents = 'none';
        this.fluidRect.style.filter = 'url(#fluid-filter-2)';

        // 创建4个canvas，放入子容器
        // 初始化每个 canvas 的位移偏移数组
        this._canvasOffsets = [];
        for (let i = 0; i < 4; i++) {
            const canvas = document.createElement('canvas');
            canvas.className = 'fluid-effect-canvas';
            canvas.setAttribute('canvasID', (i + 1).toString());
            canvas.width = this.options.resolution;
            canvas.height = this.options.resolution;

            // 设置canvas样式
            canvas.style.imageRendering = 'auto';
            canvas.style.willChange = 'transform';
            canvas.style.transformOrigin = 'center center';
            // 获取上下文并设置模糊
            const ctx = canvas.getContext('2d');
            ctx.filter = `blur(${this.options.blurAmount}px)`;

            this.canvases.push(canvas);
            this.canvasContexts.push(ctx);

            // 初始化随机位移（像素）
            const amp = parseFloat(this.options.canvasDisplacementAmplitude) || 20;
            this._canvasOffsets.push({
                dx: (Math.random() * 2 - 1) * amp,
                dy: (Math.random() * 2 - 1) * amp
            });

            const _delays = [0, 5, 10, 15];
            const randDelay = _delays[i];
            canvas.style.animationDelay = `${randDelay}s`;

            this.fluidRect.appendChild(canvas);
        }

        this.fluidWrapper.appendChild(this.fluidRect);
        this.container.appendChild(this.fluidWrapper);
    }

    setupContainer() {
        this.container.style.position = 'relative';
        this.container.style.overflow = 'hidden';
        // 确保 overlay 在容器内时同步样式
        if (this.backdropOverlay && this.options.backdropFilterEnabled) {
            const bf = `blur(${this.options.backdropBlur}px) saturate(${this.options.backdropSaturate}%)`;
            this.backdropOverlay.style.backdropFilter = bf;
            this.backdropOverlay.style.webkitBackdropFilter = bf;
            this.backdropOverlay.style.background = 'rgba(255,255,255,0)';
        }
    }

    onResize() {
        const rect = this.container.getBoundingClientRect();
        const width = rect.width;
        const height = rect.height;
        const viewSize = Math.max(width, height);
        const canvasSize = viewSize * 0.707; // 0.707 ≈ 1/√2
        // 调试信息：输出容器与计算尺寸
        console.log('onResize start', {containerWidth: width, containerHeight: height, canvasSize});

        // 更新每个canvas的位置和大小（同时同步高 DPI backing buffer），保证 drawImage 按显示尺寸绘制
        const displaySize = Math.max(1, Math.round(canvasSize));
        const dpr = window.devicePixelRatio || 1;
        // 保存当前 display size / dpr 以供绘制使用
        this._lastDisplaySize = displaySize;
        this._lastDpr = dpr;
        console.log('onResize dpi info', {displaySize, dpr});
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
                        // 调试信息：输出 ctx 变换和 canvas backing
                        try {
                            console.log('set backing', {index, backing, cssWidth: canvas.style.width, cssHeight: canvas.style.height, ctxTransform: ctx.getTransform()});
                        } catch (e) {
                            console.log('set backing', {index, backing, cssWidth: canvas.style.width, cssHeight: canvas.style.height});
                        }
                    }
                } else {
                    // 若未改变 backing，也输出当前状态便于排查
                    console.log('backing unchanged', {index, canvasWidth: canvas.width, canvasHeight: canvas.height, cssWidth: canvas.style.width});
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

    setSourceFromImage(image) {
        if (!image || !image.complete) return;

        this.currentImage = image;
        this.currentImageUrl = image.src;

        // 使用 naturalWidth/naturalHeight 获取图片真实像素尺寸，避免使用被 CSS 缩放后的 width/height
        const width = image.naturalWidth || image.width || (image.clientWidth || 0);
        const height = image.naturalHeight || image.height || (image.clientHeight || 0);
        console.log('setSourceFromImage image size', {width, height, naturalWidth: image.naturalWidth, naturalHeight: image.naturalHeight});
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
            try {
                console.log('drawImage params', {i, sx, sy, sWidth, sHeight, canvasWidth: canvas.width, canvasHeight: canvas.height, displaySize, dpr: this._lastDpr});
                if (ctx && ctx.getTransform) console.log('ctx.getTransform()', ctx.getTransform());
            } catch (e) {
                console.log('drawImage debug', {i, sx, sy, sWidth, sHeight, displaySize});
            }
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

    setSourceFromUrl(url) {
        const image = new Image();
        image.crossOrigin = 'Anonymous';
        image.onload = () => this.setSourceFromImage(image);
        image.src = url;
    }

    setDisplacementScale(scale) {
        if (!this.feDisplacementMap) return;
        const currentScale = parseFloat(this.feDisplacementMap.getAttribute('scale') || this.options.displacementScale);
        const newScale = currentScale + (scale - currentScale) * 0.1; // 平滑过渡
        this.feDisplacementMap.setAttribute('scale', newScale.toString());
    }

    // 动画循环
    animate() {
        if (!this.isRunning) return;

        // 更新旋转动画
        if (this.options.rotationEnabled) {
            this.updateRotations();
        }

        this.animationId = requestAnimationFrame(() => this.animate());
    }

    // 更新旋转动画
    updateRotations() {
        // 旋转交给 CSS 动画处理，JS 不再逐帧修改 transform
        return;
    }

    // 音频响应功能已移除，相关逻辑由外部或其它模块处理，如需恢复请复原此方法。

    // 公共方法
    start() {
        if (this.isRunning) return;
        this.isRunning = true;
        this.animate();

        // 音频响应已移除
    }

    stop() {
        this.isRunning = false;
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }

        // 音频相关清理已移除
    }

    setPlayState(playing) {
        this.playState = playing;
        // 按新的两层结构，控制父容器的暂停类
        if (this.fluidWrapper) {
            this.fluidWrapper.classList.toggle('paused', !playing);
        }

        // 如果暂停，停止旋转动画
        // 同步 canvas 的 CSS 动画播放状态
        this.canvases.forEach(canvas => {
            if (canvas) {
                canvas.style.animationPlayState = playing ? 'running' : 'paused';
                canvas.classList.toggle('paused', !playing);
            }
        });

        if (!playing && this.options.rotationEnabled) {
            this.lastAnimationTime = 0; // 兼容旧逻辑（保留但无实际影响）
        }
    }

    updateOptions(newOptions) {
        this.options = { ...this.options, ...newOptions };

        // 更新模糊
        if (newOptions.blurAmount !== undefined) {
            this.canvasContexts.forEach(ctx => {
                ctx.filter = `blur(${newOptions.blurAmount}px)`;
            });
        }

        // 更新湍流
        // 湍流基频固定为 0.005（忽略传入值），保持向后兼容但不允许更改
        if (newOptions.turbulenceFrequency !== undefined) {
            this.feTurbulence.setAttribute('baseFrequency', '0.005');
            this._baseTurbulenceFrequency = 0.005;
        }

        if (newOptions.turbulenceOctaves !== undefined) {
            this.feTurbulence.setAttribute('numOctaves', newOptions.turbulenceOctaves.toString());
        }

        if (newOptions.rotationDirections !== undefined) {
            // 确保有4个方向值
            if (Array.isArray(newOptions.rotationDirections) && newOptions.rotationDirections.length === 4) {
                this.options.rotationDirections = newOptions.rotationDirections;
                // 更新每个 canvas 的 animationDirection
                for (let i = 0; i < 4; i++) {
                    const c = this.canvases[i];
                    if (!c) continue;
                    const dir = this.options.rotationDirections[i] || 1;
                    c.style.animationDirection = dir === -1 ? 'reverse' : 'normal';
                }
            }
        }

        if (newOptions.rotationDelays !== undefined) {
            // 确保有4个延迟值
            if (Array.isArray(newOptions.rotationDelays) && newOptions.rotationDelays.length === 4) {
                this.options.rotationDelays = newOptions.rotationDelays;
                // 重置开始时间
                this.lastAnimationTime = 0;
                // 更新每个 canvas 的 animationDelay
                for (let i = 0; i < 4; i++) {
                    const c = this.canvases[i];
                    if (!c) continue;
                    const delay = this.options.rotationDelays[i] || 0;
                    c.style.animationDelay = `${delay}s`;
                }
            }
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

    destroy() {
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

        console.log('FluidEffect2 destroyed');
    }
}

// 导出
if (typeof module !== 'undefined' && module.exports) {
    module.exports = FluidEffect2;
}

// 在浏览器环境中绑定到 window，确保全局可访问
if (typeof window !== 'undefined') {
    window.FluidEffect2 = FluidEffect2;
}