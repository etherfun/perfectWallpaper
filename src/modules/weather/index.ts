/**
 * 澶╂皵妯″潡鍏ュ彛鏂囦欢
 * 鏁村悎鎵€鏈夊ぉ姘旂浉鍏崇殑API銆佸伐鍏峰嚱鏁板拰UI
 */

export { getWeatherTips } from './tips';

// UI 妯″潡瀵煎嚭
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

// 鏍煎紡鍖栧伐鍏峰鍑?
export { generateAlertHTML, getAirQualityText } from './formatters';

// 鐘舵€佸鍑猴紙浠?weatherState 閲嶅鍑猴級
export {
    isAnimatingPrecipToggle,
    precipTemperatureToggleTimer,
    showTemperatureInsteadOfPrecip,
    weather_address,
    weather_daliy_tip,
    weather_data,
} from './weatherState';

import { useConfigStore } from '@/stores/config';
import { globalT } from '@/utils/i18n';

import { debugLogger } from '../../utils/logger';
import { timerManager } from '../../utils/timer';
import { fetch_with_retry } from '../../utils/tool';
import type { WeatherAPIHandler } from './api/base';
import type { SevenHourlyData, WeatherAddress, WeatherData } from './types';
import { generateWeatherTable } from './ui/generateWeatherTable';
import { showWeatherError, showWeatherLoading } from './ui/states';

const config = useConfigStore();

// 瀵煎嚭绫诲瀷
export type { SevenHourlyData, WeatherAddress, WeatherData };

// ============== 鍥炬爣缂撳瓨 ==============

const MAX_ICON_CACHE_SIZE = 100;
const iconCache = new Map<string, string>();

export async function getIconSvg(iconPath: string): Promise<string> {
    // 鐩存帴浣跨敤 .get() 鏌ユ壘锛圡ap 鍦ㄦ壘涓嶅埌鏃惰繑鍥?undefined锛?
    const cached = iconCache.get(iconPath);
    if (cached !== undefined) {
        return cached;
    }

    try {
        const res = await fetch(iconPath);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const svg = await res.text();
        // 缂撳瓨澶у皬绠＄悊
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

// ============== API 鐩稿叧 ==============

const apiHandlers: { [key: number]: () => Promise<WeatherAPIHandler> } = {
    1: () => import('./api/qweather').then(m => m.qweather),
    2: () => import('./api/icufree').then(m => m.icufree),
    3: () => import('./api/yiketianqi').then(m => m.yiketianqi),
    4: () => import('./api/visualcrossing').then(m => m.visualcrossing),
    5: () => import('./api/openmeteo').then(m => m.openmeteo),
};

let isWeatherInitRunning = false;

export async function weather_init(): Promise<void> {
    // 闃叉骞跺彂璋冪敤
    if (isWeatherInitRunning) {
        return;
    }
    isWeatherInitRunning = true;

    try {
        const { weather_address, weather_data } = await import('./weatherState');

        // 浠呭湪鏃犳暟鎹椂鏄剧ず鍔犺浇鐘舵€?
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

// 澶╂皵鏇存柊闂撮殧锛堟绉掞級
const WEATHER_UPDATE_INTERVALS: Record<number, number> = {
    1: 15 * 60 * 1000, // 15 鍒嗛挓
    2: 20 * 60 * 1000, // 20 鍒嗛挓
    3: 30 * 60 * 1000, // 30 鍒嗛挓
    4: 45 * 60 * 1000, // 45 鍒嗛挓
    5: 60 * 60 * 1000, // 60 鍒嗛挓
};
const DEFAULT_UPDATE_INTERVAL = 15 * 60 * 1000;
let weatherTimerId: string | null = null;

export function autoWeather(): void {
    weather_init();
    // 濡傛灉宸叉湁瀹氭椂鍣紝鍏堝垹闄?
    if (weatherTimerId) {
        timerManager.remove(weatherTimerId);
    }
    weatherTimerId = timerManager.create(
        autoWeather,
        WEATHER_UPDATE_INTERVALS[config.weather_updata ?? 0] || DEFAULT_UPDATE_INTERVAL,
        'updataWeather'
    );
}
