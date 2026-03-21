/**
 * Date Property Handler
 * 处理日期相关的属性监听
 */

import { WallpaperProperties } from './types';
import { appConfig } from '../../utils/config';
import { debugLogger } from '../../utils/logger';

declare let dateFormat: {
    yearFormat: number;
    monthFormat: number;
    dayFormat: number;
    weekFormat: number;
    separator: number;
    order: number;
};

declare let DateX: number;
declare let DateY: number;
declare let datetransparency: number;
declare let oDate_color: number[];
declare let oDate_blurcolor_show: boolean;
declare let oDate_blurcolor: number[];
declare let oDate_yakeli_show: boolean;
declare let oDate_yakelicolor: number[];
declare let oDate_yakeli: number;
declare let oDate_bluryakeli: number;
declare let oDate: HTMLElement;
declare let bodyElement: HTMLElement;
declare let h: number;
declare let w: number;
declare let getdate: () => void;

export interface DatePropertyHandlerResult {
    // dateInitComplate 现在通过 appConfig 管理
}

/**
 * 处理日期相关属性
 * @param properties 属性对象
 * @param FirstLoad 是否首次加载
 * @returns 处理结果
 */
export function handleDateProperties(
    properties: WallpaperProperties,
    FirstLoad: boolean
): DatePropertyHandlerResult {
    const result: DatePropertyHandlerResult = {};

    // 是否显示日期
    if (properties.showDate) {
        const oDate_show = properties.showDate.value;
        bodyElement.style.setProperty("--date-display", oDate_show ? 'flex' : 'none');
        bodyElement.style.setProperty("--date-visibility", oDate_show ? 'visible' : 'hidden');
    }

    // 日期圆角
    if (properties.odate_roundedcorners) {
        bodyElement.style.setProperty("--date-roundedcorners", String(properties.odate_roundedcorners.value));

        const updateHeight = () => {
            const height = oDate.getBoundingClientRect().height;
            if (!height) return;
            bodyElement.style.setProperty("--date-height", height + "px");
        };

        updateHeight();
        const observer = new ResizeObserver(updateHeight);
        observer.observe(oDate);
    }

    // 日期颜色
    if (properties.odate_color) {
        appConfig.setODateColor(properties.odate_color.value.split(' ').map((c) => Math.ceil(parseFloat(c) * 255)));
        bodyElement.style.setProperty("--date-color", appConfig.getODateColor().join(', '));
    }

    if (properties.odate_blurcolor_show) {
        appConfig.setODateBlurcolorShow(properties.odate_blurcolor_show.value);
        bodyElement.style.setProperty("--date-blur-enabled", appConfig.getODateBlurcolorShow() ? '1' : '0');
    }

    if (properties.odate_blurcolor) {
        appConfig.setODateBlurcolor(properties.odate_blurcolor.value.split(' ').map((c) => Math.ceil(parseFloat(c) * 255)));
        bodyElement.style.setProperty("--date-blur-color", appConfig.getODateBlurcolor().join(', '));
    }

    if (properties.odate_yakeli_show) {
        appConfig.setODateYakeliShow(properties.odate_yakeli_show.value);
        bodyElement.style.setProperty("--date-yakeli-enabled", appConfig.getODateYakeliShow() ? '1' : '0');
    }

    if (properties.odate_yakelicolor) {
        appConfig.setODateYakelicColor(properties.odate_yakelicolor.value.split(' ').map((c) => Math.ceil(parseFloat(c) * 255)));
        bodyElement.style.setProperty("--date-yakeli-color", appConfig.getODateYakelicColor().join(', '));
    }

    if (properties.odate_yakeli) {
        appConfig.setODateYakeli(properties.odate_yakeli.value / 100);
        bodyElement.style.setProperty("--date-yakeli", String(appConfig.getODateYakeli()));
    }

    if (properties.odate_bluryakeli) {
        appConfig.setODateBluryakeli(properties.odate_bluryakeli.value);
        bodyElement.style.setProperty("--date-blur-yakeli", `${appConfig.getODateBluryakeli()}px`);
    }

    // 日期位置
    if (properties.DateX) {
        appConfig.setDateX(properties.DateX.value);
        bodyElement.style.setProperty("--date-left", `${appConfig.getDateX()}%`);
    }

    if (properties.DateY) {
        appConfig.setDateY(properties.DateY.value);
        bodyElement.style.setProperty("--date-top", `${appConfig.getDateY()}%`);
    }

    // 日期大小
    if (properties.DateSize) {
        const s = properties.DateSize.value;
        bodyElement.style.setProperty("--date-font-size", Math.floor(h / 300 * s) + 'px');
        bodyElement.style.setProperty("--date-line-height", Math.floor(h / 570 * s) + 'px');
    }

    if (properties.date_showwidth) {
        if (properties.date_showwidth.value === 0) {
            bodyElement.style.setProperty("--date-show-width", 'auto');
        } else {
            const s = properties.date_showwidth.value / 100;
            bodyElement.style.setProperty("--date-show-width", w * s + "px");
        }
    }

    if (properties.date_separator) {
        const dateFormat = appConfig.getDateFormat();
        dateFormat.separator = properties.date_separator.value;
        appConfig.setDateFormat(dateFormat);
        if (!FirstLoad) getdate();
    }

    if (properties.date_order) {
        const dateFormat = appConfig.getDateFormat();
        dateFormat.order = properties.date_order.value;
        appConfig.setDateFormat(dateFormat);
        if (!FirstLoad) getdate();
    }

    if (properties.date_yearFormat) {
        const dateFormat = appConfig.getDateFormat();
        dateFormat.yearFormat = properties.date_yearFormat.value;
        appConfig.setDateFormat(dateFormat);
        if (!FirstLoad) getdate();
    }

    if (properties.date_monthFormat) {
        const dateFormat = appConfig.getDateFormat();
        dateFormat.monthFormat = properties.date_monthFormat.value;
        appConfig.setDateFormat(dateFormat);
        if (!FirstLoad) getdate();
    }

    if (properties.date_dayFormat) {
        const dateFormat = appConfig.getDateFormat();
        dateFormat.dayFormat = properties.date_dayFormat.value;
        appConfig.setDateFormat(dateFormat);
        if (!FirstLoad) getdate();
    }

    if (properties.date_weekFormat) {
        const dateFormat = appConfig.getDateFormat();
        dateFormat.weekFormat = properties.date_weekFormat.value;
        appConfig.setDateFormat(dateFormat);
        if (!FirstLoad) getdate();
    }

    // 日期透明度
    if (properties.datetransparency) {
        const transparency = properties.datetransparency.value / 100;
        appConfig.setDateTransparency(transparency);
        bodyElement.style.setProperty("--date-opacity", String(transparency));
    }

    if (FirstLoad) {
        debugLogger.info('[Date] 日期参数初始化完成');
        appConfig.setDateInitComplete(true);
    }

    return result;
}
