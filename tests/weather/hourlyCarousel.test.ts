// @vitest-environment jsdom
/**
 * Tests for weather hourly carousel (逐时轮播多字段化)
 *
 * Covers:
 *   - enabledHourlyFields 派生（默认值 / 配置覆盖 / 全禁用兜底）
 *   - togglePrecip 在启用字段列表中循环
 *   - 当前字段被禁用时自动重置为首个启用字段
 *   - hourlyValues 各字段的格式化（单位后缀 / % 去重）
 *   - precipLabelKey / precipCellClass 跟随当前字段
 *   - 轮播间隔 clamp（5–120s）与总开关启停
 *   - useWeatherProperties 对 weather_hourly_* 属性的分发
 */
import { createPinia, setActivePinia } from 'pinia';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

import { useConfigStore } from '@/stores/config';
import { useWeatherStore } from '@/modules/weather';

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
let config: ReturnType<typeof useConfigStore>;

/** 向 sevenHourlyData 写入可区分的测试数据 */
function seedHourlyData(): void {
    weather.data.sevenHourlyData.Times = ['10:00', '11:00'];
    weather.data.sevenHourlyData.Pops = ['30%', '--'];
    weather.data.sevenHourlyData.Temps = ['25', '26'];
    weather.data.sevenHourlyData.Humidities = ['60', '65'];
    weather.data.sevenHourlyData.WindSpeeds = ['3.5', '4'];
    weather.data.sevenHourlyData.Pressures = ['1010', '1011'];
    weather.data.sevenHourlyData.Clouds = ['20', '30'];
    weather.data.sevenHourlyData.Precips = ['0.5', ''];
    weather.data.sevenHourlyData.Dews = ['15', '16'];
    weather.data.sevenHourlyData.WindLvs = ['3', '4'];
}

beforeEach(() => {
    setActivePinia(createPinia());
    vi.useFakeTimers();
    if (typeof globalThis.ResizeObserver === 'undefined') {
        globalThis.ResizeObserver = class {
            observe() {}
            unobserve() {}
            disconnect() {}
        } as unknown as typeof ResizeObserver;
    }
    config = useConfigStore();
    weather = useWeatherStore();
    vi.spyOn(weather, 'init').mockResolvedValue();
    // 支持逐时预报的 API（QWeather=1），否则 startPrecipTimer 直接返回
    config.weather_api_choose = 1;
});

afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
});

describe('hourly carousel — enabledHourlyFields', () => {
    test('默认仅启用 pop + temp（保持旧版行为）', () => {
        expect(weather.enabledHourlyFields).toEqual(['pop', 'temp']);
    });

    test('config 开关可扩展启用列表（按 HOURLY_FIELD_KEYS 顺序）', () => {
        config.weather_hourly_humidity = true;
        config.weather_hourly_pressure = true;
        expect(weather.enabledHourlyFields).toEqual(['pop', 'temp', 'humidity', 'pressure']);
    });

    test('全部禁用时兜底为 [pop]', () => {
        config.weather_hourly_pop = false;
        config.weather_hourly_temp = false;
        expect(weather.enabledHourlyFields).toEqual(['pop']);
    });
});

