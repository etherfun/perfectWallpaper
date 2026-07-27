/**
 * propertyHandlers 共用工具
 */
import { debugLogger } from './logger';

/** 在 FirstLoad 时输出 "参数初始化完成" 日志 */
export function logInitComplete(tag: string, displayName: string, FirstLoad: boolean): void {
    if (FirstLoad) { debugLogger.info(`${tag} ${displayName}参数初始化完成`); }
}

/** 把 WE 的归一化颜色字符串 "1 0.5 0.2" → RGB 元组 [255, 128, 51] */
export function colorToRgb(normalized: string): [number, number, number] {
    return normalized.split(' ').map(c => Math.ceil(parseFloat(c) * 255)) as [number, number, number];
}

/**
 * 属性映射 helper — 处理最常见的模式：
 *   if (properties.xxx) { patch.xxx = v; cssVars.forEach(([k, f]) => set(k, f(v))) }
 */
export function applyProp(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    properties: any,
    key: string,
    patch: Record<string, unknown>,
    storeKey: string,
    cssVars?: Array<[string, (v: any) => string]>,
): void {
    const prop = properties[key];
    if (prop === undefined) return;
    const v = prop.value;
    patch[storeKey] = v;
    if (cssVars) {
        for (const [cssKey, fn] of cssVars) {
            document.body.style.setProperty(cssKey, fn(v));
        }
    }
}

/** 显示/隐藏 toggle: flex / none */
export function applyVisibility(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    properties: any,
    key: string,
    patch: Record<string, unknown>,
    storeKey: string,
    cssVar: string,
): void {
    applyProp(properties, key, patch, storeKey, [
        [cssVar, (v: boolean) => v ? 'flex' : 'none'],
    ]);
}
