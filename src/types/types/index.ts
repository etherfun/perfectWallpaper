/**
 * Wallpaper Properties 类型定义（聚合入口）
 *
 * 从 `src/types/types.ts` 拆分：
 * - 各领域 Config 接口 → api/audio/date/player/sakura/slide/time/weather
 * - WallpaperProperties（按领域拆分后交叉聚合）→ wallpaper-*
 * 对外 API 与拆分前完全一致。
 */

export type { APIUrlsConfig } from './api';
export type {
    AudioConfig,
    AudioPoint,
    AudioVisualizerConfig,
    PWCircleConfig,
    PWLineConfig,
} from './audio';
export type { DateFormatConfig } from './date';
export type { PlayerControlConfig } from './player';
export type { SakuraConfig } from './sakura';
export type { SlideConfig } from './slide';
export type { TimePositionConfig } from './time';
export type { WallpaperProperties } from './wallpaper-properties';
export type { WeatherConfig } from './weather';
