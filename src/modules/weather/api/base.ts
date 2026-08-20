/**
 * Weather API Base Interface
 * Common interface for all weather API implementations
 */

import {
    AIR_QUALITY_APIS,
    API_ICUFREE,
    API_OPENMETEO,
    API_QWEATHER,
    API_VISUALCROSSING,
    API_YIKETIANQI,
    HOURLY_FORECAST_APIS,
} from '../constants';
import type { WeatherAddress, WeatherData, WeatherUnit } from '../types';

/**
 * 天气数据获取器
 *
 * 各 API 实现负责拉取数据并**返回归一化后的天气数据片段**
 * （Partial<WeatherData>）。地址与单位由调用方显式传入，
 * handler 不再依赖任何全局单例。
 */
export type WeatherFetcher = (
    address: WeatherAddress,
    unit: WeatherUnit
) => Promise<Partial<WeatherData>>;

/**
 * API 注册表：配置项 weather_api_choose 的取值 → 动态导入的 fetcher 工厂
 */
export const apiHandlers: Record<number, () => Promise<WeatherFetcher>> = {
    [API_QWEATHER]: () => import('./qweather').then(m => m.qweather),
    [API_ICUFREE]: () => import('./icufree').then(m => m.icufree),
    [API_YIKETIANQI]: () => import('./yiketianqi').then(m => m.yiketianqi),
    [API_VISUALCROSSING]: () => import('./visualcrossing').then(m => m.visualcrossing),
    [API_OPENMETEO]: () => import('./openmeteo').then(m => m.openmeteo),
};

/**
 * Check if an API supports hourly forecast data
 */
export function supportsHourlyForecast(apiNumber: number): boolean {
    return HOURLY_FORECAST_APIS.includes(apiNumber);
}

/**
 * Check if an API supports air quality data
 */
export function supportsAirQuality(apiNumber: number): boolean {
    return AIR_QUALITY_APIS.includes(apiNumber);
}
