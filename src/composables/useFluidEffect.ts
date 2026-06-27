/**
 * useFluidEffect — Vue 3 composable wrapper for src/fluid/*
 *
 * Stage 5-C2 (fluid WebGL effect): wraps the imperative FluidEffect state
 * machine into a reactive composable that:
 *   - Exposes passthroughs for the FluidEffect state machine (enable /
 *     disable / enableFullscreen / disableFullscreen / toggle).
 *   - Exposes getter accessors (state / enabled / fullscreenEnabled).
 *   - Watches `config.fluidEffectEnabled` and toggles the effect
 *     automatically.
 *   - Auto-cleans on unmount (calls disable()).
 *
 * The FluidEffect class is instantiated lazily — only when the composable
 * is mounted and config.fluidEffectEnabled is true. This avoids spinning
 * up WebGL contexts in standalone / SSR scenarios where the effect is
 * disabled.
 *
 * Drawing logic stays in src/fluid/effect/* (single source of truth).
 */

import { computed, onBeforeUnmount, onMounted, shallowRef, watch } from 'vue';

import { FluidEffect } from '@/fluid';
import { useConfigStore } from '@/stores/config';

export interface UseFluidEffectApi {
    /** Reactive: whether the effect is in any enabled state. */
    readonly isEnabled: import('vue').ComputedRef<boolean>;
    /** Reactive: whether the effect is in fullscreen mode. */
    readonly isFullscreen: import('vue').ComputedRef<boolean>;
    /** Enable normal-mode fluid effect. */
    enable: () => void;
    /** Disable and tear down the effect. */
    disable: () => void;
    /** Switch to fullscreen mode. */
    enableFullscreen: () => void;
    /** Switch back to normal mode. */
    disableFullscreen: () => void;
    /** Toggle between enabled / disabled. */
    toggle: () => boolean;
}

export function useFluidEffect(): UseFluidEffectApi {
    const config = useConfigStore();
    // The FluidEffect class has private fields that are nominal-typed.
    // We hold it as `unknown` internally and only expose the public API
    // surface (enable/disable/toggle/etc.) via the returned object.
    // This avoids leaking the class's private shape into tests.
    //
    // shallowRef: keeps the FluidEffect object NON-reactive (the underlying
    // WebGL instance must not be wrapped in a Vue Proxy — the class holds
    // GPU resources + RAF handles that don't tolerate Proxy traps), while
    // still triggering component-level reactivity on `.value` REASSIGNMENT.
    // Per-field mutations on the FluidEffect itself (e.g. `instance.enabled = true`)
    // are picked up via manual `triggerRef()` calls if needed, but for the
    // isEnabled/isFullscreen computeds we explicitly read `instance.value`
    // inside the computed so a `triggerRef()` after mutation re-runs them.
    const instance = shallowRef<unknown>(null);

    // Lazy create — only when first enabled.
    function ensureInstance(): FluidEffect {
        if (!instance.value) {
            instance.value = FluidEffect.create();
        }
        return instance.value as FluidEffect;
    }


    onMounted(() => {
        // If config says enabled, kick off the effect on mount.
        if (config.fluidEffectEnabled) {
            ensureInstance().enable();
        }
    });

    onBeforeUnmount(() => {
        // Best-effort teardown — disable() is a no-op if already DISABLED.
        (instance.value as FluidEffect | null)?.disable();
        instance.value = null;
    });

    // React to fluidEffectEnabled toggle.
    watch(
        () => config.fluidEffectEnabled,
        (enabled) => {
            if (enabled) {
                ensureInstance().enable();
            } else {
                (instance.value as FluidEffect | null)?.disable();
            }
        }
    );

    return {
        isEnabled: computed(() => Boolean((instance.value as FluidEffect | null)?.enabled)),
        isFullscreen: computed(() =>
            Boolean((instance.value as FluidEffect | null)?.fullscreenEnabled)
        ),
        enable: () => ensureInstance().enable(),
        disable: () => (instance.value as FluidEffect | null)?.disable(),
        enableFullscreen: () => ensureInstance().enableFullscreen(),
        disableFullscreen: () => (instance.value as FluidEffect | null)?.disableFullscreen(),
        toggle: () => ensureInstance().toggle(),
    };
}
