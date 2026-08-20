/**
 * 天气数据格式化函数
 * 职责：将天气数据转换为显示用的格式化字符串
 */

import { globalT } from '@/utils/i18n';
import { escapeHtml } from '@/utils/string';

import type { WeatherAlert } from './types';

/**
 * 获取空气质量描述文本
 */
export function getAirQualityText(airValue: string | number): string {
    if (!airValue || airValue === '') return '';

    let airNum = typeof airValue === 'string' ? parseFloat(airValue) : airValue;
    if (isNaN(airNum)) {
        return String(airValue);
    }

    if (airNum <= 50) return `${globalT('weather_air_quality_excellent')} (${airNum})`;
    if (airNum <= 100) return `${globalT('weather_air_quality_good')} (${airNum})`;
    if (airNum <= 150) return `${globalT('weather_air_quality_light_pollution')} (${airNum})`;
    if (airNum <= 200) return `${globalT('weather_air_quality_moderate_pollution')} (${airNum})`;
    if (airNum <= 300) return `${globalT('weather_air_quality_heavy_pollution')} (${airNum})`;
    return `${globalT('weather_air_quality_severe_pollution')} (${airNum})`;
}

/**
 * 生成天气预警HTML
 * @param alerts - 预警数组（由调用方传入，不再依赖全局单例）
 */
export function generateAlertHTML(alerts: WeatherAlert[]): string {
    if (!alerts || !Array.isArray(alerts) || alerts.length === 0) {
        return '';
    }

    const severityLevel: { [key: string]: number } = {
        extreme: 5,
        severe: 4,
        moderate: 3,
        minor: 2,
        unknown: 1,
    };

    type AlertWithIds = WeatherAlert & { ids: string[] };

    const sorted = [...alerts].sort(
        (a, b) => (severityLevel[b.level] ?? 0) - (severityLevel[a.level] ?? 0)
    );

    const alertMap: { [key: string]: AlertWithIds } = {};
    sorted.forEach(alert => {
        const existing = alertMap[alert.alert];
        if (!existing) {
            alertMap[alert.alert] = { ...alert, ids: [alert.id] };
        } else {
            existing.ids.push(alert.id);
            if ((severityLevel[alert.level] ?? 0) > (severityLevel[existing.level] ?? 0)) {
                existing.level = alert.level;
                existing.color = alert.color;
            }
        }
    });

    const parts: string[] = [];
    Object.values(alertMap).forEach(a => {
        // a.alert / a.color 来自天气 API，需转义后写入 HTML，避免 v-html 注入
        const safeAlert = escapeHtml(a.alert);
        const safeColor = escapeHtml(a.color);
        const safeIds = escapeHtml(a.ids.join(','));
        parts.push(
            `<span class="weather-alert-item" style="color: rgb(${safeColor}); font-weight: bold; margin-right: 10px;" data-id="${safeIds}">${safeAlert}</span>`
        );
    });

    return parts.join('');
}
