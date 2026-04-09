import { config } from "./utils/config";
import { elements } from "./utils/elementManager";
import { waitAndExecute } from "./utils/timer";

let oDate = elements.date.container as HTMLElement;
// Null check for oDate_webtext - elements.date.webtext may be null if DOM is not ready
let oDate_webtext: HTMLElement | null = elements.date.webtext as HTMLElement | null;

// 日期彩色律动状态
let dateHue = 0;
let dateTag = 1;

// 日期彩色律动
function updateDateColor(): void {
    if (dateHue > 255) { dateTag *= -1; dateHue = 255; }
    if (dateHue < 0) { dateTag *= -1; dateHue = 0; }
    const dateColor = 'hsl(' + dateHue + ',90%,50%)';
    dateHue += dateTag / 1;

    if (oDate) {
        oDate.style.color = dateColor;
    }
}

// 日期彩色律动动画循环
let dateAnimationFrameId: number | null = null;

function dateColorRhythmLoop(): void {
    if (config.date_color_rhythm) {
        updateDateColor();
        dateAnimationFrameId = requestAnimationFrame(dateColorRhythmLoop);
    }
}

export function startDateColorRhythmLoop(): void {
    if (dateAnimationFrameId !== null) {
        cancelAnimationFrame(dateAnimationFrameId);
    }
    dateAnimationFrameId = requestAnimationFrame(dateColorRhythmLoop);
}

export function stopDateColorRhythmLoop(): void {
    if (dateAnimationFrameId !== null) {
        cancelAnimationFrame(dateAnimationFrameId);
        dateAnimationFrameId = null;
        if (oDate) {
            oDate.style.color = "";
        }
    }
}

// 星期数组
let w_array = new Array("星期天","星期一","星期二","星期三","星期四","星期五","星期六");
let we_array = new Array("Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday");

// 月份数组
let m_array = new Array("一月","二月","三月","四月","五月","六月","七月","八月","九月","十月","十一月","十二月");
let me_array = new Array("January","February","March","April","May","June","July","August","September","October","November","December");

function getFormattedYear(t) {
    switch(config.date_format.year_format) {
        case 1: // YYYY格式
            return t.getFullYear();
        case 2: // YY格式（后两位）
            return t.getFullYear().toString().substr(-2);
        case 0: // 不显示
        default:
            return "";
    }
}

function getFormattedMonth(t) {
    let month = t.getMonth() + 1;
    switch(config.date_format.month_format) {
        case 1: // 数字格式
            return month;
        case 2: // 英文月份
            return me_array[t.getMonth()];
        case 3: // 中文月份
            return m_array[t.getMonth()];
        case 0: // 不显示
        default:
            return "";
    }
}

function getFormattedDay(t) {
    let day = t.getDate();
    switch(config.date_format.day_format) {
        case 1: // 数字格式
            return day;
        case 2: // 带前导零
            return day < 10 ? "0" + day : day;
        case 0: // 不显示
        default:
            return "";
    }
}

function getFormattedWeek(t) {
    switch(config.date_format.week_format) {
        case 1: // 中文星期
            return w_array[t.getDay()];
        case 2: // 英文星期
            return we_array[t.getDay()];
        case 0: // 不显示
        default:
            return "";
    }
}

function getSeparator() {
    switch(config.date_format.separator) {
        case 1: // 无分隔符（用于中文格式）
            return "";
        case 2: // "/"
            return "/";
        case 3: // "-"
            return "-";
        case 4: // "."
            return ".";
        case 5: // 中文分隔符
            return {year: "年", month: "月", day: "日"};
        case 6: // 空格
            return " ";
        default:
            return "";
    }
}

// 构建日期字符串
function buildDateString(year: any, month: any, day: any, week: any, sep: any) {
    let parts: any[] = [];
    let partTypes: string[] = [];
    
    // 根据顺序添加年份、月份、日期，并记录类型
    if (config.date_format.order === 1) { // 年月日顺序
        if (year) { parts.push(year); partTypes.push('year'); }
        if (month) { parts.push(month); partTypes.push('month'); }
        if (day) { parts.push(day); partTypes.push('day'); }
    } else if (config.date_format.order === 2) { // 月日年顺序
        if (month) { parts.push(month); partTypes.push('month'); }
        if (day) { parts.push(day); partTypes.push('day'); }
        if (year) { parts.push(year); partTypes.push('year'); }
    } else if (config.date_format.order === 3) { // 日月年顺序
        if (day) { parts.push(day); partTypes.push('day'); }
        if (month) { parts.push(month); partTypes.push('month'); }
        if (year) { parts.push(year); partTypes.push('year'); }
    }
    
    // 处理分隔符
    let result = "";
    if (sep === "" || typeof sep === "string") {
        // 简单分隔符
        for (let i = 0; i < parts.length; i++) {
            if (i > 0) result += sep;
            result += parts[i];
        }
    } else if (typeof sep === "object") {
        // 中文分隔符（年/月/日）- 根据实际类型添加正确的分隔符
        for (let i = 0; i < parts.length; i++) {
            result += parts[i];
            let partType = partTypes[i];
            if (partType === 'year' && sep.year) result += sep.year;
            else if (partType === 'month' && sep.month) result += sep.month;
            else if (partType === 'day' && sep.day) result += sep.day;
        }
    }
    
    // 添加星期
    if (week) {
        if (result) result += " ";
        result += week;
    }
    
    return result;
}

// 主函数：获取并显示日期
export function getdate() {
    let t = new Date();

    let year = getFormattedYear(t);
    let month = getFormattedMonth(t);
    let day = getFormattedDay(t);
    let week = getFormattedWeek(t);
    let sep = getSeparator();

    let dateString = buildDateString(year, month, day, week, sep);

    if (oDate_webtext) {
        oDate_webtext.innerHTML = dateString;
    }
}

function autodata(){
    getdate()
    setTimeout(getdate,600000)
}

waitAndExecute(
    () => config.date_init_complete === true,
    () => autodata()
);
