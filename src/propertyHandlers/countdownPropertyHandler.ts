import { config } from '../utils/config';
import { WallpaperProperties } from './types';
import { timerManager } from '../utils/timer';
import { elements } from '@/utils/elementManager';
import { setcountdown_a } from '../countdown';
import { debugLogger } from '@/utils/logger';

// ResizeObserver for countdown height tracking
let countdownResizeObserver: ResizeObserver | null = null;

const bodyElement = elements.body;
const countdown = elements.countdown.container;

/**
 * 处理倒计时相关属性
 * @param properties 属性对象
 * @param FirstLoad 是否首次加载
 */
export function handleCountdownProperties(
    properties: WallpaperProperties,
    FirstLoad: boolean
): void {

    // 倒计时位置
    if (properties.countdownY) {
        config.countdown_y = properties.countdownY.value;
        bodyElement.style.setProperty("--countdown-top", `${properties.countdownY.value}%`);
    }

    if (properties.countdownX) {
        config.countdown_x = properties.countdownX.value;
        bodyElement.style.setProperty("--countdown-left", `${properties.countdownX.value}%`);
    }

    // 倒计时大小
    if (properties.countdown_size) {
        config.countdown_size = properties.countdown_size.value;
        const s = properties.countdown_size.value;
        bodyElement.style.setProperty("--countdown-font-size", Math.floor(window.innerHeight / 300 * s) + 'px');
        //bodyElement.style.setProperty("--countdown-line-height", Math.floor(window.innerHeight / 570 * s) + 'px');
    }

    // 倒计时文本
    if (properties.countdown_txt) {
        config.countdown_txt = properties.countdown_txt.value;
    }

    if (properties.countdown_txt1) {
        config.countdown_txt1 = properties.countdown_txt1.value;
    }

    // 是否显示倒计时
    if (properties.countdown_show) {
        config.countdown_show = properties.countdown_show.value;
        timerManager.remove('updataCountdown');
        bodyElement.style.setProperty("--countdown-display", properties.countdown_show.value ? 'flex' : 'none');
        bodyElement.style.setProperty("--countdown-visibility", properties.countdown_show.value ? 'visible' : 'hidden');
        if (properties.countdown_show.value) {
            setcountdown_a();
        }
    }

    // 倒计时目标日期
    if (properties.countdown_year) {
        config.countdown_year = properties.countdown_year.value;
    }

    if (properties.countdown_month) {
        config.countdown_month = properties.countdown_month.value;
    }

    if (properties.countdown_day) {
        config.countdown_day = properties.countdown_day.value;
    }

    // 倒计时颜色
    if (properties.countdown_color) {
        const color = properties.countdown_color.value.split(' ').map((c) => Math.ceil(parseFloat(c) * 255));
        config.countdown_color = color as [number, number, number];
        bodyElement.style.setProperty("--countdown-color", color.join(', '));
    }

    if (properties.countdown_blurcolor_show) {
        config.countdown_blurcolor_show = properties.countdown_blurcolor_show.value;
        bodyElement.style.setProperty("--countdown-blur-enabled", properties.countdown_blurcolor_show.value ? '1' : '0');
    }

    if (properties.countdown_blurcolor) {
        const color = properties.countdown_blurcolor.value.split(' ').map((c) => Math.ceil(parseFloat(c) * 255));
        config.countdown_blurcolor = color as [number, number, number];
        bodyElement.style.setProperty("--countdown-blur-color", color.join(', '));
    }

    if (properties.countdown_yakeli_show) {
        config.countdown_yakeli_show = properties.countdown_yakeli_show.value;
        bodyElement.style.setProperty("--countdown-yakeli-enabled", properties.countdown_yakeli_show.value ? '1' : '0');
    }

    if (properties.countdown_yakelicolor) {
        const color = properties.countdown_yakelicolor.value.split(' ').map((c) => Math.ceil(parseFloat(c) * 255));
        config.countdown_yakelic_color = color as [number, number, number];
        bodyElement.style.setProperty("--countdown-yakeli-color", color.join(', '));
    }

    if (properties.countdown_yakeli) {
        const value = properties.countdown_yakeli.value / 100;
        config.countdown_yakeli = value;
        bodyElement.style.setProperty("--countdown-yakeli", String(value));
    }

    if (properties.countdown_bluryakeli) {
        config.countdown_bluryakeli = properties.countdown_bluryakeli.value;
        config.first_load_countdown = false;
        bodyElement.style.setProperty("--countdown-blur-yakeli", String(properties.countdown_bluryakeli.value) + 'px');
    }

    // 倒计时透明度
    if (properties.countdown_timetransparency) {
        config.countdown_timetransparency = properties.countdown_timetransparency.value;
        const t = properties.countdown_timetransparency.value / 100;
        bodyElement.style.setProperty("--countdown-opacity", String(t));
    }

    // 倒计时圆角
    if (properties.countdown_roundedcorners) {
        config.countdown_roundedcorners = properties.countdown_roundedcorners.value;
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

    // 倒计时显示宽度
    if (properties.countdown_showwidth) {
        config.countdown_showwidth = properties.countdown_showwidth.value;
        if (properties.countdown_showwidth.value === 0) {
            bodyElement.style.setProperty("--countdown-show-width", 'auto');
        } else {
            const s = properties.countdown_showwidth.value / 100;
            bodyElement.style.setProperty("--countdown-show-width", window.innerWidth * s + "px");
        }
    }

    if (FirstLoad) {
        debugLogger.info('[Countdown] 倒计时参数初始化完成');
    }
}
