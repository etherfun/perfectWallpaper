import { config } from '../../utils/config';
import { i18n } from '../../utils/i18n';
import { fetch_with_retry, weather_paymode } from '../../utils/tool';
import type { WeatherAddress, WeatherData } from '../types';
import type {
    QWeather3dResponse,
    QWeather24hResponse,
    QWeatherAirResponse,
    QWeatherAlertResponse,
    QWeatherCityResponse,
    QWeatherNowResponse,
} from './types';

// 和风天气 API 实现
// Case 1: qweatherapi

// 风向映射：API返回值 -> i18n key
const WIND_DIR_MAP: Record<string, string> = {
    N: 'weather_wind_north',
    NNE: 'weather_wind_north',
    NE: 'weather_wind_northeast',
    ENE: 'weather_wind_east',
    E: 'weather_wind_east',
    ESE: 'weather_wind_east',
    SE: 'weather_wind_southeast',
    SSE: 'weather_wind_south',
    S: 'weather_wind_south',
    SSW: 'weather_wind_south',
    SW: 'weather_wind_southwest',
    WSW: 'weather_wind_west',
    W: 'weather_wind_west',
    WNW: 'weather_wind_west',
    NW: 'weather_wind_northwest',
    NNW: 'weather_wind_northwest',
};

/**
 * 获取城市编号
 */
export async function qweatherLookupCity(weather_address: WeatherAddress): Promise<WeatherAddress> {
    const response = await fetch_with_retry(
        `https://${config.api_host}/geo//v2/city/lookup?location=${weather_address.cityname}`,
        {
            method: 'GET',
            headers: {
                'X-QW-Api-Key': config.city_key,
            },
        }
    );
    const data: QWeatherCityResponse = await response.json();

    weather_address.citynumber = data.location[0].id;
    weather_address.cityname = data.location[0].name;
    weather_address.latitude = data.location[0].lat;
    weather_address.longitude = data.location[0].lon;
    weather_address.checkcity = weather_address.cityname;

    return weather_address;
}

/**
 * 获取实时天气
 */
async function fetchNowWeather(
    weather_address: WeatherAddress,
    weather_data: WeatherData
): Promise<void> {
    const response = await fetch_with_retry(
        `https://${config.api_host}/v7/weather/now?location=${weather_address.citynumber}&lang=${config.language_code}`,
        {
            method: 'GET',
            headers: {
                'X-QW-Api-Key': config.city_key,
            },
        }
    );
    const res: QWeatherNowResponse = await response.json();

    weather_data.updateTime = res.updateTime;
    weather_data.windSpeed = res.now.windSpeed;
    weather_data.humidity = res.now.humidity;
    weather_data.temperature = res.now.temp;
    weather_data.feels = res.now.feelsLike;
    weather_data.weathernow = res.now.text;
    weather_data.wind = i18n(WIND_DIR_MAP[res.now.windDir] || 'weather_wind_north');
    weather_data.windLv = res.now.windScale;
    weather_data.precip = res.now.precip;
    weather_data.cloud = res.now.cloud;
    weather_data.vis = res.now.vis;
    weather_data.dew = res.now.dew;
    weather_data.pressure = res.now.pressure;
    weather_data.icon = res.now.icon;
}

/**
 * 获取空气质量
 */
async function fetchAirQuality(
    weather_address: WeatherAddress,
    weather_data: WeatherData
): Promise<void> {
    const response = await fetch_with_retry(
        `https://${config.api_host}/airquality/v1/daily/${weather_address.latitude}/${weather_address.longitude}?lang=${config.language_code}`,
        {
            method: 'GET',
            headers: {
                'X-QW-Api-Key': config.city_key,
            },
        }
    );
    const airData: QWeatherAirResponse = await response.json();

    if (airData && airData.days && airData.days.length > 0) {
        const day = airData.days[0];
        if (day.indexes && day.indexes.length > 0) {
            const aqiIndex = day.indexes.find(
                index =>
                    index.name === 'AQI (CN)' ||
                    index.name === 'cn-mee' ||
                    index.name === 'QAQI' ||
                    index.name === '空气质量指数' ||
                    index.code === 'aqi' ||
                    index.code === 'cn_mee'
            );

            if (aqiIndex) {
                weather_data.air =
                    aqiIndex.aqi?.toString() || aqiIndex.aqiDisplay || i18n('weather_no_data');
            } else {
                const firstIndex = day.indexes[0];
                weather_data.air =
                    firstIndex.aqi?.toString() || firstIndex.aqiDisplay || i18n('weather_no_data');
            }
        } else {
            weather_data.air = i18n('weather_no_data');
        }
    } else {
        weather_data.air = i18n('weather_no_data');
    }
}

