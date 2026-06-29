/**
 * Domain store: fluid
 * Fluid effect settings (Phase 3)
 */
import { defineStore } from 'pinia';
import { ref } from 'vue';

export const useFluidStore = defineStore('fluid', () => {
    const fluidEffectEnabled = ref(false);
    const fluid_effect_enabled_fullscreen = ref(false);
    const fluid_effect_resolution = ref(240);
    const fluid_effect_blur_amount = ref(20);
    const fluid_effect_displacement_scale = ref(0.5);
    const fluid_effect_turbulence_octaves = ref(4);
    const fluid_effect_canvas_displacement = ref(0);
    const fluid_effect_dark_overlay_strength = ref(50);
    const fluid_effect_backdrop_filter_strength = ref(10);

    return {
        fluidEffectEnabled, fluid_effect_enabled_fullscreen,
        fluid_effect_resolution, fluid_effect_blur_amount,
        fluid_effect_displacement_scale, fluid_effect_turbulence_octaves,
        fluid_effect_canvas_displacement, fluid_effect_dark_overlay_strength,
        fluid_effect_backdrop_filter_strength,
    };
});
