// @vitest-environment jsdom
/**
 * Tests for PWCircle 全圆布局 — 水平线分隔左右声道
 *
 * 音频数据为双声道架构：createPoint(left, right) 接收两个独立数组
 * （各 64 bin，WE 原始布局中对应 0..63 / 64..127）。
 * 布局：左声道占上半圆、右声道占下半圆，关于水平直径严格镜像：
 *   - bin k 与右声道同序号点的 x 相同、y 关于圆心对称
 *   - 左 bin 0 与右 bin 0 在 3 点钟方向接壤，bin 63 在 9 点钟方向接壤
 *   - 左声道全部点在上半平面（y < cy），右声道全部点在下半平面（y > cy）
 *
 * 注意：模块顶层调用 useRuntimeStore()，必须先 setActivePinia 再动态 import。
 */
import { createPinia, setActivePinia } from 'pinia';
import { beforeEach, describe, expect, test } from 'vitest';

import { useRuntimeStore } from '@/stores/runtime';

let createPoint: (left: number[], right: number[]) => void;
 
let state: any;

beforeEach(async () => {
    setActivePinia(createPinia());
    ({ createPoint } = await import('@/modules/audio-visualizer/circle/PWCircle/points'));
    state = (await import('@/modules/audio-visualizer/circle/PWCircle/state')).state;
});

/** 配置 param 与画布状态，返回 { rt, CX, CY, R } */
function setup(opts?: { offsetAngle?: number; polygon?: boolean }) {
    const rt = useRuntimeStore();
    const p = rt.param;
    p.showSemiCircle = false;
    p.SemiCircledirection = 1;
    p.offsetAngle = opts?.offsetAngle ?? 0;
    // polygon=true 模拟滑条选了位置 1..11（多边形变换）；
    // 默认（false）= 滑条位置 12 → 正常模式，polygonActive=false
    p.polygonActive = opts?.polygon ?? false;
    p.PolygonAngle = opts?.polygon ? 12 : 180;
    p.Polygon = 120;
    p.direction = 3; // 双向：offset1 = base + h + 1, offset2 = base - h - 1
    p.r = 0.45;
    p.range = 9;
    p.waveArr = new Array(128).fill(0);
    p.cX = 0.5;
    p.cY = 0.5;
    p.rotation = 0;

    state.w = 1000;
    state.h = 800;
    state.minW = 800;

    const CX = 500; // cX * w
    const CY = 400; // cY * h
    return { rt, CX, CY };
}

/** 静音双声道（各 64 bin） */
function silent(): [number[], number[]] {
    return [new Array(64).fill(0), new Array(64).fill(0)];
}

describe('PWCircle 全圆 — 水平线分隔左右声道', () => {
    test('左声道在上半平面、右声道在下半平面', () => {
        setup();
        createPoint(...silent());
        const arr1 = useRuntimeStore().param.arr1!;
        for (let i = 0; i < 64; i++) {
            expect(arr1[i]!.y).toBeLessThan(400);
        }
        for (let i = 64; i < 128; i++) {
            expect(arr1[i]!.y).toBeGreaterThan(400);
        }
    });

    test('镜像对称：bin k 与右声道同序号点 x 相同、y 关于水平线对称', () => {
        setup();
        createPoint(...silent());
        const arr1 = useRuntimeStore().param.arr1!;
        for (let k = 0; k < 64; k++) {
            const top = arr1[k]!;
            const bottom = arr1[64 + k]!;
            expect(top.x).toBeCloseTo(bottom.x, 6);
            expect(top.y + bottom.y).toBeCloseTo(800, 6); // 2 * CY
        }
    });

    test('接壤点：左 bin 0|右 bin 0 紧邻 3 点钟水平线，bin 63 紧邻 9 点钟水平线', () => {
        setup();
        createPoint(...silent());
        const arr1 = useRuntimeStore().param.arr1!;
        // 半径 base = r*minW/2 = 180；direction=3 时 offset1 = 181
        // bin 0 角度 -(0.5/64)π → 距水平线垂直距离 = 181*sin(π/128) ≈ 4.43
        const gap = Math.abs(arr1[0]!.y - 400);
        expect(gap).toBeGreaterThan(0);
        expect(gap).toBeLessThan(10);
        // bin 63 与 bin 0 关于垂直轴对称（x 关于 CX 对称）
        expect(Math.abs((arr1[63]!.x - 500) + (arr1[0]!.x - 500))).toBeLessThan(1e-6);
        // bin 127 与 bin 64 同理（下半圆）
        expect(Math.abs((arr1[127]!.x - 500) + (arr1[64]!.x - 500))).toBeLessThan(1e-6);
    });

    test('等角间距：左声道相邻点夹角恒为 π/64', () => {
        setup();
        createPoint(...silent());
        const arr1 = useRuntimeStore().param.arr1!;
        const CX = 500;
        const CY = 400;
        let prev = Math.atan2(arr1[0]!.y - CY, arr1[0]!.x - CX);
        for (let i = 1; i < 64; i++) {
            const cur = Math.atan2(arr1[i]!.y - CY, arr1[i]!.x - CX);
            const delta = Math.abs(prev - cur);
            expect(delta).toBeCloseTo(Math.PI / 64, 5);
            prev = cur;
        }
    });

    test('音频响应：bin 有值时该点半径增大，镜像点同步', () => {
        setup();
        const [left, right] = silent();
        left[10] = 1; // 左声道 bin 10
        right[10] = 1; // 右声道 bin 10（镜像位）
        createPoint(left, right);
        const arr1 = useRuntimeStore().param.arr1!;
        const CX = 500;
        const CY = 400;
        const dTop = Math.hypot(arr1[10]!.x - CX, arr1[10]!.y - CY);
        const dBottom = Math.hypot(arr1[74]!.x - CX, arr1[74]!.y - CY);
        const dQuietTop = Math.hypot(arr1[20]!.x - CX, arr1[20]!.y - CY);
        // 两声道镜像点半径相同且大于静音点
        expect(dTop).toBeCloseTo(dBottom, 6);
        expect(dTop).toBeGreaterThan(dQuietTop);
    });

    test('offsetAngle 整体旋转后镜像关系保持（关于旋转后轴线对称）', () => {
        const { rt } = setup({ offsetAngle: 30 });
        createPoint(...silent());
        const arr1 = rt.param.arr1!;
        const CX = 500;
        const CY = 400;
        const phi = (30 * Math.PI) / 180; // 旋转角
        for (let k = 0; k < 64; k++) {
            const top = arr1[k]!;
            const bottom = arr1[64 + k]!;
            // 距圆心等距
            const dTop = Math.hypot(top.x - CX, top.y - CY);
            const dBottom = Math.hypot(bottom.x - CX, bottom.y - CY);
            expect(dTop).toBeCloseTo(dBottom, 6);
            // 角度关于旋转后轴线（φ）对称：angTop + angBottom ≡ 2φ (mod 2π)
            const aTop = Math.atan2(top.y - CY, top.x - CX);
            const aBottom = Math.atan2(bottom.y - CY, bottom.x - CX);
            let sum = aTop + aBottom - 2 * phi;
            // 归一化到 [-2π, 2π] 再判断接近 0 或 ±2π
            sum = ((sum % (2 * Math.PI)) + 3 * Math.PI) % (2 * Math.PI) - Math.PI;
            expect(Math.abs(sum)).toBeLessThan(1e-9);
        }
    });
});

