import { globalT } from '@/utils/i18n';

import { WeatherData, WeatherTip } from './types';

/**
 * 鑾峰彇澶╂皵鎻愮ず
 * @param weatherData - 澶╂皵鏁版嵁
 * @returns 澶╂皵鎻愮ず鏂囨湰
 */
export function getWeatherTips(weatherData: WeatherData): string {
    const tips: WeatherTip[] = [];
    const hour = new Date().getHours();
    const isNight = hour >= 22 || hour < 5;
    const isMorning = hour >= 5 && hour < 12;
    const isAfternoon = hour >= 12 && hour < 18;
    const isEvening = hour >= 18 && hour < 22;

    const weatherText = weatherData.weathernow || '';
    const windScale = parseInt(weatherData.windLv) || 0;
    const airQuality = parseInt(weatherData.air) || 0;
    const humidity = parseInt(weatherData.humidity) || 0;
    const uvIndex = parseInt(weatherData.uvindex) || 0;
    const currentTemp = parseInt(weatherData.temperature) || 0;
    const feelsTemp = parseInt(weatherData.feels) || 0;
    //const windSpeed = parseFloat(weatherData.windSpeed) || 0;
    const visibility = parseFloat(weatherData.vis) || 0;
    const cloudCover = parseInt(weatherData.cloud) || 0;
    //const pressure = parseInt(weatherData.pressure) || 0;
    const precipitation = parseFloat(weatherData.precip) || 0;

    // 璁＄畻娓╁害鑼冨洿
    let maxTemp = -100;
    let minTemp = 100;

    // 浣跨敤24灏忔椂棰勬姤鏁版嵁璁＄畻娓╁害鑼冨洿
    if (weatherData.sevenHourlyData?.Temps) {
        weatherData.sevenHourlyData.Temps.forEach(tempStr => {
            const temp = parseInt(tempStr);
            if (!isNaN(temp)) {
                if (temp > maxTemp) maxTemp = temp;
                if (temp < minTemp) minTemp = temp;
            }
        });
    }

    // 濡傛灉鏃犳硶浠?4灏忔椂鏁版嵁鑾峰彇娓╁害锛屼娇鐢ㄥ綋鍓嶆俯搴︿綔涓洪粯璁ゅ€?
    if (maxTemp === -100 && !isNaN(currentTemp)) {
        maxTemp = currentTemp;
        minTemp = currentTemp;
    }

    // 妫€鏌ユ槸鍚︽湁澶╂皵棰勮
    const hasWeatherAlert =
        weatherData.weatherAlert &&
        Array.isArray(weatherData.weatherAlert) &&
        weatherData.weatherAlert.length > 0;

    // 浼樺厛绾?0: 澶╂皵棰勮锛堟渶楂樹紭鍏堢骇锛?
    if (hasWeatherAlert) {
        tips.push({ priority: 0, text: globalT('weather_tip_alert') });
    }

    // 浼樺厛绾?1: 鏋佺澶╂皵鐘跺喌
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

    if (windScale >= 6) {
        tips.push({ priority: 1, text: globalT('weather_tip_windy_strong') });
    } else if (windScale >= 4) {
        tips.push({ priority: 1, text: globalT('weather_tip_windy') });
    }

    // 浼樺厛绾?2: 鍋ュ悍鐩稿叧寤鸿
    if (airQuality > 150) {
        tips.push({ priority: 2, text: globalT('weather_tip_air_quality_poor') });
    } else if (airQuality > 100) {
        tips.push({ priority: 2, text: globalT('weather_tip_air_quality') });
    }

    if (uvIndex >= 8) {
        tips.push({ priority: 2, text: globalT('weather_tip_uv_extreme') });
    } else if (uvIndex >= 6) {
        tips.push({ priority: 2, text: globalT('weather_tip_uv_high') });
    } else if (uvIndex >= 3 && !isNight) {
        tips.push({ priority: 2, text: globalT('weather_tip_uv_moderate') });
    }

    // 浼樺厛绾?3: 娓╁害鐩稿叧寤鸿
    if (maxTemp >= 35) {
        tips.push({ priority: 3, text: globalT('weather_tip_hot_extreme') });
    } else if (maxTemp >= 30) {
        tips.push({ priority: 3, text: globalT('weather_tip_hot') });
    } else if (minTemp <= -10) {
        tips.push({ priority: 3, text: globalT('weather_tip_cold_extreme') });
    } else if (minTemp <= 0) {
        tips.push({ priority: 3, text: globalT('weather_tip_cold') });
    }

    // 浣撴劅娓╁害涓庡疄娴嬫俯搴﹀樊寮?
    const tempDiff = Math.abs(feelsTemp - currentTemp);
    if (tempDiff >= 5 && !isNight) {
        if (feelsTemp > currentTemp) {
            tips.push({ priority: 3, text: globalT('weather_tip_feels_hotter') });
        } else {
            tips.push({ priority: 3, text: globalT('weather_tip_feels_colder') });
        }
    }

    // 浼樺厛绾?4: 婀垮害鐩稿叧寤鸿
    if (humidity >= 80) {
        tips.push({ priority: 4, text: globalT('weather_tip_humidity_high') });
    } else if (humidity <= 30) {
        tips.push({ priority: 4, text: globalT('weather_tip_humidity_low') });
    }

    // 浼樺厛绾?5: 鑳借搴﹀缓璁?
    if (visibility > 0 && visibility < 1) {
        tips.push({ priority: 5, text: globalT('weather_tip_visibility_poor') });
    } else if (visibility >= 1 && visibility < 5) {
        tips.push({ priority: 5, text: globalT('weather_tip_visibility_low') });
    }

    // 浼樺厛绾?6: 鏃堕棿鐩稿叧寤鸿
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
    if (cloudCover >= 80) {
        tips.push({ priority: 7, text: globalT('weather_tip_cloudy_heavy') });
    } else if (cloudCover >= 50) {
        tips.push({ priority: 7, text: globalT('weather_tip_cloudy') });
    }

    if (precipitation > 10) {
        tips.push({ priority: 7, text: globalT('weather_tip_heavy_precip') });
    } else if (precipitation > 1) {
        tips.push({ priority: 7, text: globalT('weather_tip_moderate_precip') });
    }

    // 鎸変紭鍏堢骇鎺掑簭锛屽彇浼樺厛绾ф渶楂樼殑
    if (tips.length > 0) {
        tips.sort((a, b) => a.priority - b.priority);
        return tips[0]?.text ?? '';
    }

    // 榛樿寤鸿
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
