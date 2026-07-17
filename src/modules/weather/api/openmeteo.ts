import { globalT } from '@/i18n';

import { fetch_with_retry } from '../../../utils/tool';
import type { SevenHourlyData, WeatherAddress, WeatherData } from '../types';
import { OPEN_METEO_TO_QWEATHER } from '../types';
import { getWeatherUnit } from '../weatherState';

interface OpenMeteoCurrent {
    time: string;
    temperature_2m: string;
    apparent_temperature: string;
    relative_humidity_2m: string;
    precipitation: string;
    rain?: string;
    weather_code: number;
    cloud_cover: string;
    pressure_msl: string;
    wind_speed_10m: string;
    wind_direction_10m: number;
}

interface OpenMeteoDaily {
    temperature_2m_max: string[];
    temperature_2m_min: string[];
    apparent_temperature_max: string[];
    apparent_temperature_min: string[];
    sunrise: string[];
    sunset: string[];
    uv_index_max: string[];
}

interface OpenMeteoHourly {
    time: string[];
    temperature_2m: string[];
    relative_humidity_2m: string[];
    dew_point_2m: string[];
    precipitation_probability: number[];
    precipitation: string[];
    weather_code: number[];
    surface_pressure: string[];
    wind_speed_10m: string[];
    wind_direction_10m: number[];
    cloud_cover: string[];
}

interface OpenMeteoResponse {
    current: OpenMeteoCurrent;
    daily: OpenMeteoDaily;
    hourly: OpenMeteoHourly;
}

/**
 * 获取 Open-Meteo 天气代码对应的和风天气图标
 */
