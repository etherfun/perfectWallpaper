/**
 * 澶╂皵 UI 鏇存柊鍑芥暟
 * 鑱岃矗锛氭洿鏂板ぉ姘旀樉绀虹殑鍚勪釜閮ㄥ垎
 */

import { useConfigStore } from "@/stores/config";
import { globalT } from '@/utils/i18n';

import { elements } from '../../../utils/elementManager';
import { fetch_with_retry } from '../../../utils/tool';
import { generateAlertHTML, getAirQualityText } from '../formatters';
import { getWeatherTips } from '../tips';
import { formatTime } from '../utils';
import { getWeatherUnit } from '../weatherState';
import { weather_address, weather_data } from '../weatherState';
import { showTemperatureInsteadOfPrecip } from '../weatherState';

const config = useConfigStore();

/**
 * 鏇存柊宸︿晶涓诲ぉ姘斾俊鎭紙鍥炬爣锛屾俯搴︺€佸ぉ姘旀枃瀛椼€佷綋鎰熸俯搴︺€佸煄甯傦級
 */
export async function updateMainWeatherDisplay(): Promise<void> {
    const e = elements.weather;

    // 鍥炬爣
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
        e.feels.textContent = `${globalT('weather_feels_label')} ${weather_data.feels}${getWeatherUnit().temp || '℃'}`;
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
 * 鏇存柊鍙充晶涓讳俊鎭锛堟俯搴﹁寖鍥淬€佹箍搴︺€侀鍚戙€侀绾с€侀閫熴€佽兘瑙佸害锛?
 */
export function updateWeatherDetails(): void {
    const e = elements.weather;

    // 温度范围
    e.tempRange.textContent = `${weather_data.temperature_max} ~ ${weather_data.temperature_min}℃`;

    // 湿度（条件显示）
    if ([1, 3, 4, 5].includes(config.weather_api_choose ?? 0)) {
        e.humidity.style.display = '';
        e.humidity.textContent = `${globalT('weather_humidity_label')}${weather_data.humidity}%`;
    } else {
        e.humidity.style.display = 'none';
    }

    // 风向
    e.windDirection.textContent = weather_data.wind;

    // 风级（条件显示）
    if ([1, 2].includes(config.weather_api_choose ?? 0)) {
        e.windLevel.style.display = '';
        e.windLevel.textContent = `${weather_data.windLv}${globalT('weather_wind_level_label')}`;
    } else {
        e.windLevel.style.display = 'none';
    }

    // 椋庨€燂紙鏉′欢鏄剧ず锛?
    if ([1, 3, 4, 5].includes(config.weather_api_choose ?? 0)) {
        e.windSpeed.style.display = '';
        e.windSpeed.textContent = `${weather_data.windSpeed}${getWeatherUnit().wind || 'km/h'}`;
    } else {
        e.windSpeed.style.display = 'none';
    }

    // 鑳借搴︼紙鏉′欢鏄剧ず锛?
    if ([1].includes(config.weather_api_choose ?? 0)) {
        e.visibility.style.display = '';
        e.visibility.textContent = `${globalT('weather_visibility_label')}${weather_data.vis}${getWeatherUnit().vis || 'km'}`;
    } else {
        e.visibility.style.display = 'none';
    }
}

/**
 * 鏇存柊璇︽儏琛岋紙UV鎸囨暟銆佷簯閲忋€佹棩鍑烘棩钀姐€佹湀鐩革級
 */
export function updateWeatherExtendedInfo(): void {
    const e = elements.weather;

    if ([1, 3, 4, 5].includes(config.weather_api_choose ?? 0)) {
        e.detailRow.style.display = '';
        e.uvIndex.textContent = `${globalT('weather_uv_label')}${weather_data.uvindex}`;

        // 浜戦噺锛堟潯浠舵樉绀猴級
        if ([1, 4, 5].includes(config.weather_api_choose ?? 0)) {
            e.cloud.style.display = '';
            e.cloud.textContent = `${globalT('weather_cloud_label')}${weather_data.cloud}%`;
        } else {
            e.cloud.style.display = 'none';
        }

        e.sunrise.textContent = `${globalT('weather_sunrise_label')}${formatTime(weather_data.sunrise)}`;
        e.sunset.textContent = `${globalT('weather_sunset_label')}${formatTime(weather_data.sunset)}`;

        // 鏈堢浉锛堟潯浠舵樉绀猴級
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
 * 鏇存柊绌烘皵璐ㄩ噺琛屽拰棰勮淇℃伅
 */
export function updateAirQualityAndAlerts(): void {
    const e = elements.weather;

    if ([1].includes(config.weather_api_choose ?? 0)) {
        e.airRow.style.display = '';
        e.airQuality.textContent = globalT('weather_air_quality_label');
        e.airValue.textContent = getAirQualityText(weather_data.air);

        const alertsHTML = generateAlertHTML();
        if (alertsHTML) {
            e.alertContainer.style.display = '';
            e.alertContainer.innerHTML = `${globalT('weather_alert_label')}<div class="weather-alert-items-warp"><div class="weather-alert-items">${alertsHTML}</div></div>`;
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
            e.alertContainer.innerHTML = `${globalT('weather_alert_label')}<div class="weather-alert-items-warp"><div class="weather-alert-items">${alertsHTML}</div></div>`;
        } else {
            e.alertContainer.style.display = 'none';
        }
    } else {
        e.airRow.style.display = 'none';
    }
}

/**
 * 鏇存柊闄嶆按姒傜巼琛?
 */
export function updatePrecipContainer(): void {
    const e = elements.weather;

    if ([1, 4, 5].includes(config.weather_api_choose ?? 0)) {
        e.precipContainer.style.display = '';
        const showTemp = showTemperatureInsteadOfPrecip;
        const label = showTemp ? globalT('weather_show_temperature') : globalT('weather_show_precipprob');
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

        // 纭繚鏃堕棿鏍煎拰鏁板€兼牸瀛愬厓绱犲瓨鍦?
        for (let i = 0; i < 7; i++) {
            let timeEl = document.getElementById(`weatherPrecipTime${i}`);
            if (!timeEl) {
                timeEl = document.createElement('span');
                timeEl.id = `weatherPrecipTime${i}`;
                timeEl.className = 'precip-time-cell';
                (e.precipTimes as HTMLElement).appendChild(timeEl);
            }
            timeEl.textContent = weather_data.sevenHourlyData.Times[i] || '--:--';
        }

        for (let i = 0; i < 7; i++) {
            let valueEl = document.getElementById(`weatherPrecipValue${i}`);
            if (!valueEl) {
                valueEl = document.createElement('span');
                valueEl.id = `weatherPrecipValue${i}`;
                valueEl.className = 'precip-prob-cell';
                (e.precipValues as HTMLElement).appendChild(valueEl);
            }
            valueEl.textContent = `${dataValues[i] || '--'}${unit}`;
        }
    } else {
        e.precipContainer.style.display = 'none';
    }
}

/**
 * 鏇存柊鎻愮ず淇℃伅琛?
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
