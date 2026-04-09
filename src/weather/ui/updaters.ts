/**
 * 天气 UI 更新函数
 * 职责：更新天气显示的各个部分
 */

import { config } from '../../utils/config';
import { elements } from '../../utils/elementManager';
import { i18n } from '../../utils/i18n';
import { fetch_with_retry } from '../../utils/tool';
import { generateAlertHTML, getAirQualityText } from '../formatters';
import { getWeatherTips } from '../tips';
import { formatTime } from '../utils';
import { getWeatherUnit } from '../weatherState';
import { weather_address, weather_data } from '../weatherState';
import { showTemperatureInsteadOfPrecip } from '../weatherState';

/**
 * 更新左侧主天气信息（图标，温度、天气文字、体感温度、城市）
 */
export async function updateMainWeatherDisplay(): Promise<void> {
    const e = elements.weather;

    // 图标
    if ([1, 4, 5].includes(config.weather_api_choose ?? 0)) {
        try {
            const iconRes = await fetch_with_retry(
                `src/source/QWeather-Icons/icons/${weather_data.icon}-fill.svg`
            );
            const iconSvg = await iconRes.text();
            e.icon.innerHTML = iconSvg;
        } catch {
            const iconRes = await fetch_with_retry(`src/source/QWeather-Icons/icons/999-fill.svg`);
            const iconSvg = await iconRes.text();
            e.icon.innerHTML = iconSvg;
        }
    }

    // 温度和天气文字
    e.temp.textContent = `${weather_data.temperature}${getWeatherUnit().temp || '℃'}`;
    e.text.textContent = weather_data.weathernow || '';

    // 体感温度（条件显示）
    if ([1, 3, 4, 5].includes(config.weather_api_choose ?? 0)) {
        e.feels.style.display = '';
        e.feels.textContent = `${i18n('weather_feels_label')} ${weather_data.feels}${getWeatherUnit().temp || '℃'}`;
    } else {
        e.feels.style.display = 'none';
    }

    // 城市（条件显示）
    if ([1, 2, 3, 4].includes(config.weather_api_choose ?? 0)) {
        e.city.style.display = '';
        e.city.textContent = weather_address.cityname;
    } else {
        e.city.style.display = 'none';
    }
}

/**
 * 更新右侧主信息行（温度范围、湿度、风向、风级、风速、能见度）
 */
export function updateWeatherDetails(): void {
    const e = elements.weather;

    // 温度范围
    e.tempRange.textContent = `${weather_data.temperature_max} ~ ${weather_data.temperature_min}℃`;

    // 湿度（条件显示）
    if ([1, 3, 4, 5].includes(config.weather_api_choose ?? 0)) {
        e.humidity.style.display = '';
        e.humidity.textContent = `${i18n('weather_humidity_label')}${weather_data.humidity}%`;
    } else {
        e.humidity.style.display = 'none';
    }

    // 风向
    e.windDirection.textContent = weather_data.wind;

    // 风级（条件显示）
    if ([1, 2].includes(config.weather_api_choose ?? 0)) {
        e.windLevel.style.display = '';
        e.windLevel.textContent = `${weather_data.windLv}${i18n('weather_wind_level_label')}`;
    } else {
        e.windLevel.style.display = 'none';
    }

    // 风速（条件显示）
    if ([1, 3, 4, 5].includes(config.weather_api_choose ?? 0)) {
        e.windSpeed.style.display = '';
        e.windSpeed.textContent = `${weather_data.windSpeed}${getWeatherUnit().wind || 'km/h'}`;
    } else {
        e.windSpeed.style.display = 'none';
    }

    // 能见度（条件显示）
    if ([1].includes(config.weather_api_choose ?? 0)) {
        e.visibility.style.display = '';
        e.visibility.textContent = `${i18n('weather_visibility_label')}${weather_data.vis}${getWeatherUnit().vis || 'km'}`;
    } else {
        e.visibility.style.display = 'none';
    }
}

/**
 * 更新详情行（UV指数、云量、日出日落、月相）
 */