/**
 * 获取天气预警
 */
async function fetchWeatherAlert(
    weather_address: WeatherAddress,
    weather_data: WeatherData
): Promise<void> {
    const response = await fetch_with_retry(
        `https://${config.api_host}/weatheralert/v1/current/${weather_address.latitude}/${weather_address.longitude}?lang=${config.language_code}`,
        {
            method: 'GET',
            headers: {
                'X-QW-Api-Key': config.city_key,
            },
        }
    );
    const alertData: QWeatherAlertResponse = await response.json();

    if (alertData && alertData.alerts && alertData.alerts.length > 0) {
        weather_data.weatherAlert = alertData.alerts.map(alertList => ({
            alert: alertList.eventType?.name ?? '',
            title: alertList.headline ?? '',
            id: alertList.id ?? '',
            releaseTime: new Date(
                parseInt(alertList.id?.substring(0, 4) ?? '0'),
                parseInt(alertList.id?.substring(4, 6) ?? '1') - 1,
                parseInt(alertList.id?.substring(6, 8) ?? '1'),
                parseInt(alertList.id?.substring(8, 10) ?? '0'),
                parseInt(alertList.id?.substring(10, 12) ?? '0'),
                parseInt(alertList.id?.substring(12, 14) ?? '0')
            ),
            startTime: new Date(alertList.onsetTime || Date.now()),
            endTime: new Date(alertList.expireTime || Date.now()),
            level: alertList.severity ?? '',
            urgency: alertList.urgency ?? '',
            color: `${alertList.color?.red ?? 0}, ${alertList.color?.green ?? 0}, ${alertList.color?.blue ?? 0}`,
            sender: alertList.senderName ?? '',
            description: alertList.description ?? '',
            instruction: alertList.instruction ?? '',
            criteria: alertList.criteria ?? '',
            source:
                typeof alertData.metadata?.attributions?.[0] === 'string'
                    ? alertData.metadata.attributions[0]
                    : (
                          alertData.metadata?.attributions?.[0] as
                              | { name?: string; source?: string }
                              | undefined
                      )?.name ||
                      (
                          alertData.metadata?.attributions?.[0] as
                              | { name?: string; source?: string }
                              | undefined
                      )?.source ||
                      '',
            icon: alertList.icon ?? '',
            status: alertList.messageType?.code ?? '',
        }));
    }
}

/**
 * 获取24小时预报
 */
