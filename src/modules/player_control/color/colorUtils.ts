/**
 * 纯颜色工具函数
 */
import type { PaletteColor, RgbTuple } from '../types';

/**
 * 把 #rrggbb / rrggbb 形式的十六进制颜色转为 [r, g, b] 元组。
 * 也支持 WE 空格分隔格式 "r g b"。
 * 解析失败时回退为白色（避免盖掉 SCSS CSS 变量）。
 */
export function hexToRgb(hex: string): RgbTuple {
    // 尝试十六进制
    const hexResult = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (hexResult?.[1] && hexResult[2] && hexResult[3]) {
        return [
            parseInt(hexResult[1], 16),
            parseInt(hexResult[2], 16),
            parseInt(hexResult[3], 16),
        ];
    }

    // 尝试 WE 空格分隔 "r g b" 格式
    const spaceResult = /^(\d+)\s+(\d+)\s+(\d+)$/.exec(hex);
    if (spaceResult?.[1] && spaceResult[2] && spaceResult[3]) {
        return [
            parseInt(spaceResult[1], 10),
            parseInt(spaceResult[2], 10),
            parseInt(spaceResult[3], 10),
        ];
    }

    // 解析失败 → 白色，避免黑色盖掉 SCSS CSS 变量
    return [255, 255, 255];
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
    if (typeof (color as any)?.rgb !== 'function') return null;
    const rgb = color.rgb();
    return [rgb.r, rgb.g, rgb.b];
}
