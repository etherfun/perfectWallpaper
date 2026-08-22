// @vitest-environment jsdom
/**
 * Regression tests — 全局亚克力关闭后组件不透明度错误为 1
 *
 * Bug 链条（修复前）：
 *   1. WE 全量推送时 useGlobalYakeliProperties 最后执行
 *   2. global_yakeli_enabled=false → applyGlobalGlassOverride(false) 移除所有组件玻璃变量
 *   3. replayFromStore() 回写 --weather-yakeli 用了 raw 值（50 而非 0.5）
 *      → rgba(var(--yakeli-color), calc(50 * enabled)) alpha ≥ 1 → 完全不透明
 *   4. sysmon/dockbar 无 store 键，replay 不回写 → 残留全局覆盖值（不透明度=1）
 *
 * 修复：
 *   - weather handler 存归一化值（0..1）
 *   - glass.tokens 增加 componentTokenCache，关闭覆盖时按缓存恢复各组件原值
 *   - replay 的 yakeli 一律 /100 归一化
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
vi.mock('@/utils/tool', () => ({
    debounce: vi.fn(),
    fetch_with_retry: vi.fn(() => Promise.resolve({ text: () => Promise.resolve('') } as unknown as Response)),
    migrateUsageDataOnce: vi.fn(),
    weather_paymode: vi.fn(() => false),
}));

import { useConfigStore } from '@/stores/config';
import {
    applyGlobalGlassOverride,
    isGlobalGlassOverridden,
} from '@/tokens/glass.tokens';
import { applyGlass } from '@/tokens/glass.tokens';
import { useGlobalYakeliProperties } from '@/modules/core/useGlobalYakeliProperties';
import { useWeatherProperties } from '@/modules/weather/useWeatherProperties';
import { useSystemMonitorProperties } from '@/modules/systemMonitor/useSystemMonitorProperties';
import type { WallpaperProperties } from '@/types/types';

let store: ReturnType<typeof useConfigStore>;

beforeEach(() => {
    setActivePinia(createPinia());
    if (typeof globalThis.ResizeObserver === 'undefined') {
        globalThis.ResizeObserver = class {
            observe() {}
            unobserve() {}
            disconnect() {}
        } as unknown as typeof ResizeObserver;
    }
    document.body.removeAttribute('style');
    store = useConfigStore();
});

/** 模拟 WE 全量推送顺序：组件属性在前、global_* 在最后 */
function pushAllProps(): void {
    // 组件属性（字母序在 global_* 之前）
    useWeatherProperties(
        {
            weather_show: { value: true },
            weather_yakeli_show: { value: true },
            weather_yakeli: { value: 30 },
            weather_bluryakeli: { value: 8 },
            weather_roundedcorners: { value: 40 },
        } as never as WallpaperProperties,
        true
    );
    useSystemMonitorProperties(
        {
            sysmon_enabled: { value: true },
            sysmon_yakeli_show: { value: true },
            sysmon_yakeli: { value: 25 },
            sysmon_bluryakeli: { value: 12 },
            sysmon_roundedcorners: { value: 30 },
        } as never as WallpaperProperties,
        true
    );
    // 全局覆盖（最后推送）→ 关闭状态
    useGlobalYakeliProperties(
        {
            global_yakeli_enabled: { value: false },
            global_yakelicolor: { value: '0 0 0' },
            global_yakeli: { value: 30 },
            global_bluryakeli: { value: 10 },
            global_yakeli_roundedcorners: { value: 12 },
        } as never as WallpaperProperties,
        true
    );
}

describe('regression — 全局亚克力关闭后不透明度恢复原值', () => {
    test('weather：关闭覆盖后 --weather-yakeli = 0.3（非 raw 30）', () => {
        pushAllProps();
        expect(isGlobalGlassOverridden()).toBe(false);
        const v = document.body.style.getPropertyValue('--weather-yakeli');
        expect(v).toBe('0.3');
        // alpha 计算合法：rgba(...,calc(0.3*1)) < 1
        expect(parseFloat(v)).toBeLessThan(1);
    });

    test('sysmon：无 store 键，由 componentTokenCache 恢复 0.25', () => {
        pushAllProps();
        expect(document.body.style.getPropertyValue('--sysmon-yakeli')).toBe('0.25');
        expect(document.body.style.getPropertyValue('--sysmon-yakeli-enabled')).toBe('1');
        expect(document.body.style.getPropertyValue('--sysmon-blur-yakeli')).toBe('12px');
        expect(document.body.style.getPropertyValue('--sysmon-roundedcorners')).toBe('30');
    });

    test('开启→关闭切换：组件原值完整恢复', () => {
        // 先以组件自身值初始化
        pushAllProps();
        // 开启全局覆盖
        useGlobalYakeliProperties(
            {
                global_yakeli_enabled: { value: true },
                global_yakelicolor: { value: '0 0 0' },
                global_yakeli: { value: 80 },
                global_bluryakeli: { value: 20 },
                global_yakeli_roundedcorners: { value: 50 },
            } as never as WallpaperProperties,
            false
        );
        expect(isGlobalGlassOverridden()).toBe(true);
        // 所有组件被全局值接管
        expect(document.body.style.getPropertyValue('--weather-yakeli')).toBe('0.8');
        expect(document.body.style.getPropertyValue('--sysmon-yakeli')).toBe('0.8');

        // 关闭全局覆盖
        useGlobalYakeliProperties(
            { global_yakeli_enabled: { value: false } } as never as WallpaperProperties,
            false
        );
        expect(isGlobalGlassOverridden()).toBe(false);
        // 各组件恢复自身原值（而非残留全局 0.8 或 raw 值）
        expect(document.body.style.getPropertyValue('--weather-yakeli')).toBe('0.3');
        expect(document.body.style.getPropertyValue('--sysmon-yakeli')).toBe('0.25');
        expect(document.body.style.getPropertyValue('--sysmon-blur-yakeli')).toBe('12px');
    });

    test('applyGlass 缓存：全局启用期间的组件写入被拦截但记录快照', () => {
        applyGlobalGlassOverride(true, { yakeliEnabled: true, yakeli: 0.9 });
        // 全局生效期间组件写入被拦截
        applyGlass('clock', { yakeli: 0.2 });
        expect(document.body.style.getPropertyValue('--clock-yakeli')).toBe('0.9');
        // 关闭后从快照恢复
        applyGlobalGlassOverride(false, {});
        expect(document.body.style.getPropertyValue('--clock-yakeli')).toBe('0.2');
    });

    test('从未写入过的组件：关闭覆盖后清除变量回退 SCSS 默认值', () => {
        applyGlobalGlassOverride(true, { yakeliEnabled: true, yakeli: 0.9 });
        // hitokoto 从未写入
        applyGlobalGlassOverride(false, {});
        expect(
            document.body.style.getPropertyValue('--hitokoto-yakeli')
        ).toBe('');
    });
});
