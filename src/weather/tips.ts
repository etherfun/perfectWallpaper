import { i18n } from '../utils/i18n';
import { WeatherData, WeatherTip } from './types';

/**
 * 获取天气提示
 * @param weatherData - 天气数据
 * @returns 天气提示文本
 */
export function getWeatherTips(weatherData: WeatherData): string {
    const tips: WeatherTip[] = [];
    const hour = new Date().getHours();
    const isNight = hour >= 22 || hour < 5;
    const isMorning = hour >= 5 && hour < 12;
    const isAfternoon = hour >= 12 && hour < 18;
    const isEvening = hour >= 18 && hour < 22;

    // 获取天气数据
    const weatherText = weatherData.weathernow || "";
    const windScale = parseInt(weatherData.windLv) || 0;
    const airQuality = parseInt(weatherData.air) || 0;
    const humidity = parseInt(weatherData.humidity) || 0;
    const uvIndex = parseInt(weatherData.uvindex) || 0;
    const currentTemp = parseInt(weatherData.temperature) || 0;
    const feelsTemp = parseInt(weatherData.feels) || 0;
    const windSpeed = parseFloat(weatherData.windSpeed) || 0;
    const visibility = parseFloat(weatherData.vis) || 0;
    const cloudCover = parseInt(weatherData.cloud) || 0;
    const pressure = parseInt(weatherData.pressure) || 0;
    const precipitation = parseFloat(weatherData.precip) || 0;

    // 计算温度范围
    let maxTemp = -100;
    let minTemp = 100;

    // 使用24小时预报数据计算温度范围
    if (weatherData.sevenHourlyData?.Temps) {
        weatherData.sevenHourlyData.Temps.forEach(tempStr => {
            const temp = parseInt(tempStr);
            if (!isNaN(temp)) {
                if (temp > maxTemp) maxTemp = temp;
                if (temp < minTemp) minTemp = temp;
            }
        });
    }

    // 如果无法从24小时数据获取温度，使用当前温度作为默认值
    if (maxTemp === -100 && !isNaN(currentTemp)) {
        maxTemp = currentTemp;
        minTemp = currentTemp;
    }

    // 检查是否有天气预警
    const hasWeatherAlert = weatherData.weatherAlert && 
                           Array.isArray(weatherData.weatherAlert) && 
                           weatherData.weatherAlert.length > 0;

    // 优先级 0: 天气预警（最高优先级）
    if (hasWeatherAlert) {
        tips.push({ priority: 0, text: i18n('weather_tip_alert') });
    }

    // 优先级 1: 极端天气状况
    const sunnyText = i18n('weather_condition_sunny');
    const cloudyText = i18n('weather_condition_cloudy');
    const rainText = i18n('weather_condition_rain');
    const snowText = i18n('weather_condition_snow');

    if (weatherText.includes(rainText)) {
        tips.push({ priority: 1, text: i18n('weather_tip_rain') });
    }

    if (weatherText.includes(snowText)) {
        tips.push({ priority: 1, text: i18n('weather_tip_snow') });
    }

    if (windScale >= 6) {
        tips.push({ priority: 1, text: i18n('weather_tip_windy_strong') });
    } else if (windScale >= 4) {
        tips.push({ priority: 1, text: i18n('weather_tip_windy') });
    }

    // 优先级 2: 健康相关建议
    if (airQuality > 150) {
        tips.push({ priority: 2, text: i18n('weather_tip_air_quality_poor') });
    } else if (airQuality > 100) {
        tips.push({ priority: 2, text: i18n('weather_tip_air_quality') });
    }

    if (uvIndex >= 8) {
        tips.push({ priority: 2, text: i18n('weather_tip_uv_extreme') });
    } else if (uvIndex >= 6) {
        tips.push({ priority: 2, text: i18n('weather_tip_uv_high') });
    } else if (uvIndex >= 3 && !isNight) {
        tips.push({ priority: 2, text: i18n('weather_tip_uv_moderate') });
    }

    // 优先级 3: 温度相关建议
    if (maxTemp >= 35) {
        tips.push({ priority: 3, text: i18n('weather_tip_hot_extreme') });
    } else if (maxTemp >= 30) {
        tips.push({ priority: 3, text: i18n('weather_tip_hot') });
    } else if (minTemp <= -10) {
        tips.push({ priority: 3, text: i18n('weather_tip_cold_extreme') });
    } else if (minTemp <= 0) {
        tips.push({ priority: 3, text: i18n('weather_tip_cold') });
    }

    // 体感温度与实测温度差异
    const tempDiff = Math.abs(feelsTemp - currentTemp);
    if (tempDiff >= 5 && !isNight) {
        if (feelsTemp > currentTemp) {
            tips.push({ priority: 3, text: i18n('weather_tip_feels_hotter') });
        } else {
            tips.push({ priority: 3, text: i18n('weather_tip_feels_colder') });
        }
    }

    // 优先级 4: 湿度相关建议
    if (humidity >= 80) {
        tips.push({ priority: 4, text: i18n('weather_tip_humidity_high') });
    } else if (humidity <= 30) {
        tips.push({ priority: 4, text: i18n('weather_tip_humidity_low') });
    }

    // 优先级 5: 能见度建议
    if (visibility > 0 && visibility < 1) {
        tips.push({ priority: 5, text: i18n('weather_tip_visibility_poor') });
    } else if (visibility >= 1 && visibility < 5) {
        tips.push({ priority: 5, text: i18n('weather_tip_visibility_low') });
    }

    // 优先级 6: 时间相关建议
    if ((weatherText.includes(sunnyText) || weatherText.includes(cloudyText)) && !isNight) {
        if (isMorning) {
            tips.push({ priority: 6, text: i18n('weather_tip_morning_sunny') });
        } else if (isAfternoon) {
            tips.push({ priority: 6, text: i18n('weather_tip_afternoon_sunny') });
        } else if (isEvening) {
            tips.push({ priority: 6, text: i18n('weather_tip_evening_sunny') });
        }
    }

    if ((weatherText.includes(sunnyText) || weatherText.includes(cloudyText)) && isNight) {
        tips.push({ priority: 6, text: i18n('weather_tip_sunny_night') });
    }

    // 优先级 7: 通用建议
    if (cloudCover >= 80) {
        tips.push({ priority: 7, text: i18n('weather_tip_cloudy_heavy') });
    } else if (cloudCover >= 50) {
        tips.push({ priority: 7, text: i18n('weather_tip_cloudy') });
    }

    if (precipitation > 10) {
        tips.push({ priority: 7, text: i18n('weather_tip_heavy_precip') });
    } else if (precipitation > 1) {
        tips.push({ priority: 7, text: i18n('weather_tip_moderate_precip') });
    }

    // 按优先级排序，取优先级最高的
    if (tips.length > 0) {
        tips.sort((a, b) => b.priority - a.priority);
        return tips[0].text;
    }

    // 默认建议
    if (isMorning) {
        return i18n('weather_tip_default_morning');
    } else if (isAfternoon) {
        return i18n('weather_tip_default_afternoon');
    } else if (isEvening) {
        return i18n('weather_tip_default_evening');
    } else {
        return i18n('weather_tip_default_night');
    }
}
