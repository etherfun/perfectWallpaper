import { elements } from '@/utils/elementManager';

import { config } from '../utils/config';
import { logInitComplete } from './_helpers';
import { WallpaperProperties } from './types';

const oClock = elements.clock.container;

/**
 * 处理时间/时钟相关属性
 * @param properties 属性对象
 * @param FirstLoad 是否首次加载
 *
 * Stage 7-B (Phase 7 批次 1):
 *   - src/time.ts 已删除；startTimeColorRhythmLoop/stopTimeColorRhythmLoop
 *     由 Clock.vue 的 useColorRhythm composable 通过 watch(config.time_color_rhythm)
 *     自动管理。
 *   - handler 不再显式调用 start/stop loop — 写 config.time_color_rhythm
 *     即可让 Vue 组件响应。
 */
export function handleTimeProperties(properties: WallpaperProperties, FirstLoad: boolean): void {
    // 时钟颜色律动（Vue Clock.vue useColorRhythm 自动响应）
    if (properties.time_color_rhythm) {
        config.time_color_rhythm = properties.time_color_rhythm.value;
    }

    // 是否显示时间
    if (properties.showTime) {
        const oClock_show = properties.showTime.value;
        config.show_time = oClock_show;
        elements.body.style.setProperty('--clock-display', oClock_show ? 'flex' : 'none');
        elements.body.style.setProperty('--clock-visibility', oClock_show ? 'visible' : 'hidden');
        // showTime=false → Clock.vue useColorRhythm 自动停止（enabled=false）
        if (!oClock_show) config.time_color_rhythm = false;
    }

    // 是否显示秒
    if (properties.tShowSencends) {
        config.t_show_sencends = properties.tShowSencends.value;
    }

    // 时间位置
    if (properties.tX) {
        config.time_x = properties.tX.value;
        elements.body.style.setProperty('--clock-left', `${properties.tX.value}%`);
    }

    if (properties.tY) {
        config.time_y = properties.tY.value;
        elements.body.style.setProperty('--clock-top', `${properties.tY.value}%`);
    }

    // 时间大小
    if (properties.tSize) {
        const s = properties.tSize.value;
        config.t_size = s;
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
        config.oclock_roundedcorners = properties.oclock_roundedcorners.value;
        elements.body.style.setProperty(
            '--clock-roundedcorners',
            String(properties.oclock_roundedcorners.value)
        );

        const updateHeight = () => {
            const height = oClock.getBoundingClientRect().height;
            if (!height) return;
            elements.body.style.setProperty('--clock-height', height + 'px');
        };

        updateHeight();
        const observer = new ResizeObserver(updateHeight);
        observer.observe(oClock);
    }

    // 日期圆角
    if (properties.odate_roundedcorners) {
        config.odate_roundedcorners = properties.odate_roundedcorners.value;
    }

    // 时间颜色
    if (properties.TimeColor) {
        const c = properties.TimeColor.value.split(' ').map(c => Math.ceil(parseFloat(c) * 255));
        config.time_color = 'rgb(' + c + ')';
        elements.body.style.setProperty('--clock-color', c.join(', '));
    }

    // 时间模糊颜色
    if (properties.TimeBlurColor) {
        const c = properties.TimeBlurColor.value
            .split(' ')
            .map(c => Math.ceil(parseFloat(c) * 255));
        config.time_blur_color = '0 0 20px rgb(' + c + ')';
        elements.body.style.setProperty('--clock-blur-color', c.join(', '));
        elements.body.style.setProperty('--clock-blur-enabled', '1');
    }

    // 时间制式
    if (properties.tStyle) {
        config.time_style = properties.tStyle.value;
    }

    // 时间透明度
    if (properties.timetransparency) {
        const transparency = properties.timetransparency.value / 100;
        config.time_transparency = transparency;
        elements.body.style.setProperty('--clock-opacity', String(transparency));
    }

    if (properties.oclock_blurcolor_show) {
        config.oclock_blurcolor_show = properties.oclock_blurcolor_show.value;
        elements.body.style.setProperty(
            '--clock-blur-enabled',
            config.oclock_blurcolor_show ? '1' : '0'
        );
    }

    if (properties.oclock_blurcolor) {
        config.oclock_blurcolor = properties.oclock_blurcolor.value
            .split(' ')
            .map(c => Math.ceil(parseFloat(c) * 255)) as [number, number, number];
        elements.body.style.setProperty('--clock-blur-color', config.oclock_blurcolor.join(', '));
    }

    if (properties.oclock_yakeli_show) {
        config.oclock_yakeli_show = properties.oclock_yakeli_show.value;
        elements.body.style.setProperty(
            '--clock-yakeli-enabled',
            config.oclock_yakeli_show ? '1' : '0'
        );
    }

    if (properties.oclock_yakelicolor) {
        config.oclock_yakelic_color = properties.oclock_yakelicolor.value
            .split(' ')
            .map(c => Math.ceil(parseFloat(c) * 255)) as [number, number, number];
        elements.body.style.setProperty(
            '--clock-yakeli-color',
            config.oclock_yakelic_color.join(', ')
        );
    }

    if (properties.oclock_yakeli) {
        config.oclock_yakeli = properties.oclock_yakeli.value / 100;
        elements.body.style.setProperty('--clock-yakeli', String(config.oclock_yakeli));
    }

    if (properties.oclock_bluryakeli) {
        config.oclock_bluryakeli = properties.oclock_bluryakeli.value;
        elements.body.style.setProperty(
            '--clock-blur-yakeli',
            String(config.oclock_bluryakeli) + 'px'
        );
    }

    // 日期透明度
    if (properties.datetransparency) {
        const datetransparency = properties.datetransparency.value / 100;
        config.date_transparency = datetransparency;
        elements.body.style.setProperty('--date-opacity', String(datetransparency));
    }

    if (FirstLoad) {
        logInitComplete('[Date]', '日期', FirstLoad);
    }
}
