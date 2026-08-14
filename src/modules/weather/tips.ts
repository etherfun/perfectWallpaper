import { globalT } from '@/utils/i18n';

import type { WeatherData, WeatherTip } from './types';

/** 时间段边界（小时） */
const NIGHT_START_HOUR = 22;
const NIGHT_END_HOUR = 5;
const MORNING_START_HOUR = 5;
const MORNING_END_HOUR = 12;
const AFTERNOON_END_HOUR = 18;
const EVENING_END_HOUR = 22;

/** 各类建议的触发阈值 */
const WIND_STRONG_LEVEL = 6;
const WIND_LEVEL = 4;
const AIR_POOR = 150;
const AIR_MODERATE = 100;
const UV_EXTREME = 8;
const UV_HIGH = 6;
const UV_MODERATE = 3;
const TEMP_HOT_EXTREME = 35;
const TEMP_HOT = 30;
const TEMP_COLD_EXTREME = -10;
const TEMP_COLD = 0;
const FEELS_DIFF = 5;
const HUMIDITY_HIGH = 80;
const HUMIDITY_LOW = 30;
const VISIBILITY_POOR = 1;
const VISIBILITY_LOW = 5;
const CLOUD_HEAVY = 80;
const CLOUD_MODERATE = 50;
const PRECIP_HEAVY = 10;
const PRECIP_MODERATE = 1;

/** 温度范围初始哨兵值 */
const TEMP_SENTINEL_MIN = -100;
const TEMP_SENTINEL_MAX = 100;

/**
 * 获取天气提示
 * @param weatherData - 天气数据
 * @returns 天气提示文本
 */
