/**
 * 天气 UI 状态函数 — Vue 响应式版
 * 职责：控制天气加载/错误等 UI 状态
 */

import { weatherUiState } from '../weatherState';

/**
 * 显示天气加载状态
 */
export function showWeatherLoading(): void {
    weatherUiState.loading = true;
    weatherUiState.error = '';
}

/**
 * 隐藏天气加载状态
 */
export function hideWeatherLoading(): void {
    weatherUiState.loading = false;
}

/**
 * 显示天气错误信息
 */
export function showWeatherError(message: string): void {
    weatherUiState.loading = false;
    weatherUiState.error = message;
}
