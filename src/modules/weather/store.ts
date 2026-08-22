/**
 * 天气 Pinia store — 取代原 weatherState.ts 的模块级可变单例
 *
 * 这是天气模块的唯一状态源：所有响应式数据、UI 状态、降水/温度切换
 * 以及数据获取编排（原 weather_init / autoWeather）都收敛到此处。
 * API fetcher 为纯函数（接收 address + unit，返回 Partial<WeatherData>），
 * 由本 store 的 init/startAutoRefresh action 统一调用并写入 state。
 */

import { defineStore } from 'pinia';
import { computed, reactive, ref, watch } from 'vue';

import { useConfigStore } from '@/stores/config';
import { globalT } from '@/utils/i18n';
import { debugLogger } from '@/utils/logger';
import { timerManager } from '@/utils/timer';
import { fetch_with_retry,migrateUsageDataOnce } from '@/utils/tool';

import { apiHandlers, supportsHourlyForecast } from './api/base';
import { initSevenHourlyData } from './api/types';
import {
    DEFAULT_HOURLY_FIELDS,
    DEFAULT_UPDATE_INTERVAL,
    HOURLY_FIELD_CELL_CLASSES,
    HOURLY_FIELD_DISPLAY_TYPES,
    HOURLY_FIELD_KEYS,
    HOURLY_FIELD_LABEL_KEYS,
    PRECIP_TOGGLE_ANIM_MS,
    WEATHER_UPDATE_INTERVALS,
    type HourlyFieldKey,
} from './constants';
import { generateAlertHTML,getAirQualityText } from './formatters';
import { getWeatherTips } from './tips';
import type { WeatherAddress, WeatherData } from './types';
import { resolveUnit } from './units';

/** 创建空天气数据（与 SevenHourlyData 默认值同源，避免重复字面量） */
function createEmptyWeatherData(): WeatherData {
    return {
        updateTime: '',
        icon: '',
        temperature: '',
        feels: '',
        weathernow: '',
        windSpeed: '',
        humidity: '',
        temperature_max: '',
        temperature_min: '',
        feels_max: '',
        feels_min: '',
        wind: '',
        precip: '',
        precipcover: '',
        precipprob: '',
        snow: '',
        snowdepth: '',
        preciptype: '',
        windgust: '',
        visibility: '',
        solarradiation: '',
        uvindex: '',
        sunrise: '',
        sunset: '',
        moonphase: '',
        cloud: '',
        vis: '',
        dew: '',
        pressure: '',
        rangefeelstemperature: '',
        rangetemperature: '',
        obstime: '',
        windLv: '',
        air: '',
        weatherAlert: [],
        weatherAlertColor: '',
        sevenHourlyData: initSevenHourlyData(),
    };
}