describe('hourly carousel — togglePrecip 循环', () => {
    test('默认两字段循环 pop → temp → pop', () => {
        expect(weather.currentHourlyField).toBe('pop');
        weather.togglePrecip();
        expect(weather.currentHourlyField).toBe('temp');
        vi.advanceTimersByTime(400); // 越过动画防抖
        weather.togglePrecip();
        expect(weather.currentHourlyField).toBe('pop');
    });

    test('多字段按注册顺序循环', () => {
        config.weather_hourly_humidity = true;
        expect(weather.currentHourlyField).toBe('pop');
        weather.togglePrecip(); // → temp
        vi.advanceTimersByTime(400);
        weather.togglePrecip(); // → humidity
        expect(weather.currentHourlyField).toBe('humidity');
        vi.advanceTimersByTime(400);
        weather.togglePrecip(); // → pop（回绕）
        expect(weather.currentHourlyField).toBe('pop');
    });

    test('仅一个字段启用时不切换', () => {
        config.weather_hourly_temp = false;
        expect(weather.enabledHourlyFields).toEqual(['pop']);
        weather.togglePrecip();
        expect(weather.currentHourlyField).toBe('pop');
    });

    test('动画期间重复调用被防抖忽略', () => {
        weather.togglePrecip();
        expect(weather.currentHourlyField).toBe('temp');
        expect(weather.isAnimatingPrecipToggle).toBe(true);
        weather.togglePrecip(); // 动画中，忽略
        expect(weather.currentHourlyField).toBe('temp');
        vi.advanceTimersByTime(400);
        expect(weather.isAnimatingPrecipToggle).toBe(false);
    });
});

describe('hourly carousel — 字段禁用联动', () => {
    test('当前字段被禁用时重置为首个启用字段', async () => {
        weather.togglePrecip();
        expect(weather.currentHourlyField).toBe('temp');
        config.weather_hourly_temp = false;
        await vi.advanceTimersByTimeAsync(0); // flush watchers
        expect(weather.currentHourlyField).toBe('pop');
    });
});

describe('hourly carousel — hourlyValues 格式化', () => {
    beforeEach(seedHourlyData);

    const cases: Array<{
        field: string;
        enable?: Record<string, boolean>;
        expected: string[];
        labelKey: string;
        cellClass: string;
    }> = [
        { field: 'pop', expected: ['30%', '--'], labelKey: 'weather_show_precipprob', cellClass: 'precip-prob-cell' },
        { field: 'temp', expected: ['25℃', '26℃'], labelKey: 'weather_show_temperature', cellClass: 'precip-temp-cell' },
        { field: 'humidity', expected: ['60%', '65%'], labelKey: 'weather_show_humidity', cellClass: 'precip-humidity-cell' },
        { field: 'windspeed', expected: ['3.5 km/h', '4 km/h'], labelKey: 'weather_show_windspeed', cellClass: 'precip-windspeed-cell' },
        { field: 'pressure', expected: ['1010 hPa', '1011 hPa'], labelKey: 'weather_show_pressure', cellClass: 'precip-pressure-cell' },
        { field: 'cloud', expected: ['20%', '30%'], labelKey: 'weather_show_cloud', cellClass: 'precip-cloud-cell' },
        { field: 'precip', expected: ['0.5 mm', '--'], labelKey: 'weather_show_precip', cellClass: 'precip-precip-cell' },
        { field: 'dew', expected: ['15℃', '16℃'], labelKey: 'weather_show_dew', cellClass: 'precip-dew-cell' },
        { field: 'windlv', expected: ['3 级', '4 级'], labelKey: 'weather_show_windlv', cellClass: 'precip-windlv-cell' },
    ];

    for (const c of cases) {
        test(`${c.field} → ${JSON.stringify(c.expected)}`, async () => {
            // 启用目标字段（默认仅 pop+temp，其余字段需显式开启才能轮播到）
            config[`weather_hourly_${c.field}` as 'weather_hourly_pop'] = true;
            await vi.advanceTimersByTimeAsync(0); // flush enabledHourlyFields watcher
            // 切到目标字段
            let guard = 0;
            while (weather.currentHourlyField !== c.field && guard < 12) {
                weather.togglePrecip();
                vi.advanceTimersByTime(400);
                guard++;
            }
            expect(weather.currentHourlyField).toBe(c.field);
            expect(weather.hourlyValues).toEqual(c.expected);
            expect(weather.precipLabelKey).toBe(c.labelKey);
            expect(weather.precipCellClass).toBe(c.cellClass);
        });
    }

    test('pop 已带 % 的值不重复追加', () => {
        weather.data.sevenHourlyData.Pops = ['45%'];
        expect(weather.hourlyValues).toEqual(['45%']);
    });
});

