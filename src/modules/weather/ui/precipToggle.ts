/**
 * 降水/温度切换逻辑 — Vue 响应式版
 * 职责：处理降水概率和温度显示的定时切换
 *
 * 真 Vue 化：不再操作 DOM（动画交给模板 Transition），
 * 只翻转响应式状态 showTemperatureInsteadOfPrecip 并维护定时器。
 */

import { useConfigStore } from '@/stores/config';

import { supportsHourlyForecast } from '../api/base';
import { PRECIP_TOGGLE_ANIM_MS, PRECIP_TOGGLE_INTERVAL_MS } from '../constants';
import {
    clearPrecipTimer,
    isAnimatingPrecipToggle,
    setIsAnimatingPrecipToggle,
    setPrecipTemperatureToggleTimer,
    toggleShowTemperatureInsteadOfPrecip,
    weather_data,
} from '../weatherState';

const config = useConfigStore();

/**
 * 切换降水/温度显示
 */
export function togglePrecipTemperatureDisplay(): void {
    // 检查数据是否可用
    if (!weather_data.sevenHourlyData) return;

    // 防止动画期间重复切换
    if (isAnimatingPrecipToggle.value) return;
    setIsAnimatingPrecipToggle(true);

    // 切换显示状态（模板自动响应）
    toggleShowTemperatureInsteadOfPrecip();

    // 动画结束后重置标志
    setTimeout(() => {
        setIsAnimatingPrecipToggle(false);
    }, PRECIP_TOGGLE_ANIM_MS);
}

/**
 * 启动降水/温度轮换定时器
 */
export function startPrecipTemperatureToggleTimer(): void {
    // 清除已有定时器
    clearPrecipTimer();

    // 仅当有降水行时启动定时器（weather_api_choose 为 1, 4, 5）
    if (supportsHourlyForecast(config.weather_api_choose ?? 0)) {
        // 每 20 秒切换一次显示
        setPrecipTemperatureToggleTimer(
            window.setInterval(togglePrecipTemperatureDisplay, PRECIP_TOGGLE_INTERVAL_MS)
        );
    }
}

/**
 * 清除降水/温度轮换定时器
 */
export function clearPrecipTemperatureToggleTimer(): void {
    clearPrecipTimer();
}
