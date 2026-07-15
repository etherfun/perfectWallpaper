/**
 * useFluidEffectProperties — Vue 3 composable wrapper for fluid effect properties
 *
 * Stage 3-3 (Phase 7 批次 3-3): wrap src/propertyHandlers/fluidEffectPropertyHandler.ts
 * as a composable.
 *
 * runtime.FluidEffect is a WebGL-bound imperative instance kept on the
 * legacy `config` singleton (Stage 3.5-B). All Pinia-bound config fields
 * are mirrored via useConfigStore().$patch.
 */
import { useConfigStore } from '@/stores/config';
import { useRuntimeStore } from '@/stores/runtime';

const configStore = useConfigStore();
const runtimeStore = useRuntimeStore();

import { FluidEffect } from '@/modules/fluid';
import { elements } from '@/utils/elementManager';

import { WallpaperProperties } from '../../types/types';
import { logInitComplete } from '../core/propertyHandlers/_helpers';

export function useFluidEffectProperties(
    properties: WallpaperProperties,
    FirstLoad: boolean
): void {
    const store = useConfigStore();
    const patch: Record<string, unknown> = {};

    if (FirstLoad) {
         
        (runtimeStore.fluidEffect as any) = FluidEffect.create();
    }

     
    const cfg = runtimeStore.fluidEffect as any;

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
