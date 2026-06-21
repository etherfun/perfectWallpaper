import * as sakuraModule from '../sakura';
import { useConfigStore } from '@/stores/config';
import { elements } from '@/utils/elementManager';
import { logInitComplete } from './_helpers';
import { WallpaperProperties } from './types';

/**
 * 处理樱花效果相关属性
 * @param properties 属性对象
 * @param FirstLoad 是否首次加载
 *
 * Stage 7-B: 改写 config.xxx = ... 为 useConfigStore().$patch({...})，
 * 解除本 handler 对 src/utils/config 单例的依赖（Stage 3.5 准备）。
 *
 * 保留 src/utils/elementManager 引用（Stage 3.5 之后才会迁移 DOM refs）。
 */
export function handleSakuraProperties(properties: WallpaperProperties, FirstLoad: boolean): void {
    const store = useConfigStore();
    const patch: Record<string, unknown> = {};

    // 樱花特效
    if (properties.showSakura) {
        const showSakura = properties.showSakura.value;
        patch.show_sakura = showSakura;
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
