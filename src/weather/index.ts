/**
 * 天气模块入口文件
 * 整合所有天气相关的API、工具函数和UI
 */

export { weather_unit_choose } from './units';
export { getWeatherTips } from './tips';

// UI 模块导出
export {
    showWeatherLoading,
    hideWeatherLoading,
    showWeatherError,
    togglePrecipTemperatureDisplay,
    startPrecipTemperatureToggleTimer,
    clearPrecipTemperatureToggleTimer,
    updateMainWeatherDisplay,
    updateWeatherDetails,
    updateWeatherExtendedInfo,
    updateAirQualityAndAlerts,
    updatePrecipContainer,
    updateTipDisplay,
    generateWeatherTable,
} from './ui';
export { tooltip } from './tooltip';

// 格式化工具导出
export { getAirQualityText, generateAlertHTML } from './formatters';

// 状态导出（从 weatherState 重导出）
export {
    weather_data,
    weather_address,
    weather_daliy_tip,
    showTemperatureInsteadOfPrecip,
    precipTemperatureToggleTimer,
    isAnimatingPrecipToggle,
} from './weatherState';

import type { WeatherData, WeatherAddress, SevenHourlyData } from './types';
import type { WeatherAPIHandler } from './api/base';
import { fetch_with_retry } from '../utils/tool';
import { config } from '../utils/config';
import { timerManager } from '../utils/timer';
import { i18n } from '../utils/i18n';
import { showWeatherLoading, showWeatherError } from './ui/states';
import { generateWeatherTable } from './ui/generateWeatherTable';

// 导出类型
export type { WeatherData, WeatherAddress, SevenHourlyData }

// ============== 图标缓存 ==============

const MAX_ICON_CACHE_SIZE = 100;
const iconCache = new Map<string, string>();

export async function getIconSvg(iconPath: string): Promise<string> {
    if (iconCache.has(iconPath)) {
        const value = iconCache.get(iconPath)!;
        iconCache.delete(iconPath);
        iconCache.set(iconPath, value);
        return value;
    }
    const res = await fetch(iconPath);
    const svg = await res.text();
    if (iconCache.size >= MAX_ICON_CACHE_SIZE) {
        const firstKey = iconCache.keys().next().value;
        if (firstKey) iconCache.delete(firstKey);
    }
    iconCache.set(iconPath, svg);
    return svg;
}

export function clearIconCache(): void {
    iconCache.clear();
}

// ============== API 相关 ==============

const apiHandlers: { [key: number]: () => Promise<WeatherAPIHandler> } = {
    1: () => import('./api/qweather').then(m => m.qweather),
    2: () => import('./api/icufree').then(m => m.icufree),
    3: () => import('./api/yiketianqi').then(m => m.yiketianqi),
    4: () => import('./api/visualcrossing').then(m => m.visualcrossing),
    5: () => import('./api/openmeteo').then(m => m.openmeteo)
};

let isWeatherInitRunning = false;

export async function weather_init(): Promise<void> {
    // 防止并发调用
    if (isWeatherInitRunning) {
        return;
    }
    isWeatherInitRunning = true;

    try {
        showWeatherLoading();

        const { weather_address } = await import('./weatherState');
        if (weather_address.cityname === "") {
            try {
                const citydata = await fetch_with_retry("http://i.tianqi.com/index.php?c=code&id=11", {});
                const text = await citydata.text();
                weather_address.cityname = text.split("</strong>")[1].split(" ")[0];
            } catch (e) {
                console.error("Failed to get city:", e);
            }
        }

        const handlerFactory = apiHandlers[config.weatherApiChoose];
        if (handlerFactory) {
            try {
                const handler = await handlerFactory();
                const { weather_data } = await import('./weatherState');
                await handler(weather_address, weather_data);
                await generateWeatherTable();
            } catch (error) {
                console.error("Weather fetch error:", error);
                showWeatherError(i18n('weather_error_loading') || 'Failed to load weather data');
            }
        }
    } finally {
        isWeatherInitRunning = false;
    }
}

export function autoWeather(): void {
    weather_init();
    const intervals: { [key: number]: number } = {
        1: 900000,
        2: 1200000,
        3: 1800000,
        4: 2700000,
        5: 3600000
    };
    timerManager.create(autoWeather, intervals[config.weatherUpdate] || 900000, 'updataWeather');
}
