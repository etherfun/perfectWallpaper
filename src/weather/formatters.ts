/**
 * 天气数据格式化函数
 * 职责：将天气数据转换为显示用的格式化字符串
 */

import { i18n } from '../utils/i18n';
import type { WeatherAlert } from './types';
import { weather_data } from './weatherState';

/**
 * 获取空气质量描述文本
 */
export function getAirQualityText(airValue: string | number): string {
    if (!airValue || airValue === "") return "";

    let airNum = typeof airValue === 'string' ? parseFloat(airValue) : airValue;
    if (isNaN(airNum)) {
        return String(airValue);
    }

    if (airNum <= 50) return `${i18n('weather_air_quality_excellent')} (${airNum})`;
    if (airNum <= 100) return `${i18n('weather_air_quality_good')} (${airNum})`;
    if (airNum <= 150) return `${i18n('weather_air_quality_light_pollution')} (${airNum})`;
    if (airNum <= 200) return `${i18n('weather_air_quality_moderate_pollution')} (${airNum})`;
    if (airNum <= 300) return `${i18n('weather_air_quality_heavy_pollution')} (${airNum})`;
    return `${i18n('weather_air_quality_severe_pollution')} (${airNum})`;
}

/**
 * 生成天气预警HTML
 */
export function generateAlertHTML(): string {
    if (!weather_data.weatherAlert || !Array.isArray(weather_data.weatherAlert) || weather_data.weatherAlert.length === 0) {
        return '';
    }

    const severityLevel: { [key: string]: number } = {
        extreme: 5,
        severe: 4,
        moderate: 3,
        minor: 2,
        unknown: 1
    };

    type AlertWithIds = WeatherAlert & { ids: string[] };

    const sorted = [...weather_data.weatherAlert].sort((a, b) =>
        severityLevel[b.level] - severityLevel[a.level]
    );

    const alertMap: { [key: string]: AlertWithIds } = {};
    sorted.forEach(alert => {
        if (!alertMap[alert.alert]) {
            alertMap[alert.alert] = { ...alert, ids: [alert.id] };
        } else {
            alertMap[alert.alert].ids.push(alert.id);
            if (severityLevel[alert.level] > severityLevel[alertMap[alert.alert].level]) {
                alertMap[alert.alert].level = alert.level;
                alertMap[alert.alert].color = alert.color;
            }
        }
    });

    const parts: string[] = [];
    Object.values(alertMap).forEach(a => {
        const idsString = a.ids.join(',');
        parts.push(`<span class="weather-alert-item" style="color: rgb(${a.color}); font-weight: bold; margin-right: 10px;" data-id="${idsString}">${a.alert}</span>`);
    });

    return parts.join('');
}
