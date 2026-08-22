/**
 * PWCircle 点位计算逻辑：基于音频数据生成圆形点阵
 *
 * 从 `circle/PWCircle.ts` 拆出的 createPoint / getXY。
 */

import { rt, state } from './state';

/** 点阵数量（与原始实现一致） */
const POINT_COUNT = 128;

/** 单声道 bin 数（WE 音频布局：左 64 + 右 64） */
const CHANNEL_BINS = 64;

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
 * 多边形模式的槽值缓冲：槽 0..63 = 左声道、槽 64..119 = 右声道。
 * 与 js 分支原始实现一致——音频数组直接按索引填入 120 个槽，
 * 不做任何混合/重采样（混合或上采样都会破坏原始视觉效果）。
 */
const _slotValues: number[] = new Array(POLYGON_SLOTS).fill(0);

/**
 * 双声道 → 120 槽直接填充：左声道占前 64 槽，右声道占后 56 槽。
 */
function fillSlotValues(left: number[], right: number[]): void {
    for (let k = 0; k < POLYGON_SLOTS; k++) {
        _slotValues[k] =
            k < CHANNEL_BINS ? (left[k] ?? 0) : (right[k - CHANNEL_BINS] ?? 0);
    }
}

/**
 * Create circle visualization points based on audio data
 *
 * 双声道输入：left → 上半圆（或半圆模式全量）、right → 下半圆。
 * 全圆默认布局中两声道关于水平直径镜像；多边形/半圆模式下
 * 使用对应声道的值填充各自点位。
 */
export function createPoint(left: number[], right: number[]): void {
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

    // 全圆默认布局：水平线分隔左右声道。offsetAngle（度）整体旋转，
    // 保持镜像关系不变。
    const rotRad = (offsetAngle * Math.PI) / 180;

    // 多边形模式：由显式开关 param.polygonActive 控制（WE 推送 PolygonAngle
    // 属性的任意档位时置 true，含 PA=12）。与原始实现一致只生成 120 个点，
    // styles 按 param.activePoints 遍历，尾部 8 个池对象不参与绘制。
    // （旧版用 PA!==12 当哨兵：①吞掉 combo 第 8 档 PA=12；②初始 PA=0 时
    // 会误入多边形分支产生除零。）
    const polygonMode = !showSemiCircle && param.polygonActive;
    if (polygonMode) {
        fillSlotValues(left, right);
        param.activePoints = POLYGON_SLOTS;
    } else {
        param.activePoints = POINT_COUNT;
    }

    for (let i = 0; i < param.activePoints; i++) {
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
            // 半圆模式：按方向取声道（上/左=左声道，下/右=右声道）
            audioValue =
                semiCircledirection === 2 || semiCircledirection === 4
                    ? right[i] ?? 0
                    : left[i] ?? 0;
        } else if (polygonMode) {
            // 原始公式：deg = π/PA · (slot + offsetAngle) · 3。
            // 点落在少量离散角度位置上，style2/3 连线画出多边形轮廓
            // （PA=1→三角、PA=4→八边、PA=180→近似圆），波峰音频下效果更明显。
            // 槽值即声道 bin（左 64 + 右 56 直接填充），waveArr 按槽索引读写。
            deg = (Math.PI / polygonAngle) * (i + offsetAngle) * 3;
            audioValue = _slotValues[i] ?? 0;
        } else {
            // 滑条默认（mode 12 → PolygonAngle=180）：水平线分隔左右声道布局。
            // 上半圆取左声道 bin i，下半圆取右声道 bin i-64 —— 天然对齐，
            // 无需再从混合数组里拆分。
            const isLeftChannel = i < 64;
            const chIdx = isLeftChannel ? i : i - 64;
            const halfDeg = ((chIdx + 0.5) / 64) * Math.PI;
            deg = (isLeftChannel ? -halfDeg : halfDeg) + rotRad;
            audioValue = isLeftChannel ? left[chIdx] ?? 0 : right[chIdx] ?? 0;
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
