/**
 * 流体效果内部常量
 *
 * 集中管理模块内部的固定值，避免硬编码散落。
 */

/** 全屏模式下的默认占位图片 */
export const FALLBACK_FULLSCREEN_IMAGE = "url('imgs/1.jpg')";

/** 全屏模式背景样式的预设值 */
export const FULLSCREEN_BACKGROUND_STYLE = {
    size: 'cover',
    position: 'center',
    repeat: 'no-repeat',
} as const;

/** 渲染器对画布位移的循环索引边界（4 个画布 2x2 排列） */
export const CANVAS_GRID_SIZE = 2;
