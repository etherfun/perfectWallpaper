import { useConfigStore } from '@/stores/config';
import { useRuntimeStore } from '@/stores/runtime';

const runtimeStore = useRuntimeStore();

import { FluidEffect } from '@/modules/fluid';
import { elements } from '@/utils/elementManager';

import { WallpaperProperties } from '../../types/types';
import { logInitComplete } from '../../utils/helpers';

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

    // 鍏ㄥ睆鍚敤 - 浼樺厛澶勭悊
    if (properties.fluidEffectEnabledFullscreen) {
        cfg?.set('fullscreenEnabled', properties.fluidEffectEnabledFullscreen.value);
        patch.fluid_effect_enabled_fullscreen = properties.fluidEffectEnabledFullscreen.value;
    }

    // 鍚敤
    if (properties.fluidEffectEnabled) {
        cfg?.set('enabled', properties.fluidEffectEnabled.value);
        // 濡傛灉鍚敤浜嗗叏灞忛厤缃紝纭繚鍦?FULLSCREEN 妯″紡
        if (properties.fluidEffectEnabled.value && store.fluid_effect_enabled_fullscreen === true) {
            cfg?.set('fullscreenEnabled', true);
        }
        patch.fluidEffectEnabled = properties.fluidEffectEnabled.value;
    }

    // 鍒嗚鲸鐜?
    if (properties.fluidEffectResolution) {
        patch.fluid_effect_resolution = properties.fluidEffectResolution.value;
        cfg?.set('resolution', properties.fluidEffectResolution.value);
    }

    // 妯＄硦绋嬪害
    if (properties.fluidEffectBlurAmount) {
        patch.fluid_effect_blur_amount = properties.fluidEffectBlurAmount.value;
        cfg?.set('blurAmount', properties.fluidEffectBlurAmount.value);
    }

    // 缃崲鍥剧缉鏀?
    if (properties.fluidEffectDisplacementScale) {
        patch.fluid_effect_displacement_scale = properties.fluidEffectDisplacementScale.value;
        cfg?.set('displacementScale', properties.fluidEffectDisplacementScale.value);
    }

    // 婀嶆祦鍏害
    if (properties.fluidEffectTurbulenceOctaves) {
        patch.fluid_effect_turbulence_octaves = properties.fluidEffectTurbulenceOctaves.value;
        cfg?.set('turbulenceOctaves', properties.fluidEffectTurbulenceOctaves.value);
    }

    // 鐢诲竷浣嶇Щ骞呭害
    if (properties.fluidEffectCanvasDisplacement) {
        patch.fluid_effect_canvas_displacement = properties.fluidEffectCanvasDisplacement.value;
        cfg?.set('canvasDisplacementAmplitude', properties.fluidEffectCanvasDisplacement.value);
    }

    // 鏆楀寲
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

    // 妯＄硦
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
