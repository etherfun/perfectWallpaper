/** 统一亚克力/毛玻璃令牌（替代各组件散落的 yakeli/blur 变量） */
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

export function applyGlass(prefix: string, tokens: GlassTokens): void {
    const body = document.body.style;
    if (tokens.yakeliEnabled !== undefined) body.setProperty(`--${prefix}-yakeli-enabled`, tokens.yakeliEnabled ? '1' : '0');
    if (tokens.yakeliColor) body.setProperty(`--${prefix}-yakeli-color`, tokens.yakeliColor.join(','));
    if (tokens.yakeli !== undefined) body.setProperty(`--${prefix}-yakeli`, String(tokens.yakeli));
    if (tokens.blurYakeli !== undefined) body.setProperty(`--${prefix}-blur-yakeli`, tokens.blurYakeli);
    if (tokens.blurEnabled !== undefined) body.setProperty(`--${prefix}-blur-enabled`, tokens.blurEnabled ? '1' : '0');
    if (tokens.blurColor) body.setProperty(`--${prefix}-blur-color`, tokens.blurColor.join(','));
    if (tokens.roundedCorners !== undefined) body.setProperty(`--${prefix}-roundedcorners`, String(tokens.roundedCorners));
    if (tokens.height !== undefined) body.setProperty(`--${prefix}-height`, tokens.height);
}

export function applyPictureInfoTokens(tokens: Partial<GlassTokens> & { visible?: boolean }): void {
    if (tokens.visible !== undefined) {
        const { applyVisibility } = require('./visibility.tokens') as typeof import('./visibility.tokens');
        applyVisibility('picture-info', tokens.visible);
        const rest = { ...tokens } as Record<string, unknown>;
        delete rest.visible;
        applyGlass('picture-info', rest as GlassTokens);
        return;
    }
    applyGlass('picture-info', tokens);
}


