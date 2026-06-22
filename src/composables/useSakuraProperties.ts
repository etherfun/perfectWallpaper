/**
 * useSakuraProperties — Vue 3 composable wrapper for sakura properties
 *
 * Stage 3-3 (Phase 7 批次 3-3): wrap src/propertyHandlers/sakuraPropertyHandler.ts
 * as a composable so Vue 组件 can subscribe to individual config changes.
 * Keeps the original side effects (sakura scene toggle, transparency,
 * resize, reload-effect) — the imperative calls into src/sakura/* stay.
 */
import * as sakuraModule from '@/sakura';
import { useConfigStore } from '@/stores/config';
import { elements } from '@/utils/elementManager';

import { logInitComplete } from '../propertyHandlers/_helpers';
import { WallpaperProperties } from '../propertyHandlers/types';

export function useSakuraProperties(properties: WallpaperProperties, FirstLoad: boolean): void {
    const store = useConfigStore();
    const patch: Record<string, unknown> = {};

    // 樱花特效
    if (properties.showSakura) {
        const showSakura = properties.showSakura.value;
        patch.showSakura = showSakura;
    }

    // 樱花透明度
    if (properties.sakuratransparency) {
        const transparency = properties.sakuratransparency.value / 100;
        patch.sakura_transparency = transparency;
    }

    // 樱花背景
    if (properties.sakurabackground) {
        patch.sakura_background = properties.sakurabackground.value;
    }

    // 樱花背景色
    if (properties.sakurabackcolor) {
        patch.sakura_back_color = properties.sakurabackcolor.value;
    }

    // 樱花反转
    if (properties.sakurareverse) {
        patch.sakura_reverse = properties.sakurareverse.value;
    }

    // 樱花数量
    if (properties.sakurapointnumber) {
        patch.sakura_point_number = properties.sakurapointnumber.value;
    }

    // 背景亮度
    if (properties.sakurabacklight) {
        patch.sakura_back_light = properties.sakurabacklight.value / 100;
    }

    // Batched $patch
    if (Object.keys(patch).length > 0) {
        store.$patch(patch);
    }

    // Side-effects (run AFTER the patch so they can read fresh store values if needed)

    // 樱花特效 — toggle scene animation
    if (properties.showSakura) {
        const showSakura = properties.showSakura.value;
        if (showSakura) {
            // 开启樱花，全屏樱花
            const canvas = elements.sakura;
            const canvasshow = elements.sakurashow;
            if (canvas && canvasshow) {
                sakuraModule.makeCanvasFullScreen(canvas, canvasshow);
            }
            sakuraModule.setAnimating(true);
            sakuraModule.animate();
            sakuraModule.removesakura();
        } else {
            // 关闭樱花，隐藏樱花
            const canvas = elements.sakura;
            const canvasshow = elements.sakurashow;
            if (canvas && canvasshow) {
                sakuraModule.makeCanvasHide(canvas, canvasshow);
            }
            sakuraModule.setAnimating(false);
        }
    }

    // 樱花透明度 → DOM
    if (properties.sakuratransparency) {
        const transparency = properties.sakuratransparency.value / 100;
        const ctx = elements.sakurashow?.getContext('2d');
        if (ctx) {
            ctx.canvas.style.opacity = String(transparency);
        }
    }

    // 樱花数量 → resize scene
    if (properties.sakurapointnumber) {
        sakuraModule.sakuraResize();
    }

    // 背景亮度 → reload effect
    if (properties.sakurabacklight) {
        sakuraModule.sakuraReLoadEffect();
    }

    if (FirstLoad) {
        logInitComplete('[Sakura]', '樱花效果', FirstLoad);
    }
}
