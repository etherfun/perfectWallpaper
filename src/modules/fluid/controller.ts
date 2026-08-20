/**
 * 流体效果 — 合并后的控制器（控制器 + 效果器一体化）
 *
 * 取代原来的 useFluidEffect（包装器）+ FluidEffect 类（效果器本体）双层结构：
 * 本模块直接在 Vue 生命周期内管理 FluidEffect 单例，属性分发与状态机在同一
 * 生命周期内完成，避免双重 create() 与 shallowRef 包装。
 *
 * 对外就用这个 useFluidEffect 即可，不再单独 new FluidEffect。
 */

import { computed, onBeforeUnmount, onMounted, shallowRef, watch } from 'vue';

import { useConfigStore } from '@/stores/config';
import { useRuntimeStore } from '@/stores/runtime';

import { FluidEffect } from './effect/FluidEffect';

function getOrCreateFluidEffect(): FluidEffect {
    const runtime = useRuntimeStore() as unknown as { fluidEffect?: FluidEffect | null };
    if (runtime.fluidEffect) return runtime.fluidEffect;
    const inst = FluidEffect.create();
    (runtime as unknown as { fluidEffect: FluidEffect }).fluidEffect = inst;
    return inst;
}

export type FluidControllerApi = {
    readonly isEnabled: import('vue').ComputedRef<boolean>;
    readonly isFullscreen: import('vue').ComputedRef<boolean>;
    enable: () => void;
    disable: () => void;
    enableFullscreen: () => void;
    disableFullscreen: () => void;
    toggle: () => boolean;
};

export function useFluidEffect(): FluidControllerApi {
    const config = useConfigStore();
    const instance = shallowRef<FluidEffect | null>(null);

    function ensureInstance(): FluidEffect {
        if (!instance.value) {
            instance.value = getOrCreateFluidEffect();
        }
        return instance.value as FluidEffect;
    }

    // 监听 enabled 与 fullscreenEnabled，双向反映 WE 配置变化
    function syncEnabledFullscreen(): void {
        const enabled = config.fluidEffectEnabled as unknown as boolean;
        const fullscreen = config.fluid_effect_enabled_fullscreen as unknown as boolean;
        const inst = instance.value;
        if (enabled && fullscreen) {
            ensureInstance().enableFullscreen();
            return;
        }
        if (enabled) {
            const fe = ((inst ?? getOrCreateFluidEffect()) as unknown) as {
                fullscreenEnabled?: boolean;
                disableFullscreen?: () => void;
            };
            if (fe.fullscreenEnabled) fe.disableFullscreen?.();
            else ensureInstance().enable();
            return;
        }
        inst?.disable();
    }

    onMounted(() => {
        if (config.fluidEffectEnabled || config.fluid_effect_enabled_fullscreen) {
            syncEnabledFullscreen();
        }
    });

    onBeforeUnmount(() => {
        (instance.value as FluidEffect | null)?.disable();
        instance.value = null;
    });

    watch(
        () => [config.fluidEffectEnabled, config.fluid_effect_enabled_fullscreen] as const,
        () => syncEnabledFullscreen(),
        { immediate: true }
    );

    return {
        isEnabled: computed(() => Boolean((instance.value as FluidEffect | null)?.enabled)),
        isFullscreen: computed(() => Boolean((instance.value as FluidEffect | null)?.fullscreenEnabled)),
        enable: () => ensureInstance().enable(),
        disable: () => (instance.value as FluidEffect | null)?.disable(),
        enableFullscreen: () => ensureInstance().enableFullscreen(),
        disableFullscreen: () => (instance.value as FluidEffect | null)?.disableFullscreen(),
        toggle: () => ensureInstance().toggle(),
    };
}
