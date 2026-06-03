import { elements } from '@/utils/elementManager';

import { getdate } from '../date';
import { startDateColorRhythmLoop, stopDateColorRhythmLoop } from '../date';
import { config } from '../utils/config';
import { logInitComplete } from './_helpers';
import { WallpaperProperties } from './types';

const oDate = elements.date.container as HTMLElement;

/**
 * 处理日期相关属性
 * @param properties 属性对象
 * @param FirstLoad 是否首次加载
 * @returns 处理结果
 */
export function handleDateProperties(properties: WallpaperProperties, FirstLoad: boolean) {
    // 日期颜色律动
    if (properties.odateColorhythm) {
        config.date_color_rhythm = properties.odateColorhythm.value;
        if (properties.odateColorhythm.value) {
            startDateColorRhythmLoop();
        } else {
            stopDateColorRhythmLoop();
        }
    }

    // 是否显示日期
    if (properties.showDate) {
        config.show_date = properties.showDate.value;
        const oDate_show = properties.showDate.value;
        elements.body.style.setProperty('--date-display', oDate_show ? 'flex' : 'none');
        elements.body.style.setProperty('--date-visibility', oDate_show ? 'visible' : 'hidden');
        if (!oDate_show) stopDateColorRhythmLoop();
    }

    // 日期圆角
    if (properties.odate_roundedcorners) {
        config.odate_roundedcorners = properties.odate_roundedcorners.value;
        elements.body.style.setProperty(
            '--date-roundedcorners',
            String(properties.odate_roundedcorners.value)
        );

        const updateHeight = () => {
            const height = oDate.getBoundingClientRect().height;
            if (!height) return;
            elements.body.style.setProperty('--date-height', height + 'px');
        };

        updateHeight();
        const observer = new ResizeObserver(updateHeight);
        if (oDate) observer.observe(oDate);
    }
    // 日期颜色
    if (properties.odate_color) {
        config.odate_color = properties.odate_color.value
            .split(' ')
            .map(c => Math.ceil(parseFloat(c) * 255)) as [number, number, number];
        elements.body.style.setProperty('--date-color', config.odate_color.join(', '));
    }

    if (properties.odate_blurcolor_show) {
        config.odate_blurcolor_show = properties.odate_blurcolor_show.value;
        elements.body.style.setProperty(
            '--date-blur-enabled',
            config.odate_blurcolor_show ? '1' : '0'
        );
    }

    if (properties.odate_blurcolor) {
        config.odate_blurcolor = properties.odate_blurcolor.value
            .split(' ')
            .map(c => Math.ceil(parseFloat(c) * 255)) as [number, number, number];
        elements.body.style.setProperty('--date-blur-color', config.odate_blurcolor.join(', '));
    }

    if (properties.odate_yakeli_show) {
        config.odate_yakeli_show = properties.odate_yakeli_show.value;
        elements.body.style.setProperty(
            '--date-yakeli-enabled',
            config.odate_yakeli_show ? '1' : '0'
        );
    }

    if (properties.odate_yakelicolor) {
        config.odate_yakelic_color = properties.odate_yakelicolor.value
            .split(' ')
            .map(c => Math.ceil(parseFloat(c) * 255)) as [number, number, number];
        elements.body.style.setProperty(
            '--date-yakeli-color',
            config.odate_yakelic_color.join(', ')
        );
    }

    if (properties.odate_yakeli) {
        config.odate_yakeli = properties.odate_yakeli.value / 100;
        elements.body.style.setProperty('--date-yakeli', String(config.odate_yakeli));
    }

    if (properties.odate_bluryakeli) {
        config.odate_bluryakeli = properties.odate_bluryakeli.value;
        elements.body.style.setProperty('--date-blur-yakeli', `${config.odate_bluryakeli}px`);
    }

    // 日期位置
    if (properties.DateX) {
        config.date_x = properties.DateX.value;
        elements.body.style.setProperty('--date-left', `${config.date_x}%`);
    }

    if (properties.DateY) {
        config.date_y = properties.DateY.value;
        elements.body.style.setProperty('--date-top', `${config.date_y}%`);
    }

    // 日期大小
    if (properties.DateSize) {
        config.date_size = properties.DateSize.value;
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
        config.date_showwidth = properties.date_showwidth.value;
        if (properties.date_showwidth.value === 0) {
            elements.body.style.setProperty('--date-show-width', 'auto');
        } else {
            const s = properties.date_showwidth.value / 100;
            elements.body.style.setProperty('--date-show-width', window.innerWidth * s + 'px');
        }
    }

    if (properties.date_separator) {
        const date_format = config.date_format;
        date_format.separator = properties.date_separator.value;
        config.date_format = date_format;
        if (!FirstLoad) getdate();
    }

    if (properties.date_order) {
        const date_format = config.date_format;
        date_format.order = properties.date_order.value;
        config.date_format = date_format;
        if (!FirstLoad) getdate();
    }

    if (properties.date_yearFormat) {
        const date_format = config.date_format;
        date_format.year_format = properties.date_yearFormat.value;
        config.date_format = date_format;
        if (!FirstLoad) getdate();
    }

    if (properties.date_monthFormat) {
        const date_format = config.date_format;
        date_format.month_format = properties.date_monthFormat.value;
        config.date_format = date_format;
        if (!FirstLoad) getdate();
    }

    if (properties.date_dayFormat) {
        const date_format = config.date_format;
        date_format.day_format = properties.date_dayFormat.value;
        config.date_format = date_format;
        if (!FirstLoad) getdate();
    }

    if (properties.date_weekFormat) {
        const date_format = config.date_format;
        date_format.week_format = properties.date_weekFormat.value;
        config.date_format = date_format;
        if (!FirstLoad) getdate();
    }

    // 日期透明度
    if (properties.datetransparency) {
        const transparency = properties.datetransparency.value / 100;
        config.date_transparency = transparency;
        elements.body.style.setProperty('--date-opacity', String(transparency));
    }

    if (FirstLoad) {
        logInitComplete('[Date]', '日期', FirstLoad);
        config.date_init_complete = true;
    }
}
