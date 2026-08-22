// @vitest-environment jsdom
/**
 * Tests for src/modules/weather/useWeatherProperties.ts
 *
 * Verifies the weather property handler covers all dispatch paths and
 * propagates to Pinia (config store + weather store) + body CSS vars.
 *
 * 注意：useWeatherProperties 现在通过 useWeatherStore 的 action 驱动天气子模块
 * （setVisible / setApiChoice / setLocationField / setDailyTip / setUnitName），
 * 这些 action 在 non-firstLoad 时会触发 init()（含网络请求）。测试中对 store.init
 * 打桩以避免真实网络调用，仅验证分发是否正确。
 */
import { createPinia, setActivePinia } from 'pinia';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

import { useConfigStore } from '@/stores/config';
import { useWeatherStore } from '@/modules/weather';
import { debugLogger } from '@/utils/logger';

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

import { useWeatherProperties } from '@/modules/weather/useWeatherProperties';

let weather: ReturnType<typeof useWeatherStore>;

beforeEach(() => {
    setActivePinia(createPinia());
    debugLogger.clearLogs();
    document.body.removeAttribute('style');
    if (typeof globalThis.ResizeObserver === 'undefined') {
        globalThis.ResizeObserver = class {
            observe() {}
            unobserve() {}
            disconnect() {}
        } as unknown as typeof ResizeObserver;
    }
    mockTimerCreate.mockClear();
    mockTimerRemove.mockClear();

    // 获取天气 store 实例并对 init 打桩，避免真实网络请求
    weather = useWeatherStore();
    vi.spyOn(weather, 'init').mockResolvedValue();
    vi.spyOn(weather, 'setUnitName');
});

afterEach(() => {
    vi.restoreAllMocks();
});

describe('useWeatherProperties', () => {
    test('weather_show true → visible + startAutoRefresh', () => {
        useWeatherProperties({ weather_show: { value: true } } as never, false);
        expect(weather.ui.visible).toBe(true);
        expect(mockTimerCreate).toHaveBeenCalledWith(
            expect.any(Function),
            expect.any(Number),
            'updataWeather'
        );
    });

    test('weather_show false → hidden + no autoRefresh', () => {
        useWeatherProperties({ weather_show: { value: false } } as never, false);
        expect(weather.ui.visible).toBe(false);
        expect(mockTimerCreate).not.toHaveBeenCalled();
    });

    test('weather_unit → config.weather_unit + setUnitName', () => {
        const store = useConfigStore();
        useWeatherProperties({ weather_unit: { value: 'metric' } } as never, false);
        expect(store.weather_unit).toBe('metric');
        expect(weather.setUnitName).toHaveBeenCalledWith('metric');
    });

    test('weather_Color → rgb() string CSS + store color array', () => {
        const store = useConfigStore();
        useWeatherProperties({ weather_Color: { value: '1 0 0' } } as never, false);
        expect(document.body.style.getPropertyValue('--weather-color')).toBe('rgb(255,0,0)');
        expect(store.weather_color).toEqual([255, 0, 0]);
    });

    test('weather_blurcolor → CSS + store', () => {
        const store = useConfigStore();
        useWeatherProperties({ weather_blurcolor: { value: '0.5 0.5 0.5' } } as never, false);
        expect(document.body.style.getPropertyValue('--weather-blur-color')).toBe('128,128,128');
        expect(store.weather_blurcolor).toEqual([128, 128, 128]);
    });

    test('weather_yakeli_show true → --weather-yakeli-enabled = 1 + store patch', () => {
        const store = useConfigStore();
        useWeatherProperties({ weather_yakeli_show: { value: true } } as never, false);
        expect(document.body.style.getPropertyValue('--weather-yakeli-enabled')).toBe('1');
        expect(store.weather_yakeli_show).toBe(true);
    });

    test('weather_yakeli /100 → CSS + store（归一化 0..1）', () => {
        const store = useConfigStore();
        useWeatherProperties({ weather_yakeli: { value: 50 } } as never, false);
        expect(document.body.style.getPropertyValue('--weather-yakeli')).toBe('0.5');
        // store 也存归一化值：全局覆盖关闭后 replay 回写 0.5 而非 raw 50
        // （raw 值会使 rgba alpha ≥1 → 组件完全不透明，见 glass.tokens bug）
        expect(store.weather_yakeli).toBe(0.5);
    });

    test('position patches set CSS variables with %', () => {
        const store = useConfigStore();
        useWeatherProperties({ weatherX: { value: 25 }, weatherY: { value: 75 } } as never, false);
        expect(store.weather_x).toBe(25);
        expect(store.weather_y).toBe(75);
        expect(document.body.style.getPropertyValue('--weather-left')).toBe('25%');
        expect(document.body.style.getPropertyValue('--weather-top')).toBe('75%');
    });

    test('weather_lat_latitude patches weather store address + config', () => {
        const store = useConfigStore();
        useWeatherProperties(
            { weather_lat_latitude: { value: 39.9 }, weather_lat_longitude: { value: 116.4 } } as never,
            false
        );
        expect(weather.address.latitude).toBe('39.9');
        expect(weather.address.longitude).toBe('116.4');
        expect(store.weather_latitude).toBe('39.9');
        expect(store.weather_longitude).toBe('116.4');
    });

    test('api choose patches weather_api_choose', () => {
        const store = useConfigStore();
        useWeatherProperties({ qweatherapi: { value: true } } as never, false);
        expect(store.weather_api_choose).toBe(1);
    });

    test('logs init complete + weather_init_complete on FirstLoad', () => {
        const store = useConfigStore();
        useWeatherProperties({} as never, true);
        expect(store.weather_init_complete).toBe(true);
        const matched = debugLogger.logs.find(l => l.message === '[Weather] 天气参数初始化完成');
        expect(matched).toBeDefined();
    });
});
