/**
 * 时间相关 DOM 元素 - 时钟、日期、一言、倒计时
 */
export const timeElements = {
    clock: {
        container: document.querySelector('#clock') as HTMLElement,
        block: document.querySelector('#clock .clock-block') as HTMLElement,
        min: document.querySelector('#clock .clock-block .min') as HTMLElement,
        indicators: document.querySelector('#clock .clock-block .time-indicators') as HTMLElement,
        sec: document.querySelector('#clock .clock-block .time-indicators .sec') as HTMLElement,
        st: document.querySelector('#clock .clock-block .time-indicators .st') as HTMLElement,
    },
    date: {
        container: document.querySelector('#oDate'),
        webtext: document.querySelector('#oDate .text'),
    },
    hitokoto: {
        container: document.querySelector('#hitokoto') as HTMLElement,
        webtext: document.querySelector('#hitokoto .text') as HTMLElement,
    },
    countdown: {
        container: document.querySelector('#countdown') as HTMLElement,
        webtext: document.querySelector('#countdown .text') as HTMLElement,
    },
} as const;
