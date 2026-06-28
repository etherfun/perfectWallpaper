/**
 * 时间相关 DOM 元素 - 时钟、日期、一言、倒计时
 *
 * lazy getter：这些元素由 Clock/Date/Hitokoto/Countdown.vue 渲染，
 * 在 Vue mount 后才存在于 DOM 中。
 */
import { makeLazyMap } from '../lazyMap';

const clockSelectors = {
    container: '#clock',
    block: '#clock .clock-block',
    min: '#clock .clock-block .min',
    indicators: '#clock .clock-block .time-indicators',
    sec: '#clock .clock-block .time-indicators .sec',
    st: '#clock .clock-block .time-indicators .st',
} as const;

type ClockMap = {
    container: HTMLElement;
    block: HTMLElement;
    min: HTMLElement;
    indicators: HTMLElement;
    sec: HTMLElement;
    st: HTMLElement;
};

const dateSelectors = {
    container: '#oDate',
    webtext: '#oDate .text',
} as const;

type DateMap = {
    container: HTMLElement;
    webtext: HTMLElement;
};

const hitokotoSelectors = {
    container: '#hitokoto',
    webtext: '#hitokoto .text',
} as const;

type HitokotoMap = {
    container: HTMLElement;
    webtext: HTMLElement;
};

const countdownSelectors = {
    container: '#countdown',
    webtext: '#countdown .text',
} as const;

type CountdownMap = {
    container: HTMLElement;
    webtext: HTMLElement;
};

export const timeElements = {
    clock: makeLazyMap<keyof typeof clockSelectors>(clockSelectors) as unknown as ClockMap,
    date: makeLazyMap<keyof typeof dateSelectors>(dateSelectors) as unknown as DateMap,
    hitokoto: makeLazyMap<keyof typeof hitokotoSelectors>(hitokotoSelectors) as unknown as HitokotoMap,
    countdown: makeLazyMap<keyof typeof countdownSelectors>(countdownSelectors) as unknown as CountdownMap,
};
