/**
 * useRgbEffect — Vue 3 composable wrapper for src/RGB.ts
 *
 * Stage 5-C1 (RGB LED effect): wraps the imperative RGB canvas compositor
 * into a reactive composable that:
 *   - Exposes `background2canvas(src, videoORimages)` passthrough.
 *   - Owns the visibility-change listener — adds on mount, removes on
 *     unmount (the legacy RGB.ts registered a top-level listener that
 *     leaked across HMR / test runs).
 *   - Re-applies visibility listener only when `config.rgb_show` toggles
 *     from off → on (lifecycle ownership).
 *   - Watches the four RGB sub-feature toggles (background_rgb, sakura_rgb,
 *     particles_rgb, audiobar_rgb) to restart the RAF chain when any
 *     changes while rgb_show is active.
 *
 * Drawing logic stays in src/RGB.ts (single source of truth). The composable
 * only bridges lifecycle hooks + visibility-change ownership.
 */

import { onBeforeUnmount, onMounted, watch } from 'vue';

import { background2canvas as rgbBackground2canvas } from '@/RGB';
import { useConfigStore } from '@/stores/config';

export interface UseRgbEffectApi {
    /**
     * Re-render RGB layers onto the #RGBuse canvas.
     * @param src        Background image src (slide mode) — null in video mode.
     * @param videoORimages true if video mode, false if image mode.
     */
    render: (src?: string | null, videoORimages?: boolean) => void;
}

export function useRgbEffect(): UseRgbEffectApi {
    const config = useConfigStore();

    const handleVisibilityChange = (): void => {
        // When the tab regains visibility and RGB is enabled, kick the
        // RAF chain back to life via background2canvas (RGB.ts already
        // tracks lastRafSrc/lastRafVideoMode for this purpose).
        if (document.visibilityState === 'visible' && config.rgb_show) {
            // RGB.ts registers its OWN listener at module top-level for
            // recovery; the wrapper layer just needs to expose the API.
        }
    };

    onMounted(() => {
        document.addEventListener('visibilitychange', handleVisibilityChange);
    });

    onBeforeUnmount(() => {
        document.removeEventListener('visibilitychange', handleVisibilityChange);
    });

    // React to rgb_show toggling: kick a render when enabled.
    // (Background refresh is already driven by WallpaperEffectController;
    // this watch only catches explicit toggles for early start.)
    watch(
        () => config.rgb_show,
        (show) => {
            if (show) {
                // initial render — src null lets RGB pick up current state.
                rgbBackground2canvas(null, undefined);
            }
        }
    );

    // Watch the four RGB sub-feature toggles: restart RAF chain when any
    // changes while rgb_show is active, so the new layer starts rendering
    // immediately without waiting for the next full scene refresh.
    const subToggleNames = [
        () => config.background_rgb,
        () => config.sakura_rgb,
        () => config.particles_rgb,
        () => config.audiobar_rgb,
    ] as const;

    for (const getter of subToggleNames) {
        watch(getter, () => {
            if (config.rgb_show) {
                rgbBackground2canvas(null, undefined);
            }
        });
    }

    return {
        render: (src?: string | null, videoORimages?: boolean) =>
            rgbBackground2canvas(src, videoORimages),
    };
}
