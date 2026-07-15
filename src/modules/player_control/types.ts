/**
 * 共享类型定义
 */

export type RgbTuple = [number, number, number];

/**
 * colorthief 返回的 Color 对象有 .rgb() 方法
 */
export interface ColorImpl {
    rgb(): { r: number; g: number; b: number };
}

/** colorthief 调色板/主色的实际返回类型（数组形式或带 rgb() 方法） */
export type PaletteColor = RgbTuple | ColorImpl | null | undefined;

/** 播放状态码（与 config.runtime.playerInfo.playerState 对齐） */
export const PLAYER_STATE = {
    STOPPED: 0,
    PLAYING: 1,
    PAUSED: 2,
} as const;
