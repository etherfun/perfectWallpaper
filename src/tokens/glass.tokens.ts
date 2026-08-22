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

/**
 * 各组件最近一次"非全局"写入的令牌快照（按前缀缓存）。
 * 全局覆盖启用期间组件写入被拦截，但原始值仍记录在此；
 * 关闭覆盖时用它恢复各组件原值（sysmon/dockbar 等无 store 键的组件
 * 无法靠 replayFromStore 恢复，必须依赖此缓存）。
 */
const componentTokenCache = new Map<string, GlassTokens>();

export function applyGlass(prefix: string, tokens: GlassTokens): void {
    const body = document.body.style;
    // 若全局覆盖生效，除 global 前缀外，所有组件写入被全局值拦截
    const overridden = globalOverride !== null && prefix !== 'global';
    if (!overridden) {
        // 非全局模式：合并到该前缀的快照并落盘 CSS 变量
        const merged = { ...(componentTokenCache.get(prefix) ?? {}), ...tokens };
        componentTokenCache.set(prefix, merged);
        writeGlassVars(prefix, merged);
        return;
    }
    // 全局覆盖生效：仅更新快照（供关闭时恢复），CSS 变量保持全局值不动
    const merged = { ...(componentTokenCache.get(prefix) ?? {}), ...tokens };
    componentTokenCache.set(prefix, merged);
}

/** 把令牌对象写为 body 上的 CSS 变量 */
function writeGlassVars(prefix: string, g: GlassTokens): void {
    const body = document.body.style;
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
        // 关闭覆盖：清除全局变量
        body.removeProperty('--global-yakeli-enabled');
        body.removeProperty('--global-yakeli-color');
        body.removeProperty('--global-yakeli');
        body.removeProperty('--global-blur-yakeli');
        body.removeProperty('--global-roundedcorners');
        // 先用 store 原值重放（有 store 键的组件兜底），
        // 再用组件令牌缓存覆盖 —— 缓存记录的是各组件最近一次真实写入，
        // 必须后执行以胜过 store 默认值（否则未配置组件被写成 0）。
        if (replayFromStore) {
            try {
                replayFromStore();
            } catch {
                // 忽略重放异常
            }
        }
        for (const prefix of GLASS_PREFIXES) {
            const cached = componentTokenCache.get(prefix);
            if (cached) {
                writeGlassVars(prefix, cached);
            } else {
                // 无缓存（该组件从未写入过）：清除变量回退到 SCSS 默认值
                body.removeProperty(`--${prefix}-yakeli-enabled`);
                body.removeProperty(`--${prefix}-yakeli-color`);
                body.removeProperty(`--${prefix}-yakeli`);
                body.removeProperty(`--${prefix}-blur-yakeli`);
                body.removeProperty(`--${prefix}-roundedcorners`);
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
    writeGlassVars('global', { yakeliEnabled: true, ...tokens });
    // 同步覆盖所有组件前缀（确保缺失 key 也显式写入，避免旧 blurColor 残留）
    for (const prefix of GLASS_PREFIXES) {
        // 若 tokens 缺少某字段，显式清除对应旧变量，避免上一轮组件自有值残留
        if (tokens.blurColor === undefined) body.removeProperty(`--${prefix}-blur-color`);
        if (tokens.blurEnabled === undefined) body.removeProperty(`--${prefix}-blur-enabled`);
        if (tokens.height === undefined) body.removeProperty(`--${prefix}-height`);
        writeGlassVars(prefix, globalOverride);
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


