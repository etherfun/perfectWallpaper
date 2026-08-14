/**
 * Wallpaper Properties 类型定义 — 音频可视化（PWCircle/PWLine）与音频参数
 *
 * 从 `src/types/types.ts` 拆出的 WallpaperProperties 声明片段（PWCircle/PWLine/音频参数），
 * 由 ./wallpaper-properties 交叉类型聚合，对外类型完全不变。
 */

// WallpaperProperties 接口 - 所有属性的类型定义
export interface WallpaperPropertiesAudioVisual {
    // 音频可视化圆圈参数
    PolygonAngle?: { value: number };
    style?: { value: number };
    radius?: { value: number };
    range?: { value: number };
    color?: { value: string };
    blurColor?: { value: string };
    cX?: { value: number };
    cY?: { value: number };
    ColorMode?: { value: number };
    SolidColorGradient?: { value: boolean };
    BlurColorGradient?: { value: boolean };
    ColorRhythm?: { value: boolean };
    GradientRate?: { value: number };
    lineWidth?: { value: number };
    rotation?: { value: number };
    direction?: { value: number };
    wavetransparency?: { value: number };
    showSemiCircle?: { value: boolean };
    SemiCircledirection?: { value: number };

    // PWLine参数
    PWLinePosition?: { value: number };
    PWLineStyle?: { value: number };
    PWLineDirection?: { value: number };
    PWLineWidth?: { value: number };
    PWLineSpacing?: { value: number };
    PWLineDensity?: { value: number };
    PWLineRange?: { value: number };
    PWLineTransparency?: { value: number };
    PWLineColor?: { value: string };
    PWLineBlurColor?: { value: string };
    PWLineX?: { value: number };
    PWLineY?: { value: number };
    PWMiddleLine?: { value: boolean };
    PWLineColorMode?: { value: number };
    PWLineSolidColorGradient?: { value: boolean };
    PWLineBlurColorGradient?: { value: boolean };
    PWLineColorRhythm?: { value: boolean };
    PWLineGradientRate?: { value: number };

    // 音频参数
    audio_amplitude?: { value: number };
    audio_decline?: { value: number };
    audio_isRing?: { value: boolean };
    audio_isStaticRing?: { value: boolean };
    audio_isInnerRing?: { value: boolean };
    audio_isOuterRing?: { value: boolean };
    audio_radius?: { value: number };
    audio_ringRotation?: { value: number };
    audio_opacity?: { value: number };
    audio_color?: { value: string };
    audio_shadowColor?: { value: string };
    audio_shadowBlur?: { value: number };
    audio_offsetX?: { value: number };
    audio_offsetY?: { value: number };
    audio_isClickOffset?: { value: boolean };
    audio_isLineTo?: { value: boolean };
    audio_firstPoint?: { value: number };
    audio_secondPoint?: { value: number };
    audio_pointNum?: { value: number };
    audio_distance?: { value: number };
    audio_lineWidth?: { value: number };
    audio_isBall?: { value: boolean };
    audio_ballSpacer?: { value: number };
    audio_ballSize?: { value: number };
    audio_ballRotation?: { value: number };

    // 音频平滑参数
    audioSmoothEnabled?: { value: boolean };
    audioSmoothFactor?: { value: number };
    audioSpatialWindow?: { value: number };
}
