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
    canvas.style.display = '';
    canvasshow.style.display = '';
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    canvasshow.width = window.innerWidth;
    canvasshow.height = window.innerHeight;
}

export function makeCanvasHide(canvas: HTMLCanvasElement, canvasshow: HTMLCanvasElement): void {
    // 先清除 2D 显示画布内容（必须在设 width=0 之前，否则坐标空间为 0）
    const ctx = canvasshow.getContext('2d');
    if (ctx) {
        ctx.clearRect(0, 0, canvasshow.width, canvasshow.height);
        // 再画一个白色背景覆盖，确保没有任何残留
        ctx.fillStyle = 'rgba(0,0,0,0)';
        ctx.fillRect(0, 0, canvasshow.width, canvasshow.height);
    }
    // 然后归零尺寸（清空内部 bitmap）
    canvas.width = 0;
    canvas.height = 0;
    canvasshow.width = 0;
    canvasshow.height = 0;
    // 用 display none 确保元素不占布局
    canvasshow.style.display = 'none';
    canvas.style.display = 'none';
}
