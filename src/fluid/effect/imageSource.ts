/**
 * 图像源加载辅助
 *
 * 提供从 URL 加载图片并绘制到一组画布的纯函数，
 * `FluidEffect2Renderer` 与 `FluidEffect` 全屏效果复用此逻辑。
 */

import { debugLogger } from '@/utils/logger';

/**
 * 异步加载 URL 图片；成功/失败均通过回调通知调用方，
 * 由调用方决定将结果应用到渲染器或回退到默认占位。
 */
export function loadImageFromUrl(url: string, onLoad: (image: HTMLImageElement) => void): void {
    const image = new Image();
    image.crossOrigin = 'Anonymous';
    image.onload = () => onLoad(image);
    image.onerror = error => {
        debugLogger.error('加载 FluidEffect2 图像失败', { url, error });
    };
    image.src = url;
}

/**
 * 把一张完整图像按 2x2 网格切片绘制到 4 个画布上。
 *
 * 第 i 个画布对应：
 *   - sx: i % 2 === 0 ? 0 : sWidth
 *   - sy: i <  2    ? 0 : sHeight
 */
export function drawImageToCanvasGrid(
    contexts: CanvasRenderingContext2D[],
    canvases: HTMLCanvasElement[],
    image: HTMLImageElement,
    lastDisplaySize: number
): void {
    const width = image.naturalWidth || image.width || image.clientWidth || 0;
    const height = image.naturalHeight || image.height || image.clientHeight || 0;
    const sWidth = Math.floor(width / 2);
    const sHeight = Math.floor(height / 2);

    for (let i = 0; i < 4; i++) {
        const ctx = contexts[i];
        const canvas = canvases[i];
        if (!ctx || !canvas) continue;

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        const sx = i % 2 === 0 ? 0 : sWidth;
        const sy = i < 2 ? 0 : sHeight;

        const displaySize =
            lastDisplaySize || Math.round(canvas.width / (window.devicePixelRatio || 1));
        ctx.drawImage(image, sx, sy, sWidth, sHeight, 0, 0, displaySize, displaySize);
    }
}
