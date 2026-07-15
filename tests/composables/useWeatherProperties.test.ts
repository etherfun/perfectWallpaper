// @vitest-environment jsdom
/**
 * Tests for src/composables/useWeatherProperties.ts — Stage 3-2
 *
 * Verifies the weather property handler covers all dispatch paths and
 * propagates to Pinia + body CSS vars + weather sub-module side effects.
 */
import { createPinia, setActivePinia } from 'pinia';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

import { useConfigStore } from '@/stores/config';
import { debugLogger } from '@/utils/logger';

const { mockAutoWeather, mockGenerateWeatherTable, mockSetWeatherUnitByName, mockWeatherInit, mockTimerRemove } =
    vi.hoisted(() => ({
        mockAutoWeather: vi.fn(),
        mockGenerateWeatherTable: vi.fn(),
        mockSetWeatherUnitByName: vi.fn(),
        mockWeatherInit: vi.fn(),
        mockTimerRemove: vi.fn(),
    }));

vi.mock('@/modules/weather', () => ({
    autoWeather: mockAutoWeather,
    generateWeatherTable: mockGenerateWeatherTable,
    weather_init: mockWeatherInit,
    weather_address: { latitude: '', longitude: '', cityname: '' },
}));
vi.mock('@/modules/weather/weatherState', () => ({
    setWeatherUnitByName: mockSetWeatherUnitByName,
}));
vi.mock('@/utils/timer', () => ({
    timerManager: { remove: mockTimerRemove },
}));
vi.mock('@/utils/tool', () => ({
    debounce: vi.fn(),
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
    mockAutoWeather.mockClear();
    mockGenerateWeatherTable.mockClear();
    mockSetWeatherUnitByName.mockClear();
    mockTimerRemove.mockClear();
});

afterEach(() => {
    vi.restoreAllMocks();
});

describe('useWeatherProperties', () => {
    test('weather_show true → display flex + autoWeather()', () => {
        useWeatherProperties({ weather_show: { value: true } } as never, false);
        expect(mockTimerRemove).toHaveBeenCalledWith('updataWeather');
        expect(mockAutoWeather).toHaveBeenCalledTimes(1);
    });

    test('weather_show false → display none + no autoWeather', () => {
        useWeatherProperties({ weather_show: { value: false } } as never, false);
        expect(mockAutoWeather).not.toHaveBeenCalled();
    });

    test('weather_unit patches store + setWeatherUnitByName', () => {
        const store = useConfigStore();
        useWeatherProperties({ weather_unit: { value: 'metric' } } as never, false);
        expect(store.weather_unit).toBe('metric');
        expect(mockSetWeatherUnitByName).toHaveBeenCalledWith('metric');
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
        expect(document.body.style.getPropertyValue('--weather-blur-color')).toBe('128, 128, 128');
        expect(store.weather_blurcolor).toEqual([128, 128, 128]);
    });

    test('weather_yakeli_show true → --weather-yakeli-enabled = 1 + store patch', () => {
        const store = useConfigStore();
        useWeatherProperties({ weather_yakeli_show: { value: true } } as never, false);
        expect(document.body.style.getPropertyValue('--weather-yakeli-enabled')).toBe('1');
        expect(store.weather_yakeli_show).toBe(true);
    });

    test('weather_yakeli /100 → CSS', () => {
        const store = useConfigStore();
        useWeatherProperties({ weather_yakeli: { value: 50 } } as never, false);
        expect(document.body.style.getPropertyValue('--weather-yakeli')).toBe('0.5');
        expect(store.weather_yakeli).toBe(50);
    });

    test('position patches set CSS variables with %', () => {
        const store = useConfigStore();
        useWeatherProperties(
            { weatherX: { value: 25 }, weatherY: { value: 75 } } as never,
            false
        );
        expect(store.weather_x).toBe(25);
        expect(store.weather_y).toBe(75);
        expect(document.body.style.getPropertyValue('--weather-left')).toBe('25%');
        expect(document.body.style.getPropertyValue('--weather-top')).toBe('75%');
    });

    test('weather_lat_latitude patches weather_address.latitude + store', async () => {
        const { weather_address } = await import('@/modules/weather');
        const store = useConfigStore();
        useWeatherProperties(
            { weather_lat_latitude: { value: 39.9 }, weather_lat_longitude: { value: 116.4 } } as never,
            false
        );
        expect(weather_address.latitude).toBe('39.9');
        expect(weather_address.longitude).toBe('116.4');
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
