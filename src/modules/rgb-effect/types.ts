/** RGB 模块共享类型 */
export interface RGBLayerFlags {
    sakurause: boolean;
    particlesRGB: boolean;
    hasAudio: boolean;
    hasBgImage: boolean;
}

export interface UseRGBCanvasApi {
    canvasRef: import('vue').Ref<HTMLCanvasElement | null>;
    encode: () => string;
    getCtx: () => CanvasRenderingContext2D | null;
}
