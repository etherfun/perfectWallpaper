/**
 * 工具函数集合
 * 包含各种通用工具函数
 */

import { debugLogger } from './logger';
import { i18n, updateAllI18nElements } from './i18n';
import { debounce, throttle, waitAndExecute } from './timer';

// 全局变量声明
declare global {
    interface Window {
        current_lang: string;
        get_i18n_text?: (key: string) => string;
        error_get_weather_data?: string;
        VC_ICON_TO_QWEATHER?: { [key: string]: { day: number; night: number } };
    }
}

/**
 * 给元素添加颜色效果
 * @param TorF - 是否启用发光效果
 * @param Element - 目标元素
 * @param Element_color - RGB颜色字符串，格式："r,g,b"
 * @param Element_blurcolor - 发光颜色字符串，格式："r,g,b"
 */
export function Element_effects_color(
    TorF: boolean, 
    Element: HTMLElement, 
    Element_color: string, 
    Element_blurcolor: string
): void {
    Element.style.color = 'rgb(' + Element_color + ')';

    if (TorF) {
        Element.style.textShadow = '0 0 20px rgb(' + Element_blurcolor + ')';
    } else {
        Element.style.textShadow = '';
    }
}

/**
 * 给元素添加亚克力效果
 * @param TorF - 是否启用亚克力效果
 * @param Element - 目标元素
 * @param Element_yakeli - 透明度 (0-1)
 * @param Element_yakelicolor - RGB颜色字符串，格式："r,g,b"
 * @param Element_bluryakeli - 模糊半径(像素)
 */
export function Element_effects_yakeli(
    TorF: boolean, 
    Element: HTMLElement, 
    Element_yakeli: number, 
    Element_yakelicolor: string, 
    Element_bluryakeli: number
): void {
    if (TorF) {
        Element.style.background = "rgba(" + Element_yakelicolor + "," + Element_yakeli + ")";
        Element.style.backdropFilter = "blur(" + Element_bluryakeli + "px)";
    } else {
        Element.style.background = "";
        Element.style.backdropFilter = "";
    }
}

/**
 * 数字不足指定位数则加"0"
 * @param n - 数字
 * @param digits - 位数，默认2位
 * @returns 补零后的字符串
 */
export function add0(n: number, digits: number = 2): string {
    let str = n.toString();
    while (str.length < digits) {
        str = '0' + str;
    }
    return str;
}

/**
 * Hex颜色转换为RGB数组
 * @param hexColor - Hex颜色值，如"#FF0000"
 * @returns RGB数组 [r, g, b]
 */
export function hexToRgb(hexColor: string): [number, number, number] {
    const colorCode = hexColor.replace("#", "");
    
    if (colorCode.length !== 6) {
        throw new Error('Invalid hex color format');
    }
    
    const r = parseInt(colorCode.substring(0, 2), 16);
    const g = parseInt(colorCode.substring(2, 4), 16);
    const b = parseInt(colorCode.substring(4, 6), 16);
    
    return [r, g, b];
}

/**
 * 天气请求数量检查
 * @returns 是否需要付费
 */
export function weather_paymode(): boolean {
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentDate = today.getDate();

    let usageData: { count?: number; month?: number } = {};
    try {
        const usageDataStr = localStorage.getItem('UsageData') || '{}';
        usageData = JSON.parse(usageDataStr);
    } catch {
        debugLogger.warn('Failed to parse UsageData, resetting');
    }
    localStorage.removeItem('UseNumber');

    if (currentDate === 1 || usageData.month !== currentMonth) {
        usageData.count = 0;
        usageData.month = currentMonth;
    }

    if ((usageData.count ?? 0) >= 50000) {
        debugLogger.warn('Weather api over Usage');
        return true; // 需要付费
    }

    usageData.count = (usageData.count ?? 0) + 1;
    localStorage.setItem('UsageData', JSON.stringify(usageData));
    return false;
}

/**
 * 如果失败多次重试fetch请求
 * @param url - URL地址
 * @param options - 请求选项
 * @param maxRetries - 最大重试次数
 * @returns Promise<Response>
 */
export function fetch_with_retry(
    url: string, 
    options: RequestInit = {}, 
    maxRetries: number = 3
): Promise<Response> {
    return new Promise((resolve, reject) => {
        const attempt = (retryCount: number) => {
            fetch(url, options)
                .then(async response => {
                    if (!response.ok) {
                        const errorMsg = typeof window.get_i18n_text === 'function'
                            ? String(await window.get_i18n_text(window.error_get_weather_data || 'error_get_weather_data'))
                            : '获取天气数据失败';
                        debugLogger.warn("Get weather failed");
                        throw new Error(`${errorMsg} HTTP ${response.status}`);
                    }
                    return response;
                })
                .then(resolve)
                .catch(error => {
                    if (retryCount < maxRetries) {
                        debugLogger.warn(`${url} 第 ${retryCount + 1} 次重试...`);
                        const delay = Math.pow(4, retryCount) * 2000;
                        setTimeout(() => attempt(retryCount + 1), delay);
                    } else {
                        debugLogger.warn(`${url} Get weather failed`);
                        reject(error);
                    }
                });
        };

        attempt(0);
    });
}

/**
 * 格式化时间
 * @param timestamp - 时间戳或Date对象
 * @param seconds - 是否包含秒
 * @returns 格式化后的时间字符串
 */
export function getTime(timestamp: Date, seconds: boolean = true): string {
    const format: Intl.DateTimeFormatOptions = {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: undefined,
        hour12: false
    };
    
    if (seconds) {
        format.second = '2-digit';
    }

    return timestamp.toLocaleString(undefined, format).replace(/\//g, '-');
}

/**
 * 根据 VisualCrossing icon 和昼夜状态获取和风 iconId
 * @param vcIcon - VisualCrossing icon
 * @param isNight - 是否夜晚
 * @returns 和风天气 iconId
 */
export function getQWeatherIcon(vcIcon: string, isNight: boolean): number {
    if (!vcIcon) return 999;

    const rule = window.VC_ICON_TO_QWEATHER?.[vcIcon];
    if (!rule) return 999;

    return isNight ? rule.night : rule.day;
}

/**
 * 判断当前时间是否夜晚
 * @param nowTime - 当前时间 "HH:MM:SS"
 * @param sunrise - 日出时间 "HH:MM:SS"
 * @param sunset - 日落时间 "HH:MM:SS"
 * @returns true 表示夜晚，false 表示白天
 */
export function isNightTime(nowTime: string, sunrise: string, sunset: string): boolean {
    const toMinutes = (t: string): number => {
        const [hours, minutes, seconds] = t.split(":").map(Number);
        return hours * 60 + minutes + seconds / 60;
    };
    
    const now = toMinutes(nowTime);
    const rise = toMinutes(sunrise);
    const set = toMinutes(sunset);
    
    return now < rise || now > set;
}

// 导出所有函数
export {
    i18n,
    updateAllI18nElements,
    debounce,
    throttle,
    waitAndExecute
};