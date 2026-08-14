/**
 * Tooltip 模块统一导出
 */

import { useConfigStore } from "@/stores/config";

import { supportsHourlyForecast } from '../api/base';
import { API_QWEATHER } from '../constants';
import { attachWeatherAlertTooltip } from './alert';
import { attachSevenHourlyTooltip } from './sevenHourly';

const config = useConfigStore();

/**
 * 统一绑定所有tooltip事件
 */
export function tooltip(): void {
    const apiId = config.weather_api_choose ?? 0;
    if (apiId === API_QWEATHER) {
        document.querySelectorAll('.weather-alert-item').forEach(item => {
            attachWeatherAlertTooltip(item as HTMLElement);
        });
    }
    if (supportsHourlyForecast(apiId)) {
        document.querySelectorAll('.precip-time-cell').forEach((el, i) => {
            attachSevenHourlyTooltip(el as HTMLElement, i);
        });
    }
}

export { attachWeatherAlertTooltip } from './alert';
export { attachSevenHourlyTooltip } from './sevenHourly';
export { getTime } from './time';
