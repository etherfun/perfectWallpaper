import { useConfigStore } from '@/stores/config';
import { useRuntimeStore } from '@/stores/runtime';
import { elements } from '@/utils/elementManager';

import { WallpaperProperties } from '../../types/types';
import { logInitComplete } from '../../utils/helpers';
import { FluidEffect } from './effect/FluidEffect';

function getFluidEffect(): FluidEffect | null {
    const runtimeStore = useRuntimeStore() as unknown as { fluidEffect?: FluidEffect | null };
    if (runtimeStore.fluidEffect) return runtimeStore.fluidEffect;
    // 兜底：controller 未 mount 前属性先到，延迟创建但不再双写 shalowRef
    const inst = FluidEffect.create();
    (runtimeStore as unknown as { fluidEffect: FluidEffect }).fluidEffect = inst;
    return inst;
}

export function useFluidEffectProperties(
    properties: WallpaperProperties,
    FirstLoad: boolean
): void {
    const store = useConfigStore();
    const patch: Record<string, unknown> = {};

    if (FirstLoad) {
        // 首次加载 — 已有实例则复用（controller 可能已创建），无则创建
        getFluidEffect();
    }

    const cfg = getFluidEffect();

    // 全屏启用 - 优先处理
    if (properties.fluidEffectEnabledFullscreen) {
        cfg?.set('fullscreenEnabled', properties.fluidEffectEnabledFullscreen.value);
        patch.fluid_effect_enabled_fullscreen = properties.fluidEffectEnabledFullscreen.value;
    }

    // 启用
    if (properties.fluidEffectEnabled) {
        cfg?.set('enabled', properties.fluidEffectEnabled.value);
        // 如果启用了全屏配置，确保在 FULLSCREEN 模式
        if (properties.fluidEffectEnabled.value && store.fluid_effect_enabled_fullscreen === true) {
            cfg?.set('fullscreenEnabled', true);
        }
        patch.fluidEffectEnabled = properties.fluidEffectEnabled.value;
    }

    // 分辨率
    if (properties.fluidEffectResolution) {
        patch.fluid_effect_resolution = properties.fluidEffectResolution.value;
        cfg?.set('resolution', properties.fluidEffectResolution.value);
    }

    // 模糊程度
    if (properties.fluidEffectBlurAmount) {
        patch.fluid_effect_blur_amount = properties.fluidEffectBlurAmount.value;
        cfg?.set('blurAmount', properties.fluidEffectBlurAmount.value);
    }

    // 置换图缩放
    if (properties.fluidEffectDisplacementScale) {
        patch.fluid_effect_displacement_scale = properties.fluidEffectDisplacementScale.value;
        cfg?.set('displacementScale', properties.fluidEffectDisplacementScale.value);
    }

    // 湍流八度
    if (properties.fluidEffectTurbulenceOctaves) {
        patch.fluid_effect_turbulence_octaves = properties.fluidEffectTurbulenceOctaves.value;
        cfg?.set('turbulenceOctaves', properties.fluidEffectTurbulenceOctaves.value);
    }

    // 画布位移幅度
    if (properties.fluidEffectCanvasDisplacement) {
        patch.fluid_effect_canvas_displacement = properties.fluidEffectCanvasDisplacement.value;
        cfg?.set('canvasDisplacementAmplitude', properties.fluidEffectCanvasDisplacement.value);
    }

    // 暗化
    if (properties.fluidEffect_DarkOverlayStrength) {
        patch.fluid_effect_dark_overlay_strength =
            properties.fluidEffect_DarkOverlayStrength.value;
        const bodyElement = elements.body;
        if (bodyElement) {
            bodyElement.style.setProperty(
                '--fluidEffect-dark-overlay-strength',
                String(properties.fluidEffect_DarkOverlayStrength.value / 100)
            );
        }
    }

    // 模糊
    if (properties.fluidEffect_backdropFilterStrength) {
        patch.fluid_effect_backdrop_filter_strength =
            properties.fluidEffect_backdropFilterStrength.value;
        const bodyElement = elements.body;
        if (bodyElement) {
            bodyElement.style.setProperty(
                '--fluidEffect-backdrop-filter-strength',
                `${properties.fluidEffect_backdropFilterStrength.value}px`
            );
        }
    }

    // Batched $patch
    if (Object.keys(patch).length > 0) {
        store.$patch(patch);
    }

    if (FirstLoad) {
        logInitComplete('[FluidEffect]', '流体', FirstLoad);
        store.$patch({ fluid_effect_init_complete: true });
    }
}
