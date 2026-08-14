/**
 * PWCircle 点位计算逻辑：基于音频数据生成圆形点阵
 *
 * 从 `circle/PWCircle.ts` 拆出的 createPoint / getXY。
 */

import { rt, state } from './state';

/**
 * Create circle visualization points based on audio data
 */
export function createPoint(arr: number[]): void {
    rt().param.arr1 = [];
    rt().param.arr2 = [];

    for (let i = 0; i < 128; i++) {
        let deg: number;
        if (rt().param.showSemiCircle) {
            switch (rt().param.SemiCircledirection) {
                case 1: // Top
                    deg = (Math.PI / 128) * (i + rt().param.offsetAngle + 0.5) * -1;
                    break;
                case 2: // Bottom
                    deg = (Math.PI / 128) * (i + rt().param.offsetAngle + 0.5);
                    break;
                case 3: // Left
                    deg = (Math.PI / 128) * (i + rt().param.offsetAngle - 179.5);
                    break;
                case 4: // Right
                    deg = (Math.PI / 128) * (i + rt().param.offsetAngle + 180.5);
                    break;
                default:
                    deg = (Math.PI / 128) * (i + rt().param.offsetAngle + 0.5) * -1;
            }
        } else {
            // 全圆角度: 与原始 JS 版本一致
            deg =
                (Math.PI / rt().param.PolygonAngle) *
                (i + rt().param.offsetAngle) *
                3;
        }

        const arrI = arr[i] ?? 0;
        let w1 = arrI ? arrI : 0;
        const prevWave = rt().param.waveArr[i];
        const w2: number =
            prevWave !== undefined && prevWave !== 0 ? prevWave - prevWave * 0.25 : 0;
        w1 = Math.max(w1, w2);
        rt().param.waveArr[i] = w1 = Math.min(w1, 1.2);
        const waveHeight = w1 * rt().param.range * 100;

        let offset1: number;
        let offset2: number;
        switch (rt().param.direction) {
            case 1:
                offset1 = (rt().param.r * state.minW) / 2 + waveHeight + 1;
                offset2 = (rt().param.r * state.minW) / 2;
                break;
            case 2:
                offset1 = (rt().param.r * state.minW) / 2;
                offset2 = (rt().param.r * state.minW) / 2 - waveHeight - 1;
                break;
            case 3:
                offset1 = (rt().param.r * state.minW) / 2 + waveHeight + 1;
                offset2 = (rt().param.r * state.minW) / 2 - waveHeight - 1;
                break;
            default:
                offset1 = (rt().param.r * state.minW) / 2 + waveHeight + 1;
                offset2 = (rt().param.r * state.minW) / 2 - waveHeight - 1;
        }

        const p1 = getXY(offset1, deg);
        const p2 = getXY(offset2, deg);

        rt().param.arr1.push({ x: p1.x, y: p1.y });
        rt().param.arr2.push({ x: p2.x, y: p2.y });
    }

    if (rt().param.rotation) {
        rt().param.offsetAngle +=
            rt().param.rotation / rt().param.Polygon;
        if (rt().param.offsetAngle >= 360) {
            rt().param.offsetAngle = 0;
        } else if (rt().param.offsetAngle <= 0) {
            rt().param.offsetAngle = 360;
        }
    }
}

/**
 * Calculate XY coordinates for a circle point
 */
export function getXY(offset: number, deg: number): { x: number; y: number } {
    const x = Math.cos(deg) * offset + rt().param.cX * state.w;
    const y = Math.sin(deg) * offset + rt().param.cY * state.h;

    return { x, y };
}
