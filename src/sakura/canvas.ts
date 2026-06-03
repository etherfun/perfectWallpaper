/**
 * 樱花画布尺寸控制
 *
 * 两个外部画布：
 *   - #sakura       WebGL 离屏画布（粒子渲染目标）
 *   - #sakurashow   2D 显示画布（每帧 drawImage 拷贝自 #sakura）
 *
 * 关闭樱花时把两个画布尺寸置 0，drawImage 自然跳过。
 */

export function makeCanvasFullScreen(
    canvas: HTMLCanvasElement,
    canvasshow: HTMLCanvasElement
): void {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    canvasshow.width = window.innerWidth;
    canvasshow.height = window.innerHeight;
}

export function makeCanvasHide(canvas: HTMLCanvasElement, canvasshow: HTMLCanvasElement): void {
    canvas.width = 0;
    canvas.height = 0;
    canvasshow.width = 0;
    canvasshow.height = 0;
}
