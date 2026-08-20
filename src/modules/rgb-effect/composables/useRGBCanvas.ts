import { useTemplateRef } from 'vue';

const ENCODED_CHANNEL_COUNT = 100 * 20 * 3;
const _rgbColorArray: number[] = new Array(ENCODED_CHANNEL_COUNT);
let _rgbCanvasCtx: CanvasRenderingContext2D | null | undefined;

/** 管理 #RGBuse 的 canvas ref 与 6000 通道编码复用 */
export function useRGBCanvas() {
    const canvasRef = useTemplateRef<HTMLCanvasElement>('rgbCanvasRef');

    function getCtx(): CanvasRenderingContext2D | null {
        const c = canvasRef.value;
        if (!c) return null;
        if (_rgbCanvasCtx === undefined) _rgbCanvasCtx = c.getContext('2d', { willReadFrequently: true });
        return _rgbCanvasCtx ?? null;
    }

    function encode(): string {
        const ctx = getCtx();
        const c = canvasRef.value;
        if (!ctx || !c) return '';
        const data = ctx.getImageData(0, 0, 100, 20).data;
        for (let d = 0, w = 0; d < data.length; d += 4, w += 3) {
            _rgbColorArray[w] = data[d] ?? 0;
            _rgbColorArray[w + 1] = data[d + 1] ?? 0;
            _rgbColorArray[w + 2] = data[d + 2] ?? 0;
        }
        return String.fromCharCode.apply(null, _rgbColorArray as unknown as number[]);
    }

    return { canvasRef, getCtx, encode };
}
