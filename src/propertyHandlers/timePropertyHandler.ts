import { WallpaperProperties } from './types';
import { config } from '../utils/config';
import { debugLogger } from '../utils/logger';
import { elements } from '@/utils/elementManager';
import { getTime_sec, startTimeColorRhythmLoop, stopTimeColorRhythmLoop } from '../time';

let tStyle = true;
const oClock_webtext_ti = elements.clock.indicators;
const oClock = elements.clock.container;

/**
 * 处理时间/时钟相关属性
 * @param properties 属性对象
 * @param FirstLoad 是否首次加载
 */
export function handleTimeProperties(
    properties: WallpaperProperties,
    FirstLoad: boolean
): void {

    // 时钟颜色律动
    if (properties.time_color_rhythm) {
        config.timeColorRhythm = properties.time_color_rhythm.value;
        if (properties.time_color_rhythm.value) {
            startTimeColorRhythmLoop();
        } else {
            stopTimeColorRhythmLoop();
        }
    }

    // 是否显示时间
    if (properties.showTime) {
        const oClock_show = properties.showTime.value;
        elements.body.style.setProperty("--clock-display", oClock_show ? 'flex' : 'none');
        elements.body.style.setProperty("--clock-visibility", oClock_show ? 'visible' : 'hidden');
        if (!oClock_show) stopTimeColorRhythmLoop();
    }

    // 是否显示秒
    if (properties.tShowSencends) {
        config.tShowSencends = properties.tShowSencends.value;
    }

    // 时间位置
    if (properties.tX) {
        config.timeX = properties.tX.value;
        elements.body.style.setProperty("--clock-left", `${properties.tX.value}%`);
    }

    if (properties.tY) {
        config.timeY = properties.tY.value;
        elements.body.style.setProperty("--clock-top", `${properties.tY.value}%`);
    }

    // 时间大小
    if (properties.tSize) {
        const s = properties.tSize.value;
        elements.body.style.setProperty("--clock-font-size", Math.floor(config.screenHeight / 300 * s) + 'px');
        elements.body.style.setProperty("--clock-line-height", Math.floor(config.screenHeight / 390 * s) + 'px');
        const indicators = document.querySelector("#clock .block .time-indicators") as HTMLElement | null;
        if (indicators) indicators.style.marginLeft = s + 'px';
    }

    if (properties.oclock_roundedcorners) {
        elements.body.style.setProperty("--clock-roundedcorners", String(properties.oclock_roundedcorners.value));

        const updateHeight = () => {
            const height = oClock.getBoundingClientRect().height;
            if (!height) return;
            elements.body.style.setProperty("--clock-height", height + "px");
        };

        updateHeight();
        const observer = new ResizeObserver(updateHeight);
        observer.observe(oClock);
    }

    // 时间颜色
    if (properties.TimeColor) {
        const c = properties.TimeColor.value.split(' ').map((c) => Math.ceil(parseFloat(c) * 255));
        config.timeColor = 'rgb(' + c + ')';
        elements.body.style.setProperty("--clock-color", c.join(', '));
    }

    // 时间模糊颜色
    if (properties.TimeBlurColor) {
        const c = properties.TimeBlurColor.value.split(' ').map((c) => Math.ceil(parseFloat(c) * 255));
        config.timeBlurColor = '0 0 20px rgb(' + c + ')';
        elements.body.style.setProperty("--clock-blur-color", c.join(', '));
        elements.body.style.setProperty("--clock-blur-enabled", '1');
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
        config.timeTransparency = transparency;
        elements.body.style.setProperty("--clock-opacity", String(transparency));
    }

    if (properties.oclock_blurcolor_show) {
        config.oClockBlurcolorShow = properties.oclock_blurcolor_show.value;
        elements.body.style.setProperty("--clock-blur-enabled", config.oClockBlurcolorShow ? '1' : '0');
    }

    if (properties.oclock_blurcolor) {
        config.oClockBlurcolor = properties.oclock_blurcolor.value.split(' ').map((c) => Math.ceil(parseFloat(c) * 255));
        elements.body.style.setProperty("--clock-blur-color", config.oClockBlurcolor.join(', '));
    }

    if (properties.oclock_yakeli_show) {
        config.oClockYakeliShow = properties.oclock_yakeli_show.value;
        elements.body.style.setProperty("--clock-yakeli-enabled", config.oClockYakeliShow ? '1' : '0');
    }

    if (properties.oclock_yakelicolor) {
        config.oClockYakelicColor = properties.oclock_yakelicolor.value.split(' ').map((c) => Math.ceil(parseFloat(c) * 255));
        elements.body.style.setProperty("--clock-yakeli-color", config.oClockYakelicColor.join(', '));
    }

    if (properties.oclock_yakeli) {
        config.oClockYakeli = properties.oclock_yakeli.value / 100;
        elements.body.style.setProperty("--clock-yakeli", String(config.oClockYakeli));
    }

    if (properties.oclock_bluryakeli) {
        config.oClockBluryakeli = properties.oclock_bluryakeli.value;
        elements.body.style.setProperty("--clock-blur-yakeli", String(config.oClockBluryakeli) + 'px');
    }

    // 日期透明度
    if (properties.datetransparency) {
        const datetransparency = properties.datetransparency.value / 100;
        elements.body.style.setProperty("--date-opacity", String(datetransparency));
    }

    if (FirstLoad) {
        debugLogger.info('[Date] 日期参数初始化完成');
    }
}
