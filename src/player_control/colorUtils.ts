/**
 * 纯颜色工具函数
 */
import type { PaletteColor, RgbTuple } from './types';

/**
 * 把 #rrggbb / rrggbb 形式的十六进制颜色转为 [r, g, b] 元组。
 * 解析失败时回退为黑色。
 */
export function hexToRgb(hex: string): RgbTuple {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
        ? [parseInt(result[1], 16), parseInt(result[2], 16), parseInt(result[3], 16)]
        : [0, 0, 0];
}

/**
 * 把 colorthief 返回的 Color 对象（或数组）转换成 [r, g, b] 元组。
 * 输入为空时返回 null。
 */
export function colorToRgb(color: PaletteColor): RgbTuple | null {
    if (!color) return null;
    if (Array.isArray(color)) {
        return color as RgbTuple;
    }
    const rgb = color.rgb();
    return [rgb.r, rgb.g, rgb.b];
}
