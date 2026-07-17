import { globalT } from '@/utils/i18n';

import { OPEN_METEO_TO_QWEATHER } from './types';

/**
 * 鏍煎紡鍖栨椂闂村嚱鏁帮紙鐢ㄤ簬鏃ュ嚭鏃ヨ惤鏃堕棿锛?
 * @param timeString - 鏃堕棿瀛楃涓?
 * @returns 鏍煎紡鍖栧悗鐨勬椂闂村瓧绗︿覆
 */
export function formatTime(timeString: string | undefined): string {
    if (!timeString) return '--:--';

    try {
        const date = new Date(timeString);
        if (isNaN(date.getTime())) {
            const timeMatch = timeString.match(/(\d{1,2}):(\d{1,2})/);
            if (timeMatch?.[1] && timeMatch[2]) {
                const hours = timeMatch[1].padStart(2, '0');
                const minutes = timeMatch[2].padStart(2, '0');
                return `${hours}:${minutes}`;
            }
            return timeString;
        }

        const hours = date.getHours().toString().padStart(2, '0');
        const minutes = date.getMinutes().toString().padStart(2, '0');
        return `${hours}:${minutes}`;
    } catch (error) {
        console.error('Error formatting time:', error);
        return timeString;
    }
}

/**
 * 鑾峰彇 Open-Meteo 澶╂皵浠ｇ爜瀵瑰簲鐨勫拰椋庡ぉ姘斿浘鏍?
 * @param weatherCode - Open-Meteo 澶╂皵浠ｇ爜
 * @param timeString - 鏃堕棿瀛楃涓?
 * @returns 鍜岄澶╂皵鍥炬爣缂栧彿
 */
export function getOpenMeteoIcon(weatherCode: number, timeString?: string): number {
    const defaultIcon = { day: 100, night: 150 };
    const iconMapping = OPEN_METEO_TO_QWEATHER[weatherCode] || defaultIcon;

    let isNight = false;
    if (timeString) {
        const time = new Date(timeString);
        const hour = time.getHours();
        isNight = hour >= 18 || hour < 6;
    }

    return isNight ? iconMapping.night : iconMapping.day;
}

/**
 * 鏍规嵁Open-Meteo澶╂皵浠ｇ爜鎺ㄦ柇闄嶆按绫诲瀷
 * @param weatherCode - Open-Meteo 澶╂皵浠ｇ爜
 * @returns 闄嶆按绫诲瀷鏂囨湰
 */
export function getPrecipTypeFromCode(weatherCode: number): string {
    // 闆ㄧ浉鍏充唬鐮?
    const rainCodes = [51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82, 95, 96, 99];
    // 闆浉鍏充唬鐮?
    const snowCodes = [71, 73, 75, 77, 85, 86];
    // 鍐婚洦鐩稿叧浠ｇ爜
    const freezingRainCodes = [56, 57, 66, 67];
    // 鍐伴浌鐩稿叧浠ｇ爜
    const hailCodes = [77];

    if (rainCodes.includes(weatherCode)) {
        if (freezingRainCodes.includes(weatherCode)) {
            return globalT('weather_precip_type_freezing_rain');
        } else if (hailCodes.includes(weatherCode)) {
            return globalT('weather_precip_type_hail');
        }
        return globalT('weather_precip_type_rain');
    } else if (snowCodes.includes(weatherCode)) {
        return globalT('weather_precip_type_snow');
    }

    return globalT('weather_precip_type_none');
}
