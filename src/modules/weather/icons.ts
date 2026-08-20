/**
 * 天气图标缓存辅助
 * 模块级 LRU 风格缓存（上限 MAX_ICON_CACHE_SIZE），无副作用。
 */

import { debugLogger } from '@/utils/logger';

import { QWEATHER_ICON_DIR } from './constants';

const MAX_ICON_CACHE_SIZE = 100;
const iconCache = new Map<string, string>();

/**
 * 获取图标 SVG 文本（带缓存）
 */
export async function getIconSvg(iconPath: string): Promise<string> {
    const cached = iconCache.get(iconPath);
    if (cached !== undefined) {
        return cached;
    }

    try {
        const res = await fetch(iconPath);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const svg = await res.text();
        if (iconCache.size >= MAX_ICON_CACHE_SIZE) {
            const firstKey = iconCache.keys().next().value;
            if (firstKey) iconCache.delete(firstKey);
        }
        iconCache.set(iconPath, svg);
        return svg;
    } catch (error) {
        debugLogger.error('Failed to fetch weather icon', { iconPath, error });
        return '';
    }
}

export function clearIconCache(): void {
    iconCache.clear();
}

/** 组装和风天气图标 SVG 路径 */
export function iconSvgPath(icon: string, fill = false): string {
    return `${QWEATHER_ICON_DIR}${icon}${fill ? '-fill' : ''}.svg`;
}
