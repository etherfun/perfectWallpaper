import { waitAndExecute } from "../utils/tool";
import { appConfig } from "../utils/config";
import { elements } from "../utils/elementManager";

var oDate = elements.date.container;
var oDate_webtext = elements.date.webtext;

// 星期数组
var w_array = new Array("星期天","星期一","星期二","星期三","星期四","星期五","星期六");
var we_array = new Array("Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday");

// 月份数组
var m_array = new Array("一月","二月","三月","四月","五月","六月","七月","八月","九月","十月","十一月","十二月");
var me_array = new Array("January","February","March","April","May","June","July","August","September","October","November","December");

// 获取格式化后的年份
function getFormattedYear(t) {
    switch(appConfig.getDateFormat().yearFormat) {
        case 1: // YYYY格式
            return t.getFullYear();
        case 2: // YY格式（后两位）
            return t.getFullYear().toString().substr(-2);
        case 0: // 不显示
        default:
            return "";
    }
}

// 获取格式化后的月份
function getFormattedMonth(t) {
    var month = t.getMonth() + 1;
    switch(appConfig.getDateFormat().monthFormat) {
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

// 获取格式化后的日期
function getFormattedDay(t) {
    var day = t.getDate();
    switch(appConfig.getDateFormat().dayFormat) {
        case 1: // 数字格式
            return day;
        case 2: // 带前导零
            return day < 10 ? "0" + day : day;
        case 0: // 不显示
        default:
            return "";
    }
}

// 获取格式化后的星期
function getFormattedWeek(t) {
    switch(appConfig.getDateFormat().weekFormat) {
        case 1: // 中文星期
            return w_array[t.getDay()];
        case 2: // 英文星期
            return we_array[t.getDay()];
        case 0: // 不显示
        default:
            return "";
    }
}

// 获取分隔符
function getSeparator() {
    switch(appConfig.getDateFormat().separator) {
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
    var parts: any[] = [];
    var partTypes: string[] = [];
    
    // 根据顺序添加年份、月份、日期，并记录类型
    if (appConfig.getDateFormat().order === 1) { // 年月日顺序
        if (year) { parts.push(year); partTypes.push('year'); }
        if (month) { parts.push(month); partTypes.push('month'); }
        if (day) { parts.push(day); partTypes.push('day'); }
    } else if (appConfig.getDateFormat().order === 2) { // 月日年顺序
        if (month) { parts.push(month); partTypes.push('month'); }
        if (day) { parts.push(day); partTypes.push('day'); }
        if (year) { parts.push(year); partTypes.push('year'); }
    } else if (appConfig.getDateFormat().order === 3) { // 日月年顺序
        if (day) { parts.push(day); partTypes.push('day'); }
        if (month) { parts.push(month); partTypes.push('month'); }
        if (year) { parts.push(year); partTypes.push('year'); }
    }
    
    // 处理分隔符
    var result = "";
    if (sep === "" || typeof sep === "string") {
        // 简单分隔符
        for (var i = 0; i < parts.length; i++) {
            if (i > 0) result += sep;
            result += parts[i];
        }
    } else if (typeof sep === "object") {
        // 中文分隔符（年/月/日）- 根据实际类型添加正确的分隔符
        for (var i = 0; i < parts.length; i++) {
            result += parts[i];
            var partType = partTypes[i];
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
function getdate() {
    var t = new Date();
    
    // 获取各个部分的格式化值
    var year = getFormattedYear(t);
    var month = getFormattedMonth(t);
    var day = getFormattedDay(t);
    var week = getFormattedWeek(t);
    var sep = getSeparator();
    
    // 构建完整的日期字符串
    var dateString = buildDateString(year, month, day, week, sep);
    
    // 显示日期
    if (oDate_webtext) {
        oDate_webtext.innerHTML = dateString;
    }
}

function autodata(){
    getdate()
    setTimeout(getdate,600000)
}

waitAndExecute(
    () => appConfig.getDateInitComplete() === true,
    () => autodata()
);

// 导出函数
export { getdate };