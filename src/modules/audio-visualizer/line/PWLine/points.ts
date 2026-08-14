/**
 * PWLine 点位计算逻辑：基于音频数据生成折线点阵
 *
 * 从 `line/PWLine.ts` 拆出的 PWLineCreatePoint / getLineXY。
 */

import { rt, state } from './state';

/**
 * Create line visualization points based on audio data
 */
export function PWLineCreatePoint(arr: number[]): void {
    rt().PWLineParam.arr1 = [];
    rt().PWLineParam.arr2 = [];
    const iv = (120 - rt().PWLineParam.LineDensity) / 2;

    if (rt().PWLineParam.LinePosition === 1) {
        state.sw =
            ((state.maxW - rt().PWLineParam.LineDensity * state.CTXLine.lineWidth) /
                (rt().PWLineParam.LineDensity - 1)) *
            rt().PWLineParam.sw;
    } else {
        state.sw =
            ((state.minW - rt().PWLineParam.LineDensity * state.CTXLine.lineWidth) /
                (rt().PWLineParam.LineDensity - 1)) *
            rt().PWLineParam.sw;
    }

    for (let i = iv, j = 0; i < rt().PWLineParam.LineDensity + iv; i++, j++) {
        const arrI = arr[i] ?? 0;
        let w1 = arrI ? arrI : 0;
        const prevWave = rt().PWLineParam.waveArr[i];
        const w2: number = prevWave !== undefined && prevWave !== 0 ? prevWave - 0.1 : 0;
        w1 = Math.max(w1, w2);
        rt().PWLineParam.waveArr[i] = w1 = Math.min(w1, 1.2);
        const waveHeight = w1 * rt().PWLineParam.range * 100;

        let Deviation1: number;
        let Deviation2: number;
        switch (rt().PWLineParam.Direction) {
            case 1:
                Deviation1 = -waveHeight - 1;
                Deviation2 = 1;
                break;
            case 2:
                Deviation1 = -1;
                Deviation2 = waveHeight + 1;
                break;
            case 3:
                Deviation1 = -waveHeight - 1;
                Deviation2 = waveHeight + 1;
                break;
            default:
                Deviation1 = -waveHeight - 1;
                Deviation2 = waveHeight + 1;
        }

        const p1 = getLineXY(Deviation1, j);
        const p2 = getLineXY(Deviation2, j);

        rt().PWLineParam.arr1.push({ x: p1.x, y: p1.y });
        rt().PWLineParam.arr2.push({ x: p2.x, y: p2.y });
    }

    if (rt().PWLineParam.LinePosition === 1) {
        const mid = rt().PWLineParam.arr1[rt().PWLineParam.LineDensity / 2 - 1];
        const first = rt().PWLineParam.arr1[0];
        if (mid && first) {
            state.lineR = mid.x - first.x;
        }
    } else {
        const mid = rt().PWLineParam.arr1[rt().PWLineParam.LineDensity / 2 - 1];
        const first = rt().PWLineParam.arr1[0];
        if (mid && first) {
            state.lineR = mid.y - first.y;
        }
    }
}

/**
 * Calculate XY coordinates for a line point
 */
export function getLineXY(Deviation: number, i: number): { x: number; y: number } {
    if (rt().PWLineParam.LinePosition === 1) {
        const x =
            state.maxW * rt().PWLineParam.LineX +
            (i + 0.5 - rt().PWLineParam.LineDensity / 2) * state.sw +
            (i + 0.5 - rt().PWLineParam.LineDensity / 2) * state.CTXLine.lineWidth;
        const y = state.minW * rt().PWLineParam.LineY;
        return { x: x, y: y + Deviation };
    } else {
        const x =
            state.minW * rt().PWLineParam.LineY +
            (i + 0.5 - rt().PWLineParam.LineDensity / 2) * state.sw +
            (i + 0.5 - rt().PWLineParam.LineDensity / 2) * state.CTXLine.lineWidth;
        const y = state.maxW * rt().PWLineParam.LineX;
        return { x: y + Deviation, y: x };
    }
}
