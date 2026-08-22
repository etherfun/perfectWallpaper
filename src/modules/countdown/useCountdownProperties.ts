import { useConfigStore } from '@/stores/config';
import { applyGlass } from '@/tokens/glass.tokens';
import { registerDeferred } from '@/utils/deferredScheduler';
import { applyShowHide, setShowWidth, syncElementHeightToCssVar } from '@/utils/dom';
import { elements } from '@/utils/elementManager';

import { WallpaperProperties } from '../../types/types';
import { parseColorString } from '../../utils/color';
import { logInitComplete } from '../../utils/helpers';
import { timerManager } from '../../utils/timer';

const bodyElement = elements.body;

/**
 * 澶勭悊鍊掕鏃剁浉鍏冲睘鎬?
 *
 * Stage 7-B (Phase 7 鎵规 2-B):
 *   - config.xxx = ... 鏀逛负 useConfigStore().$patch({...})锛岃В闄ゅ utils/config 鍗曚緥鐨勪緷璧栥€?
 *   - src/countdown.ts 宸插垹闄わ紱setcountdown_a 鐢?Countdown.vue useUpdateInterval 鑷姩瑙﹀彂銆?
 */
export function useCountdownProperties(
    properties: WallpaperProperties,
    FirstLoad: boolean
): void {
    const store = useConfigStore();
    const patch: Record<string, unknown> = {};

    if (properties.countdownY) {
        patch.countdown_y = properties.countdownY.value;
        bodyElement.style.setProperty('--countdown-top', `${properties.countdownY.value}%`);
    }

    if (properties.countdownX) {
        patch.countdown_x = properties.countdownX.value;
        bodyElement.style.setProperty('--countdown-left', `${properties.countdownX.value}%`);
    }

    if (properties.countdown_size) {
        patch.countdown_size = properties.countdown_size.value;
        const s = properties.countdown_size.value;
        bodyElement.style.setProperty(
            '--countdown-font-size',
            Math.floor((window.innerHeight / 300) * s) + 'px'
        );
    }

    if (properties.countdown_txt) {
        patch.countdown_txt = properties.countdown_txt.value;
    }

    if (properties.countdown_txt1) {
        patch.countdown_txt1 = properties.countdown_txt1.value;
    }

    if (properties.countdown_show) {
        patch.countdown_show = properties.countdown_show.value;
        timerManager.remove('updataCountdown');
        applyShowHide('countdown', properties.countdown_show.value);
    }

    if (properties.countdown_year) {
        patch.countdown_year = properties.countdown_year.value;
    }

    if (properties.countdown_month) {
        patch.countdown_month = properties.countdown_month.value;
    }

    if (properties.countdown_day) {
        patch.countdown_day = properties.countdown_day.value;
    }

    if (properties.countdown_color) {
        const color = parseColorString(properties.countdown_color.value) as [number, number, number];
        patch.countdown_color = color;
        bodyElement.style.setProperty('--countdown-color', color.join(', '));
    }

    if (properties.countdown_blurcolor_show) {
        patch.countdown_blurcolor_show = properties.countdown_blurcolor_show.value;
        applyGlass('countdown', { blurEnabled: properties.countdown_blurcolor_show.value });
    }

    if (properties.countdown_blurcolor) {
        const color = parseColorString(properties.countdown_blurcolor.value) as [number, number, number];
        patch.countdown_blurcolor = color;
        applyGlass('countdown', { blurColor: color });
    }

    if (properties.countdown_yakeli_show) {
        patch.countdown_yakeli_show = properties.countdown_yakeli_show.value;
        applyGlass('countdown', { yakeliEnabled: properties.countdown_yakeli_show.value });
    }

    if (properties.countdown_yakelicolor) {
        const color = parseColorString(properties.countdown_yakelicolor.value) as [number, number, number];
        patch.countdown_yakelic_color = color;
        applyGlass('countdown', { yakeliColor: color });
    }

    if (properties.countdown_yakeli) {
        const value = properties.countdown_yakeli.value / 100;
        patch.countdown_yakeli = value;
        applyGlass('countdown', { yakeli: value });
    }

    if (properties.countdown_bluryakeli) {
        patch.countdown_bluryakeli = properties.countdown_bluryakeli.value;
        patch.first_load_countdown = false;
        applyGlass('countdown', { blurYakeli: `${properties.countdown_bluryakeli.value}px` });
    }

    if (properties.countdown_timetransparency) {
        patch.countdown_timetransparency = properties.countdown_timetransparency.value;
        const t = properties.countdown_timetransparency.value / 100;
        bodyElement.style.setProperty('--countdown-opacity', String(t));
    }

    if (properties.countdown_roundedcorners) {
        patch.countdown_roundedcorners = properties.countdown_roundedcorners.value;
        // 经 applyGlass 写入：全局亚克力覆盖启用时由全局圆角接管
        applyGlass('countdown', { roundedCorners: properties.countdown_roundedcorners.value });

        // 鐩戝惉鍊掕鏃跺鍣ㄥ昂瀵稿彉鍖栵紝鍚屾 --countdown-height CSS 鍙橀噺銆?
        // countdown 瀹瑰櫒鐢?Vue mount 鍚庢墠瀛樺湪锛岄€氳繃 deferredScheduler 寤跺悗鎸傝浇 observer銆?
        registerDeferred('countdown:height-observer', () =>
            syncElementHeightToCssVar('--countdown-height', () => elements.countdown.container)
        );
    }

    if (properties.countdown_showwidth) {
        setShowWidth('--countdown-show-width', properties.countdown_showwidth.value);
    }

    if (Object.keys(patch).length > 0) {
        store.$patch(patch);
    }

    if (FirstLoad) {
        logInitComplete('[Countdown]', '倒计时', FirstLoad);
    }
}
