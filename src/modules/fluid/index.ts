/**
 * 流体效果模块入口
 * 控制器与效果器已合并为 useFluidEffect（controller.ts）+ FluidEffect 单例
 */

export { useFluidEffect } from './controller';
export { FluidEffect } from './effect/FluidEffect';
export type { FluidEffectConfigState, FluidEffectOptions } from './types';
export { DEFAULT_FLUID_EFFECT_CONFIG, DEFAULT_FLUID_EFFECT_OPTIONS } from './types';