describe('PWCircle 全圆 — 多边形变换（显式 polygonActive 开关）', () => {
    test('滑条位置 12（默认）：正常模式声道分隔布局（回归保护）', () => {
        setup();
        createPoint(...silent());
        const arr1 = useRuntimeStore().param.arr1!;
        // 与声道分隔基线一致：bin k 与 bin 64+k 镜像
        for (let k = 0; k < 64; k++) {
            expect(arr1[k]!.x).toBeCloseTo(arr1[64 + k]!.x, 6);
            expect(arr1[k]!.y + arr1[64 + k]!.y).toBeCloseTo(800, 6);
        }
    });

    test('combo 8（PA=12）：多边形布局生效，不再被哨兵吞掉', () => {
        const { rt } = setup({ polygon: true });
        rt.param.PolygonAngle = 12; // WE combo 第 8 档映射值
        createPoint(...silent());
        expect(rt.param.activePoints).toBe(120);
        const arr1 = rt.param.arr1!;
        const CX = 500;
        const CY = 400;
        // deg = π/12 · k · 3 = k·π/4 → 每 4 点重复一个角度（8 个离散方向）
        const angles = new Set<number>();
        for (let i = 0; i < 120; i++) {
            let d = Math.round(
                (Math.atan2(arr1[i]!.y - CY, arr1[i]!.x - CX) / (Math.PI / 180)) * 100
            ) / 100;
            if (d < 0) d += 360;
            angles.add(Math.round(d % 360));
        }
        expect(angles.size).toBe(8);
    });

    test('PolygonAngle=180：只生成 120 点（activePoints），尾部 8 池位不更新', () => {
        const { rt } = setup({ polygon: true });
        rt.param.PolygonAngle = 180;
        createPoint(...silent());
        expect(rt.param.activePoints).toBe(120);
        // 原始公式验证：前 120 点 deg = π/180 * k * 3 = k*π/60（整一圈）
        const arr1 = rt.param.arr1!;
        for (let k = 0; k < 120; k++) {
            const expectedDeg = (Math.PI / 180) * k * 3;
            const expectedX = Math.cos(expectedDeg) * ((0.45 * 800) / 2 + 1) + 500;
            const expectedY = Math.sin(expectedDeg) * ((0.45 * 800) / 2 + 1) + 400;
            expect(arr1[k]!.x).toBeCloseTo(expectedX, 6);
            expect(arr1[k]!.y).toBeCloseTo(expectedY, 6);
        }
    });

    test('默认布局 activePoints=128；切到多边形后恢复 120', () => {
        setup();
        createPoint(...silent());
        expect(useRuntimeStore().param.activePoints).toBe(128);

        const { rt } = setup({ polygon: true });
        rt.param.PolygonAngle = 4;
        createPoint(...silent());
        expect(rt.param.activePoints).toBe(120);
    });

    test('角度序列单调递增整一圈：无回绕跳变（修复错误连线）', () => {
        const { rt } = setup({ polygon: true });
        rt.param.PolygonAngle = 180; // step=3°
        createPoint(...silent());
        const arr1 = rt.param.arr1!;
        const CX = 500;
        const CY = 400;
        let prev = Math.atan2(arr1[0]!.y - CY, arr1[0]!.x - CX);
        for (let k = 1; k < 120; k++) {
            const cur = Math.atan2(arr1[k]!.y - CY, arr1[k]!.x - CX);
            let d = cur - prev;
            if (d < 0) d += 2 * Math.PI;
            // 每步恒 +3°，绝无负跳变/大跳变（回绕特征）
            expect(d).toBeCloseTo((3 * Math.PI) / 180, 6);
            prev = cur;
        }
    });

    test('槽值直接填充：左声道 bin60 → 槽60，右声道 bin10 → 槽74', () => {
        const { rt: rt2 } = setup({ polygon: true });
        rt2.param.PolygonAngle = 180;
        const [left, right] = silent();
        left[60] = 1;
        right[10] = 1;
        createPoint(left, right);
        const arr1 = rt2.param.arr1!;
        const CX = 500;
        const CY = 400;
        // 左声道 bin60 直接落在槽 60（无重采样）
        const leftPeakDist = Math.hypot(arr1[60]!.x - CX, arr1[60]!.y - CY);
        // 右声道 bin10 落在槽 64+10=74
        const rightPeakDist = Math.hypot(arr1[74]!.x - CX, arr1[74]!.y - CY);
        const quietDist = Math.hypot(arr1[10]!.x - CX, arr1[10]!.y - CY);
        expect(leftPeakDist - quietDist).toBeGreaterThan(100);
        expect(rightPeakDist - quietDist).toBeGreaterThan(100);
    });

    test('PolygonAngle=7（WE combo 5）：120 点内角度连续，无横穿弦线', () => {
        const { rt } = setup({ polygon: true });
        rt.param.PolygonAngle = 7; // 非整除值：旧复制补丁在此产生错误连线
        createPoint(...silent());
        const arr1 = rt.param.arr1!;
        const CX = 500;
        const CY = 400;
        // 相邻点角步长恒为 3π/7（mod 2π），绝无跳变
        let prev = Math.atan2(arr1[0]!.y - CY, arr1[0]!.x - CX);
        for (let k = 1; k < 120; k++) {
            const cur = Math.atan2(arr1[k]!.y - CY, arr1[k]!.x - CX);
            let d = cur - prev;
            if (d < 0) d += 2 * Math.PI;
            if (d >= 2 * Math.PI) d -= 2 * Math.PI;
            expect(d).toBeCloseTo((3 * Math.PI) / 7, 6);
            prev = cur;
        }
    });

    test('PolygonAngle=1：点落在 3 个离散角度（三角形轮廓）', () => {
        const { rt } = setup({ polygon: true });
        rt.param.PolygonAngle = 1;
        createPoint(...silent());
        const arr1 = rt.param.arr1!;
        const CX = 500;
        const CY = 400;
        const angles = new Set<number>();
        for (let i = 0; i < 120; i++) {
            angles.add(Math.round((Math.atan2(arr1[i]!.y - CY, arr1[i]!.x - CX) / (Math.PI / 180)) * 100) / 100);
        }
        expect(angles.size).toBe(3);
    });

    test('PolygonAngle=4：8 个离散角度（八边形轮廓）', () => {
        const { rt } = setup({ polygon: true });
        rt.param.PolygonAngle = 4;
        createPoint(...silent());
        const arr1 = rt.param.arr1!;
        const CX = 500;
        const CY = 400;
        const angles = new Set<number>();
        for (let i = 0; i < 120; i++) {
            const a = Math.atan2(arr1[i]!.y - CY, arr1[i]!.x - CX);
            // 量化到 1° 粒度；180 与 -180 是同一方向，归一到 [0,360)
            let d = Math.round(a / (Math.PI / 180));
            if (d < 0) d += 360;
            angles.add(d % 360);
        }
        expect(angles.size).toBe(8);
    });

    test('多边形模式与声道分隔布局产生可见差异（设置生效）', () => {
        setup();
        createPoint(...silent());
        // 注意：arr1 内是复用的池对象（每帧原地更新），必须深拷贝坐标
        const baseline = useRuntimeStore()
            .param.arr1!.map(p => ({ x: p!.x, y: p!.y }));

        const { rt: rt2 } = setup({ polygon: true });
        rt2.param.PolygonAngle = 4;
        createPoint(...silent());
        const poly = rt2.param.arr1!;

        let changed = 0;
        for (let i = 0; i < 120; i++) {
            if (
                Math.abs(poly[i]!.x - baseline[i]!.x) > 1 ||
                Math.abs(poly[i]!.y - baseline[i]!.y) > 1
            ) {
                changed++;
            }
        }
        expect(changed).toBeGreaterThan(96);
    });
});