export function getWeatherTips(weatherData: WeatherData): string {
    const tips: WeatherTip[] = [];
    const hour = new Date().getHours();
    const isNight = hour >= NIGHT_START_HOUR || hour < NIGHT_END_HOUR;
    const isMorning = hour >= MORNING_START_HOUR && hour < MORNING_END_HOUR;
    const isAfternoon = hour >= MORNING_END_HOUR && hour < AFTERNOON_END_HOUR;
    const isEvening = hour >= AFTERNOON_END_HOUR && hour < EVENING_END_HOUR;

    const weatherText = weatherData.weathernow || '';
    const windScale = parseInt(weatherData.windLv) || 0;
    const airQuality = parseInt(weatherData.air) || 0;
    const humidity = parseInt(weatherData.humidity) || 0;
    const uvIndex = parseInt(weatherData.uvindex) || 0;
    const currentTemp = parseInt(weatherData.temperature) || 0;
    const feelsTemp = parseInt(weatherData.feels) || 0;
    const visibility = parseFloat(weatherData.vis) || 0;
    const cloudCover = parseInt(weatherData.cloud) || 0;
    const precipitation = parseFloat(weatherData.precip) || 0;

    // 计算温度范围
    let maxTemp = TEMP_SENTINEL_MIN;
    let minTemp = TEMP_SENTINEL_MAX;

    // 使用 24 小时预报数据计算温度范围
    if (weatherData.sevenHourlyData?.Temps) {
        weatherData.sevenHourlyData.Temps.forEach(tempStr => {
            const temp = parseInt(tempStr);
            if (!isNaN(temp)) {
                if (temp > maxTemp) maxTemp = temp;
                if (temp < minTemp) minTemp = temp;
            }
        });
    }

   // 如果无法从 24 小时数据获取温度，使用当前温度作为默认值
    if (maxTemp === TEMP_SENTINEL_MIN && !isNaN(currentTemp)) {
        maxTemp = currentTemp;
        minTemp = currentTemp;
    }

    // 检查是否有天气预警
    const hasWeatherAlert =
        weatherData.weatherAlert &&
        Array.isArray(weatherData.weatherAlert) &&
        weatherData.weatherAlert.length > 0;

   // 优先级 0: 天气预警（最高优先级）
    if (hasWeatherAlert) {
        tips.push({ priority: 0, text: globalT('weather_tip_alert') });
    }

   // 优先级 1: 极端天气状况
    const sunnyText = globalT('weather_condition_sunny');
    const cloudyText = globalT('weather_condition_cloudy');
    const rainText = globalT('weather_condition_rain');
    const snowText = globalT('weather_condition_snow');

    if (weatherText.includes(rainText)) {
        tips.push({ priority: 1, text: globalT('weather_tip_rain') });
    }

    if (weatherText.includes(snowText)) {
        tips.push({ priority: 1, text: globalT('weather_tip_snow') });
    }

    if (windScale >= WIND_STRONG_LEVEL) {
        tips.push({ priority: 1, text: globalT('weather_tip_windy_strong') });
    } else if (windScale >= WIND_LEVEL) {
        tips.push({ priority: 1, text: globalT('weather_tip_windy') });
    }

    // 浼樺厛绾?2: 鍋ュ悍鐩稿叧寤鸿
    if (airQuality > AIR_POOR) {
        tips.push({ priority: 2, text: globalT('weather_tip_air_quality_poor') });
    } else if (airQuality > AIR_MODERATE) {
        tips.push({ priority: 2, text: globalT('weather_tip_air_quality') });
    }

    if (uvIndex >= UV_EXTREME) {
        tips.push({ priority: 2, text: globalT('weather_tip_uv_extreme') });
    } else if (uvIndex >= UV_HIGH) {
        tips.push({ priority: 2, text: globalT('weather_tip_uv_high') });
    } else if (uvIndex >= UV_MODERATE && !isNight) {
        tips.push({ priority: 2, text: globalT('weather_tip_uv_moderate') });
    }

    // 浼樺厛绾?3: 娓╁害鐩稿叧寤鸿
    if (maxTemp >= TEMP_HOT_EXTREME) {
        tips.push({ priority: 3, text: globalT('weather_tip_hot_extreme') });
    } else if (maxTemp >= TEMP_HOT) {
        tips.push({ priority: 3, text: globalT('weather_tip_hot') });
    } else if (minTemp <= TEMP_COLD_EXTREME) {
        tips.push({ priority: 3, text: globalT('weather_tip_cold_extreme') });
    } else if (minTemp <= TEMP_COLD) {
        tips.push({ priority: 3, text: globalT('weather_tip_cold') });
    }

    // 浣撴劅娓╁害涓庡疄娴嬫俯搴﹀樊寮?
    const tempDiff = Math.abs(feelsTemp - currentTemp);
    if (tempDiff >= FEELS_DIFF && !isNight) {
        if (feelsTemp > currentTemp) {
            tips.push({ priority: 3, text: globalT('weather_tip_feels_hotter') });
        } else {
            tips.push({ priority: 3, text: globalT('weather_tip_feels_colder') });
        }
    }

    // 浼樺厛绾?4: 婀垮害鐩稿叧寤鸿
    if (humidity >= HUMIDITY_HIGH) {
        tips.push({ priority: 4, text: globalT('weather_tip_humidity_high') });
    } else if (humidity <= HUMIDITY_LOW) {
        tips.push({ priority: 4, text: globalT('weather_tip_humidity_low') });
    }

    // 浼樺厛绾?5: 鑳借搴﹀缓璁?
    if (visibility > 0 && visibility < VISIBILITY_POOR) {
        tips.push({ priority: 5, text: globalT('weather_tip_visibility_poor') });
    } else if (visibility >= VISIBILITY_POOR && visibility < VISIBILITY_LOW) {
        tips.push({ priority: 5, text: globalT('weather_tip_visibility_low') });
    }

   // 优先级 6: 时间相关建议
    if ((weatherText.includes(sunnyText) || weatherText.includes(cloudyText)) && !isNight) {
        if (isMorning) {
            tips.push({ priority: 6, text: globalT('weather_tip_morning_sunny') });
        } else if (isAfternoon) {
            tips.push({ priority: 6, text: globalT('weather_tip_afternoon_sunny') });
        } else if (isEvening) {
            tips.push({ priority: 6, text: globalT('weather_tip_evening_sunny') });
        }
    }

    if ((weatherText.includes(sunnyText) || weatherText.includes(cloudyText)) && isNight) {
        tips.push({ priority: 6, text: globalT('weather_tip_sunny_night') });
    }

    // 浼樺厛绾?7: 閫氱敤寤鸿
    if (cloudCover >= CLOUD_HEAVY) {
        tips.push({ priority: 7, text: globalT('weather_tip_cloudy_heavy') });
    } else if (cloudCover >= CLOUD_MODERATE) {
        tips.push({ priority: 7, text: globalT('weather_tip_cloudy') });
    }

    if (precipitation > PRECIP_HEAVY) {
        tips.push({ priority: 7, text: globalT('weather_tip_heavy_precip') });
    } else if (precipitation > PRECIP_MODERATE) {
        tips.push({ priority: 7, text: globalT('weather_tip_moderate_precip') });
    }

    // 按优先级排序，取优先级最高的
    if (tips.length > 0) {
        tips.sort((a, b) => a.priority - b.priority);
        return tips[0]?.text ?? '';
    }

    // 默认建议
    if (isMorning) {
        return globalT('weather_tip_default_morning');
    } else if (isAfternoon) {
        return globalT('weather_tip_default_afternoon');
    } else if (isEvening) {
        return globalT('weather_tip_default_evening');
    } else {
        return globalT('weather_tip_default_night');
    }
}
