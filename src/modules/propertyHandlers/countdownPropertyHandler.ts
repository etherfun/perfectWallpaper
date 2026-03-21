/**
 * Countdown Property Handler
 * 处理倒计时相关的属性监听
 */

import { appConfig } from '../../utils/config';
import { WallpaperProperties } from './types';
import { timerManager } from '../../utils/timer';

declare let countdown: HTMLElement;
declare let bodyElement: HTMLElement;
declare let h: number;
declare let setcountdown_a: () => void;

export interface CountdownPropertyHandlerResult {
    // empty for now
}

/**
 * 处理倒计时相关属性
 * @param properties 属性对象
 * @param FirstLoad 是否首次加载
 * @returns 处理结果
 */
export function handleCountdownProperties(
    properties: WallpaperProperties,
    FirstLoad: boolean
): CountdownPropertyHandlerResult {
    const result: CountdownPropertyHandlerResult = {};

    // 倒计时位置
    if (properties.countdownY) {
        bodyElement.style.setProperty("--countdown-top", `${properties.countdownY.value}%`);
    }

    if (properties.countdownX) {
        bodyElement.style.setProperty("--countdown-left", `${properties.countdownX.value}%`);
    }

    // 倒计时大小
    if (properties.countdown_size) {
        const s = properties.countdown_size.value;
        bodyElement.style.setProperty("--countdown-font-size", Math.floor(h / 300 * s) + 'px');
        //bodyElement.style.setProperty("--countdown-line-height", Math.floor(h / 570 * s) + 'px');
    }

    // 倒计时文本
    if (properties.countdown_txt) {
        appConfig.setCountdownTxt(properties.countdown_txt.value);
    }

    if (properties.countdown_txt1) {
        appConfig.setCountdownTxt1(properties.countdown_txt1.value);
    }

    // 是否显示倒计时
    if (properties.countdown_show) {
        timerManager.remove('updataCountdown');
        bodyElement.style.setProperty("--countdown-display", properties.countdown_show.value ? 'flex' : 'none');
        bodyElement.style.setProperty("--countdown-visibility", properties.countdown_show.value ? 'visible' : 'hidden');
        if (properties.countdown_show.value) {
            setcountdown_a();
        }
    }

    // 倒计时目标日期
    if (properties.countdown_year) {
        appConfig.setCountdownYear(properties.countdown_year.value);
    }

    if (properties.countdown_month) {
        appConfig.setCountdownMonth(properties.countdown_month.value);
    }

    if (properties.countdown_day) {
        appConfig.setCountdownDay(properties.countdown_day.value);
    }

    // 倒计时颜色
    if (properties.countdown_color) {
        const color = properties.countdown_color.value.split(' ').map((c) => Math.ceil(parseFloat(c) * 255));
        appConfig.setCountdownColor(color);
        bodyElement.style.setProperty("--countdown-color", color.join(', '));
    }

    if (properties.countdown_blurcolor_show) {
        appConfig.setCountdownBlurcolorShow(properties.countdown_blurcolor_show.value);
        bodyElement.style.setProperty("--countdown-blur-enabled", properties.countdown_blurcolor_show.value ? '1' : '0');
    }

    if (properties.countdown_blurcolor) {
        const color = properties.countdown_blurcolor.value.split(' ').map((c) => Math.ceil(parseFloat(c) * 255));
        appConfig.setCountdownBlurcolor(color);
        bodyElement.style.setProperty("--countdown-blur-color", color.join(', '));
    }

    if (properties.countdown_yakeli_show) {
        appConfig.setCountdownYakeliShow(properties.countdown_yakeli_show.value);
        bodyElement.style.setProperty("--countdown-yakeli-enabled", properties.countdown_yakeli_show.value ? '1' : '0');
    }

    if (properties.countdown_yakelicolor) {
        const color = properties.countdown_yakelicolor.value.split(' ').map((c) => Math.ceil(parseFloat(c) * 255));
        appConfig.setCountdownYakelicColor(color);
        bodyElement.style.setProperty("--countdown-yakeli-color", color.join(', '));
    }

    if (properties.countdown_yakeli) {
        const value = properties.countdown_yakeli.value / 100;
        appConfig.setCountdownYakeli(value);
        bodyElement.style.setProperty("--countdown-yakeli", String(value));
    }

    if (properties.countdown_bluryakeli) {
        appConfig.setCountdownBluryakeli(properties.countdown_bluryakeli.value);
        appConfig.setFirstLoadCountdown(false);
        bodyElement.style.setProperty("--countdown-blur-yakeli", String(properties.countdown_bluryakeli.value) + 'px');
    }

    // 倒计时透明度
    if (properties.countdown_timetransparency) {
        const t = properties.countdown_timetransparency.value / 100;
        bodyElement.style.setProperty("--countdown-opacity", String(t));
    }

    // 倒计时圆角
    if (properties.countdown_roundedcorners) {
        bodyElement.style.setProperty("--countdown-roundedcorners", String(properties.countdown_roundedcorners.value));

        const updateHeight = () => {
            const height = countdown.getBoundingClientRect().height;
            if (!height) return;
            bodyElement.style.setProperty("--countdown-height", height + "px");
        };

        updateHeight();
        const observer = new ResizeObserver(updateHeight);
        observer.observe(countdown);
    }

    return result;
}
