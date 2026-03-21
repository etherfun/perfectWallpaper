/**
 * Time Property Handler
 * 处理时间/时钟相关的属性监听
 */

import { WallpaperProperties } from './types';
import { appConfig } from '../../utils/config';
import { debugLogger } from '../../utils/logger';

declare let TimeX: number;
declare let TimeY: number;
declare let tShowSencends: boolean;
declare let TimeColorRhythm: boolean;
declare let TimeColor: string;
declare let TimeBlurColor: string;
declare let timetransparency: number;
declare let oClock_color: number[];
declare let oClock_blurcolor_show: boolean;
declare let oClock_blurcolor: number[];
declare let oClock_yakeli_show: boolean;
declare let oClock_yakelicolor: number[];
declare let oClock_yakeli: number;
declare let oClock_bluryakeli: number;
declare let oClock: HTMLElement;
declare let oClock_webtext_ti: HTMLElement;
declare let bodyElement: HTMLElement;
declare let h: number;
declare let tStyle: boolean;
declare let getTime_sec: () => void;

export interface TimePropertyHandlerResult {
    // empty for now
}

/**
 * 处理时间/时钟相关属性
 * @param properties 属性对象
 * @param FirstLoad 是否首次加载
 * @returns 处理结果
 */
export function handleTimeProperties(
    properties: WallpaperProperties,
    FirstLoad: boolean
): TimePropertyHandlerResult {
    const result: TimePropertyHandlerResult = {};

    // 是否显示时间
    if (properties.showTime) {
        const oClock_show = properties.showTime.value;
        bodyElement.style.setProperty("--clock-display", oClock_show ? 'flex' : 'none');
        bodyElement.style.setProperty("--clock-visibility", oClock_show ? 'visible' : 'hidden');
    }

    // 是否显示秒
    if (properties.tShowSencends) {
        appConfig.setTShowSencends(properties.tShowSencends.value);
    }

    // 时间位置
    if (properties.tX) {
        appConfig.setTimeX(properties.tX.value);
        bodyElement.style.setProperty("--clock-left", `${properties.tX.value}%`);
    }

    if (properties.tY) {
        appConfig.setTimeY(properties.tY.value);
        bodyElement.style.setProperty("--clock-top", `${properties.tY.value}%`);
    }

    // 时间大小
    if (properties.tSize) {
        const s = properties.tSize.value;
        bodyElement.style.setProperty("--clock-font-size", Math.floor(h / 300 * s) + 'px');
        bodyElement.style.setProperty("--clock-line-height", Math.floor(h / 390 * s) + 'px');
        const indicators = document.querySelector("#clock .block .time-indicators") as HTMLElement | null;
        if (indicators) indicators.style.marginLeft = s + 'px';
    }

    if (properties.oclock_roundedcorners) {
        bodyElement.style.setProperty("--clock-roundedcorners", String(properties.oclock_roundedcorners.value));

        const updateHeight = () => {
            const height = oClock.getBoundingClientRect().height;
            if (!height) return;
            bodyElement.style.setProperty("--clock-height", height + "px");
        };

        updateHeight();
        const observer = new ResizeObserver(updateHeight);
        observer.observe(oClock);
    }

    // 颜色律动
    if (properties.TimeColorRhythm) {
        appConfig.setTimeColorRhythm(properties.TimeColorRhythm.value);
        bodyElement.style.setProperty("--clock-color-rhythm", appConfig.getTimeColorRhythm() ? '1' : '0');
        bodyElement.style.setProperty("--date-color-rhythm", appConfig.getTimeColorRhythm() ? '1' : '0');
    }

    // 时间颜色
    if (properties.TimeColor) {
        const c = properties.TimeColor.value.split(' ').map((c) => Math.ceil(parseFloat(c) * 255));
        appConfig.setTimeColor('rgb(' + c + ')');
        bodyElement.style.setProperty("--clock-color", c.join(', '));
    }

    // 时间模糊颜色
    if (properties.TimeBlurColor) {
        const c = properties.TimeBlurColor.value.split(' ').map((c) => Math.ceil(parseFloat(c) * 255));
        appConfig.setTimeBlurColor('0 0 20px rgb(' + c + ')');
        bodyElement.style.setProperty("--clock-blur-color", c.join(', '));
        bodyElement.style.setProperty("--clock-blur-enabled", '1');
    }

    // 时间制式
    if (properties.tStyle) {
        if (properties.tStyle.value) {
            oClock_webtext_ti.style.justifyContent = "flex-end";
        } else {
            oClock_webtext_ti.style.justifyContent = "space-between";
        }
        tStyle = properties.tStyle.value;
        getTime_sec();
    }

    // 时间透明度
    if (properties.timetransparency) {
        const transparency = properties.timetransparency.value / 100;
        appConfig.setTimeTransparency(transparency);
        bodyElement.style.setProperty("--clock-opacity", String(transparency));
    }

    if (properties.oclock_blurcolor_show) {
        appConfig.setOClockBlurcolorShow(properties.oclock_blurcolor_show.value);
        bodyElement.style.setProperty("--clock-blur-enabled", appConfig.getOClockBlurcolorShow() ? '1' : '0');
    }

    if (properties.oclock_blurcolor) {
        appConfig.setOClockBlurcolor(properties.oclock_blurcolor.value.split(' ').map((c) => Math.ceil(parseFloat(c) * 255)));
        bodyElement.style.setProperty("--clock-blur-color", appConfig.getOClockBlurcolor().join(', '));
    }

    if (properties.oclock_yakeli_show) {
        appConfig.setOClockYakeliShow(properties.oclock_yakeli_show.value);
        bodyElement.style.setProperty("--clock-yakeli-enabled", appConfig.getOClockYakeliShow() ? '1' : '0');
    }

    if (properties.oclock_yakelicolor) {
        appConfig.setOClockYakelicColor(properties.oclock_yakelicolor.value.split(' ').map((c) => Math.ceil(parseFloat(c) * 255)));
        bodyElement.style.setProperty("--clock-yakeli-color", appConfig.getOClockYakelicColor().join(', '));
    }

    if (properties.oclock_yakeli) {
        appConfig.setOClockYakeli(properties.oclock_yakeli.value / 100);
        bodyElement.style.setProperty("--clock-yakeli", String(appConfig.getOClockYakeli()));
    }

    if (properties.oclock_bluryakeli) {
        appConfig.setOClockBluryakeli(properties.oclock_bluryakeli.value);
        bodyElement.style.setProperty("--clock-blur-yakeli", String(appConfig.getOClockBluryakeli()) + 'px');
    }

    // 日期透明度
    if (properties.datetransparency) {
        const datetransparency = properties.datetransparency.value / 100;
        bodyElement.style.setProperty("--date-opacity", String(datetransparency));
    }

    return result;
}
