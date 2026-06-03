/**
 * 流体效果模块入口
 * 统一导出公开 API（`FluidEffect` 类 + 渲染器 + 类型/常量）
 */

import { config } from '@/utils/config';

import {
    DEFAULT_FLUID_EFFECT_CONFIG,
    DEFAULT_FLUID_EFFECT_OPTIONS,
    type FluidEffectConfigState,
    type FluidEffectOptions,
} from '../types';
import { FluidEffect } from './FluidEffect';
import { FluidEffect2Renderer } from './FluidEffect2Renderer';

export { FluidEffect, FluidEffect2Renderer };
export type { FluidEffectConfigState, FluidEffectOptions };
export { DEFAULT_FLUID_EFFECT_CONFIG, DEFAULT_FLUID_EFFECT_OPTIONS };

// 初始化运行时状态（保持与原 `effect.ts` 末尾相同的副作用）
config.runtime.fluidEffect = null;
config.runtime.fullscreenFluidEffect = null;
config.runtime.fullscreenFluidEnabled = false;
config.runtime.pictureInfoHideStyleAdded = false;
