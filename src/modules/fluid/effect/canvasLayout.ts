/**
 * 4 画布 2x2 网格的创建、布局与重排
 *
 * 渲染器把渲染目标拆成 4 个重叠的画布：
 *   - 左上 / 右上 / 左下 / 右下
 * 每个画布带随机位移使画面产生"流体"漂移感。
 * 容器尺寸变化时需要重新计算每个画布的位置和 backing store 尺寸。
 */

const GRID_COUNT = 4;
const ANIMATION_DELAYS = [0, -5, -10, -15] as const;
const WRAPPER_CLASS = 'fluid-effect-wrapper';
const WRAPPER_FULLSCREEN_CLASS = 'fullscreen';
const RECT_CLASS = 'fluid-effect-rect';
const CANVAS_CLASS = 'fluid-effect-canvas';
const CONTAINER_CLASS = 'fluid-effect-container';

/** 单个画布在 2x2 网格中的初始随机位移 */
export interface CanvasOffset {
    dx: number;
    dy: number;
}

export interface CanvasGrid {
    wrapper: HTMLElement;
    rect: HTMLElement;
    canvases: HTMLCanvasElement[];
    contexts: CanvasRenderingContext2D[];
    offsets: CanvasOffset[];
}

/**
 * 在 `container` 中创建 4 个 canvas 元素并返回引用。
 * 调用方负责把返回的 `wrapper` 追加到 DOM。
 */
export function createCanvasGrid(
    container: HTMLElement,
    resolution: number,
    displacementAmplitude: number,
    fullscreen: boolean
): CanvasGrid {
    const wrapper = document.createElement('div');
    wrapper.className = WRAPPER_CLASS;
    if (fullscreen) {
        wrapper.classList.add(WRAPPER_FULLSCREEN_CLASS);
    }

    const rect = document.createElement('div');
    rect.className = RECT_CLASS;

    const canvases: HTMLCanvasElement[] = [];
    const contexts: CanvasRenderingContext2D[] = [];
    const offsets: CanvasOffset[] = [];

    const amp = parseFloat(String(displacementAmplitude)) || 200;
    for (let i = 0; i < GRID_COUNT; i++) {
        const canvas = document.createElement('canvas');
        canvas.className = CANVAS_CLASS;
        canvas.setAttribute('canvasID', (i + 1).toString());
        canvas.width = resolution;
        canvas.height = resolution;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
            throw new Error('Failed to acquire 2D context for fluid canvas');
        }

        canvases.push(canvas);
        contexts.push(ctx);
        offsets.push({
            dx: (Math.random() * 2 - 1) * amp,
            dy: (Math.random() * 2 - 1) * amp,
        });

        canvas.style.animationDelay = `${ANIMATION_DELAYS[i]}s`;
        rect.appendChild(canvas);
    }

    wrapper.appendChild(rect);
    container.appendChild(wrapper);
    container.classList.add(CONTAINER_CLASS);

    return { wrapper, rect, canvases, contexts, offsets };
}

/** 卸载画布网格：从父节点移除 wrapper 并清空字段 */
export function unmountCanvasGrid(grid: CanvasGrid): void {
    if (grid.wrapper.parentNode) {
        grid.wrapper.parentNode.removeChild(grid.wrapper);
    }
}

/**
 * 根据容器尺寸重新计算每个 canvas 的位置和 backing store 尺寸。
 *
 * - 边长 = `viewSize * 0.707`（约 1/sqrt(2)，让画布对角覆盖视口）
 * - 4 个画布位于容器中心 ±0.35 * side 处
 * - 当 backing store 尺寸变化时重置 transform 和 filter
 *
 * 性能：非 resize 场景（viewSize 未变）不少于 10ms 时，跳过 style 重写与
 * getContext 查找，保持 60Hz 场景零开销；resize 回调已在上层防抖。
 */
export function layoutCanvasGrid(
    grid: CanvasGrid,
    container: HTMLElement,
    blurAmount: number
): { displaySize: number; dpr: number } {
    const rect = container.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const viewSize = Math.max(width, height);
    const canvasSize = viewSize * 0.707;

    const displaySize = Math.max(1, Math.round(canvasSize));
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);

    for (let x = 0; x <= 1; x++) {
        for (let y = 0; y <= 1; y++) {
            const index = y * 2 + x;
            const canvas = grid.canvases[index];
            if (!canvas) continue;

            const signX = x === 0 ? -1 : 1;
            const signY = y === 0 ? -1 : 1;
            const offset = grid.offsets[index] ?? { dx: 0, dy: 0 };

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
                    ctx.filter = `blur(${blurAmount}px)`;
                }
            }
        }
    }

    return { displaySize, dpr };
}

/** 重新随机化每个 canvas 的位移幅度，就地写入 offsets（零分配） */
export function randomizeCanvasOffsets(
    grid: CanvasGrid,
    displacementAmplitude: number
): CanvasOffset[] {
    const amp = parseFloat(String(displacementAmplitude)) || 0;
    for (let i = 0; i < grid.offsets.length; i++) {
        const off = grid.offsets[i];
        if (off) {
            off.dx = (Math.random() * 2 - 1) * amp;
            off.dy = (Math.random() * 2 - 1) * amp;
        } else {
            grid.offsets[i] = { dx: (Math.random() * 2 - 1) * amp, dy: (Math.random() * 2 - 1) * amp };
        }
    }
    return grid.offsets;
}
