/**
 * 天气模块全局状态
 * 集中管理所有天气相关的可变状态
 */

import type { WeatherAddress, WeatherData, WeatherUnit } from './types';
import { DEFAULT_UNIT, UNIT_PRESETS } from './units';

// 天气数据
export let weather_data: WeatherData = createEmptyWeatherData();

// 天气地址
export let weather_address: WeatherAddress = {
    checkcity: "",
    cityname: "",
    citynumber: "",
    latitude: "",
    longitude: ""
};

// 每日提示
export let weather_daliy_tip: string;

// 降水/温度切换状态
export let showTemperatureInsteadOfPrecip = false;
export let precipTemperatureToggleTimer: number | null = null;
export let isAnimatingPrecipToggle = false;

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
        updateTime: "",
        icon: "",
        temperature: "",
        feels: "",
        weathernow: "",
        windSpeed: "",
        humidity: "",
        temperature_max: "",
        temperature_min: "",
        feels_max: "",
        feels_min: "",
        wind: "",
        precip: "",
        precipcover: "",
        precipprob: "",
        snow: "",
        snowdepth: "",
        preciptype: "",
        windgust: "",
        visibility: "",
        solarradiation: "",
        uvindex: "",
        sunrise: "",
        sunset: "",
        moonphase: "",
        cloud: "",
        vis: "",
        dew: "",
        pressure: "",
        rangefeelstemperature: "",
        rangetemperature: "",
        obstime: "",
        windLv: "",
        air: "",
        weatherAlert: [],
        weatherAlertColor: "",
        sevenHourlyData: {
            updateTime: "",
            Times: ["--:--", "--:--", "--:--", "--:--", "--:--", "--:--", "--:--"],
            Pops: ["——", "——", "——", "——", "——", "——", "——"],
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
            preciptype: []
        }
    };
}

// 状态修改函数
export function setShowTemperatureInsteadOfPrecip(value: boolean): void {
    showTemperatureInsteadOfPrecip = value;
}

export function setPrecipTemperatureToggleTimer(value: number | null): void {
    precipTemperatureToggleTimer = value;
}

export function setIsAnimatingPrecipToggle(value: boolean): void {
    isAnimatingPrecipToggle = value;
}

export function toggleShowTemperatureInsteadOfPrecip(): void {
    showTemperatureInsteadOfPrecip = !showTemperatureInsteadOfPrecip;
}

export function clearPrecipTimer(): void {
    if (precipTemperatureToggleTimer) {
        clearInterval(precipTemperatureToggleTimer);
        precipTemperatureToggleTimer = null;
    }
}
