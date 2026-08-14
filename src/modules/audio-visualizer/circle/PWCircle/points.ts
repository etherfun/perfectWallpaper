/**
 * PWCircle 点位计算逻辑：基于音频数据生成圆形点阵
 *
 * 从 `circle/PWCircle.ts` 拆出的 createPoint / getXY。
 */

import { rt, state } from './state';

/** 点阵数量（与原始实现一致） */
const POINT_COUNT = 128;

/**
 * 预分配的点对象池：createPoint 每帧复用同一批对象，只更新 x/y 字段，
 * 避免每帧为 2 个新数组 + 256 个 {x, y} 对象分配产生 GC 压力。
 * param 是 shallowRef 内的普通对象，arr1/arr2 指向池后内容每帧原地刷新，
 * 读取方（styles）拿到的仍是同一数组引用，行为等价。
 */
const _pool1: { x: number; y: number }[] = [];
const _pool2: { x: number; y: number }[] = [];
for (let i = 0; i < POINT_COUNT; i++) {
    _pool1.push({ x: 0, y: 0 });
    _pool2.push({ x: 0, y: 0 });
}

/**
 * Create circle visualization points based on audio data
 */
export function createPoint(arr: number[]): void {
    // 缓存 param 引用：避免循环内数百次 Pinia store 访问（rt() 每次都有
    // useRuntimeStore 查找开销）。param 是普通对象，每帧引用稳定。
    const param = rt().param;

    // 首帧（或 param 被整体替换）时把 arr1/arr2 指向对象池；之后仅原地更新
    if (param.arr1 !== _pool1) param.arr1 = _pool1;
    if (param.arr2 !== _pool2) param.arr2 = _pool2;

    const showSemiCircle = param.showSemiCircle;
    const semiCircledirection = param.SemiCircledirection;
    const offsetAngle = param.offsetAngle;
    const polygonAngle = param.PolygonAngle;
    const polygon = param.Polygon;
    const direction = param.direction;
    const r = param.r;
    const range = param.range;
    const waveArr = param.waveArr;
    const cX = param.cX;
    const cY = param.cY;
    const w = state.w;
    const h = state.h;
    const minW = state.minW;

    for (let i = 0; i < POINT_COUNT; i++) {
        let deg: number;
        if (showSemiCircle) {
            switch (semiCircledirection) {
                case 1: // Top
                    deg = (Math.PI / 128) * (i + offsetAngle + 0.5) * -1;
                    break;
                case 2: // Bottom
                    deg = (Math.PI / 128) * (i + offsetAngle + 0.5);
                    break;
                case 3: // Left
                    deg = (Math.PI / 128) * (i + offsetAngle - 179.5);
                    break;
                case 4: // Right
                    deg = (Math.PI / 128) * (i + offsetAngle + 180.5);
                    break;
                default:
                    deg = (Math.PI / 128) * (i + offsetAngle + 0.5) * -1;
            }
        } else {
            // 全圆角度: 与原始 JS 版本一致
            deg = (Math.PI / polygonAngle) * (i + offsetAngle) * 3;
        }

        const arrI = arr[i] ?? 0;
        let w1 = arrI ? arrI : 0;
        const prevWave = waveArr[i];
        const w2: number =
            prevWave !== undefined && prevWave !== 0 ? prevWave - prevWave * 0.25 : 0;
        w1 = Math.max(w1, w2);
        waveArr[i] = w1 = Math.min(w1, 1.2);
        const waveHeight = w1 * range * 100;

        let offset1: number;
        let offset2: number;
        switch (direction) {
            case 1:
                offset1 = (r * minW) / 2 + waveHeight + 1;
                offset2 = (r * minW) / 2;
                break;
            case 2:
                offset1 = (r * minW) / 2;
                offset2 = (r * minW) / 2 - waveHeight - 1;
                break;
            case 3:
                offset1 = (r * minW) / 2 + waveHeight + 1;
                offset2 = (r * minW) / 2 - waveHeight - 1;
                break;
            default:
                offset1 = (r * minW) / 2 + waveHeight + 1;
                offset2 = (r * minW) / 2 - waveHeight - 1;
        }

        // 内联 getXY 计算并写入对象池（复用对象，避免每帧 256 次对象分配）
        const p1 = _pool1[i]!;
        p1.x = Math.cos(deg) * offset1 + cX * w;
        p1.y = Math.sin(deg) * offset1 + cY * h;
        const p2 = _pool2[i]!;
        p2.x = Math.cos(deg) * offset2 + cX * w;
        p2.y = Math.sin(deg) * offset2 + cY * h;
    }

    if (param.rotation) {
        param.offsetAngle += param.rotation / polygon;
        if (param.offsetAngle >= 360) {
            param.offsetAngle = 0;
        } else if (param.offsetAngle <= 0) {
            param.offsetAngle = 360;
        }
    }
}

/**
 * Calculate XY coordinates for a circle point
 */
export function getXY(offset: number, deg: number): { x: number; y: number } {
    const param = rt().param;
    const x = Math.cos(deg) * offset + param.cX * state.w;
    const y = Math.sin(deg) * offset + param.cY * state.h;

    return { x, y };
}
