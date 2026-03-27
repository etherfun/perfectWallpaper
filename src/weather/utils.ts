import { i18n } from '../utils/i18n';
import { OPEN_METEO_TO_QWEATHER } from './types';

/**
 * 格式化时间函数（用于日出日落时间）
 * @param timeString - 时间字符串
 * @returns 格式化后的时间字符串
 */
export function formatTime(timeString: string | undefined): string {
    if (!timeString) return "--:--";

    try {
        const date = new Date(timeString);
        if (isNaN(date.getTime())) {
            const timeMatch = timeString.match(/(\d{1,2}):(\d{1,2})/);
            if (timeMatch) {
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
        console.error('Error formatting time:', error);
        return timeString;
    }
}

/**
 * 获取 Open-Meteo 天气代码对应的和风天气图标
 * @param weatherCode - Open-Meteo 天气代码
 * @param timeString - 时间字符串
 * @returns 和风天气图标编号
 */
export function getOpenMeteoIcon(weatherCode: number, timeString?: string): number {
    const defaultIcon = { day: 100, night: 150 };
    const iconMapping = OPEN_METEO_TO_QWEATHER[weatherCode] || defaultIcon;

    let isNight = false;
    if (timeString) {
        const time = new Date(timeString);
        const hour = time.getHours();
        isNight = hour >= 18 || hour < 6;
    }

    return isNight ? iconMapping.night : iconMapping.day;
}

/**
 * 根据Open-Meteo天气代码推断降水类型
 * @param weatherCode - Open-Meteo 天气代码
 * @returns 降水类型文本
 */
export function getPrecipTypeFromCode(weatherCode: number): string {
    // 雨相关代码
    const rainCodes = [51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82, 95, 96, 99];
    // 雪相关代码
    const snowCodes = [71, 73, 75, 77, 85, 86];
    // 冻雨相关代码
    const freezingRainCodes = [56, 57, 66, 67];
    // 冰雹相关代码
    const hailCodes = [77];

    if (rainCodes.includes(weatherCode)) {
        if (freezingRainCodes.includes(weatherCode)) {
            return i18n('weather_precip_type_freezing_rain');
        } else if (hailCodes.includes(weatherCode)) {
            return i18n('weather_precip_type_hail');
        }
        return i18n('weather_precip_type_rain');
    } else if (snowCodes.includes(weatherCode)) {
        return i18n('weather_precip_type_snow');
    }

    return i18n('weather_precip_type_none');
}
