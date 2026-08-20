/**
 * 天气模块入口（barrel）
 *
 * 状态与编排已迁移到 useWeatherStore（Pinia）。
 * 本文件仅导出：图标缓存辅助、纯函数工具、类型与常量，
 * 以及 store 本身，供组件与 WE 属性层消费。
 */

// 状态源（Pinia store）
export { useWeatherStore } from './store';

// 纯函数工具
export { generateAlertHTML, getAirQualityText } from './formatters';
export { getWeatherTips } from './tips';

// 图标缓存辅助（模块级缓存，无副作用）
export { clearIconCache, getIconSvg, iconSvgPath } from './icons';

// 类型与常量
export * from './constants';
export type { SevenHourlyData, WeatherAddress, WeatherData, WeatherUnit } from './types';
export { OPEN_METEO_TO_QWEATHER,VC_ICON_TO_QWEATHER } from './types';

