/**
 * Color parsing and conversion utilities
 * Extracted from repeated patterns across property handlers
 */

/**
 * Parse a color string (space-separated values like "0.5 0.3 1.0") to RGB array
 */
export function parseColorString(colorStr: string): number[] {
    return colorStr.split(' ').map((c: string) => Math.ceil(parseFloat(c) * 255));
}

/**
 * Convert RGB array to RGBA string
 */
export function colorToRGBA(color: number[]): string {
    if (color.length < 3) return 'rgba(0,0,0,0.8)';
    const alpha = color[3] !== undefined ? color[3] : 255;
    return `rgba(${color[0]},${color[1]},${color[2]},${alpha / 255})`;
}

/**
 * Convert RGB array to RGB string
 */
export function colorToRGB(color: number[]): string {
    if (color.length < 3) return 'rgb(0,0,0)';
    return `rgb(${color[0]},${color[1]},${color[2]})`;
}

/**
 * Create RGBA string from color components
 */
export function rgba(r: number, g: number, b: number, a: number = 1): string {
    return `rgba(${r},${g},${b},${a})`;
}
