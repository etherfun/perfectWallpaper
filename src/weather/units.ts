import { i18n } from '../utils/i18n';
import { WeatherUnit, WeatherLang } from './types';

// 默认单位配置
const DEFAULT_UNIT: WeatherUnit = {
    temp: "℃",
    precip: "mm",
    precip_1: "mm/h",
    snow: "cm",
    snow_1: "cm/h",
    wind: "km/h",
    vis: "km",
    pressure: "hPa",
    solarradiation: "w/m²",
    temperature_code: "celsius",
    wind_speed_code: "kmh",
    precipitation_code: "mm"
};

// 单位映射表
const UNIT_PRESETS: Record<string, WeatherUnit> = {
    metric: { ...DEFAULT_UNIT },
    us: {
        temp: "℉",
        precip: "in",
        precip_1: "in/h",
        snow: "in",
        snow_1: "in/h",
        wind: "mi/h",
        vis: "mi",
        pressure: "mb",
        solarradiation: "w/m²",
        temperature_code: "fahrenheit",
        wind_speed_code: "mph",
        precipitation_code: "inch"
    },
    uk: {
        temp: "℃",
        precip: "mm",
        precip_1: "mm/h",
        snow: "cm",
        snow_1: "cm/h",
        wind: "mi/h",
        vis: "mi",
        pressure: "mb",
        solarradiation: "w/m²",
        temperature_code: "celsius",
        wind_speed_code: "kmh",
        precipitation_code: "mm"
    },
    base: {
        temp: "K",
        precip: "mm",
        precip_1: "mm/h",
        snow: "cm",
        snow_1: "cm/h",
        wind: "m/s",
        vis: "km",
        pressure: "mb",
        solarradiation: "w/m²",
        temperature_code: "kelvin",
        wind_speed_code: "ms",
        precipitation_code: "mm"
    }
};

// 全局单位配置（保持向后兼容）
export let wunit: WeatherUnit = { ...DEFAULT_UNIT };

/**
 * 根据单位设置更新全局单位配置（保持向后兼容）
 * @param weatherUnit - 单位设置值：metric, us, uk, base
 */
export function weather_unit_choose(weatherUnit: string = "metric"): void {
    wunit = { ...(UNIT_PRESETS[weatherUnit] ?? DEFAULT_UNIT) };
}

/**
 * 获取当前单位配置的副本
 */
export function getWunit(): WeatherUnit {
    return { ...wunit };
}
