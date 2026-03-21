/**
 * Fluid Effect Property Handler
 * 处理流体效果相关的属性监听
 */

import { WallpaperProperties } from './types';
import { elements } from '../../utils/elementManager';
import { appConfig, config } from '@/utils/config';

export interface FluidEffectPropertyHandlerResult {
    // empty for now
}

// 全屏启用状态记忆
let fullscreenFluidEffectValue = false;

/**
 * 处理流体效果相关属性
 * @param properties 属性对象
 * @param FirstLoad 是否首次加载
 * @returns 处理结果
 */
export function handleFluidEffectProperties(
    properties: WallpaperProperties,
    FirstLoad: boolean
): FluidEffectPropertyHandlerResult {
    const result: FluidEffectPropertyHandlerResult = {};
    const bodyElement = elements.body;

    // ========== FluidEffect2 配置处理 ==========

    // 全屏启用
    if (properties.fluidEffectEnabledFullscreen) {
        if (!appConfig.runtime.FluidEffectConfig || !appConfig.runtime.FluidEffectConfig.set) {
            return result;
        }

        if (properties.fluidEffectEnabledFullscreen.value) {
            appConfig.runtime.FluidEffectConfig.set('fullscreenEnabled', true);
        } else {
            appConfig.runtime.FluidEffectConfig.set('fullscreenEnabled', false);
        }
        config.fluidEffectEnabledFullscreen = properties.fluidEffectEnabledFullscreen.value;
    }

    // 启用
    if (properties.fluidEffectEnabled) {
        if (!appConfig.runtime.FluidEffectConfig || !appConfig.runtime.FluidEffectConfig.set) {
            return result;
        }

        if (properties.fluidEffectEnabled.value) {
            appConfig.runtime.FluidEffectConfig.set('enabled', true);
            if (config.fluidEffectEnabledFullscreen) {
                appConfig.runtime.FluidEffectConfig.set('fullscreenEnabled', true);
            }
        } else {
            appConfig.runtime.FluidEffectConfig.set('enabled', false);
            appConfig.runtime.FluidEffectConfig.set('fullscreenEnabled', false);
        }
    }

    // 分辨率
    if (properties.fluidEffectResolution) {
        if (appConfig.runtime.FluidEffectConfig && appConfig.runtime.FluidEffectConfig.set) {
            appConfig.runtime.FluidEffectConfig.set('resolution', properties.fluidEffectResolution.value);
        }
    }

    // 模糊程度
    if (properties.fluidEffectBlurAmount) {
        if (appConfig.runtime.FluidEffectConfig && appConfig.runtime.FluidEffectConfig.set) {
            appConfig.runtime.FluidEffectConfig.set('blurAmount', properties.fluidEffectBlurAmount.value);
        }
    }

    // 置换图缩放
    if (properties.fluidEffectDisplacementScale) {
        if (appConfig.runtime.FluidEffectConfig && appConfig.runtime.FluidEffectConfig.set) {
            appConfig.runtime.FluidEffectConfig.set('displacementScale', properties.fluidEffectDisplacementScale.value);
        }
    }

    // 湍流八度
    if (properties.fluidEffectTurbulenceOctaves) {
        if (appConfig.runtime.FluidEffectConfig && appConfig.runtime.FluidEffectConfig.set) {
            appConfig.runtime.FluidEffectConfig.set('turbulenceOctaves', properties.fluidEffectTurbulenceOctaves.value);
        }
    }

    // 画布位移幅度
    if (properties.fluidEffectCanvasDisplacement) {
        if (appConfig.runtime.FluidEffectConfig && appConfig.runtime.FluidEffectConfig.set) {
            appConfig.runtime.FluidEffectConfig.set('canvasDisplacementAmplitude', properties.fluidEffectCanvasDisplacement.value);
        }
    }

    // 暗化
    if (properties.fluidEffect_DarkOverlayStrength) {
        bodyElement.style.setProperty("--fluidEffect-dark-overlay-strength", String(properties.fluidEffect_DarkOverlayStrength.value / 100));
    }

    // 模糊
    if (properties.fluidEffect_backdropFilterStrength) {
        bodyElement.style.setProperty("--fluidEffect-backdrop-filter-strength", `${properties.fluidEffect_backdropFilterStrength.value}px`);
    }

    return result;
}
