import { useConfigStore } from '@/stores/config';
import { registerDeferred } from '@/utils/deferredScheduler';
import { applyShowHide, setShowWidth, syncElementHeightToCssVar } from '@/utils/dom';
import { elements } from '@/utils/elementManager';

import { WallpaperProperties } from '../../types/types';
import { parseColorString } from '../../utils/color';
import { logInitComplete } from '../../utils/helpers';

/**
 * 澶勭悊鏃ユ湡鐩稿叧灞炴€?
 *
 * Stage 7-B (Phase 7 鎵规 2-B):
 *   - config.xxx = ... 鏀逛负 useConfigStore().$patch({...})锛岃В闄ゅ utils/config 鍗曚緥鐨勪緷璧栥€?
 *   - src/date.ts 宸插垹闄わ紱startDateColorRhythmLoop/stopDateColorRhythmLoop 鐢?
 *     Date.vue useColorRhythm 鑷姩绠＄悊锛沝ate_format 鍙樺寲鐢?Date.vue computed 鑷姩鍝嶅簲銆?
 */
export function useDateProperties(properties: WallpaperProperties, FirstLoad: boolean): void {
    const store = useConfigStore();
    const patch: Record<string, unknown> = {};

    if (properties.odateColorhythm) {
        patch.date_color_rhythm = properties.odateColorhythm.value;
    }

    if (properties.showDate) {
        patch.show_date = properties.showDate.value;
        const oDate_show = properties.showDate.value;
        applyShowHide('date', oDate_show);
        if (!oDate_show) patch.date_color_rhythm = false;
    }

    if (properties.odate_roundedcorners) {
        patch.odate_roundedcorners = properties.odate_roundedcorners.value;
        elements.body.style.setProperty(
            '--date-roundedcorners',
            String(properties.odate_roundedcorners.value)
        );

        // 鐩戝惉鏃ユ湡瀹瑰櫒灏哄鍙樺寲锛屽悓姝?--date-height CSS 鍙橀噺銆?
        // oDate 瀹瑰櫒鐢?Vue mount 鍚庢墠瀛樺湪锛岄€氳繃 deferredScheduler 寤跺悗鎸傝浇 observer銆?
        registerDeferred('date:height-observer', () =>
            syncElementHeightToCssVar('--date-height', () => elements.date.container)
        );
    }

    if (properties.odate_color) {
        const color = parseColorString(properties.odate_color.value) as [number, number, number];
        patch.odate_color = color;
        elements.body.style.setProperty('--date-color', color.join(', '));
    }

    if (properties.odate_blurcolor_show) {
        patch.odate_blurcolor_show = properties.odate_blurcolor_show.value;
        elements.body.style.setProperty(
            '--date-blur-enabled',
            properties.odate_blurcolor_show.value ? '1' : '0'
        );
    }

    if (properties.odate_blurcolor) {
        const color = parseColorString(properties.odate_blurcolor.value) as [number, number, number];
        patch.odate_blurcolor = color;
        elements.body.style.setProperty('--date-blur-color', color.join(', '));
    }

    if (properties.odate_yakeli_show) {
        patch.odate_yakeli_show = properties.odate_yakeli_show.value;
        elements.body.style.setProperty(
            '--date-yakeli-enabled',
            properties.odate_yakeli_show.value ? '1' : '0'
        );
    }

    if (properties.odate_yakelicolor) {
        const color = parseColorString(properties.odate_yakelicolor.value) as [number, number, number];
        patch.odate_yakelic_color = color;
        elements.body.style.setProperty('--date-yakeli-color', color.join(', '));
    }

    if (properties.odate_yakeli) {
        const value = properties.odate_yakeli.value / 100;
        patch.odate_yakeli = value;
        elements.body.style.setProperty('--date-yakeli', String(value));
    }

    if (properties.odate_bluryakeli) {
        patch.odate_bluryakeli = properties.odate_bluryakeli.value;
        elements.body.style.setProperty('--date-blur-yakeli', `${properties.odate_bluryakeli.value}px`);
    }

    if (properties.DateX) {
        patch.date_x = properties.DateX.value;
        elements.body.style.setProperty('--date-left', `${properties.DateX.value}%`);
    }

    if (properties.DateY) {
        patch.date_y = properties.DateY.value;
        elements.body.style.setProperty('--date-top', `${properties.DateY.value}%`);
    }

    if (properties.DateSize) {
        patch.date_size = properties.DateSize.value;
        const s = properties.DateSize.value;
        elements.body.style.setProperty(
            '--date-font-size',
            Math.floor((window.innerHeight / 300) * s) + 'px'
        );
        elements.body.style.setProperty(
            '--date-line-height',
            Math.floor((window.innerHeight / 570) * s) + 'px'
        );
    }

    if (properties.date_showwidth) {
        patch.date_showwidth = properties.date_showwidth.value;
        setShowWidth('--date-show-width', properties.date_showwidth.value);
    }

    // date_format.* fields 鈥?read current from store, mutate, write back
    const date_format = { ...(store.date_format ?? {}) };
    let dateFormatChanged = false;

    if (properties.date_separator) {
        date_format.separator = properties.date_separator.value;
        dateFormatChanged = true;
    }
    if (properties.date_order) {
        date_format.order = properties.date_order.value;
        dateFormatChanged = true;
    }
    if (properties.date_yearFormat) {
        date_format.year_format = properties.date_yearFormat.value;
        dateFormatChanged = true;
    }
    if (properties.date_monthFormat) {
        date_format.month_format = properties.date_monthFormat.value;
        dateFormatChanged = true;
    }
    if (properties.date_dayFormat) {
        date_format.day_format = properties.date_dayFormat.value;
        dateFormatChanged = true;
    }
    if (properties.date_weekFormat) {
        date_format.week_format = properties.date_weekFormat.value;
        dateFormatChanged = true;
    }

    if (dateFormatChanged) {
        patch.date_format = date_format;
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
        store.$patch({ date_init_complete: true });
    }
}
