import { elements } from '@/utils/elementManager';
import { useConfigStore } from '@/stores/config';

import { logInitComplete } from './_helpers';
import { WallpaperProperties } from './types';

const oClock = elements.clock.container;

/**
 * 处理时间/时钟相关属性
 *
 * Stage 7-B (Phase 7 批次 2-B):
 *   - config.xxx = ... 改为 useConfigStore().$patch({...})，解除对 utils/config 单例的依赖。
 *   - src/time.ts 已删除；startTimeColorRhythmLoop/stopTimeColorRhythmLoop 由
 *     Clock.vue useColorRhythm 自动管理。
 */
export function handleTimeProperties(properties: WallpaperProperties, FirstLoad: boolean): void {
    const store = useConfigStore();
    const patch: Record<string, unknown> = {};

    if (properties.time_color_rhythm) {
        patch.time_color_rhythm = properties.time_color_rhythm.value;
    }

    if (properties.showTime) {
        const oClock_show = properties.showTime.value;
        patch.show_time = oClock_show;
        elements.body.style.setProperty('--clock-display', oClock_show ? 'flex' : 'none');
        elements.body.style.setProperty('--clock-visibility', oClock_show ? 'visible' : 'hidden');
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

        const updateHeight = (): void => {
            const height = oClock.getBoundingClientRect().height;
            if (!height) return;
            elements.body.style.setProperty('--clock-height', height + 'px');
        };

        updateHeight();
        const observer = new ResizeObserver(updateHeight);
        observer.observe(oClock);
    }

    if (properties.odate_roundedcorners) {
        patch.odate_roundedcorners = properties.odate_roundedcorners.value;
    }

    if (properties.TimeColor) {
        const c = properties.TimeColor.value.split(' ').map(c => Math.ceil(parseFloat(c) * 255));
        patch.time_color = 'rgb(' + c + ')';
        elements.body.style.setProperty('--clock-color', c.join(', '));
    }

    if (properties.TimeBlurColor) {
        const c = properties.TimeBlurColor.value
            .split(' ')
            .map(c => Math.ceil(parseFloat(c) * 255));
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
        const c = properties.oclock_blurcolor.value
            .split(' ')
            .map(c => Math.ceil(parseFloat(c) * 255));
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
        const c = properties.oclock_yakelicolor.value
            .split(' ')
            .map(c => Math.ceil(parseFloat(c) * 255));
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