describe('hourly carousel — 定时器', () => {
    test('startPrecipTimer 使用配置间隔（默认 20s）', () => {
        weather.startPrecipTimer();
        expect(weather.precipTimerId).not.toBeNull();
        const id = weather.precipTimerId;
        vi.advanceTimersByTime(20000);
        expect(weather.currentHourlyField).toBe('temp');
        expect(weather.precipTimerId).toBe(id);
    });

    test('间隔 clamp：低于 5s 按 5s，高于 120s 按 120s', () => {
        config.weather_hourly_interval = 2;
        weather.startPrecipTimer();
        vi.advanceTimersByTime(4999);
        expect(weather.currentHourlyField).toBe('pop');
        vi.advanceTimersByTime(1);
        expect(weather.currentHourlyField).toBe('temp');

        config.weather_hourly_interval = 500;
        weather.stopPrecipTimer();
        weather.startPrecipTimer();
        vi.advanceTimersByTime(119999);
        expect(weather.currentHourlyField).toBe('temp');
        vi.advanceTimersByTime(1);
        expect(weather.currentHourlyField).toBe('pop');
    });

    test('总开关关闭时不启动定时器，watch 联动停止已有定时器', async () => {
        weather.startPrecipTimer();
        expect(weather.precipTimerId).not.toBeNull();

        config.weather_hourly_enabled = false;
        await vi.advanceTimersByTimeAsync(0);
        expect(weather.precipTimerId).toBeNull();

        // 关闭状态下手动 start 也无效
        weather.startPrecipTimer();
        expect(weather.precipTimerId).toBeNull();

        // 重新开启后恢复
        config.weather_hourly_enabled = true;
        await vi.advanceTimersByTimeAsync(0);
        expect(weather.precipTimerId).not.toBeNull();
    });

    test('修改间隔后重启定时器', async () => {
        weather.startPrecipTimer();
        const oldId = weather.precipTimerId;
        config.weather_hourly_interval = 30;
        await vi.advanceTimersByTimeAsync(0);
        expect(weather.precipTimerId).not.toBeNull();
        expect(weather.precipTimerId).not.toBe(oldId);
    });

    test('stopPrecipTimer 清除定时器', () => {
        weather.startPrecipTimer();
        weather.stopPrecipTimer();
        expect(weather.precipTimerId).toBeNull();
    });
});

describe('useWeatherProperties — weather_hourly_* 分发', () => {
    test('enabled/interval/各字段开关写入 config store', () => {
        useWeatherProperties(
            {
                weather_hourly_enabled: { value: true },
                weather_hourly_interval: { value: 45 },
                weather_hourly_pop: { value: true },
                weather_hourly_temp: { value: false },
                weather_hourly_humidity: { value: true },
                weather_hourly_windspeed: { value: true },
                weather_hourly_pressure: { value: true },
                weather_hourly_cloud: { value: true },
                weather_hourly_precip: { value: true },
                weather_hourly_dew: { value: true },
                weather_hourly_windlv: { value: true },
            } as never,
            false
        );
        expect(config.weather_hourly_enabled).toBe(true);
        expect(config.weather_hourly_interval).toBe(45);
        expect(config.weather_hourly_pop).toBe(true);
        expect(config.weather_hourly_temp).toBe(false);
        expect(config.weather_hourly_humidity).toBe(true);
        expect(config.weather_hourly_windspeed).toBe(true);
        expect(config.weather_hourly_pressure).toBe(true);
        expect(config.weather_hourly_cloud).toBe(true);
        expect(config.weather_hourly_precip).toBe(true);
        expect(config.weather_hourly_dew).toBe(true);
        expect(config.weather_hourly_windlv).toBe(true);
    });

    test('未推送的属性保持默认值', () => {
        useWeatherProperties({} as never, false);
        expect(config.weather_hourly_enabled).toBe(true);
        expect(config.weather_hourly_interval).toBe(20);
        expect(config.weather_hourly_humidity).toBe(false);
    });
});
