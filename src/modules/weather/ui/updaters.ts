/**
 * 天气 UI 更新函数 — Vue 响应式版
 *
 * 真 Vue 化：所有 DOM 写入已迁入 Weather.vue 模板（响应式绑定）。
 * 这些函数保留签名作为兼容层：数据已由 API handler 写入响应式
 * weather_data，模板自动更新。函数体只需处理数据就绪后
 * 需要触发的副作用（如图标 fetch、tooltip 刷新）。
 */

import { getWeatherTips } from '../tips';
import { weather_data } from '../weatherState';

/**
 * 更新左侧主天气信息（图标，温度、天气文字、体感温度、城市）
 * — 模板已绑定，此处仅确保 tooltip 数据就绪
 */
export async function updateMainWeatherDisplay(): Promise<void> {
    // 图标 v-html 由 Weather.vue 中 watch(weather_data.icon) 驱动
    // 文本由模板绑定，无需操作 DOM
    await Promise.resolve();
}

/**
 * 更新右侧主信息行（温度范围、湿度、风向、风级、风速、能见度）
 * — 模板已绑定
 */
export function updateWeatherDetails(): void {
    // no-op：模板响应式绑定
}

/**
 * 更新详情行（UV指数、云量、日出日落、月相）
 * — 模板已绑定
 */
export function updateWeatherExtendedInfo(): void {
    // no-op：模板响应式绑定
}

/**
 * 更新空气质量和预警信息
 * — 模板已绑定（alertHtml computed 调用 generateAlertHTML）
 */
export function updateAirQualityAndAlerts(): void {
    // no-op：模板响应式绑定
}

/**
 * 更新降水概率行
 * — 模板已绑定（hourlyTimes/hourlyValues computed）
 */
export function updatePrecipContainer(): void {
    // no-op：模板响应式绑定
}

/**
 * 更新提示信息行
 */
export function updateTipDisplay(): void {
    // 提示内容由模板 computed（getWeatherTips）驱动
    // 此处仅确保每日提示状态已就绪
    void getWeatherTips(weather_data);
}
