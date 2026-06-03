/**
 * 播放状态控制辅助
 *
 * 把流体效果的 CSS 动画播放状态（running / paused）切换抽出来，
 * 供渲染器在 `setPlayState` 中调用。
 */

const PLAY_STATE_RUNNING = 'running';
const PLAY_STATE_PAUSED = 'paused';

/**
 * 将所有流体效果相关 DOM 元素的 `animationPlayState` 同步到目标状态。
 *
 * - `fluidRect` 控制容器旋转动画
 * - 每个 canvas 控制自身的位移/缩放动画
 */
export function setAnimationPlayState(
    fluidRect: HTMLElement | null,
    canvases: HTMLCanvasElement[],
    playing: boolean
): void {
    const state = playing ? PLAY_STATE_RUNNING : PLAY_STATE_PAUSED;

    if (fluidRect) {
        fluidRect.style.animationPlayState = state;
    }

    for (const canvas of canvases) {
        if (canvas) {
            canvas.style.animationPlayState = state;
        }
    }
}
