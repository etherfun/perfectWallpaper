import { add0 } from './utils/tool';
import { config } from './utils/config';
import { elements } from './utils/elementManager';
import { getdate } from './date';

var oClock = elements.clock.container;
var oClock_block = elements.clock.block;
var oClock_webtext_min = elements.clock.min;
var oClock_webtext_ti = elements.clock.indicators;
var oClock_webtext_sec = elements.clock.sec;
var oClock_webtext_st = elements.clock.st;

var oDate = elements.date.container as HTMLElement;
var tStyle = true;

// 时钟彩色律动状态
var clockHue = 0;
var clockTag = 1;


// 时钟彩色律动
function updateClockColor(): void {
    if (clockHue > 255) { clockTag *= -1; clockHue = 255; }
    if (clockHue < 0) { clockTag *= -1; clockHue = 0; }
    const clockColor = 'hsl(' + clockHue + ',90%,50%)';
    clockHue += clockTag / 1;

    if (oClock) {
        oClock.style.color = clockColor;
    }
}

// 时钟彩色律动动画循环
let clockAnimationFrameId: number | null = null;
let timeIntervalId: ReturnType<typeof setInterval> | null = null;

function clockColorRhythmLoop(): void {
    if (config.time_color_rhythm) {
        updateClockColor();
        clockAnimationFrameId = requestAnimationFrame(clockColorRhythmLoop);
    }
}

export function startTimeColorRhythmLoop(): void {
    if (clockAnimationFrameId !== null) {
        cancelAnimationFrame(clockAnimationFrameId);
    }
    clockAnimationFrameId = requestAnimationFrame(clockColorRhythmLoop);
}

export function stopTimeColorRhythmLoop(): void {
    if (clockAnimationFrameId !== null) {
        cancelAnimationFrame(clockAnimationFrameId);
        clockAnimationFrameId = null;
        if (oClock) {
            oClock.style.color = "";
        }
    }
}

export function stopTimeUpdate(): void {
    if (timeIntervalId !== null) {
        clearInterval(timeIntervalId);
        timeIntervalId = null;
    }
}

timeIntervalId = setInterval(getTime_sec, 1000);

export function getTime_sec() {
    var t = new Date();
    if (oClock_webtext_sec) {
        oClock_webtext_sec.innerHTML = add0(t.getSeconds());
    }

    if (tStyle == false) {
        //h = t.getHours()
        if (oClock_webtext_min) {
            oClock_webtext_min.innerHTML = add0(t.getHours() >= 12 ? t.getHours() - 12 : t.getHours()) + " : " + add0(t.getMinutes());
        }
        if (oClock_webtext_st) {
            oClock_webtext_st.style.display = "flex";
        }
        var str = t.getHours() <= 12 ? "AM" : "PM";
        if (oClock_webtext_st) {
            oClock_webtext_st.innerHTML = str;
        }
    } else {
        if (oClock_webtext_min) {
            oClock_webtext_min.innerHTML = add0(t.getHours()) + " : " + add0(t.getMinutes());
        }
        if (oClock_webtext_st) {
            oClock_webtext_st.style.display = "none";
        }
    }

    if (tStyle == false) {
        var str = t.getHours() < 12 ? "AM" : "PM";
        if (oClock_webtext_st) {
            oClock_webtext_st.innerHTML = str;
        }
    }

    if (t.getHours() === 0 && t.getMinutes() === 0 && t.getSeconds() === 0) {
        getdate();
    }
}
