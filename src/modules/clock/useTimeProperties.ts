import { useConfigStore } from '@/stores/config';
import { registerDeferred } from '@/utils/deferredScheduler';
import { applyShowHide, syncElementHeightToCssVar } from '@/utils/dom';
import { elements } from '@/utils/elementManager';

import { WallpaperProperties } from '../../types/types';
import { parseColorString } from '../../utils/color';
import { logInitComplete } from '../../utils/helpers';

/**
 * 澶勭悊鏃堕棿/鏃堕挓鐩稿叧灞炴€?
 *
 * Stage 7-B (Phase 7 鎵规 2-B):
 *   - config.xxx = ... 鏀逛负 useConfigStore().$patch({...})锛岃В闄ゅ utils/config 鍗曚緥鐨勪緷璧栥€?
 *   - src/time.ts 宸插垹闄わ紱startTimeColorRhythmLoop/stopTimeColorRhythmLoop 鐢?
 *     Clock.vue useColorRhythm 鑷姩绠＄悊銆?
 */
export function useTimeProperties(properties: WallpaperProperties, FirstLoad: boolean): void {
    const store = useConfigStore();
    const patch: Record<string, unknown> = {};

    if (properties.time_color_rhythm) {
        patch.time_color_rhythm = properties.time_color_rhythm.value;
    }

    if (properties.showTime) {
        const oClock_show = properties.showTime.value;
        patch.show_time = oClock_show;
        applyShowHide('clock', oClock_show);
        if (!oClock_show) patch.time_color_rhythm = false;
    }

    if (properties.tShowSencends) {
        patch.t_show_sencends = properties.tShowSencends.value;
    }

    if (properties.tX) {
        patch.time_x = properties.tX.value;
        elements.body.style.setProperty('--clock-left', `${properties.tX.value}%`);
    }

    if (properties.tY) {
        patch.time_y = properties.tY.value;
        elements.body.style.setProperty('--clock-top', `${properties.tY.value}%`);
    }

    if (properties.tSize) {
        const s = properties.tSize.value;
        patch.t_size = s;
        elements.body.style.setProperty(
            '--clock-font-size',
            Math.floor((window.innerHeight / 300) * s) + 'px'
        );
        elements.body.style.setProperty(
            '--clock-line-height',
            Math.floor((window.innerHeight / 390) * s) + 'px'
        );
        const indicators = document.querySelector(
            '#clock .clock-block .time-indicators'
        ) as HTMLElement | null;
        if (indicators) indicators.style.marginLeft = s + 'px';
    }

    if (properties.oclock_roundedcorners) {
        patch.oclock_roundedcorners = properties.oclock_roundedcorners.value;
        elements.body.style.setProperty(
            '--clock-roundedcorners',
            String(properties.oclock_roundedcorners.value)
        );

        // 鐩戝惉鏃堕挓瀹瑰櫒灏哄鍙樺寲锛屽悓姝?--clock-height CSS 鍙橀噺銆?
        // oClock 鍦?Vue mount 涔嬪悗鎵嶅瓨鍦紝閫氳繃 deferredScheduler 寤跺悗鎸傝浇 observer锛?
        // 閲嶅 push 鍚屼竴 id 鏃?registerDeferred 浼氭浛鎹换鍔″苟鑷姩 dispose 鏃?observer銆?
        registerDeferred('time:clock-height-observer', () =>
            syncElementHeightToCssVar('--clock-height', () => elements.clock.container)
        );
    }

    if (properties.odate_roundedcorners) {
        patch.odate_roundedcorners = properties.odate_roundedcorners.value;
    }

    if (properties.TimeColor) {
        const c = parseColorString(properties.TimeColor.value);
        patch.time_color = 'rgb(' + c + ')';
        elements.body.style.setProperty('--clock-color', c.join(', '));
    }

    if (properties.TimeBlurColor) {
        const c = parseColorString(properties.TimeBlurColor.value);
        patch.time_blur_color = '0 0 20px rgb(' + c + ')';
        elements.body.style.setProperty('--clock-blur-color', c.join(', '));
        elements.body.style.setProperty('--clock-blur-enabled', '1');
    }

    if (properties.tStyle) {
        patch.time_style = properties.tStyle.value;
    }

    if (properties.timetransparency) {
        const transparency = properties.timetransparency.value / 100;
        patch.time_transparency = transparency;
        elements.body.style.setProperty('--clock-opacity', String(transparency));
    }

    if (properties.oclock_blurcolor_show) {
        patch.oclock_blurcolor_show = properties.oclock_blurcolor_show.value;
        elements.body.style.setProperty(
            '--clock-blur-enabled',
            properties.oclock_blurcolor_show.value ? '1' : '0'
        );
    }

    if (properties.oclock_blurcolor) {
        const c = parseColorString(properties.oclock_blurcolor.value) as [number, number, number];
        patch.oclock_blurcolor = c;
        elements.body.style.setProperty('--clock-blur-color', c.join(', '));
    }

    if (properties.oclock_yakeli_show) {
        patch.oclock_yakeli_show = properties.oclock_yakeli_show.value;
        elements.body.style.setProperty(
            '--clock-yakeli-enabled',
            properties.oclock_yakeli_show.value ? '1' : '0'
        );
    }

    if (properties.oclock_yakelicolor) {
        const c = parseColorString(properties.oclock_yakelicolor.value) as [number, number, number];
        patch.oclock_yakelic_color = c;
        elements.body.style.setProperty('--clock-yakeli-color', c.join(', '));
    }

    if (properties.oclock_yakeli) {
        const yakeli = properties.oclock_yakeli.value / 100;
        patch.oclock_yakeli = yakeli;
        elements.body.style.setProperty('--clock-yakeli', String(yakeli));
    }

    if (properties.oclock_bluryakeli) {
        patch.oclock_bluryakeli = properties.oclock_bluryakeli.value;
        elements.body.style.setProperty('--clock-blur-yakeli', `${properties.oclock_bluryakeli.value}px`);
    }

    if (properties.datetransparency) {
        const datetransparency = properties.datetransparency.value / 100;
        patch.date_transparency = datetransparency;
        elements.body.style.setProperty('--date-opacity', String(datetransparency));
    }

    if (Object.keys(patch).length > 0) {
        store.$patch(patch);
    }

    if (FirstLoad) {
        logInitComplete('[Date]', '日期', FirstLoad);
    }
}
