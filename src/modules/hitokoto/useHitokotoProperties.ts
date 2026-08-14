import { useConfigStore } from '@/stores/config';
import { registerDeferred } from '@/utils/deferredScheduler';
import { applyShowHide, setShowWidth, syncElementHeightToCssVar } from '@/utils/dom';
import { elements } from '@/utils/elementManager';

import { WallpaperProperties } from '../../types/types';
import { parseColorString } from '../../utils/color';
import { logInitComplete } from '../../utils/helpers';
import { timerManager } from '../../utils/timer';

/**
 * 澶勭悊涓€瑷€鐩稿叧灞炴€?
 *
 * Stage 7-B (Phase 7 鎵规 2-B):
 *   - config.xxx = ... 鏀逛负 useConfigStore().$patch({...})锛岃В闄ゅ utils/config 鍗曚緥鐨勪緷璧栥€?
 *   - src/hitokoto.ts 宸插垹闄わ紱autoHitokto 鐢?Hitokoto.vue watch(config.hitokoto_show)
 *     鑷姩瑙﹀彂 fetchHitokoto + 鍚仠 interval銆?
 */
export function useHitokotoProperties(
    properties: WallpaperProperties,
    FirstLoad: boolean
): void {
    const store = useConfigStore();
    const patch: Record<string, unknown> = {};

    if (properties.hitokoto_updata) {
        patch.hitokoto_update = properties.hitokoto_updata.value;
    }

    if (properties.hitokoto_auth) {
        patch.hitokoto_format_test = properties.hitokoto_auth.value ? 1 : 2;
    }

    // 涓€瑷€鑷畾涔?(hit_a..hit_l 鈫?c=a& 绛?
    if (properties.hitokoto_a) {
        patch.hit_a = properties.hitokoto_a.value ? 'c=a&' : '';
    }
    if (properties.hitokoto_b) {
        patch.hit_b = properties.hitokoto_b.value ? 'c=b&' : '';
    }
    if (properties.hitokoto_c) {
        patch.hit_c = properties.hitokoto_c.value ? 'c=c&' : '';
    }
    if (properties.hitokoto_d) {
        patch.hit_d = properties.hitokoto_d.value ? 'c=d&' : '';
    }
    if (properties.hitokoto_e) {
        patch.hit_e = properties.hitokoto_e.value ? 'c=e&' : '';
    }
    if (properties.hitokoto_f) {
        patch.hit_f = properties.hitokoto_f.value ? 'c=f&' : '';
    }
    if (properties.hitokoto_g) {
        patch.hit_g = properties.hitokoto_g.value ? 'c=g&' : '';
    }
    if (properties.hitokoto_h) {
        patch.hit_h = properties.hitokoto_h.value ? 'c=h&' : '';
    }
    if (properties.hitokoto_i) {
        patch.hit_i = properties.hitokoto_i.value ? 'c=i&' : '';
    }
    if (properties.hitokoto_j) {
        patch.hit_j = properties.hitokoto_j.value ? 'c=j&' : '';
    }
    if (properties.hitokoto_k) {
        patch.hit_k = properties.hitokoto_k.value ? 'c=k&' : '';
    }
    if (properties.hitokoto_l) {
        patch.hit_l = properties.hitokoto_l.value ? 'c=l&' : '';
    }

    if (properties.hitokoto_show) {
        const hitokoto_show = properties.hitokoto_show.value;
        patch.hitokoto_show = hitokoto_show;
        timerManager.remove('updataHitokto');
        applyShowHide('hitokoto', hitokoto_show);
        // Hitokoto.vue watch(hitokoto_show) 鑷姩 fetch + restart interval
    }

    if (properties.hitokoto_color) {
        const color = parseColorString(properties.hitokoto_color.value) as [number, number, number];
        patch.hitokoto_color = color;
        elements.body.style.setProperty('--hitokoto-color', color.join(', '));
    }

    if (properties.hitokoto_blurcolor) {
        const blurcolor = parseColorString(properties.hitokoto_blurcolor.value) as [number, number, number];
        patch.hitokoto_blurcolor = blurcolor;
        elements.body.style.setProperty('--hitokoto-blur-color', blurcolor.join(', '));
    }

    if (properties.hitokoto_yakelicolor) {
        const yakeliccolor = parseColorString(properties.hitokoto_yakelicolor.value) as [number, number, number];
        patch.hitokoto_yakelic_color = yakeliccolor;
        elements.body.style.setProperty('--hitokoto-yakeli-color', yakeliccolor.join(', '));
    }

    if (properties.hitokoto_yakeli) {
        const yakeli = properties.hitokoto_yakeli.value / 100;
        patch.hitokoto_yakeli = yakeli;
        elements.body.style.setProperty('--hitokoto-yakeli', String(yakeli));
    }

    if (properties.hitokoto_bluryakeli) {
        const blur = properties.hitokoto_bluryakeli.value;
        patch.hitokoto_bluryakeli = blur;
        elements.body.style.setProperty('--hitokoto-blur-yakeli', `${blur}px`);
    }

    if (properties.hitokoto_blurcolor_show) {
        const show = properties.hitokoto_blurcolor_show.value;
        patch.hitokoto_blurcolor_show = show;
        elements.body.style.setProperty('--hitokoto-blur-enabled', show ? '1' : '0');
    }

    if (properties.hitokoto_yakeli_show) {
        const show = properties.hitokoto_yakeli_show.value;
        patch.hitokoto_yakeli_show = show;
        elements.body.style.setProperty('--hitokoto-yakeli-enabled', show ? '1' : '0');
    }

    if (properties.hitokoto_timetransparency) {
        const t = properties.hitokoto_timetransparency.value / 100;
        patch.hitokoto_timetransparency = properties.hitokoto_timetransparency.value;
        elements.body.style.setProperty('--hitokoto-opacity', String(t));
    }

    if (properties.hitokoto_roundedcorners) {
        patch.hitokoto_roundedcorners = properties.hitokoto_roundedcorners.value;
        elements.body.style.setProperty(
            '--hitokoto-roundedcorners',
            String(properties.hitokoto_roundedcorners.value)
        );

        // 鐩戝惉涓€瑷€瀹瑰櫒灏哄鍙樺寲锛屽悓姝?--hitokoto-height CSS 鍙橀噺銆?
        // hitokoto 瀹瑰櫒鐢?Vue mount 鍚庢墠瀛樺湪锛岄€氳繃 deferredScheduler 寤跺悗鎸傝浇 observer銆?
        registerDeferred('hitokoto:height-observer', () =>
            syncElementHeightToCssVar('--hitokoto-height', () => elements.hitokoto.container)
        );
    }

    if (properties.hitokoto_size) {
        const s = properties.hitokoto_size.value;
        patch.hitokoto_size = s;
        elements.body.style.setProperty(
            '--hitokoto-font-size',
            Math.floor((window.innerHeight / 570) * s) + 'px'
        );
        elements.body.style.setProperty(
            '--hitokoto-line-height',
            Math.floor((window.innerHeight / 570) * s) + 'px'
        );
    }

    if (properties.hitokoto_showwidth) {
        patch.hitokoto_showwidth = properties.hitokoto_showwidth.value;
        setShowWidth('--hitokoto-show-width', properties.hitokoto_showwidth.value);
    }

    if (properties.hitokotoX) {
        patch.hitokoto_x = properties.hitokotoX.value;
        elements.body.style.setProperty('--hitokoto-left', `${properties.hitokotoX.value}%`);
    }

    if (properties.hitokotoY) {
        patch.hitokoto_y = properties.hitokotoY.value;
        elements.body.style.setProperty('--hitokoto-top', `${properties.hitokotoY.value}%`);
    }

    if (Object.keys(patch).length > 0) {
        store.$patch(patch);
    }

    if (FirstLoad) {
        logInitComplete('[Hitokoto]', '一言', FirstLoad);
    }
}
