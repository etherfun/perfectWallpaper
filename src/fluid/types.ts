/**
 * 流体效果类型定义
 */

/**
 * 流体效果配置选项
 */
export interface FluidEffectOptions {
    resolution?: number;
    blurAmount?: number;
    displacementScale?: number;
    turbulenceSeed?: number;
    turbulenceFrequency?: number;
    turbulenceOctaves?: number;
    canvasDisplacementAmplitude?: number;
    fullscreen?: boolean;
}

/**
 * 流体效果配置状态
 */
export interface FluidEffectConfigState {
    enabled: boolean;
    resolution: number;
    blurAmount: number;
    displacementScale: number;
    turbulenceFrequency: number;
    turbulenceOctaves: number;
    fullscreenEnabled: boolean;
    canvasDisplacementAmplitude: number;
}

/**
 * 默认配置值
 */
export const DEFAULT_FLUID_EFFECT_OPTIONS: Required<FluidEffectOptions> = {
    resolution: 384,  // 降低默认分辨率以提升性能 (512 -> 384)
    blurAmount: 5,
    displacementScale: 400,
    turbulenceSeed: Math.floor(Math.random() * 1000),
    turbulenceFrequency: 0.005,
    turbulenceOctaves: 1,
    canvasDisplacementAmplitude: 200,
    fullscreen: false
};

export const DEFAULT_FLUID_EFFECT_CONFIG: FluidEffectConfigState = {
    enabled: true,
    resolution: 384,  // 降低默认分辨率以提升性能
    blurAmount: 5,
    displacementScale: 400,
    turbulenceFrequency: 0.005,
    turbulenceOctaves: 1,
    fullscreenEnabled: true,
    canvasDisplacementAmplitude: 200
};
