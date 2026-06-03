import { config } from '@/utils/config';

import { FluidEffect } from '../fluid';
import { elements } from '../utils/elementManager';
import { logInitComplete } from './_helpers';
import { WallpaperProperties } from './types';

/**
 * 处理流体效果相关属性
 * @param properties 属性对象
 * @param FirstLoad 是否首次加载
 */
export function handleFluidEffectProperties(
    properties: WallpaperProperties,
    FirstLoad: boolean
): void {
    const bodyElement = elements.body;

    if (FirstLoad) config.runtime.FluidEffect = FluidEffect.create();

    const cfg = config.runtime.FluidEffect;

    // 全屏启用 - 优先处理
    if (properties.fluidEffectEnabledFullscreen) {
        cfg?.set('fullscreenEnabled', properties.fluidEffectEnabledFullscreen.value);
        config.fluid_effect_enabled_fullscreen = properties.fluidEffectEnabledFullscreen.value;
    }

    // 启用
    if (properties.fluidEffectEnabled) {
        cfg?.set('enabled', properties.fluidEffectEnabled.value);
        // 如果启用了全屏配置，确保在 FULLSCREEN 模式
        if (properties.fluidEffectEnabled.value && config.fluid_effect_enabled_fullscreen) {
            cfg?.set('fullscreenEnabled', true);
        }
    }

    // 分辨率
    if (properties.fluidEffectResolution) {
        config.fluid_effect_resolution = properties.fluidEffectResolution.value;
        cfg?.set('resolution', properties.fluidEffectResolution.value);
    }

    // 模糊程度
    if (properties.fluidEffectBlurAmount) {
        config.fluid_effect_blur_amount = properties.fluidEffectBlurAmount.value;
        cfg?.set('blurAmount', properties.fluidEffectBlurAmount.value);
    }

    // 置换图缩放
    if (properties.fluidEffectDisplacementScale) {
        config.fluid_effect_displacement_scale = properties.fluidEffectDisplacementScale.value;
        cfg?.set('displacementScale', properties.fluidEffectDisplacementScale.value);
    }

    // 湍流八度
    if (properties.fluidEffectTurbulenceOctaves) {
        config.fluid_effect_turbulence_octaves = properties.fluidEffectTurbulenceOctaves.value;
        cfg?.set('turbulenceOctaves', properties.fluidEffectTurbulenceOctaves.value);
    }

    // 画布位移幅度
    if (properties.fluidEffectCanvasDisplacement) {
        config.fluid_effect_canvas_displacement = properties.fluidEffectCanvasDisplacement.value;
        cfg?.set('canvasDisplacementAmplitude', properties.fluidEffectCanvasDisplacement.value);
    }

    // 暗化
    if (properties.fluidEffect_DarkOverlayStrength && bodyElement) {
        config.fluid_effect_dark_overlay_strength =
            properties.fluidEffect_DarkOverlayStrength.value;
        bodyElement.style.setProperty(
            '--fluidEffect-dark-overlay-strength',
            String(properties.fluidEffect_DarkOverlayStrength.value / 100)
        );
    }

    // 模糊
    if (properties.fluidEffect_backdropFilterStrength && bodyElement) {
        config.fluid_effect_backdrop_filter_strength =
            properties.fluidEffect_backdropFilterStrength.value;
        bodyElement.style.setProperty(
            '--fluidEffect-backdrop-filter-strength',
            `${properties.fluidEffect_backdropFilterStrength.value}px`
        );
    }

    if (FirstLoad) {
        logInitComplete('[FluidEffect]', '流体', FirstLoad);
        config.fluid_effect_init_complete = true;
    }
}
