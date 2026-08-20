import { useConfigStore } from "@/stores/config";
import { globalT } from '@/utils/i18n';

import { fetch_with_retry, getQWeatherIcon, isNightTime } from '../../../utils/tool';
import type { WeatherAddress, WeatherData, WeatherUnit } from '../types';
import { windDirectionToText } from '../utils';

const config = useConfigStore();

interface VisualCrossingHour {
    datetime: string;
    temp: string;
    feelslike: string;
    humidity: string;
    dew: string;
    precip: string;
    precipprob: string;
    preciptype: string | string[];
    pressure: string;
    winddir: number;
    windspeed: string;
    windgust: string;
    cloudcover: string;
    conditions: string;
    icon: string;
}

interface VisualCrossingDay {
    tempmax: string;
    tempmin: string;
    feelslikemax: string;
    feelslikemin: string;
    sunrise: string;
    sunset: string;
    moonphase: number;
    cloudcover: number;
    hours: VisualCrossingHour[];
}

interface VisualCrossingCurrentConditions {
    datetime: string;
    temp: string;
    feelslike: string;
    humidity: string;
    dew: string;
    precip: string;
    precipcover: string;
    precipprob: string;
    preciptype: string | string[];
    pressure: string;
    winddir: number;
    windspeed: string;
    windgust: string;
    visibility: string;
    solarradiation: string;
    uvindex: string;
    conditions: string;
    icon: string;
    snow?: string;
    snowdepth?: string;
}

interface VisualCrossingResponse {
    resolvedAddress: string;
    currentConditions: VisualCrossingCurrentConditions;
    days: VisualCrossingDay[];
}

const MOON_PHASE_KEYS = [
    'weather_moonphase_new_moon',
    'weather_moonphase_waxing_crescent',
    'weather_moonphase_first_quarter',
    'weather_moonphase_waxing_gibbous',
    'weather_moonphase_full_moon',
    'weather_moonphase_waning_gibbous',
    'weather_moonphase_last_quarter',
    'weather_moonphase_waning_crescent',
];

/**
 * 获取接下来 7 小时的数据
 */
function getNext7Hours(res: VisualCrossingResponse): VisualCrossingHour[] {
    const now = new Date();
    const endTime = new Date(now.getTime() + 7 * 60 * 60 * 1000);

    const day0Hours = res.days[0]?.hours;
    const day1Hours = res.days[1]?.hours;
    const allHours: VisualCrossingHour[] = [...(day0Hours || []), ...(day1Hours || [])];

    return allHours.filter(h => {
        const [hh, mm, ss] = h.datetime.split(':').map(Number);

        const hourDate = new Date(now);
        hourDate.setHours(hh ?? 0, mm ?? 0, ss ?? 0, 0);

        if (hourDate < now) {
            hourDate.setDate(hourDate.getDate() + 1);
        }

        return hourDate > now && hourDate <= endTime;
    });
}

/**
 * Visual Crossing API 实现
 * Case 4: Visual Crossing
 *
 * 拉取数据后返回归一化片段，由 weather_init 统一写入响应式 weather_data。
 */
export async function visualcrossing(
    address: WeatherAddress,
    _unit: WeatherUnit
): Promise<Partial<WeatherData>> {
    const nowDate = Math.floor(Date.now() / 1000);
    const sevenDate = nowDate + 7 * 24 * 60 * 60;

    const response = await fetch_with_retry(
        `https://weather.visualcrossing.com/VisualCrossingWebServices/rest/services/timeline/${encodeURIComponent(address.cityname)}/${nowDate}/${sevenDate}?unitGroup=${config.weather_unit}&key=${config.visual_crossing_key}&contentType=json&lang=id`,
        {},
        3
    );
    const res: VisualCrossingResponse = await response.json();

    const resNow = res.currentConditions;
    const resHourly = getNext7Hours(res);
    const resDaily = res.days;
    const today = resDaily[0];
    if (!today) return {};

    address.cityname = res.resolvedAddress.split(',')[0] ?? '';

    const result: Partial<WeatherData> = {
        updateTime: resNow.datetime,
        windSpeed: resNow.windspeed,
        humidity: resNow.humidity,
        temperature: resNow.temp,
        temperature_max: today.tempmax,
        temperature_min: today.tempmin,
        feels: resNow.feelslike,
        feels_max: today.feelslikemax,
        feels_min: today.feelslikemin,
        weathernow: resNow.conditions
            .split(',')
            .map(c => c.trim())
            .map(c => globalT(`weather_visualcrossing_${c}`))
            .join(' <br/> '),
        preciptype: Array.isArray(resNow.preciptype)
            ? resNow.preciptype.join(',')
            : resNow.preciptype || '',
        precipcover: resNow.precipcover,
        precipprob: resNow.precipprob,
        precip: resNow.precip,
        snow: resNow.snow || '',
        snowdepth: resNow.snowdepth || '',
        windgust: resNow.windgust,
        visibility: resNow.visibility,
        solarradiation: resNow.solarradiation,
        uvindex: resNow.uvindex,
        sunrise: today.sunrise,
        sunset: today.sunset,
        cloud: today.cloudcover.toString(),
        dew: resNow.dew,
        pressure: resNow.pressure,
        icon: getQWeatherIcon(
            resNow.icon,
            isNightTime(new Date().toTimeString().split(' ')[0] ?? '', today.sunrise, today.sunset)
        ).toString(),
        wind: windDirectionToText(resNow.winddir),
        moonphase: globalT(MOON_PHASE_KEYS[Math.floor((today.moonphase + 0.0625) * 8) % 8] ?? 'weather_no_data'),
    };

    // 七小时预报
    result.sevenHourlyData = {
        updateTime: '',
        Times: resHourly.map(hour => hour.datetime.slice(0, 5)),
        Pops: resHourly.map(hour => `${hour.precipprob}%`),
        Temps: resHourly.map(hour => hour.temp),
        Icons: resHourly.map(hour => {
            const isNight = isNightTime(hour.datetime, today.sunrise, today.sunset);
            return getQWeatherIcon(hour.icon, isNight).toString();
        }),
        Texts: resHourly.map(hour => {
            if (!hour.conditions) return '';
            return hour.conditions
                .split(',')
                .map(c => c.trim())
                .map(c => globalT(`weather_visualcrossing_${c}`))
                .join(' <br/> ');
        }),
        Wind360s: resHourly.map(hour => hour.winddir.toString()),
        Winds: resHourly.map(hour => windDirectionToText(hour.winddir)),
        WindLvs: [],
        WindSpeeds: resHourly.map(hour => hour.windspeed),
        Humidities: resHourly.map(hour => hour.humidity),
        Precips: resHourly.map(hour => hour.precip),
        Pressures: resHourly.map(hour => hour.pressure),
        Clouds: resHourly.map(hour => hour.cloudcover),
        Dews: resHourly.map(hour => hour.dew),
        preciptype: resHourly.map(hour =>
            Array.isArray(hour.preciptype) ? hour.preciptype.join(',') : hour.preciptype || ''
        ),
    };

    return result;
}
