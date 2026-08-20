/** 统一亚克力/毛玻璃令牌（替代各组件散落的 yakeli/blur 变量） */
import { applyVisibility } from './visibility.tokens';

export type GlassTokens = {
    yakeliEnabled?: boolean;
    yakeliColor?: [number, number, number];
    yakeli?: number; // 0..1
    blurYakeli?: string; // e.g. '10px'
    blurEnabled?: boolean;
    blurColor?: [number, number, number];
    roundedCorners?: number;
    height?: string;
};

const GLASS_PREFIXES = [
    'clock',
    'date',
    'hitokoto',
    'countdown',
    'weather',
    'player',
    'picture-info',
    'sysmon',
    'dockbar',
] as const;

// 全局覆盖缓存：启用时同步写入所有组件 CSS 变量
let globalOverride: GlassTokens | null = null;

export function applyGlass(prefix: string, tokens: GlassTokens): void {
    const body = document.body.style;
    // 若全局覆盖生效，除 global 前缀外，所有组件写入被全局值拦截
    const effective: GlassTokens =
        globalOverride && prefix !== 'global' ? { ...tokens, ...globalOverride } : tokens;
    const g = prefix === 'global' ? tokens : effective;
    if (g.yakeliEnabled !== undefined) body.setProperty(`--${prefix}-yakeli-enabled`, g.yakeliEnabled ? '1' : '0');
    if (g.yakeliColor) body.setProperty(`--${prefix}-yakeli-color`, g.yakeliColor.join(','));
    if (g.yakeli !== undefined) body.setProperty(`--${prefix}-yakeli`, String(g.yakeli));
    if (g.blurYakeli !== undefined) body.setProperty(`--${prefix}-blur-yakeli`, g.blurYakeli);
    if (g.blurEnabled !== undefined) body.setProperty(`--${prefix}-blur-enabled`, g.blurEnabled ? '1' : '0');
    if (g.blurColor) body.setProperty(`--${prefix}-blur-color`, g.blurColor.join(','));
    if (g.roundedCorners !== undefined) body.setProperty(`--${prefix}-roundedcorners`, String(g.roundedCorners));
    if (g.height !== undefined) body.setProperty(`--${prefix}-height`, g.height);
}

/**
 * 由 store 重放各组件 yakeli 原值（关闭全局覆盖时调用，避免闪白）。
 * 由 useGlobalYakeliProperties 传入，避免 tokens 循环依赖 store。
 */
let replayFromStore: (() => void) | null = null;
export function registerGlassReplay(fn: () => void): void {
    replayFromStore = fn;
}

/** 应用全局亚克力覆盖：enabled=true 时 overrides 写入 --global-* 并同步覆盖所有组件前缀 */
export function applyGlobalGlassOverride(
    enabled: boolean,
    tokens: GlassTokens
): void {
    const body = document.body.style;
    if (!enabled) {
        globalOverride = null;
        // 关闭覆盖：清除全局变量并移除已覆盖的组件变量，等待下次各组件写入或重放
        body.removeProperty('--global-yakeli-enabled');
        body.removeProperty('--global-yakeli-color');
        body.removeProperty('--global-yakeli');
        body.removeProperty('--global-blur-yakeli');
        body.removeProperty('--global-roundedcorners');
        // 清除各组件被覆盖的变量，避免旧值残留
        for (const prefix of GLASS_PREFIXES) {
            body.removeProperty(`--${prefix}-yakeli-enabled`);
            body.removeProperty(`--${prefix}-yakeli-color`);
            body.removeProperty(`--${prefix}-yakeli`);
            body.removeProperty(`--${prefix}-blur-yakeli`);
            body.removeProperty(`--${prefix}-roundedcorners`);
        }
        // 立刻用 store 原值重放，避免关闭瞬间闪白（无依赖时则等待下次推送）
        if (replayFromStore) {
            try {
                replayFromStore();
            } catch {
                // 忽略重放异常
            }
        }
        return;
    }
    // 启用：yakeliEnabled 恒为 1，透明度/模糊/圆角/颜色由 sliders 决定
    globalOverride = {
        yakeliEnabled: true,
        ...tokens,
    };
    // 同步写入全局 CSS 变量（供调试/回退）
    applyGlass('global', { yakeliEnabled: true, ...tokens });
    // 同步覆盖所有组件前缀（确保缺失 key 也显式写入，避免旧 blurColor 残留）
    for (const prefix of GLASS_PREFIXES) {
        // 若 tokens 缺少某字段，显式清除对应旧变量，避免上一轮组件自有值残留
        if (tokens.blurColor === undefined) body.removeProperty(`--${prefix}-blur-color`);
        if (tokens.blurEnabled === undefined) body.removeProperty(`--${prefix}-blur-enabled`);
        if (tokens.height === undefined) body.removeProperty(`--${prefix}-height`);
        applyGlass(prefix, globalOverride);
    }
}

/** 供调试：当前是否全局覆盖 */
export function isGlobalGlassOverridden(): boolean {
    return globalOverride !== null;
}

export function applyPictureInfoTokens(tokens: Partial<GlassTokens> & { visible?: boolean }): void {
    if (tokens.visible !== undefined) {
        applyVisibility('picture-info', tokens.visible);
        const rest = { ...tokens } as Record<string, unknown>;
        delete rest.visible;
        applyGlass('picture-info', rest as GlassTokens);
        return;
    }
    applyGlass('picture-info', tokens);
}


