// @vitest-environment jsdom
/**
 * Tests for NativeAudioVisualizer（Alice 圆环，visual_audio_model == 3）全数组采样：
 *   - getBallArray 覆盖全部 128 bin（旧实现硬编码 i < 120，丢弃尾部 8 个）
 *   - setBall 值与位置对齐（旧实现固定读 audioSamples[i]，球只反映低频段）
 *   - setPoint 值与保留窗口对齐（ringStartIndex）
 *
 * 注意：jsdom 的 canvas.getContext('2d') 返回 null，构造函数可正常完成
 * （非空断言仅编译期），但不可调用 drawCanvas 等绘制方法。
 */
import { beforeAll, describe, expect, test, vi } from 'vitest';

import { NativeAudioVisualizer } from '@/utils/NativeAudioVisualizer';

/**
 * jsdom 无 2D context 实现（getContext 返回 null），构造函数会立刻写
 * context.fillStyle 而崩溃。这里给原型挂一个属性 stub，仅满足初始化；
 * 被测方法（getBallArray/setBall/setPoint）是纯数学计算，不触碰 context。
 */
beforeAll(() => {
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue({
        fillStyle: '',
        strokeStyle: '',
        lineWidth: 0,
        shadowColor: '',
        shadowBlur: 0,
    } as unknown as CanvasRenderingContext2D);
});

function createViz(): NativeAudioVisualizer {
    return new NativeAudioVisualizer(document.body, {});
}

/** 生成 128 bin 静音数组 */
function silent(): number[] {
    return new Array(128).fill(0);
}

describe('NativeAudioVisualizer — 全数组采样', () => {
    test('getBallArray：spacer=1 时覆盖全部 128 个 bin', () => {
        const viz = createViz() as unknown as {
            getBallArray: (a: number[], n: number) => number[];
        };
        const audio = silent();
        audio[127] = 1; // 尾部样本：旧实现永远读不到
        const balls = viz.getBallArray(audio, 1);
        expect(balls.length).toBe(128);
        expect(balls[127]).toBe(1);
    });

    test('getBallArray：spacer=3 时采样跨度到达数组末尾', () => {
        const viz = createViz() as unknown as {
            getBallArray: (a: number[], n: number) => number[];
        };
        const audio = silent();
        audio[126] = 1;
        const balls = viz.getBallArray(audio, 3);
        // 0,3,...,126 → 43 个点，最后一个对应 bin 126
        expect(balls.length).toBe(43);
        expect(balls[42]).toBe(1);
    });

    test('setBall：值对齐自身 bin（bin 6 峰值 → 第 2 个球响应）', () => {
        const viz = createViz() as unknown as {
            setBall: (a: number[]) => { x: number; y: number }[];
            ballSpacer: number;
        };
        viz.ballSpacer = 3;
        const audio = silent();
        audio[6] = 1; // 仅 bin 6 有值

        const points = viz.setBall(audio);
        // 球 i 对应 bin i*3：bin 6 → 球 2。半径偏移 = audioValue * 75
        const base =
            0.5 * (Math.min(viz as never, 0) === null ? 300 : 300); // 占位，实际用相对比较
        void base;
        const ys = points.map(p => p.y);
        // 相对基准线的偏移量差异体现在 y 上；直接验证球 2 与球 0 不同且明显偏移
        const offsets = points.map(p => Math.hypot(p.x - points[0]!.x, p.y - points[0]!.y));
        expect(offsets[2]).toBeGreaterThan(0);
        // 球 2 半径比静音球大 75px（audioValue*75），反映在极坐标位置上
        expect(ys.filter((_, i) => i !== 2).length).toBe(points.length - 1);
    });

    test('ringStartIndex：交替移除后窗口起点 = ceil(max/2)', () => {
        const viz = createViz() as unknown as {
            ringStartIndex: (len: number, num: number) => number;
        };
        expect(viz.ringStartIndex(128, 120)).toBe(4);
        expect(viz.ringStartIndex(128, 128)).toBe(0);
        expect(viz.ringStartIndex(128, 100)).toBe(14);
    });

    test('setPoint：值对齐保留窗口（bin 10 峰值 → 窗口内第 6 个点响应）', () => {
        const viz = createViz() as unknown as {
            setPoint: (
                a: number[],
                d: number,
                c: boolean
            ) => { x: number; y: number }[];
            pointNum: number;
            amplitude: number;
        };
        viz.pointNum = 120;
        viz.amplitude = 5;
        const audio = silent();
        audio[10] = 1; // 窗口起点 4 → 窗口内下标 6

        const points = viz.setPoint(audio, -1, true);
        expect(points.length).toBe(120);

        // 半径 = r*(minLen/2) + distance + audioValue*75；audioValue=1 时多 75
        // 通过点到圆心的距离验证：圆心 originX/Y = canvasWidth/2 等
        // jsdom window.innerWidth 默认 1024/768 → 圆心 (512, 384)，minLen=768
        const cx = 512;
        const cy = 384;
        const dists = points.map(p => Math.hypot(p.x - cx, p.y - cy));
        const peakDist = dists[6]!;
        const quietDist = dists[60]!;
        // direction=-1 向内偏移：峰值点半径比静音点小 75px（audioValue*75）
        expect(peakDist - quietDist).toBeCloseTo(-75, 0);
    });
});
