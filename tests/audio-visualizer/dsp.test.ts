// @vitest-environment jsdom
/**
 * Tests for audio visualizer DSP fixes:
 *   - blendSeam: 首尾接缝融合（圆环闭合点高低差消除）
 *   - PWLineCreatePoint: 全数组采样（旧逻辑只取中间子集，丢弃首尾样本）
 *
 * 注意：audioVisualizer / PWLine 模块在 import 时会调用 useRuntimeStore()，
 * 必须先 setActivePinia 再动态 import，否则抛 "no active Pinia"。
 */
import { createPinia, setActivePinia } from 'pinia';
import { beforeEach, describe, expect, test, vi } from 'vitest';

const { mockTimerCreate, mockTimerRemove } = vi.hoisted(() => ({
    mockTimerCreate: vi.fn(),
    mockTimerRemove: vi.fn(),
}));

vi.mock('@/utils/timer', () => ({
    timerManager: { create: mockTimerCreate, remove: mockTimerRemove },
}));

import { useRuntimeStore } from '@/stores/runtime';

let blendSeam: (data: number[]) => number[];
let PWLineCreatePoint: (arr: number[]) => void;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let lineState: any;

beforeEach(async () => {
    setActivePinia(createPinia());
    // 动态导入：确保模块级 store 调用发生在 Pinia 激活之后
    ({ blendSeam } = await import('@/modules/audio-visualizer/audioVisualizer'));
    ({ PWLineCreatePoint } = await import('@/modules/audio-visualizer/line/PWLine/points'));
    lineState = await import('@/modules/audio-visualizer/line/PWLine/state').then(m => m.state);
});

describe('blendSeam — 首尾接缝融合', () => {
    test('端点精确等于公共均值（闭合点两侧高度一致）', () => {
        // 典型频谱：低频大、高频小
        const data = Array.from({ length: 128 }, (_, i) => Math.max(0, 1 - i / 128));
        const head = data[0]!;
        const tail = data[127]!;
        blendSeam(data);
        expect(data[0]).toBeCloseTo(data[127]!, 10);
        // 端点值介于原两端之间（向均值收敛）
        const seamAvg = (head + tail) / 2;
        expect(data[0]).toBeCloseTo(seamAvg, 10);
    });

    test('渐变区单调过渡，中段不受影响', () => {
        const data = new Array(128).fill(0.5);
        data[0] = 1;
        data[127] = 0;
        const midBefore = data.slice(16, 112);
        blendSeam(data);
        // 中段（渐变区之外）保持不变
        expect(data.slice(16, 112)).toEqual(midBefore);
        // 头部从 seamAvg 单调上升到原值方向
        expect(data[0]).toBeLessThanOrEqual(data[1]!);
        expect(data[1]!).toBeLessThanOrEqual(data[8]!);
        // 尾部从 seamAvg 单调下降回原值方向
        expect(data[127]).toBeGreaterThanOrEqual(data[126]!);
    });

    test('平滑关闭场景下依然生效（blendSeam 独立于平滑开关）', () => {
        // blendSeam 是纯函数，这里验证它不依赖任何 config 状态：
        // 同输入同输出
        const a = [0.9, ...new Array(126).fill(0.5), 0.05];
        const b = [0.9, ...new Array(126).fill(0.5), 0.05];
        blendSeam(a);
        blendSeam(b);
        expect(a).toEqual(b);
    });

    test('数组过短（<8）时原样返回', () => {
        const data = [1, 0];
        expect(blendSeam(data)).toBe(data);
        expect(data).toEqual([1, 0]);
    });

    test('首尾本就相等的对称数据：闭合保持、渐变区外不受影响', () => {
        // 构造关于中心镜像对称的数据：head === tail
        const half = Array.from({ length: 64 }, (_, i) => 0.8 - i / 100);
        const data = [...half, ...[...half].reverse()];
        expect(data.length).toBe(128);
        const snapshot = [...data];
        blendSeam(data);
        // 核心保证：闭合点两侧高度一致
        expect(data[0]).toBeCloseTo(data[127]!, 10);
        // 渐变区（fade=8）之外的中段完全不变
        expect(data.slice(8, 120)).toEqual(snapshot.slice(8, 120));
        // 对称数据两端均值相同 → 端点仅向窗口均值小幅收敛（<0.05）
        expect(Math.abs(data[0]! - snapshot[0]!)).toBeLessThan(0.05);
    });
});