export const useWeatherStore = defineStore('weather', () => {
    const config = useConfigStore();

    // ===== 状态 =====
    const data = reactive<WeatherData>(createEmptyWeatherData());
    const address = reactive<WeatherAddress>({
        checkcity: '',
        cityname: '',
        citynumber: '',
        latitude: '',
        longitude: '',
    });
    const ui = reactive({ loading: false, error: '', visible: false });
    const currentHourlyField = ref<HourlyFieldKey>('pop');
    // 兼容旧版布尔值：true=气温, false=降水概率
    const showTemperatureInsteadOfPrecip = computed({
        get: () => currentHourlyField.value === 'temp',
        set: (v: boolean) => {
            currentHourlyField.value = v ? 'temp' : 'pop';
        },
    });
    const isAnimatingPrecipToggle = ref(false);
    const precipTimerId = ref<number | null>(null);
    const isInitRunning = ref(false);
    let pendingRefresh = false;
    let autoTimerId: string | null = null;

    // ===== 派生（getters） =====
    const unitConfig = computed(() => resolveUnit(config.weather_unit));
    const airQualityText = computed(() => getAirQualityText(data.air));
    const alertHtml = computed(() => generateAlertHTML(data.weatherAlert));
    // 模板化预警列表（v-for 渲染，避免 v-html + innerHTML 事件失效）
    const alertItems = computed(() => {
        const alerts = data.weatherAlert;
        if (!alerts?.length) return [] as { alert: string; color: string; ids: string[] }[];
        const severity: Record<string, number> = { extreme: 5, severe: 4, moderate: 3, minor: 2, unknown: 1 };
        const sorted = [...alerts].sort((a,b) => (severity[b.level]??0)-(severity[a.level]??0));
        const map = new Map<string, { alert: string; color: string; ids: string[]; level: string }>();
        for (const a of sorted) {
            const ex = map.get(a.alert);
            if (!ex) map.set(a.alert, { alert: a.alert, color: a.color, ids: [a.id], level: a.level });
            else { ex.ids.push(a.id); if ((severity[a.level]??0) > (severity[ex.level]??0)) { ex.level = a.level; ex.color = a.color; } }
        }
        return [...map.values()].map(v => ({ alert: v.alert, color: v.color, ids: v.ids }));
    });
    const tip = computed(() => (config.weather_daily_tip ? getWeatherTips(data) : ''));

    const enabledHourlyFields = computed<HourlyFieldKey[]>(() => {
        const enabled: HourlyFieldKey[] = [];
        for (const key of HOURLY_FIELD_KEYS) {
            const cfgKey = `weather_hourly_${key}` as keyof typeof config;
            const val = (config as unknown as Record<string, unknown>)[cfgKey] as boolean | undefined;
            const isEnabled = val !== undefined ? val : DEFAULT_HOURLY_FIELDS[key];
            if (isEnabled) enabled.push(key);
        }
        if (enabled.length === 0) return ['pop'];
        return enabled;
    });

    const precipLabel = computed(() => globalT(HOURLY_FIELD_LABEL_KEYS[currentHourlyField.value]));
    const precipLabelKey = computed(() => HOURLY_FIELD_LABEL_KEYS[currentHourlyField.value]);
    const precipDisplayType = computed(() => HOURLY_FIELD_DISPLAY_TYPES[currentHourlyField.value]);
    const precipCellClass = computed(() => HOURLY_FIELD_CELL_CLASSES[currentHourlyField.value]);
    const hourlyTimes = computed(() => data.sevenHourlyData.Times);
    const hourlyValues = computed(() => {
        const field = currentHourlyField.value;
        const d = data.sevenHourlyData;
        let values: string[] = [];
        let suffix = '';
        switch (field) {
            case 'pop':
                values = d.Pops;
                suffix = '';
                break;
            case 'temp':
                values = d.Temps;
                suffix = unitConfig.value.temp || '℃';
                break;
            case 'humidity':
                values = d.Humidities;
                suffix = '%';
                break;
            case 'windspeed':
                values = d.WindSpeeds;
                suffix = unitConfig.value.wind ? ` ${unitConfig.value.wind}` : '';
                break;
            case 'pressure':
                values = d.Pressures;
                suffix = unitConfig.value.pressure ? ` ${unitConfig.value.pressure}` : 'hPa';
                break;
            case 'cloud':
                values = d.Clouds;
                suffix = '%';
                break;
            case 'precip':
                values = d.Precips;
                suffix = unitConfig.value.precip ? ` ${unitConfig.value.precip}` : 'mm';
                break;
            case 'dew':
                values = d.Dews;
                suffix = unitConfig.value.temp || '℃';
                break;
            case 'windlv':
                values = d.WindLvs;
                suffix = globalT('weather_wind_level_label') ? ` ${globalT('weather_wind_level_label')}` : '';
                break;
            default:
                values = d.Pops;
                suffix = '';
                break;
        }
        if (field === 'pop') {
            return values.map(v => {
                if (!v || v === '--') return '--';
                return v.includes('%') ? v : `${v}%`;
            });
        }
        return values.map(v => {
            if (!v || v === '--' || v === '') return '--';
            if (field === 'windlv') return `${v}${suffix}`;
            return `${v}${suffix}`;
        });
    });

    // 当启用字段变化时，若当前字段不在启用列表则重置为首个
    watch(enabledHourlyFields, enabled => {
        if (!enabled.includes(currentHourlyField.value)) {
            currentHourlyField.value = enabled[0] ?? 'pop';
        }
        if (config.weather_hourly_enabled !== false) startPrecipTimer();
    });
    watch(
        () => config.weather_hourly_enabled,
        enabled => {
            if (enabled === false) stopPrecipTimer();
            else startPrecipTimer();
        }
    );
    watch(
        () => config.weather_hourly_interval,
        () => {
            if (config.weather_hourly_enabled !== false) startPrecipTimer();
        }
    );

    // ===== 内部辅助 =====
    function applyResult(partial: Partial<WeatherData>): void {
        Object.assign(data, partial);
    }

    async function detectCity(): Promise<void> {
        if (address.cityname !== '') return;
        try {
            const res = await fetch_with_retry('http://i.tianqi.com/index.php?c=code&id=11', {});
            const text = await res.text();
            const afterStrong = text.split('</strong>')[1];
            const city = afterStrong?.split(' ')[0];
            if (city) address.cityname = city;
        } catch (error) {
            debugLogger.error('[Weather] Failed to auto-detect city', { error });
        }
    }

    // ===== 数据获取编排（原 weather_init / autoWeather） =====
    async function init(): Promise<void> {
        migrateUsageDataOnce();
        // 并发保护：属性批量下发时（如先 setLocationField 后 setApiChoice），
        // 首个 init 可能以不完整状态运行，后续 init 被 isInitRunning 挡住。
        // 用 pendingRefresh 标记，待当前 init 结束后以最终状态再跑一次。
        if (isInitRunning.value) {
            pendingRefresh = true;
            return;
        }
        isInitRunning.value = true;
        try {
            if (data.temperature === '' && data.weathernow === '') ui.loading = true;

            await detectCity();

            const choice = config.weather_api_choose ?? 0;
            const factory = apiHandlers[choice];
            if (!factory) return;

            try {
                const fetcher = await factory();
                const result = await fetcher(address, unitConfig.value);
                applyResult(result);
                ui.loading = false;
                ui.error = '';
                startPrecipTimer();
            } catch (error) {
                debugLogger.error('[Weather] Fetch error', { error });
                ui.error = globalT('weather_error_loading') || 'Failed to load weather data';
                ui.loading = false;
            }
        } finally {
            isInitRunning.value = false;
            if (pendingRefresh) {
                pendingRefresh = false;
                void init();
            }
        }
    }

    function startAutoRefresh(): void {
        void init();
        if (autoTimerId) timerManager.remove(autoTimerId);
        const interval = WEATHER_UPDATE_INTERVALS[config.weather_updata ?? 0] ?? DEFAULT_UPDATE_INTERVAL;
        autoTimerId = timerManager.create(startAutoRefresh, interval, 'updataWeather');
    }

    function stopAutoRefresh(): void {
        if (autoTimerId) {
            timerManager.remove(autoTimerId);
            autoTimerId = null;
        }
    }

    // ===== 逐时轮播（多字段） =====
    function togglePrecip(): void {
        if (!data.sevenHourlyData?.Times?.length) return;
        if (isAnimatingPrecipToggle.value) return;
        const enabled = enabledHourlyFields.value;
        if (enabled.length <= 1) return;
        isAnimatingPrecipToggle.value = true;
        const idx = enabled.indexOf(currentHourlyField.value);
        const next = enabled[(idx + 1) % enabled.length] ?? enabled[0] ?? 'pop';
        currentHourlyField.value = next;
        window.setTimeout(() => {
            isAnimatingPrecipToggle.value = false;
        }, PRECIP_TOGGLE_ANIM_MS);
    }

    function startPrecipTimer(): void {
        stopPrecipTimer();
        if (config.weather_hourly_enabled === false) return;
        if (!supportsHourlyForecast(config.weather_api_choose ?? 0)) return;
        const enabled = enabledHourlyFields.value;
        if (enabled.length <= 1) return;
        const intervalSec = config.weather_hourly_interval ?? 20;
        const intervalMs = Math.max(5, Math.min(120, intervalSec)) * 1000;
        precipTimerId.value = window.setInterval(togglePrecip, intervalMs);
    }

    function stopPrecipTimer(): void {
        if (precipTimerId.value) {
            clearInterval(precipTimerId.value);
            precipTimerId.value = null;
        }
    }

    // ===== WE 属性 → store 的适配 action =====
    function setVisible(visible: boolean): void {
        ui.visible = visible;
        if (visible) startAutoRefresh();
        else stopAutoRefresh();
    }

    function setApiChoice(apiId: number, firstLoad: boolean): void {
        config.weather_api_choose = apiId;
        if (!firstLoad) void init();
    }

    function setLocationField(
        key: 'latitude' | 'longitude' | 'cityname',
        value: string,
        firstLoad: boolean
    ): void {
        address[key] = value;
        // 同步持久化到 config（原 handler 同时写 weather_address 与 config.weather_latitude/longitude）
        if (key === 'latitude') config.weather_latitude = value;
        else if (key === 'longitude') config.weather_longitude = value;
        if (!firstLoad) void init();
    }

    function setUnitName(name: string): void {
        config.weather_unit = name || 'metric';
    }

    function setDailyTip(value: boolean, firstLoad: boolean): void {
        config.weather_daily_tip = value;
        if (!firstLoad) void init();
    }

    return {
        // state
        data,
        address,
        ui,
        currentHourlyField,
        showTemperatureInsteadOfPrecip,
        isAnimatingPrecipToggle,
        precipTimerId,
        // getters
        unitConfig,
        airQualityText,
        alertHtml,
        alertItems,
        tip,
        enabledHourlyFields,
        precipLabel,
        precipLabelKey,
        precipDisplayType,
        precipCellClass,
        hourlyTimes,
        hourlyValues,
        // actions
        init,
        startAutoRefresh,
        stopAutoRefresh,
        togglePrecip,
        startPrecipTimer,
        stopPrecipTimer,
        setVisible,
        setApiChoice,
        setLocationField,
        setUnitName,
        setDailyTip,
    };
});
