/**
 * 天气模块共享常量
 */

/** 天气 API 类型 ID（对应配置项 weather_api_choose 的取值） */
export const API_QWEATHER = 1;
export const API_ICUFREE = 2;
export const API_YIKETIANQI = 3;
export const API_VISUALCROSSING = 4;
export const API_OPENMETEO = 5;

/** 支持逐小时预报（七小时行）的 API 列表 */
export const HOURLY_FORECAST_APIS: readonly number[] = [
    API_QWEATHER,
    API_VISUALCROSSING,
    API_OPENMETEO,
];

/** 支持空气质量数据的 API 列表 */
export const AIR_QUALITY_APIS: readonly number[] = [API_QWEATHER, API_YIKETIANQI];

/** 和风天气图标资源目录（壁纸项目内置） */
export const QWEATHER_ICON_DIR = 'src/source/QWeather-Icons/icons/';

/** 图标缺失时的占位编号 */
export const EMPTY_ICON_CODE = '999';

/** 数据缺失时的占位文本 */
export const EMPTY_TIME_TEXT = '--:--';

/** 降水/温度显示轮换间隔（ms） */
export const PRECIP_TOGGLE_INTERVAL_MS = 20000;

/** 降水/温度切换动画时长（ms） */
export const PRECIP_TOGGLE_ANIM_MS = 350;

/** Tooltip 距鼠标/视口边缘的间距（px） */
export const TOOLTIP_EDGE_OFFSET = 20;

/** Tooltip 隐藏动画等待时长（ms） */
export const TOOLTIP_HIDE_DELAY_MS = 200;

/** 各 API 的自动刷新间隔（ms） */
export const WEATHER_UPDATE_INTERVALS: Record<number, number> = {
    [API_QWEATHER]: 15 * 60 * 1000,
    [API_ICUFREE]: 20 * 60 * 1000,
    [API_YIKETIANQI]: 30 * 60 * 1000,
    [API_VISUALCROSSING]: 45 * 60 * 1000,
    [API_OPENMETEO]: 60 * 60 * 1000,
};
export const DEFAULT_UPDATE_INTERVAL = 15 * 60 * 1000;
