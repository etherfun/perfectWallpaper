/**
 * 天气模块入口文件
 * 整合所有天气相关的API、工具函数和UI
 */

export { getWeatherTips } from './tips';

// UI 模块导出
export { tooltip } from './tooltip';
export {
    clearPrecipTemperatureToggleTimer,
    generateWeatherTable,
    hideWeatherLoading,
    showWeatherError,
    showWeatherLoading,
    startPrecipTemperatureToggleTimer,
    togglePrecipTemperatureDisplay,
    updateAirQualityAndAlerts,
    updateMainWeatherDisplay,
    updatePrecipContainer,
    updateTipDisplay,
    updateWeatherDetails,
    updateWeatherExtendedInfo,
} from './ui';

// 格式化工具导出
export { generateAlertHTML, getAirQualityText } from './formatters';

// 状态导出（从 weatherState 重导出）
export {
    isAnimatingPrecipToggle,
    precipTemperatureToggleTimer,
    showTemperatureInsteadOfPrecip,
    weather_address,
    weather_daliy_tip,
    weather_data,
} from './weatherState';

import { globalT } from '@/i18n';

import { useConfigStore } from '@/stores/config';
import { debugLogger } from '../utils/logger';
import { timerManager } from '../utils/timer';
import { fetch_with_retry } from '../utils/tool';
import type { WeatherAPIHandler } from './api/base';
import type { SevenHourlyData, WeatherAddress, WeatherData } from './types';
import { generateWeatherTable } from './ui/generateWeatherTable';
import { showWeatherError, showWeatherLoading } from './ui/states';

const config = useConfigStore();

// 导出类型
export type { SevenHourlyData, WeatherAddress, WeatherData };

// ============== 图标缓存 ==============

const MAX_ICON_CACHE_SIZE = 100;
const iconCache = new Map<string, string>();

export async function getIconSvg(iconPath: string): Promise<string> {
    // 直接使用 .get() 查找（Map 在找不到时返回 undefined）
    const cached = iconCache.get(iconPath);
    if (cached !== undefined) {
        return cached;
    }

    try {
        const res = await fetch(iconPath);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const svg = await res.text();
        // 缓存大小管理
        if (iconCache.size >= MAX_ICON_CACHE_SIZE) {
            const firstKey = iconCache.keys().next().value;
            if (firstKey) iconCache.delete(firstKey);
        }
        iconCache.set(iconPath, svg);
        return svg;
    } catch (error) {
        debugLogger.error('Failed to fetch weather icon', { iconPath, error });
        return '';
    }
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
    5: () => import('./api/openmeteo').then(m => m.openmeteo),
};

let isWeatherInitRunning = false;

export async function weather_init(): Promise<void> {
    // 防止并发调用
    if (isWeatherInitRunning) {
        return;
    }
    isWeatherInitRunning = true;

    try {
        const { weather_address, weather_data } = await import('./weatherState');

        // 仅在无数据时显示加载状态
        if (weather_data.temperature === '' && weather_data.weathernow === '') {
            showWeatherLoading();
        }
        if (weather_address.cityname === '') {
            try {
                const citydata = await fetch_with_retry(
                    'http://i.tianqi.com/index.php?c=code&id=11',
                    {}
                );
                const text = await citydata.text();
                const afterStrong = text.split('</strong>')[1];
                weather_address.cityname = afterStrong?.split(' ')[0] ?? weather_address.cityname;
            } catch (e) {
                console.error('Failed to get city:', e);
            }
        }

        const handlerFactory = apiHandlers[config.weather_api_choose ?? 0];
        if (handlerFactory) {
            try {
                const handler = await handlerFactory();
                await handler(weather_address, weather_data);
                await generateWeatherTable();
            } catch (error) {
                console.error('Weather fetch error:', error);
                showWeatherError(globalT('weather_error_loading') || 'Failed to load weather data');
            }
        }
    } finally {
        isWeatherInitRunning = false;
    }
}

// 天气更新间隔（毫秒）
const WEATHER_UPDATE_INTERVALS: Record<number, number> = {
    1: 15 * 60 * 1000, // 15 分钟
    2: 20 * 60 * 1000, // 20 分钟
    3: 30 * 60 * 1000, // 30 分钟
    4: 45 * 60 * 1000, // 45 分钟
    5: 60 * 60 * 1000, // 60 分钟
};
const DEFAULT_UPDATE_INTERVAL = 15 * 60 * 1000;
let weatherTimerId: string | null = null;

export function autoWeather(): void {
    weather_init();
    // 如果已有定时器，先删除
    if (weatherTimerId) {
        timerManager.remove(weatherTimerId);
    }
    weatherTimerId = timerManager.create(
        autoWeather,
        WEATHER_UPDATE_INTERVALS[config.weather_updata ?? 0] || DEFAULT_UPDATE_INTERVAL,
        'updataWeather'
    );
}
