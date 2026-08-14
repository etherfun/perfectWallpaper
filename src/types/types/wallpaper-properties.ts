/**
 * Wallpaper Properties 类型定义 — 聚合
 *
 * 将按领域拆分的 WallpaperProperties 各片段交叉组合为完整接口，
 * 对外暴露的字段与拆分前的 `src/types/types.ts` 完全一致。
 */

import type { WallpaperPropertiesAudioVisual } from './wallpaper-audio-visual';
import type { WallpaperPropertiesExtra } from './wallpaper-extra';
import type { WallpaperPropertiesGlobal } from './wallpaper-global';
import type { WallpaperPropertiesMedia } from './wallpaper-media';

// WallpaperProperties 接口 - 所有属性的类型定义
export type WallpaperProperties = WallpaperPropertiesGlobal &
    WallpaperPropertiesMedia &
    WallpaperPropertiesAudioVisual &
    WallpaperPropertiesExtra;
