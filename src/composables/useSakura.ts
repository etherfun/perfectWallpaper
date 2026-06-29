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
    makeCanvasHide,
    removesakura,
    sakuraLoad,
    sakuraReLoadEffect,
    sakuraResize,
    setAnimating,
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

    // React to showSakura toggle
    // 注意：此 watch 在 `applyUserProperties` 之后异步触发，
    // 而 property handler 同步执行 DOM 操作。watch 仅做"兜底"保护，
    // 不做重复 DOM 操作——关闭动画由 handler 中的 makeCanvasHide 负责。
    watch(
        () => config.showSakura,
        (show) => {
            isActive.value = show === true;
            if (show === true) {
                applySakuraTransparency();
            } else {
                // 兜底关闭：handler 中的 makeCanvasHide 优先执行，
                // 这里只在 handler 未生效时（如独立模式早期）隐藏 canvas
                setAnimating(false);
            }
        }
    );

    // Phase 7 重放保护：useSakuraProperties 在 WE 初始推送时运行，
    // 写入旧 config 单例并 $patch -> Pinia，但元素的 DOM 侧效果
    // （透明度/resize/reload）因 canvas 尚未存在而丢失。
    // 当 $patch 更新 Pinia 后，以下 watcher 自动重放这些效果。
    watch(
        () => config.sakura_transparency,
        () => {
            applySakuraTransparency();
        }
    );

    watch(
        () => config.sakura_point_number,
        () => {
            sakuraResize();
        }
    );

    watch(
        () => config.sakura_back_light,
        () => {
            sakuraReLoadEffect();
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
