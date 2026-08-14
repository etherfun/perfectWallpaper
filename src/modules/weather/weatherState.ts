/**
 * 天气模块全局状态 — Vue 响应式版
 * 集中管理所有天气相关的可变状态
 */

import { reactive } from 'vue';

import type { WeatherAddress, WeatherData, WeatherUnit } from './types';
import { DEFAULT_UNIT, UNIT_PRESETS } from './units';

// 天气数据（响应式 — 模板直接绑定）
export const weather_data: WeatherData = reactive<WeatherData>(createEmptyWeatherData());

// 天气地址（响应式）
export const weather_address: WeatherAddress = reactive<WeatherAddress>({
    checkcity: '',
    cityname: '',
    citynumber: '',
    latitude: '',
    longitude: '',
});

// 每日提示
export const weather_daliy_tip = reactive<{ value: string }>({ value: '' });

// 降水/温度切换状态（响应式）
export const showTemperatureInsteadOfPrecip = reactive<{ value: boolean }>({ value: false });
export const precipTemperatureToggleTimer = reactive<{ value: number | null }>({ value: null });
export const isAnimatingPrecipToggle = reactive<{ value: boolean }>({ value: false });

// UI 状态（加载/错误/可见性）
export const weatherUiState = reactive({
    loading: false,
    error: '',
    visible: true,
});

// 单位配置状态
let weatherUnit: WeatherUnit = { ...DEFAULT_UNIT };

/**
 * 根据单位名称设置单位配置
 * @param unitName - 单位名称：metric, us, uk, base
 */
export function setWeatherUnitByName(unitName: string): void {
    weatherUnit = { ...(UNIT_PRESETS[unitName] ?? DEFAULT_UNIT) };
}

/**
 * 获取当前单位配置的副本
 */
export function getWeatherUnit(): WeatherUnit {
    return { ...weatherUnit };
}

// 创建空天气数据
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
        sevenHourlyData: {
            updateTime: '',
            Times: ['--:--', '--:--', '--:--', '--:--', '--:--', '--:--', '--:--'],
            Pops: ['——', '——', '——', '——', '——', '——', '——'],
            Temps: [],
            Icons: [],
            Texts: [],
            Wind360s: [],
            Winds: [],
            WindLvs: [],
            WindSpeeds: [],
            Humidities: [],
            Precips: [],
            Pressures: [],
            Clouds: [],
            Dews: [],
            preciptype: [],
        },
    };
}

// 状态修改函数（兼容旧调用方）
export function setShowTemperatureInsteadOfPrecip(value: boolean): void {
    showTemperatureInsteadOfPrecip.value = value;
}

export function setPrecipTemperatureToggleTimer(value: number | null): void {
    precipTemperatureToggleTimer.value = value;
}

export function setIsAnimatingPrecipToggle(value: boolean): void {
    isAnimatingPrecipToggle.value = value;
}

export function toggleShowTemperatureInsteadOfPrecip(): void {
    showTemperatureInsteadOfPrecip.value = !showTemperatureInsteadOfPrecip.value;
}

export function clearPrecipTimer(): void {
    if (precipTemperatureToggleTimer.value) {
        clearInterval(precipTemperatureToggleTimer.value);
        precipTemperatureToggleTimer.value = null;
    }
}