function getOpenMeteoIcon(weatherCode: number, timeString: string): number {
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
 * 根据Open-Meteo天气代码推断降水类型
 */
function getPrecipTypeFromCode(weatherCode: number): string {
    const rainCodes = [51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82, 95, 96, 99];
    const snowCodes = [71, 73, 75, 77, 85, 86];
    const freezingRainCodes = [56, 57, 66, 67];
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

const DIRECTIONS = [
    'weather_wind_north',
    'weather_wind_northeast',
    'weather_wind_east',
    'weather_wind_southeast',
    'weather_wind_south',
    'weather_wind_southwest',
    'weather_wind_west',
    'weather_wind_northwest',
];

/**
 * Open-Meteo API 实现
 * Case 5: Open-Meteo
 */
export async function openmeteo(
    weather_address: WeatherAddress,
    weather_data: WeatherData
): Promise<void> {
    const unit = getWeatherUnit();
    const response = await fetch_with_retry(
        `https://api.open-meteo.com/v1/forecast?latitude=${weather_address.latitude}&longitude=${weather_address.longitude}&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,rain,weather_code,cloud_cover,surface_pressure,wind_speed_10m,wind_direction_10m&daily=apparent_temperature_max,apparent_temperature_min,temperature_2m_min,sunrise,sunset,uv_index_max,temperature_2m_max&hourly=temperature_2m,relative_humidity_2m,dew_point_2m,precipitation_probability,precipitation,weather_code,surface_pressure,wind_speed_10m,wind_direction_10m,cloud_cover&timezone=auto&forecast_days=1&forecast_hours=12&temperature_unit=${unit.temperature_code}&wind_speed_unit=${unit.wind_speed_code}&precipitation_unit=${unit.precipitation_code}`,
        {},
        3
    );
    const res: OpenMeteoResponse = await response.json();

    weather_data.updateTime = res.current.time;
    weather_data.temperature = res.current.temperature_2m;
    weather_data.temperature_max = res.daily.temperature_2m_max[0] ?? '0';
    weather_data.temperature_min =
        res.daily.temperature_2m_min?.[0] || res.daily.temperature_2m_max[0] || '0';
    weather_data.feels = res.current.apparent_temperature;
    weather_data.humidity = res.current.relative_humidity_2m;
    weather_data.windSpeed = res.current.wind_speed_10m;

    // 天气状况
    weather_data.weathernow =
        globalT(`weather_openmeteo_${res.current.weather_code}`) || globalT('weather_no_data');

    // 风向
    const windDirIndex = Math.floor((res.current.wind_direction_10m + 22.5) / 45) % 8;
    weather_data.wind = globalT(DIRECTIONS[windDirIndex] ?? 'weather_no_data');

    weather_data.precip = res.current.precipitation;
    weather_data.sunrise = res.daily.sunrise[0] ?? '';
    weather_data.sunset = res.daily.sunset[0] ?? '';
    weather_data.cloud = res.current.cloud_cover;
    weather_data.pressure = res.current.pressure_msl;
    weather_data.obstime = res.current.time.replace('T', ' ');
    weather_data.rangetemperature = `${res.daily.temperature_2m_min?.[0] || res.daily.temperature_2m_max[0] || '0'}~${res.daily.temperature_2m_max[0] ?? '0'}`;
    weather_data.uvindex = res.daily.uv_index_max?.[0] || globalT('weather_no_data');
    weather_data.rangefeelstemperature = `${res.daily.apparent_temperature_min?.[0] || res.daily.temperature_2m_min?.[0] || res.daily.temperature_2m_max[0] || '0'}~${res.daily.apparent_temperature_max?.[0] || res.daily.temperature_2m_max[0] || '0'}`;
    weather_data.rain = (res.current as { rain?: string }).rain || '0';
    weather_data.icon = getOpenMeteoIcon(res.current.weather_code, res.current.time).toString();

    // 处理七小时预报数据
    if (res.hourly && res.hourly.time && res.hourly.time.length > 0) {
        const now = new Date();
        const currentTime =
            now.toISOString().split('T')[0] +
            'T' +
            now.getHours().toString().padStart(2, '0') +
            ':00';

        let currentIndex = res.hourly.time.findIndex(time => time >= currentTime);
        if (currentIndex === -1) currentIndex = 0;

        const next7Hours = Math.min(7, res.hourly.time.length - currentIndex);

        const sevenHourlyData: SevenHourlyData = {
            updateTime: res.current.time,
            Times: [],
            Pops: [],
            Temps: [],
            Icons: [],
            Texts: [],
            Wind360s: [],
            Winds: [],
            WindLvs: [],
            WindSpeeds: [],
            Humidities: [],
            Precips: [],
            Pressures: [],
            Clouds: [],
            Dews: [],
            preciptype: [],
        };

        for (let i = 0; i < next7Hours; i++) {
            const idx = currentIndex + i;
            const timeStr = res.hourly.time[idx];
            if (!timeStr) continue;

            sevenHourlyData.Times.push(timeStr.split('T')[1]?.substring(0, 5) ?? '--:--');

            const pop = res.hourly.precipitation_probability?.[idx] ?? 0;
            sevenHourlyData.Pops.push(pop !== null ? `${pop}%` : '——');

            sevenHourlyData.Temps.push(res.hourly.temperature_2m?.[idx] ?? '--');

            const weatherCode = res.hourly.weather_code?.[idx] ?? res.current.weather_code;
            sevenHourlyData.Icons.push(getOpenMeteoIcon(weatherCode, timeStr).toString());
            sevenHourlyData.Texts.push(
                globalT(`weather_openmeteo_${weatherCode}`) || globalT('weather_no_data')
            );

            const windDir = res.hourly.wind_direction_10m?.[idx] ?? res.current.wind_direction_10m;
            const dirIndex = Math.floor((windDir + 22.5) / 45) % 8;
            sevenHourlyData.Winds.push(globalT(DIRECTIONS[dirIndex] ?? 'weather_no_data'));
            sevenHourlyData.Wind360s.push(windDir.toString());

            sevenHourlyData.WindSpeeds.push(
                res.hourly.wind_speed_10m?.[idx] ?? res.current.wind_speed_10m
            );
            sevenHourlyData.Humidities.push(
                res.hourly.relative_humidity_2m?.[idx] ?? res.current.relative_humidity_2m
            );
            sevenHourlyData.Precips.push(
                res.hourly.precipitation?.[idx] ?? res.current.precipitation
            );
            sevenHourlyData.Pressures.push(
                res.hourly.surface_pressure?.[idx] ?? res.current.pressure_msl
            );
            sevenHourlyData.Clouds.push(res.hourly.cloud_cover?.[idx] ?? res.current.cloud_cover);
            sevenHourlyData.Dews.push(res.hourly.dew_point_2m?.[idx] ?? '--');
            sevenHourlyData.preciptype.push(getPrecipTypeFromCode(weatherCode));
        }

        // 不足7小时用空值填充
        while (sevenHourlyData.Times.length < 7) {
            sevenHourlyData.Times.push('--:--');
            sevenHourlyData.Pops.push('——');
            sevenHourlyData.Temps.push('--');
            sevenHourlyData.Icons.push('999');
            sevenHourlyData.Texts.push(globalT('weather_no_data'));
            sevenHourlyData.Winds.push('--');
            sevenHourlyData.Wind360s.push('--');
            sevenHourlyData.WindSpeeds.push('--');
            sevenHourlyData.Humidities.push('--');
            sevenHourlyData.Precips.push('--');
            sevenHourlyData.Pressures.push('--');
            sevenHourlyData.Clouds.push('--');
            sevenHourlyData.Dews.push('--');
            sevenHourlyData.preciptype.push('--');
        }

        weather_data.sevenHourlyData = sevenHourlyData;
    }
}
