// 倒计时模块
import { timerManager } from '@/utils/timer';

import { config } from './utils/config';
import { elements } from './utils/elementManager';

const countdown_webtext = elements.countdown.webtext;

// 添加前导零
function add0(num: number): string {
    return num < 10 ? "0" + num : num.toString();
}

export function setcountdown(): void {
    const examDate = new Date(config.countdown_year, config.countdown_month - 1, config.countdown_day);
    const now = new Date();
    const distance = examDate.getTime() - now.getTime();

    const days = Math.ceil(distance / (1000 * 60 * 60 * 24));
    const hours = Math.ceil((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.ceil((distance % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.ceil((distance % (1000 * 60)) / 1000);

    if (countdown_webtext) {
        countdown_webtext.innerHTML = config.countdown_txt + (days - 1) + ":" + add0(hours - 1) + ":" + add0(minutes - 1) + ":" + add0(seconds) + config.countdown_txt1;
    }
}

// 定时更新倒计时
export function setcountdown_a(): void {
    setcountdown();
    timerManager.create(setcountdown_a, 1000, 'updataCountdown');
}
