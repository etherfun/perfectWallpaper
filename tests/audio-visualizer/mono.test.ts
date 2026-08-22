/**
 * Tests for audio-visualizer/mono.ts — 双声道拼接助手
 *
 * 验证拼接语义（还原 WE 原始 128 bin 布局）：
 *   - 左声道在前、右声道在后，长度 = 两者之和
 *   - 复用同一缓冲区（零每帧分配）
 *   - 稀疏/缺失 bin 容错（?? 0）
 */
import { describe, expect, test } from 'vitest';

import { toMono } from '@/modules/audio-visualizer/mono';

describe('toMono — 双声道拼接', () => {
    test('左前右后，长度 = 64 + 64 = 128', () => {
        const left = new Array(64).fill(0);
        const right = new Array(64).fill(0);
        left[10] = 0.5;
        right[20] = 0.8;

        const mono = toMono(left, right);

        expect(mono.length).toBe(128);
        expect(mono[10]).toBe(0.5); // 左声道 bin10 → mono[10]
        expect(mono[64 + 20]).toBe(0.8); // 右声道 bin20 → mono[84]
        expect(mono[63]).toBe(0);
        expect(mono[64]).toBe(0);
    });

    test('复用同一缓冲区：两次调用返回同一引用且内容刷新', () => {
        const a = toMono([1, 2], [3]);
        const b = toMono([9], [8, 7]);

        expect(b).toBe(a); // 同一缓冲区
        expect(a.length).toBe(3);
        expect([...a]).toEqual([9, 8, 7]);
    });

    test('稀疏数组容错：缺失 bin 读作 0', () => {
        const sparse: number[] = [];
        sparse[1] = 0.4;
        const mono = toMono(sparse, [0.6]);

        expect(mono.length).toBe(3);
        expect(mono[0]).toBe(0);
        expect(mono[1]).toBe(0.4);
        expect(mono[2]).toBe(0.6);
    });
});
