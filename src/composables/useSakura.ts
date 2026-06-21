/**
 * useSakura — Vue 3 composable wrapper for src/sakura/*
 *
 * Stage 5-C2 (sakura WebGL effect): wraps the imperative WebGL sakura
 * renderer into a reactive composable that:
 *   - Exposes passthroughs for sakuraLoad / removesakura / sakuraResize /
 *     sakuraReLoadEffect / applySakuraTransparency.
 *   - Auto-applies transparency when `config.sakura_transparency` changes.
 *   - Tracks the showSakura toggle and exposes a `isActive` ref for
 *     parent components.
 *
 * Important: the legacy src/sakura/index.ts registers `initSakura()` at
 * module top-level (which adds a `window.load` listener). The composable
 * does NOT re-register that listener — that would cause double-init.
 * Drawing logic stays in src/sakura/* (single source of truth).
 */

import { onBeforeUnmount, onMounted, ref, watch } from 'vue';

import {
    applySakuraTransparency,
    removesakura,
    sakuraLoad,
    sakuraReLoadEffect,
    sakuraResize,
} from '@/sakura';
import { useConfigStore } from '@/stores/config';

export interface UseSakuraApi {
    /** Initialize WebGL context + start scene. Idempotent (guards on gl). */
    load: () => void;
    /** Stop animation and rebuild effect lib (call on brightness change). */
    reloadEffect: () => void;
    /** Trigger scene resize (call on window resize or particle count change). */
    resize: () => void;
    /** Copy current WebGL frame to 2D display canvas. */
    copyToDisplay: () => void;
    /** Re-apply #sakurashow CSS opacity from config. */
    applyTransparency: () => void;
    /** Reactive: whether sakura is currently visible. */
    readonly isActive: import('vue').Ref<boolean>;
}

export function useSakura(): UseSakuraApi {
    const config = useConfigStore();
    const isActive = ref<boolean>(Boolean(config.showSakura));

    onMounted(() => {
        // Sync initial state — applies transparency on mount.
        applySakuraTransparency();
        isActive.value = config.showSakura === true;
    });

    onBeforeUnmount(() => {
        // Do NOT call removesakura / animation stop here — when the Vue
        // app is destroyed the entire document is going away. Leaving
        // the RAF loop running is harmless (jsdom doesn't have RAF but
        // in a real browser the lifecycle ends with the page).
    });

    // React to showSakura toggle — purely reactive bookkeeping. The
    // actual WebGL init is owned by sakuraLoad() which propertyHandler
    // calls directly via the legacy module.
    watch(
        () => config.showSakura,
        (show) => {
            isActive.value = show === true;
            if (show === true) {
                applySakuraTransparency();
            }
        }
    );

    return {
        load: () => sakuraLoad(),
        reloadEffect: () => sakuraReLoadEffect(),
        resize: () => sakuraResize(),
        copyToDisplay: () => removesakura(),
        applyTransparency: () => applySakuraTransparency(),
        isActive,
    };
}
