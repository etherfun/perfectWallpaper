// @vitest-environment jsdom
/**
 * 回归测试：全局亚克力关闭后组件不透明度错误为 1 的 bug
 *
 * Bug 链条（修复前）：
 *   1. WE 按字母序全量推送属性，useGlobalYakeliProperties 最后执行
 *   2. global_yakeli_enabled=false → applyGlobalGlassOverride(false)
 *      移除所有组件玻璃 CSS 变量 → replayFromStore() 用 store 值回写
 *   3. 但 weather_yakeli 在 store 中存 raw 0..100（如 50），
 *      回写 --weather-yakeli: 50 → rgba alpha ≥1 → 组件完全不透明
 *   4. sysmon/dockbar 无 store 键，replay 跳过 → 变量被移除或残留全局值
 *
 * 修复：
 *   - weather handler 存归一化 0..1；replay 对 yakeli 一律 /100
 *   - glass.tokens 增加 componentTokenCache：全局覆盖期间组件写入仅更新
 *     快照不落盘；关闭时用快照恢复（sysmon/dockbar 依赖此路径）
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

vi.mock('@/utils/elementManager', () => ({
    elements: {
        body: document.body,
        weather: {
            weather: document.createElement('div'),
            precipContainer: document.createElement('div'),
        },
    },
}));

import { useConfigStore } from '@/stores/config';
import { useWeatherStore } from '@/modules/weather';
import { useWeatherProperties } from '@/modules/weather/useWeatherProperties';
import { useGlobalYakeliProperties } from '@/modules/core/useGlobalYakeliProperties';
import { applyGlass, isGlobalGlassOverridden } from '@/tokens/glass.tokens';

let config: ReturnType<typeof useConfigStore>;

beforeEach(() => {
    setActivePinia(createPinia());
    if (typeof globalThis.ResizeObserver === 'undefined') {
        globalThis.ResizeObserver = class {
            observe() {}
            unobserve() {}
            disconnect() {}
        } as unknown as typeof ResizeObserver;
    }
    config = useConfigStore();
    const weather = useWeatherStore();
    vi.spyOn(weather, 'init').mockResolvedValue();
});

describe('回归：全局亚克力关闭后不透明度恢复', () => {
    test('核心场景：开启→关闭全局覆盖后，weather 不透明度回到用户值而非 1', () => {
        // 1) 用户设置天气亚克力不透明度 50%（WE 推送 raw 50）
        useWeatherProperties({ weather_yakeli: { value: 50 } } as never, false);
        expect(document.body.style.getPropertyValue('--weather-yakeli')).toBe('0.5');

        // 2) 开启全局覆盖（全局值 30%）
        useGlobalYakeliProperties(
            { global_yakeli_enabled: { value: true }, global_yakeli: { value: 30 } } as never,
            false
        );
        expect(isGlobalGlassOverridden()).toBe(true);
        expect(document.body.style.getPropertyValue('--weather-yakeli')).toBe('0.3');

        // 3) 关闭全局覆盖 —— bug 场景：此前回写 raw 50 导致 alpha≥1
        useGlobalYakeliProperties({ global_yakeli_enabled: { value: false } } as never, false);
        expect(isGlobalGlassOverridden()).toBe(false);
        expect(document.body.style.getPropertyValue('--weather-yakeli')).toBe('0.5');
    });

    test('无 store 键的组件（sysmon/dockbar）关闭后从缓存恢复', () => {
        // sysmon 用户值经 applyGlass 写入（handler 不落 store）
        applyGlass('sysmon', { yakeliEnabled: true, yakeli: 0.4 });
        expect(document.body.style.getPropertyValue('--sysmon-yakeli')).toBe('0.4');

        // 开启全局覆盖 → 被拦截为全局值
        useGlobalYakeliProperties(
            { global_yakeli_enabled: { value: true }, global_yakeli: { value: 20 } } as never,
            false
        );
        expect(document.body.style.getPropertyValue('--sysmon-yakeli')).toBe('0.2');

        // 全局覆盖期间组件新写入只进缓存、不动 CSS
        applyGlass('sysmon', { yakeli: 0.7 });
        expect(document.body.style.getPropertyValue('--sysmon-yakeli')).toBe('0.2');

        // 关闭 → 从缓存恢复 0.7（而非残留全局 0.2 或被移除）
        useGlobalYakeliProperties({ global_yakeli_enabled: { value: false } } as never, false);
        expect(document.body.style.getPropertyValue('--sysmon-yakeli')).toBe('0.7');
    });

    test('从未写入过的组件关闭后清除变量回退 SCSS 默认值', () => {
        useGlobalYakeliProperties(
            { global_yakeli_enabled: { value: true }, global_yakeli: { value: 40 } } as never,
            false
        );
        expect(document.body.style.getPropertyValue('--countdown-yakeli')).toBe('0.4');

        useGlobalYakeliProperties({ global_yakeli_enabled: { value: false } } as never, false);
        // countdown 未推送过任何玻璃属性 → 无缓存 → 清除变量
        expect(document.body.style.getPropertyValue('--countdown-yakeli')).toBe('');
    });

    test('clock（store 有键）关闭后 replay 归一化回写', () => {
        // clock handler 经 applyGlass 写入并 patch store（0..1）
        applyGlass('clock', { yakeliEnabled: true, yakeli: 0.6 });
        config.$patch({ oclock_yakeli: 0.6 });

        useGlobalYakeliProperties(
            { global_yakeli_enabled: { value: true }, global_yakeli: { value: 10 } } as never,
            false
        );
        expect(document.body.style.getPropertyValue('--clock-yakeli')).toBe('0.1');

        useGlobalYakeliProperties({ global_yakeli_enabled: { value: false } } as never, false);
        expect(document.body.style.getPropertyValue('--clock-yakeli')).toBe('0.6');
    });

    test('历史脏数据兼容：store 残留 raw 值时 replay /100 兜底', () => {
        // 模拟旧版本已把 raw 50 写入 store（localStorage 迁移场景）
        config.$patch({ weather_yakeli: 50 });

        useGlobalYakeliProperties(
            { global_yakeli_enabled: { value: true }, global_yakeli: { value: 30 } } as never,
            false
        );
        useGlobalYakeliProperties({ global_yakeli_enabled: { value: false } } as never, false);

        // replay pct() 把 50 → 0.5，不会出现 alpha=50
        expect(document.body.style.getPropertyValue('--weather-yakeli')).toBe('0.5');
    });
});
