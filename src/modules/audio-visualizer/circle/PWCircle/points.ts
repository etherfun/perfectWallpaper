/**
 * PWCircle 点位计算逻辑：基于音频数据生成圆形点阵
 *
 * 从 `circle/PWCircle.ts` 拆出的 createPoint / getXY。
 */

import { rt, state } from './state';

/** 点阵数量（与原始实现一致） */
const POINT_COUNT = 128;

/** 多边形模式的角度槽数（原始实现为 120 点） */
const POLYGON_SLOTS = 120;

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
 * 多边形模式的槽值缓冲：128 bin 下采样为 120 槽（区间取 max，保留峰值）。
 * 与 PWLine 的分桶下采样同源——保证每个 bin 恰好归属一个槽、无回绕无重叠。
 */
const _slotValues: number[] = new Array(POLYGON_SLOTS).fill(0);

/**
 * 把 128 个 bin 聚合为 120 个槽值（每槽取覆盖区间的最大值）。
 * 多边形模式下同一角度槽的两个点若音频值不同，折线会画出径向线段
 * （"错误连线"）；聚合后每槽单值，彻底消除该问题。
 */
function downsampleToSlots(arr: number[]): number[] {
    const len = arr.length > 0 ? arr.length : 1;
    for (let k = 0; k < POLYGON_SLOTS; k++) {
        const start = Math.floor((k * len) / POLYGON_SLOTS);
        const end = Math.max(start + 1, Math.floor(((k + 1) * len) / POLYGON_SLOTS));
        let m = 0;
        for (let j = start; j < end && j < len; j++) {
            const v = arr[j] ?? 0;
            if (v > m) m = v;
        }
        _slotValues[k] = m;
    }
    return _slotValues;
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
    const polygon = param.Polygon;
    const polygonAngle = param.PolygonAngle;
    const direction = param.direction;
    const r = param.r;
    const range = param.range;
    const waveArr = param.waveArr;
    const cX = param.cX;
    const cY = param.cY;
    const w = state.w;
    const h = state.h;
    const minW = state.minW;

    // 全圆布局：水平线分隔左右声道。
    // WE 音频数组 0..63 为左声道、64..127 为右声道，映射到上下两半圆：
    //   左声道（上半圆）：bin i 角度 -((i+0.5)/64)·π，从 3 点钟扫向 9 点钟
    //   右声道（下半圆）：bin j 角度 +((j+0.5)/64)·π，从 3 点钟扫向 9 点钟
    // bin 0|64 在水平线右端（3 点钟）接壤，bin 63|127 在左端（9 点钟）接壤，
    // 两声道关于水平直径严格镜像（±θ 的 cos 相同、sin 反号）。
    // offsetAngle（度）整体旋转，保持镜像关系不变。
    const rotRad = (offsetAngle * Math.PI) / 180;

    // 多边形模式（滑条 ≠ 默认）：与原始实现一致，按 120 个角度槽循环。
    // 先把 128 bin 下采样为 120 槽值（区间取 max），再逐槽用原始公式
    // deg = π/PA · (slot + offsetAngle) · 3 计算点位。
    // 槽值写入池的前 120 个位置；剩余 8 个池位复制槽 0（styles 固定遍历
    // 128 点，多出的点与首点重合不会产生可见线条——同角度同半径）。
    const polygonMode = !showSemiCircle && polygonAngle !== 12;
    if (polygonMode) {
        downsampleToSlots(arr);
    }

    for (let i = 0; i < POINT_COUNT; i++) {
        // 多边形模式：槽 120..127（池尾部多余位）回绕到槽 0..7。
        // 直接复制池中已算好的坐标——同角度同半径，折线与首段严格重合，
        // 不产生任何可见线条。若重算会因 waveArr 同帧先写后读产生径向刺线。
        if (polygonMode && i >= POLYGON_SLOTS) {
            const src = _pool1[i - POLYGON_SLOTS]!;
            const dst = _pool1[i]!;
            dst.x = src.x;
            dst.y = src.y;
            const src2 = _pool2[i - POLYGON_SLOTS]!;
            const dst2 = _pool2[i]!;
            dst2.x = src2.x;
            dst2.y = src2.y;
            continue;
        }

        let deg: number;
        let audioValue: number;
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
            audioValue = arr[i] ?? 0;
        } else if (polygonMode) {
            // 原始公式：deg = π/PA · (slot + offsetAngle) · 3。
            // 点落在少量离散角度位置上，style2/3 连线画出多边形轮廓
            // （PA=1→三角、PA=4→八边、PA=180→近似圆），波峰音频下效果更明显。
            // 每槽单值（已下采样），折线无径向刺线。waveArr 按槽索引读写。
            deg = (Math.PI / polygonAngle) * (i + offsetAngle) * 3;
            audioValue = _slotValues[i] ?? 0;
        } else {
            // 滑条默认（mode 12 → PolygonAngle=180）：水平线分隔左右声道布局。
            const isLeftChannel = i < 64;
            const chIdx = isLeftChannel ? i : i - 64;
            const halfDeg = ((chIdx + 0.5) / 64) * Math.PI;
            deg = (isLeftChannel ? -halfDeg : halfDeg) + rotRad;
            audioValue = arr[i] ?? 0;
        }

        let w1 = audioValue ? audioValue : 0;
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
