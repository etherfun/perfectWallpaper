import { globalT } from '@/utils/i18n';
import { debugLogger } from '@/utils/logger';

import { EMPTY_TIME_TEXT } from './constants';
import { OPEN_METEO_TO_QWEATHER } from './types';

/** 夜间时段边界（小时）：18 点后、6 点前视为夜间 */
const NIGHT_START_HOUR = 18;
const NIGHT_END_HOUR = 6;

/**
 * 格式化时间（用于日出日落等时间显示）
 * @param timeString - 时间字符串
 * @returns 格式化后的时间字符串（HH:mm）
 */
export function formatTime(timeString: string | undefined): string {
    if (!timeString) return EMPTY_TIME_TEXT;

    try {
        const date = new Date(timeString);
        if (isNaN(date.getTime())) {
            const timeMatch = timeString.match(/(\d{1,2}):(\d{1,2})/);
            if (timeMatch?.[1] && timeMatch[2]) {
                const hours = timeMatch[1].padStart(2, '0');
                const minutes = timeMatch[2].padStart(2, '0');
                return `${hours}:${minutes}`;
            }
            return timeString;
        }

        const hours = date.getHours().toString().padStart(2, '0');
        const minutes = date.getMinutes().toString().padStart(2, '0');
        return `${hours}:${minutes}`;
    } catch (error) {
        debugLogger.error('[Weather] Failed to format time', { timeString, error });
        return timeString;
    }
}

/**
 * 获取 Open-Meteo 天气代码对应的和风天气图标
 * @param weatherCode - Open-Meteo 天气代码
 * @param timeString - 时间字符串（用于区分白天/夜间图标）
 * @returns 和风天气图标编号
 */
export function getOpenMeteoIcon(weatherCode: number, timeString?: string): number {
    const defaultIcon = { day: 100, night: 150 };
    const iconMapping = OPEN_METEO_TO_QWEATHER[weatherCode] || defaultIcon;

    let isNight = false;
    if (timeString) {
        const time = new Date(timeString);
        const hour = time.getHours();
        isNight = hour >= NIGHT_START_HOUR || hour < NIGHT_END_HOUR;
    }

    return isNight ? iconMapping.night : iconMapping.day;
}

/** 与降雨相关的 Open-Meteo 天气代码 */
const RAIN_CODES = [51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82, 95, 96, 99];
/** 与降雪相关的 Open-Meteo 天气代码 */
const SNOW_CODES = [71, 73, 75, 77, 85, 86];
/** 冻雨相关天气代码 */
const FREEZING_RAIN_CODES = [56, 57, 66, 67];
/** 冰雹相关天气代码 */
const HAIL_CODES = [77];

/**
 * 根据 Open-Meteo 天气代码推断降水类型
 * @param weatherCode - Open-Meteo 天气代码
 * @returns 降水类型文本
 */
export function getPrecipTypeFromCode(weatherCode: number): string {
    if (RAIN_CODES.includes(weatherCode)) {
        if (FREEZING_RAIN_CODES.includes(weatherCode)) {
            return globalT('weather_precip_type_freezing_rain');
        }
        if (HAIL_CODES.includes(weatherCode)) {
            return globalT('weather_precip_type_hail');
        }
        return globalT('weather_precip_type_rain');
    }
    if (SNOW_CODES.includes(weatherCode)) {
        return globalT('weather_precip_type_snow');
    }

    return globalT('weather_precip_type_none');
}
