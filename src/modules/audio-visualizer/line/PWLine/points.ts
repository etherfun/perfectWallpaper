/**
 * PWLine 点位计算逻辑：基于音频数据生成折线点阵
 *
 * 从 `line/PWLine.ts` 拆出的 PWLineCreatePoint / getLineXY。
 */

import { rt, state } from './state';

/**
 * 预分配的点对象池：PWLineCreatePoint 每帧复用同一批对象，只更新 x/y 字段，
 * 避免每帧为 2 个新数组 + 2×LineDensity 个 {x, y} 对象分配产生 GC 压力。
 */
const _pool1: { x: number; y: number }[] = [];
const _pool2: { x: number; y: number }[] = [];

/** 确保池容量不小于 size（只增不减；减少时由调用方截断 length） */
function ensurePool(pool: { x: number; y: number }[], size: number): void {
    while (pool.length < size) {
        pool.push({ x: 0, y: 0 });
    }
}

/**
 * Create line visualization points based on audio data
 */
export function PWLineCreatePoint(arr: number[]): void {
    // 缓存 param 引用：避免循环内数百次 Pinia store 访问（rt() 每次都有
    // useRuntimeStore 查找开销）。param 是普通对象，每帧引用稳定。
    const param = rt().PWLineParam;

    // 首帧（或 param 被整体替换）时把 arr1/arr2 指向对象池；之后仅原地更新
    if (param.arr1 !== _pool1) param.arr1 = _pool1;
    if (param.arr2 !== _pool2) param.arr2 = _pool2;

    const lineDensity = param.LineDensity;
    // 全数组采样：把 arr 的全部样本（WE 提供 128 个）映射到 lineDensity 根柱。
    // 旧逻辑 iv=(120-lineDensity)/2 只取中间子集，密度 120 时也丢弃 120..127
    // 共 8 个样本，密度更小时丢弃更多。
    //   - 下采样（density < len）：每根柱取其覆盖 bin 区间的最大值，
    //     保证每个 bin 恰好归属一根柱、峰值不丢失；
    //   - 上采样（density >= len）：按柱中心线性插值，平滑还原。
    const arrLen = arr.length > 0 ? arr.length : 1;

    // 池容量对齐 LineDensity（LineDensity 可调，变化时扩展/截断）
    ensurePool(_pool1, lineDensity);
    ensurePool(_pool2, lineDensity);
    _pool1.length = lineDensity;
    _pool2.length = lineDensity;

    const linePosition = param.LinePosition;
    const lineWidth = state.CTXLine.lineWidth;
    if (linePosition === 1) {
        state.sw =
            ((state.maxW - lineDensity * lineWidth) / (lineDensity - 1)) * param.sw;
    } else {
        state.sw =
            ((state.minW - lineDensity * lineWidth) / (lineDensity - 1)) * param.sw;
    }

    const range = param.range;
    const direction = param.Direction;
    const waveArr = param.waveArr;
    const lineX = param.LineX;
    const lineY = param.LineY;
    const sw = state.sw;
    const maxW = state.maxW;
    const minW = state.minW;
    const densityHalf = lineDensity / 2;

    for (let j = 0; j < lineDensity; j++) {
        let w1: number;
        if (lineDensity >= arrLen) {
            // 上采样：柱中心线性插值
            const pos = (j * (arrLen - 1)) / Math.max(1, lineDensity - 1);
            const i0 = Math.floor(pos);
            const i1 = Math.min(arrLen - 1, i0 + 1);
            const frac = pos - i0;
            w1 = (arr[i0] ?? 0) * (1 - frac) + (arr[i1] ?? 0) * frac;
        } else {
            // 下采样：柱 j 覆盖 bin [start, end)，取最大值（保留峰值）
            const start = Math.floor((j * arrLen) / lineDensity);
            const end = Math.max(start + 1, Math.floor(((j + 1) * arrLen) / lineDensity));
            let m = 0;
            for (let k = start; k < end && k < arrLen; k++) {
                const v = arr[k] ?? 0;
                if (v > m) m = v;
            }
            w1 = m;
        }
        const prevWave = waveArr[j];
        const w2: number = prevWave !== undefined && prevWave !== 0 ? prevWave - 0.1 : 0;
        w1 = Math.max(w1, w2);
        waveArr[j] = w1 = Math.min(w1, 1.2);
        const waveHeight = w1 * range * 100;

        let Deviation1: number;
        let Deviation2: number;
        switch (direction) {
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

        // 内联 getLineXY 计算并写入对象池（复用对象，避免每帧 2×LineDensity 次对象分配）
        const spread = (j + 0.5 - densityHalf) * sw + (j + 0.5 - densityHalf) * lineWidth;
        const p1 = _pool1[j]!;
        const p2 = _pool2[j]!;
        if (linePosition === 1) {
            const x = maxW * lineX + spread;
            const y = minW * lineY;
            p1.x = x;
            p1.y = y + Deviation1;
            p2.x = x;
            p2.y = y + Deviation2;
        } else {
            const x = minW * lineY + spread;
            const y = maxW * lineX;
            p1.x = y + Deviation1;
            p1.y = x;
            p2.x = y + Deviation2;
            p2.y = x;
        }
    }

    const mid = _pool1[lineDensity / 2 - 1];
    const first = _pool1[0];
    if (mid && first) {
        if (linePosition === 1) {
            state.lineR = mid.x - first.x;
        } else {
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
