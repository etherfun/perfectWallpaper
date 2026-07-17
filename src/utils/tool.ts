/**
 * 工具函数集合
 * 包含各种通用工具函数
 */

import { debugLogger } from './logger';

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
    const colorCode = hexColor.replace('#', '');

    if (colorCode.length !== 6 || !/^[0-9a-fA-F]{6}$/.test(colorCode)) {
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
                        const errorMsg =
                            typeof window.get_i18n_text === 'function'
                                ? String(
                                      await window.get_i18n_text(
                                          window.error_get_weather_data || 'error_get_weather_data'
                                      )
                                  )
                                : '获取天气数据失败';
                        debugLogger.warn('Get weather failed');
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
        hour12: false,
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
        const [hours, minutes, seconds] = t.split(':').map(Number);
        return (hours ?? 0) * 60 + (minutes ?? 0) + (seconds ?? 0) / 60;
    };

    const now = toMinutes(nowTime);
    const rise = toMinutes(sunrise);
    const set = toMinutes(sunset);

    return now < rise || now > set;
}

/**
 * 防抖函数
 * @param func - 需要防抖的函数
 * @param wait - 等待时间(毫秒)
 * @param immediate - 是否立即执行
 * @returns 防抖处理后的函数
 */
export function debounce<T extends (...args: never[]) => unknown>(
    func: T,
    wait: number,
    immediate: boolean = false
): (...args: Parameters<T>) => Promise<ReturnType<T>> {
    let timeout: number | null = null;

    return function executedFunction(
        this: unknown,
        ...args: Parameters<T>
    ): Promise<ReturnType<T>> {
        return new Promise((resolve, reject) => {
            const context = this;

            const later = async function () {
                timeout = null;
                if (!immediate) {
                    try {
                        const result = (await func.apply(context, args)) as ReturnType<T>;
                        resolve(result);
                    } catch (err) {
                        reject(err);
                    }
                }
            };

            const callNow = immediate && !timeout;

            if (timeout !== null) {
                clearTimeout(timeout);
            }
            timeout = window.setTimeout(later, wait);

            if (callNow) {
                try {
                    const result = func.apply(context, args);
                    // Handle both sync and async functions
                    if (result instanceof Promise) {
                        result.then(resolve).catch(reject);
                    } else {
                        resolve(result as ReturnType<T>);
                    }
                } catch (err) {
                    reject(err);
                }
            }
        });
    };
}

/**
 * 节流函数
 * @param func - 需要节流的函数
 * @param limit - 限制时间(毫秒)
 * @returns 节流处理后的函数
 */
export function throttle<T extends (...args: never[]) => unknown>(
    func: T,
    limit: number
): (...args: Parameters<T>) => void {
    let inThrottle: boolean = false;

    return function (this: unknown, ...args: Parameters<T>) {
        const context = this;

        if (!inThrottle) {
            func.apply(context, args);
            inThrottle = true;
            setTimeout(() => (inThrottle = false), limit);
        }
    };
}
