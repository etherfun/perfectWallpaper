import { WallpaperProperties } from './types';
import { elements } from '../utils/elementManager';
import { config } from '@/utils/config';
import { FluidEffect } from '../fluid';
import { debugLogger } from '@/utils/logger';

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

    // 全屏启用
    if (properties.fluidEffectEnabledFullscreen) {
        cfg.set('fullscreenEnabled', properties.fluidEffectEnabledFullscreen.value);
        config.fluidEffectEnabledFullscreen = properties.fluidEffectEnabledFullscreen.value;
    }

    // 启用
    if (properties.fluidEffectEnabled) {
        cfg.set('enabled', properties.fluidEffectEnabled.value);
        if (properties.fluidEffectEnabled.value && config.fluidEffectEnabledFullscreen) {
            cfg.set('fullscreenEnabled', true);
        }
    }

    // 分辨率
    if (properties.fluidEffectResolution) {
        cfg.set('resolution', properties.fluidEffectResolution.value);
    }

    // 模糊程度
    if (properties.fluidEffectBlurAmount) {
        cfg.set('blurAmount', properties.fluidEffectBlurAmount.value);
    }

    // 置换图缩放
    if (properties.fluidEffectDisplacementScale) {
        cfg.set('displacementScale', properties.fluidEffectDisplacementScale.value);
    }

    // 湍流八度
    if (properties.fluidEffectTurbulenceOctaves) {
        cfg.set('turbulenceOctaves', properties.fluidEffectTurbulenceOctaves.value);
    }

    // 画布位移幅度
    if (properties.fluidEffectCanvasDisplacement) {
        cfg.set('canvasDisplacementAmplitude', properties.fluidEffectCanvasDisplacement.value);
    }

    // 暗化
    if (properties.fluidEffect_DarkOverlayStrength && bodyElement) {
        bodyElement.style.setProperty("--fluidEffect-dark-overlay-strength", String(properties.fluidEffect_DarkOverlayStrength.value / 100));
    }

    // 模糊
    if (properties.fluidEffect_backdropFilterStrength && bodyElement) {
        bodyElement.style.setProperty("--fluidEffect-backdrop-filter-strength", `${properties.fluidEffect_backdropFilterStrength.value}px`);
    }


    if (FirstLoad) {
        debugLogger.info('[FluidEffect] 流体参数初始化完成');
        config.fluidEffectInitComplete = true;
    }
}
