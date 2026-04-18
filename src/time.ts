import { getdate } from './date';
import { config } from './utils/config';
import { elements } from './utils/elementManager';
import { add0 } from './utils/tool';

const oClock = elements.clock.container;
const oClock_webtext_min = elements.clock.min;
const oClock_webtext_sec = elements.clock.sec;
const oClock_webtext_st = elements.clock.st;

// 时钟彩色律动状态
interface ClockRhythmState {
    hue: number;
    direction: 1 | -1;
}

let clockState: ClockRhythmState = { hue: 0, direction: 1 };

function updateClockColor(): void {
    const { hue, direction } = clockState;
    const newHue = hue + direction;

    if (newHue > 255) {
        clockState = { hue: 255, direction: -1 };
    } else if (newHue < 0) {
        clockState = { hue: 0, direction: 1 };
    } else {
        clockState = { hue: newHue, direction };
    }

    oClock && (oClock.style.color = `hsl(${clockState.hue},90%,50%)`);
}

let clockAnimationFrameId: number | null = null;

function clockColorRhythmLoop(): void {
    if (config.time_color_rhythm) {
        updateClockColor();
        clockAnimationFrameId = requestAnimationFrame(clockColorRhythmLoop);
    }
}

export function startTimeColorRhythmLoop(): void {
    if (clockAnimationFrameId !== null) return;
    clockAnimationFrameId = requestAnimationFrame(clockColorRhythmLoop);
}

export function stopTimeColorRhythmLoop(): void {
    if (clockAnimationFrameId === null) return;
    cancelAnimationFrame(clockAnimationFrameId);
    clockAnimationFrameId = null;
    oClock && (oClock.style.color = '');
}

let timeIntervalId: ReturnType<typeof setInterval> | null = null;

export function stopTimeUpdate(): void {
    if (timeIntervalId !== null) {
        clearInterval(timeIntervalId);
        timeIntervalId = null;
    }
}

// 格式化小时（12小时制），避免中午12点显示为零点
function formatHour12(hour: number): number {
    return hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
}

// 更新时间（每秒）
export function getTime_sec(): void {
    const now = new Date();
    const hours = now.getHours();
    const minutes = now.getMinutes();
    const seconds = now.getSeconds();

    oClock_webtext_sec && (oClock_webtext_sec.innerHTML = add0(seconds));

    if (config.time_style) {
        // 12小时制
        const hour12 = formatHour12(hours);
        oClock_webtext_min && (oClock_webtext_min.innerHTML = `${add0(hour12)} : ${add0(minutes)}`);
        oClock_webtext_st && (oClock_webtext_st.style.display = 'flex');
        oClock_webtext_st && (oClock_webtext_st.innerHTML = hours < 12 ? 'AM' : 'PM');
    } else {
        // 24小时制
        oClock_webtext_min && (oClock_webtext_min.innerHTML = `${add0(hours)} : ${add0(minutes)}`);
        oClock_webtext_st && (oClock_webtext_st.style.display = 'none');
    }

    // 午夜重置日期
    if (hours === 0 && minutes === 0 && seconds === 0) {
        getdate();
    }
}

timeIntervalId = setInterval(getTime_sec, 1000);
