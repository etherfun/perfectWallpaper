// @vitest-environment jsdom
/**
 * Tests for global acrylic override (全局亚克力覆盖) — glass.tokens
 *
 * 回归场景：全局亚克力关闭时，各组件不透明度必须恢复自身值而非 1。
 * 根因（已修复）：
 *   1. weather_yakeli 存 raw 值(0..100)，replay 回写后 rgba alpha≥1 → 完全不透明
 *   2. sysmon/dockbar 无 store 键，关闭覆盖时变量被清除且无法恢复，
 *      残留全局值或回退错误默认值
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

let applyGlass: typeof import('@/tokens/glass.tokens').applyGlass;
let applyGlobalGlassOverride: typeof import('@/tokens/glass.tokens').applyGlobalGlassOverride;
let registerGlassReplay: typeof import('@/tokens/glass.tokens').registerGlassReplay;
let isGlobalGlassOverridden: typeof import('@/tokens/glass.tokens').isGlobalGlassOverridden;

beforeEach(async () => {
    setActivePinia(createPinia());
    const mod = await import('@/tokens/glass.tokens');
    applyGlass = mod.applyGlass;
    applyGlobalGlassOverride = mod.applyGlobalGlassOverride;
    registerGlassReplay = mod.registerGlassReplay;
    isGlobalGlassOverridden = mod.isGlobalGlassOverridden;
    document.body.removeAttribute('style');
});

describe('glass.tokens — 全局覆盖开关', () => {
    test('启用覆盖：组件写入被拦截，CSS 变量保持全局值', () => {
        applyGlobalGlassOverride(true, { yakeliEnabled: true, yakeli: 0.3 });
        // 组件随后写入自己的值 → 被拦截，CSS 保持全局 0.3
        applyGlass('weather', { yakeli: 0.04 });
        expect(document.body.style.getPropertyValue('--weather-yakeli')).toBe('0.3');
        expect(isGlobalGlassOverridden()).toBe(true);
    });

    test('关闭覆盖：组件恢复自身原值（非 1）', () => {
        // 覆盖前组件写入自身值
        applyGlass('weather', { yakeliEnabled: true, yakeli: 0.04 });
        applyGlass('clock', { yakeliEnabled: true, yakeli: 0.5 });
        // 启用再关闭全局覆盖
        applyGlobalGlassOverride(true, { yakeliEnabled: true, yakeli: 0.3 });
        applyGlobalGlassOverride(false, {});
        // 恢复为组件自身值，而不是被清除或变成 1
        expect(document.body.style.getPropertyValue('--weather-yakeli')).toBe('0.04');
        expect(document.body.style.getPropertyValue('--clock-yakeli')).toBe('0.5');
        expect(document.body.style.getPropertyValue('--weather-yakeli-enabled')).toBe('1');
        expect(isGlobalGlassOverridden()).toBe(false);
    });

    test('sysmon/dockbar（无 store 键）关闭覆盖后同样恢复原值', () => {
        applyGlass('sysmon', { yakeliEnabled: true, yakeli: 0.03 });
        applyGlass('dockbar', { yakeliEnabled: true, yakeli: 0.5 });
        applyGlobalGlassOverride(true, { yakeliEnabled: true, yakeli: 0.3 });
        // 覆盖期间 CSS 是全局值
        expect(document.body.style.getPropertyValue('--sysmon-yakeli')).toBe('0.3');
        applyGlobalGlassOverride(false, {});
        // 恢复自身值
        expect(document.body.style.getPropertyValue('--sysmon-yakeli')).toBe('0.03');
        expect(document.body.style.getPropertyValue('--dockbar-yakeli')).toBe('0.5');
    });

    test('覆盖期间多次部分写入合并快照，关闭后完整恢复', () => {
        applyGlass('player', { yakeliEnabled: true, yakeliColor: [10, 20, 30] });
        applyGlass('player', { yakeli: 0.4 });
        applyGlass('player', { blurYakeli: '3px' });
        applyGlobalGlassOverride(true, { yakeliEnabled: true, yakeli: 0.9 });
        applyGlobalGlassOverride(false, {});
        expect(document.body.style.getPropertyValue('--player-yakeli-enabled')).toBe('1');
        expect(document.body.style.getPropertyValue('--player-yakeli-color')).toBe('10,20,30');
        expect(document.body.style.getPropertyValue('--player-yakeli')).toBe('0.4');
        expect(document.body.style.getPropertyValue('--player-blur-yakeli')).toBe('3px');
    });

    test('从未写入过的组件关闭覆盖后清除变量（回退 SCSS 默认）', () => {
        applyGlass('hitokoto', { yakeli: 0.2 }); // 只有 hitokoto 有缓存
        applyGlobalGlassOverride(true, { yakeliEnabled: true, yakeli: 0.3 });
        applyGlobalGlassOverride(false, {});
        expect(document.body.style.getPropertyValue('--hitokoto-yakeli')).toBe('0.2');
        // countdown 从未写入 → 变量被清除
        expect(document.body.style.getPropertyValue('--countdown-yakeli')).toBe('');
    });

    test('replayFromStore 在关闭时被调用（store 键兜底）', () => {
        const replay = vi.fn();
        registerGlassReplay(replay);
        applyGlobalGlassOverride(true, { yakeliEnabled: true, yakeli: 0.3 });
        expect(replay).not.toHaveBeenCalled();
        applyGlobalGlassOverride(false, {});
        expect(replay).toHaveBeenCalledTimes(1);
    });

    test('启用覆盖时 blurColor/blurEnabled/height 缺失字段被显式清除', () => {
        applyGlass('date', { blurColor: [1, 2, 3], blurEnabled: true, height: '100px' });
        applyGlobalGlassOverride(true, { yakeliEnabled: true, yakeli: 0.3 });
        expect(document.body.style.getPropertyValue('--date-blur-color')).toBe('');
        expect(document.body.style.getPropertyValue('--date-blur-enabled')).toBe('');
        expect(document.body.style.getPropertyValue('--date-height')).toBe('');
    });
});
