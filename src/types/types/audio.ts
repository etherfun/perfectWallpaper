/**
 * Wallpaper Properties 类型定义 — 音频可视化配置
 */

export interface AudioVisualizerConfig {
    visual_audio_model: number;
    PWCircle_show_bool: boolean;
    PWLine_show_bool: boolean;
}

export interface AudioPoint {
    x: number;
    y: number;
}

export interface PWCircleConfig {
    style: number;
    r: number;
    color: string;
    blurColor: string;
    arr1: AudioPoint[];
    arr2: AudioPoint[];
    rotation: number;
    rotationcopy: number;
    offsetAngle: number;
    waveArr: number[];
    cX: number;
    cY: number;
    range: number;
    shadowBlur: number;
    lineWidth: number;
    showCircle: boolean;
    wavetransparency: number;
    showSemiCircle: boolean;
    SemiCircledirection: number;
    Polygon: number;
    SolidColorGradient: boolean;
    BlurColorGradient: boolean;
    ColorRhythm: boolean;
    ColorMode: number;
    TagNow: number;
    GradientRate: number;
}

export interface PWLineConfig {
    style: number;
    sw: number;
    lineWidth: number;
    waveArr: number[];
    range: number;
    color: string;
    blurColor: string;
    shadowBlur: number;
    arr1: AudioPoint[];
    arr2: AudioPoint[];
    arr3: AudioPoint[];
    LineX: number;
    LineY: number;
    showLine: boolean;
    LinePosition: number;
    Direction: number;
    LineDensity: number;
    LineTransparency: number;
    MiddleLine: boolean;
    TagNow: number;
    SolidColorGradient: boolean;
    BlurColorGradient: boolean;
    ColorRhythm: boolean;
    ColorMode: number;
    GradientRate: number;
}

export interface AudioConfig {
    opacity: number;
    color: string;
    shadowColor: string;
    shadowBlur: number;
    offsetX: number;
    offsetY: number;
    isClickOffset: boolean;
}
