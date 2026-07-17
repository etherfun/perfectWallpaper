import * as sakuraModule from '@/modules/sakura';
import { gl } from '@/modules/sakura/state/state';
import { useConfigStore } from '@/stores/config';
import { elements } from '@/utils/elementManager';

import { WallpaperProperties } from '../../types/types';
import { logInitComplete } from '../../utils/helpers';

const config = useConfigStore();

export function useSakuraProperties(properties: WallpaperProperties, FirstLoad: boolean): void {
    const store = useConfigStore();
    const patch: Record<string, unknown> = {};

    // 妯辫姳鐗规晥
    if (properties.showSakura) {
        const showSakura = properties.showSakura.value;
        patch.showSakura = showSakura;
        store.showSakura = showSakura; // sync
    }

    // 妯辫姳閫忔槑搴?
    if (properties.sakuratransparency) {
        const transparency = properties.sakuratransparency.value / 100;
        patch.sakura_transparency = transparency;
        config.sakura_transparency = transparency; // sync
    }

    // 妯辫姳鑳屾櫙
    if (properties.sakurabackground) {
        const v = properties.sakurabackground.value;
        patch.sakura_background = v;
        config.sakura_background = v; // sync
    }

    // 妯辫姳鑳屾櫙鑹?
    if (properties.sakurabackcolor) {
        const v = properties.sakurabackcolor.value;
        patch.sakura_back_color = v;
        config.sakura_back_color = v; // sync
    }

    // 妯辫姳鍙嶈浆
    if (properties.sakurareverse) {
        const v = properties.sakurareverse.value;
        patch.sakura_reverse = v;
        config.sakura_reverse = v; // sync
    }

    // 妯辫姳鏁伴噺
    if (properties.sakurapointnumber) {
        const v = properties.sakurapointnumber.value;
        patch.sakura_point_number = v;
        config.sakura_point_number = v; // sync
    }

    // 鑳屾櫙浜害
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

    // 妯辫姳鐗规晥 鈥?toggle scene animation
    if (properties.showSakura) {
        const showSakura = properties.showSakura.value;
        if (showSakura) {
            // Phase 7 淇濇姢锛歝anvas 浠?index.html 杩佺Щ鍒?Vue 妯℃澘锛?
            // window.load 鏃?canvas 涓嶅瓨鍦ㄥ鑷?sakuraLoad() 璺宠繃銆?
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
            // 鍏抽棴妯辫姳锛岄殣钘忔ū鑺?
            const canvas = elements.sakura;
            const canvasshow = elements.sakurashow;
            if (canvas && canvasshow) {
                sakuraModule.makeCanvasHide(canvas, canvasshow);
            }
            sakuraModule.setAnimating(false);
        }
    }

    // 妯辫姳閫忔槑搴?鈫?DOM
    if (properties.sakuratransparency) {
        const transparency = properties.sakuratransparency.value / 100;
        const ctx = elements.sakurashow?.getContext('2d');
        if (ctx) {
            ctx.canvas.style.opacity = String(transparency);
        }
    }

    // 妯辫姳鏁伴噺 鈫?resize scene
    if (properties.sakurapointnumber) {
        sakuraModule.sakuraResize();
    }

    // 鑳屾櫙浜害 鈫?reload effect
    if (properties.sakurabacklight) {
        sakuraModule.sakuraReLoadEffect();
    }

    if (FirstLoad) {
        logInitComplete('[Sakura]', '妯辫姳鏁堟灉', FirstLoad);
    }
}
