/**
 * useAudioVisualProperties 拆分辅助 — Canvas 上下文获取
 */

export function getCircleCtx(): CanvasRenderingContext2D | null {
    const can = document.querySelector('#can') as HTMLCanvasElement | null;
    return can?.getContext('2d') ?? null;
}

export function getLineCtx(): CanvasRenderingContext2D | null {
    const canLine = document.querySelector('#CanLine') as HTMLCanvasElement | null;
    return canLine?.getContext('2d') ?? null;
}