export function updateWeatherExtendedInfo(): void {
    const e = elements.weather;

    if ([1, 3, 4, 5].includes(config.weather_api_choose ?? 0)) {
        e.detailRow.style.display = '';
        e.uvIndex.textContent = `${i18n('weather_uv_label')}${weather_data.uvindex}`;

        // 云量（条件显示）
        if ([1, 4, 5].includes(config.weather_api_choose ?? 0)) {
            e.cloud.style.display = '';
            e.cloud.textContent = `${i18n('weather_cloud_label')}${weather_data.cloud}%`;
        } else {
            e.cloud.style.display = 'none';
        }

        e.sunrise.textContent = `${i18n('weather_sunrise_label')}${formatTime(weather_data.sunrise)}`;
        e.sunset.textContent = `${i18n('weather_sunset_label')}${formatTime(weather_data.sunset)}`;

        // 月相（条件显示）
        if ([1, 4].includes(config.weather_api_choose ?? 0)) {
            e.moonphase.style.display = '';
            e.moonphase.textContent = weather_data.moonphase;
        } else {
            e.moonphase.style.display = 'none';
        }
    } else if ([2].includes(config.weather_api_choose ?? 0)) {
        e.detailRow.style.display = 'none';
    } else if ([3].includes(config.weather_api_choose ?? 0)) {
        e.detailRow.style.display = 'none';
    }
}

/**
 * 更新空气质量行和预警信息
 */
export function updateAirQualityAndAlerts(): void {
    const e = elements.weather;

    if ([1].includes(config.weather_api_choose ?? 0)) {
        e.airRow.style.display = '';
        e.airQuality.textContent = i18n('weather_air_quality_label');
        e.airValue.textContent = getAirQualityText(weather_data.air);

        const alertsHTML = generateAlertHTML();
        if (alertsHTML) {
            e.alertContainer.style.display = '';
            e.alertContainer.innerHTML = `${i18n('weather_alert_label')}<div class="weather-alert-items-warp"><div class="weather-alert-items">${alertsHTML}</div></div>`;
        } else {
            e.alertContainer.style.display = 'none';
        }
    } else if ([2, 3].includes(config.weather_api_choose ?? 0)) {
        e.airRow.style.display = '';
        e.airQuality.textContent = '';
        e.airValue.textContent = '';
        const alertsHTML = generateAlertHTML();
        if (alertsHTML) {
            e.alertContainer.style.display = '';
            e.alertContainer.innerHTML = `${i18n('weather_alert_label')}<div class="weather-alert-items-warp"><div class="weather-alert-items">${alertsHTML}</div></div>`;
        } else {
            e.alertContainer.style.display = 'none';
        }
    } else {
        e.airRow.style.display = 'none';
    }
}

/**
 * 更新降水概率行
 */
export function updatePrecipContainer(): void {
    const e = elements.weather;

    if ([1, 4, 5].includes(config.weather_api_choose ?? 0)) {
        e.precipContainer.style.display = '';
        const showTemp = showTemperatureInsteadOfPrecip;
        const label = showTemp ? i18n('weather_show_temperature') : i18n('weather_show_precipprob');
        const dataValues = showTemp
            ? weather_data.sevenHourlyData.Temps
            : weather_data.sevenHourlyData.Pops;
        const unit = showTemp ? getWeatherUnit().temp || '℃' : '';

        e.precipLabel.setAttribute('data-display-type', showTemp ? 'temperature' : 'precipitation');
        e.precipLabel.setAttribute(
            'data-i18n',
            showTemp ? 'weather_show_temperature' : 'weather_show_precipprob'
        );
        e.precipLabel.textContent = label;

        // 更新7个时间格
        for (let i = 0; i < 7; i++) {
            const timeEl = document.getElementById(`weatherPrecipTime${i}`);
            if (timeEl) {
                timeEl.textContent = weather_data.sevenHourlyData.Times[i] || '--:--';
            }
        }

        // 更新7个数值格
        for (let i = 0; i < 7; i++) {
            const valueEl = document.getElementById(`weatherPrecipValue${i}`);
            if (valueEl) {
                valueEl.textContent = `${dataValues[i] || '--'}${unit}`;
            }
        }
    } else {
        e.precipContainer.style.display = 'none';
    }
}

/**
 * 更新提示信息行
 */
export function updateTipDisplay(): void {
    const e = elements.weather;

    const tip = getWeatherTips(weather_data);
    if (tip && config.weather_daily_tip) {
        e.tip.style.display = '';
        e.tip.textContent = tip;
    } else {
        e.tip.style.display = 'none';
    }
}
