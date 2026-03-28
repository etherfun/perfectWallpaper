import { WallpaperProperties } from './types';
import { config } from '../utils/config';
import { debugLogger } from '../utils/logger';
import { elements } from '@/utils/elementManager';
import { getdate } from '../date';
import { startDateColorRhythmLoop, stopDateColorRhythmLoop } from '../date';

const oDate = elements.date.container as HTMLElement;

/**
 * 处理日期相关属性
 * @param properties 属性对象
 * @param FirstLoad 是否首次加载
 * @returns 处理结果
 */
export function handleDateProperties(
    properties: WallpaperProperties,
    FirstLoad: boolean
) {
    // 日期颜色律动
    if (properties.odateColorhythm) {
        config.dateColorRhythm = properties.odateColorhythm.value;
        if (properties.odateColorhythm.value) {
            startDateColorRhythmLoop();
        } else {
            stopDateColorRhythmLoop();
        }
    }

    // 是否显示日期
    if (properties.showDate) {
        const oDate_show = properties.showDate.value;
        elements.body.style.setProperty("--date-display", oDate_show ? 'flex' : 'none');
        elements.body.style.setProperty("--date-visibility", oDate_show ? 'visible' : 'hidden');
        if (!oDate_show) stopDateColorRhythmLoop();
    }

    // 日期圆角
    if (properties.odate_roundedcorners) {
        elements.body.style.setProperty("--date-roundedcorners", String(properties.odate_roundedcorners.value));

        const updateHeight = () => {
            const height = oDate.getBoundingClientRect().height;
            if (!height) return;
            elements.body.style.setProperty("--date-height", height + "px");
        };

        updateHeight();
        const observer = new ResizeObserver(updateHeight);
        if (oDate) observer.observe(oDate);
    }
    // 日期颜色
    if (properties.odate_color) {
        config.oDateColor = properties.odate_color.value.split(' ').map((c) => Math.ceil(parseFloat(c) * 255));
        elements.body.style.setProperty("--date-color", config.oDateColor.join(', '));
    }

    if (properties.odate_blurcolor_show) {
        config.oDateBlurcolorShow = properties.odate_blurcolor_show.value;
        elements.body.style.setProperty("--date-blur-enabled", config.oDateBlurcolorShow ? '1' : '0');
    }

    if (properties.odate_blurcolor) {
        config.oDateBlurcolor = properties.odate_blurcolor.value.split(' ').map((c) => Math.ceil(parseFloat(c) * 255));
        elements.body.style.setProperty("--date-blur-color", config.oDateBlurcolor.join(', '));
    }

    if (properties.odate_yakeli_show) {
        config.oDateYakeliShow = properties.odate_yakeli_show.value;
        elements.body.style.setProperty("--date-yakeli-enabled", config.oDateYakeliShow ? '1' : '0');
    }

    if (properties.odate_yakelicolor) {
        config.oDateYakelicColor = properties.odate_yakelicolor.value.split(' ').map((c) => Math.ceil(parseFloat(c) * 255));
        elements.body.style.setProperty("--date-yakeli-color", config.oDateYakelicColor.join(', '));
    }

    if (properties.odate_yakeli) {
        config.oDateYakeli = properties.odate_yakeli.value / 100;
        elements.body.style.setProperty("--date-yakeli", String(config.oDateYakeli));
    }

    if (properties.odate_bluryakeli) {
        config.oDateBluryakeli = properties.odate_bluryakeli.value;
        elements.body.style.setProperty("--date-blur-yakeli", `${config.oDateBluryakeli}px`);
    }

    // 日期位置
    if (properties.DateX) {
        config.dateX = properties.DateX.value;
        elements.body.style.setProperty("--date-left", `${config.dateX}%`);
    }

    if (properties.DateY) {
        config.dateY = properties.DateY.value;
        elements.body.style.setProperty("--date-top", `${config.dateY}%`);
    }

    // 日期大小
    if (properties.DateSize) {
        const s = properties.DateSize.value;
        elements.body.style.setProperty("--date-font-size", Math.floor(config.screenHeight / 300 * s) + 'px');
        elements.body.style.setProperty("--date-line-height", Math.floor(config.screenHeight / 570 * s) + 'px');
    }

    if (properties.date_showwidth) {
        if (properties.date_showwidth.value === 0) {
            elements.body.style.setProperty("--date-show-width", 'auto');
        } else {
            const s = properties.date_showwidth.value / 100;
            elements.body.style.setProperty("--date-show-width", config.screenWidth * s + "px");
        }
    }

    if (properties.date_separator) {
        const dateFormat = config.dateFormat;
        dateFormat.separator = properties.date_separator.value;
        config.dateFormat = dateFormat;
        if (!FirstLoad) getdate();
    }

    if (properties.date_order) {
        const dateFormat = config.dateFormat;
        dateFormat.order = properties.date_order.value;
        config.dateFormat = dateFormat;
        if (!FirstLoad) getdate();
    }

    if (properties.date_yearFormat) {
        const dateFormat = config.dateFormat;
        dateFormat.yearFormat = properties.date_yearFormat.value;
        config.dateFormat = dateFormat;
        if (!FirstLoad) getdate();
    }

    if (properties.date_monthFormat) {
        const dateFormat = config.dateFormat;
        dateFormat.monthFormat = properties.date_monthFormat.value;
        config.dateFormat = dateFormat;
        if (!FirstLoad) getdate();
    }

    if (properties.date_dayFormat) {
        const dateFormat = config.dateFormat;
        dateFormat.dayFormat = properties.date_dayFormat.value;
        config.dateFormat = dateFormat;
        if (!FirstLoad) getdate();
    }

    if (properties.date_weekFormat) {
        const dateFormat = config.dateFormat;
        dateFormat.weekFormat = properties.date_weekFormat.value;
        config.dateFormat = dateFormat;
        if (!FirstLoad) getdate();
    }

    // 日期透明度
    if (properties.datetransparency) {
        const transparency = properties.datetransparency.value / 100;
        config.dateTransparency = transparency;
        elements.body.style.setProperty("--date-opacity", String(transparency));
    }

    if (FirstLoad) {
        debugLogger.info('[Date] 日期参数初始化完成');
        config.dateInitComplete = true;
    }
}