describe('PWLineCreatePoint — 全数组采样', () => {
    /** 默认 LineY=0.5、minW=500 → 基线 y = 250；方向 1 基线偏移 -1 → 249 */
    const BASELINE = 249;

    function setupLine(density: number): ReturnType<typeof useRuntimeStore> {
        const rt = useRuntimeStore();
        rt.PWLineParam.LineDensity = density;
        rt.PWLineParam.range = 5;
        rt.PWLineParam.Direction = 1;
        rt.PWLineParam.sw = 0.8;
        rt.PWLineParam.waveArr = new Array(120).fill(0);
        lineState.CTXLine = { lineWidth: 0 } as unknown as CanvasRenderingContext2D;
        lineState.maxW = 1000;
        lineState.minW = 500;
        lineState.lineR = 0;
        return rt;
    }

    test('密度 120 时使用全部 128 个样本（含旧逻辑丢弃的 120..127）', () => {
        const rt = setupLine(120);
        // 仅最后一个 bin（index 127）有值：旧逻辑完全读不到
        const arr = new Array(128).fill(0);
        arr[127] = 1;

        PWLineCreatePoint(arr);

        // 最后一根柱（覆盖 bin 126..127）应有非零高度
        const last = rt.PWLineParam.arr1![119]!;
        expect(last.y).toBeLessThan(BASELINE);
        // 中段柱保持基线
        const mid = rt.PWLineParam.arr1![60]!;
        expect(mid.y).toBe(BASELINE);
    });

    test('仅 index 0 有值时第一根柱响应', () => {
        const rt = setupLine(120);
        const arr = new Array(128).fill(0);
        arr[0] = 1;

        PWLineCreatePoint(arr);

        const first = rt.PWLineParam.arr1![0]!;
        expect(first.y).toBeLessThan(BASELINE);
    });

    test('低密度（30 根柱）仍覆盖整个数组两端', () => {
        const rt = setupLine(30);
        // 旧逻辑 iv=(120-30)/2=15，只读 arr[15..44]，首尾完全被跳过
        const arr = new Array(128).fill(0);
        arr[0] = 1; // 头部样本 → 柱 0（覆盖 bin 0..3）
        arr[127] = 1; // 尾部样本 → 柱 29（覆盖 bin 122..127）

        PWLineCreatePoint(arr);

        const heights = rt.PWLineParam.arr1!.map(p => p!.y);
        const nonBaseline = heights.filter(y => y < BASELINE);
        // 首尾各至少一根柱有高度
        expect(nonBaseline.length).toBeGreaterThanOrEqual(2);
        expect(heights[0]).toBeLessThan(BASELINE);
        expect(heights[29]).toBeLessThan(BASELINE);
    });

    test('下采样保留峰值：窄峰不被平均抹平', () => {
        const rt = setupLine(32);
        const arr = new Array(128).fill(0.1);
        arr[64] = 1; // 单 bin 窄峰

        PWLineCreatePoint(arr);

        // 峰值所在柱应显著高于周围 0.1 的柱
        const peakBar = Math.floor((64 * 32) / 128); // bar 16
        const peakY = rt.PWLineParam.arr1![peakBar]!.y;
        const neighborY = rt.PWLineParam.arr1![peakBar + 4]!.y;
        expect(BASELINE - peakY).toBeGreaterThan((BASELINE - neighborY) * 2);
    });

    test('waveArr 按 bar 下标衰减（峰值回落）', () => {
        const rt = setupLine(120);
        const arr = new Array(128).fill(0);
        arr[0] = 1;

        PWLineCreatePoint(arr);
        expect(rt.PWLineParam.waveArr![0]).toBeGreaterThan(0);

        // 下一帧静音：峰值保持衰减而非立即归零
        PWLineCreatePoint(new Array(128).fill(0));
        expect(rt.PWLineParam.waveArr![0]).toBeGreaterThan(0);
    });
});