async function fetch24hForecast(
    weather_address: WeatherAddress,
    weather_data: WeatherData
): Promise<void> {
    const response = await fetch_with_retry(
        `https://${config.api_host}/v7/weather/24h?location=${weather_address.citynumber}&lang=${config.language_code}`,
        {
            method: 'GET',
            headers: {
                'X-QW-Api-Key': config.city_key,
            },
        }
    );
    const hourlyData: QWeather24hResponse = await response.json();

    weather_data.hourlyData = hourlyData;

    if (hourlyData && hourlyData.hourly && hourlyData.hourly.length > 0) {
        const sevenHourlyData = hourlyData.hourly.slice(0, 7);

        weather_data.sevenHourlyData.updateTime = hourlyData.updateTime;
        weather_data.sevenHourlyData.Times = sevenHourlyData.map(hour => {
            const timeStr = hour.fxTime;
            return timeStr.split('T')[1].split('+')[0].substring(0, 5);
        });
        weather_data.sevenHourlyData.Pops = sevenHourlyData.map(hour => {
            return hour.pop !== undefined && hour.pop !== '' ? `${hour.pop}%` : '——';
        });
        weather_data.sevenHourlyData.Temps = sevenHourlyData.map(hour => hour.temp);
        weather_data.sevenHourlyData.Icons = sevenHourlyData.map(hour => hour.icon);
        weather_data.sevenHourlyData.Texts = sevenHourlyData.map(hour => hour.text);
        weather_data.sevenHourlyData.Wind360s = sevenHourlyData.map(hour => hour.wind360);
        weather_data.sevenHourlyData.Winds = sevenHourlyData.map(hour => hour.windDir);
        weather_data.sevenHourlyData.WindLvs = sevenHourlyData.map(hour => hour.windScale);
        weather_data.sevenHourlyData.WindSpeeds = sevenHourlyData.map(hour => hour.windSpeed);
        weather_data.sevenHourlyData.Humidities = sevenHourlyData.map(hour => hour.humidity);
        weather_data.sevenHourlyData.Precips = sevenHourlyData.map(hour => hour.precip);
        weather_data.sevenHourlyData.Pressures = sevenHourlyData.map(hour => hour.pressure);
        weather_data.sevenHourlyData.Clouds = sevenHourlyData.map(hour =>
            hour.cloud !== '' ? hour.cloud : '——'
        );
        weather_data.sevenHourlyData.Dews = sevenHourlyData.map(hour => hour.dew);
    }
}

/**
 * 获取3天预报
 */
async function fetch3dForecast(
    weather_address: WeatherAddress,
    weather_data: WeatherData
): Promise<void> {
    const response = await fetch_with_retry(
        `https://${config.api_host}/v7/weather/3d?location=${weather_address.citynumber}&lang=${config.language_code}`,
        {
            method: 'GET',
            headers: {
                'X-QW-Api-Key': config.city_key,
            },
        }
    );
    const dailyData: QWeather3dResponse = await response.json();

    if (dailyData && dailyData.daily && dailyData.daily.length > 0) {
        const today = dailyData.daily[0];

        weather_data.temperature_max = today.tempMax;
        weather_data.temperature_min = today.tempMin;
        weather_data.feels_max = today.feelsLikeMax || today.tempMax;
        weather_data.feels_min = today.feelsLikeMin || today.tempMin;
        weather_data.sunrise = today.sunrise;
        weather_data.sunset = today.sunset;
        weather_data.moonphase = today.moonPhase;
        weather_data.uvindex = today.uvIndex;
        weather_data.rangetemperature = `${today.tempMin}~${today.tempMax}`;
        weather_data.rangefeelstemperature = `${today.feelsLikeMin || today.tempMin}~${today.feelsLikeMax || today.tempMax}`;

        weather_data.dailyData = dailyData;
    }
}

/**
 * 检查是否超出免费额度
 */
function checkQuota(): boolean {
    return !config.qweather_api_paymode && weather_paymode();
}

/**
 * 和风天气API主函数
 */
export async function qweather(
    weather_address: WeatherAddress,
    weather_data: WeatherData
): Promise<void> {
    if (checkQuota()) {
        throw new Error(i18n('error_get_weather_data_over_usage'));
    }

    // 如果没有城市编号，先查询
    if (
        weather_address.citynumber === '' ||
        weather_address.cityname !== weather_address.checkcity
    ) {
        await qweatherLookupCity(weather_address);
    }

    // 首先获取必要的数据（nowWeather 是必需的，其他可以并行）
    await fetchNowWeather(weather_address, weather_data);

    // 并行获取可选数据
    if (!checkQuota()) {
        await Promise.all([
            fetchAirQuality(weather_address, weather_data).catch(() => {
                /* ignore errors */
            }),
            fetchWeatherAlert(weather_address, weather_data).catch(() => {
                /* ignore errors */
            }),
            fetch24hForecast(weather_address, weather_data).catch(() => {
                /* ignore errors */
            }),
            fetch3dForecast(weather_address, weather_data).catch(() => {
                /* ignore errors */
            }),
        ]);
    }
}
