/**
 * useDateProperties — Vue 3 composable 包装 date 属性处理
 *
 * Stage 3-1 (Phase 7 批次 3-1): 把 src/propertyHandlers/datePropertyHandler.ts
 * 的全部逻辑迁移到 composable。保持原 handler 的所有副作用（CSS 变量 /
 * Pinia patch / ResizeObserver），不引入行为变更。
 *
 * 关键变更点（相对于原 handler）：
 * - date_format 子对象通过 Pinia $patch 整体更新（保持 handler 的 read-modify-write 模式）
 */
import { elements } from '@/utils/elementManager';
import { useConfigStore } from '@/stores/config';

import { logInitComplete } from '../propertyHandlers/_helpers';
import { WallpaperProperties } from '../propertyHandlers/types';

const oDate = elements.date.container as HTMLElement;

/**
 * 处理日期相关属性
 *
 * Stage 7-B (Phase 7 批次 2-B):
 *   - config.xxx = ... 改为 useConfigStore().$patch({...})，解除对 utils/config 单例的依赖。
 *   - src/date.ts 已删除；startDateColorRhythmLoop/stopDateColorRhythmLoop 由
 *     Date.vue useColorRhythm 自动管理；date_format 变化由 Date.vue computed 自动响应。
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
        elements.body.style.setProperty('--date-display', oDate_show ? 'flex' : 'none');
        elements.body.style.setProperty('--date-visibility', oDate_show ? 'visible' : 'hidden');
        if (!oDate_show) patch.date_color_rhythm = false;
    }

    if (properties.odate_roundedcorners) {
        patch.odate_roundedcorners = properties.odate_roundedcorners.value;
        elements.body.style.setProperty(
            '--date-roundedcorners',
            String(properties.odate_roundedcorners.value)
        );

        const updateHeight = (): void => {
            const height = oDate.getBoundingClientRect().height;
            if (!height) return;
            elements.body.style.setProperty('--date-height', height + 'px');
        };

        updateHeight();
        const observer = new ResizeObserver(updateHeight);
        if (oDate) observer.observe(oDate);
    }

    if (properties.odate_color) {
        const color = properties.odate_color.value
            .split(' ')
            .map(c => Math.ceil(parseFloat(c) * 255));
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
        const color = properties.odate_blurcolor.value
            .split(' ')
            .map(c => Math.ceil(parseFloat(c) * 255));
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
        const color = properties.odate_yakelicolor.value
            .split(' ')
            .map(c => Math.ceil(parseFloat(c) * 255));
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
        if (properties.date_showwidth.value === 0) {
            elements.body.style.setProperty('--date-show-width', 'auto');
        } else {
            const s = properties.date_showwidth.value / 100;
            elements.body.style.setProperty('--date-show-width', window.innerWidth * s + 'px');
        }
    }

    // date_format.* fields — read current from store, mutate, write back
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
