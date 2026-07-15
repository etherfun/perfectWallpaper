/**
 * useSakuraProperties — Vue 3 composable wrapper for sakura properties
 *
 * Stage 3-3 (Phase 7 批次 3-3): wrap src/propertyHandlers/sakuraPropertyHandler.ts
 * as a composable so Vue 组件 can subscribe to individual config changes.
 * Keeps the original side effects (sakura scene toggle, transparency,
 * resize, reload-effect) — the imperative calls into src/sakura/* stay.
 */
import * as sakuraModule from '@/modules/sakura';
import { gl } from '@/modules/sakura/state';
import { useConfigStore } from '@/stores/config';
import { elements } from '@/utils/elementManager';

import { WallpaperProperties } from '../../types/types';
import { logInitComplete } from '../../utils/_helpers';

const config = useConfigStore();

export function useSakuraProperties(properties: WallpaperProperties, FirstLoad: boolean): void {
    const store = useConfigStore();
    const patch: Record<string, unknown> = {};

    // 樱花特效
    if (properties.showSakura) {
        const showSakura = properties.showSakura.value;
        patch.showSakura = showSakura;
        store.showSakura = showSakura; // sync
    }

    // 樱花透明度
    if (properties.sakuratransparency) {
        const transparency = properties.sakuratransparency.value / 100;
        patch.sakura_transparency = transparency;
        config.sakura_transparency = transparency; // sync
    }

    // 樱花背景
    if (properties.sakurabackground) {
        const v = properties.sakurabackground.value;
        patch.sakura_background = v;
        config.sakura_background = v; // sync
    }

    // 樱花背景色
    if (properties.sakurabackcolor) {
        const v = properties.sakurabackcolor.value;
        patch.sakura_back_color = v;
        config.sakura_back_color = v; // sync
    }

    // 樱花反转
    if (properties.sakurareverse) {
        const v = properties.sakurareverse.value;
        patch.sakura_reverse = v;
        config.sakura_reverse = v; // sync
    }

    // 樱花数量
    if (properties.sakurapointnumber) {
        const v = properties.sakurapointnumber.value;
        patch.sakura_point_number = v;
        config.sakura_point_number = v; // sync
    }

    // 背景亮度
    if (properties.sakurabacklight) {
        const v = properties.sakurabacklight.value / 100;
        patch.sakura_back_light = v;
        config.sakura_back_light = v; // sync
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
            // Phase 7 保护：canvas 从 index.html 迁移到 Vue 模板，
            // window.load 时 canvas 不存在导致 sakuraLoad() 跳过。
            if (!gl) {
                sakuraModule.sakuraLoad();
            } else {
                const canvas = elements.sakura;
                const canvasshow = elements.sakurashow;
                if (canvas && canvasshow) {
                    sakuraModule.makeCanvasFullScreen(canvas, canvasshow);
                }
                sakuraModule.setAnimating(true);
                sakuraModule.animate();
            }
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
