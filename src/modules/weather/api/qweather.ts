import { useConfigStore } from '@/stores/config';
import { globalT } from '@/utils/i18n';

const config = useConfigStore();

import { fetch_with_retry, weather_paymode } from '../../../utils/tool';
import type { WeatherAddress, WeatherData, WeatherUnit } from '../types';
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

// 风向映射：API 返回值 -> i18n key
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
 * 获取城市编号（写入传入的 address）
 */
export async function qweatherLookupCity(address: WeatherAddress): Promise<void> {
    const response = await fetch_with_retry(
        `https://${config.api_host}/geo//v2/city/lookup?location=${address.cityname}`,
        {
            method: 'GET',
            headers: {
                'X-QW-Api-Key': config.city_key!,
            },
        }
    );
    const data: QWeatherCityResponse = await response.json();

    if (!data.location || data.location.length === 0) {
        throw new Error(`City lookup returned no results for: ${address.cityname}`);
    }

    address.citynumber = data.location[0]?.id ?? '';
    address.cityname = data.location[0]?.name ?? '';
    address.latitude = data.location[0]?.lat ?? '';
    address.longitude = data.location[0]?.lon ?? '';
    address.checkcity = address.cityname;
}

/**
 * 获取实时天气
 */
async function fetchNowWeather(out: Partial<WeatherData>, address: WeatherAddress): Promise<void> {
    const response = await fetch_with_retry(
        `https://${config.api_host}/v7/weather/now?location=${address.citynumber}&lang=${config.language_code}`,
        {
            method: 'GET',
            headers: {
                'X-QW-Api-Key': config.city_key!,
            },
        }
    );
    const res: QWeatherNowResponse = await response.json();

    out.updateTime = res.updateTime;
    out.windSpeed = res.now.windSpeed;
    out.humidity = res.now.humidity;
    out.temperature = res.now.temp;
    out.feels = res.now.feelsLike;
    out.weathernow = res.now.text;
    out.wind = globalT(WIND_DIR_MAP[res.now.windDir] ?? 'weather_wind_north');
    out.windLv = res.now.windScale;
    out.precip = res.now.precip;
    out.cloud = res.now.cloud;
    out.vis = res.now.vis;
    out.dew = res.now.dew;
    out.pressure = res.now.pressure;
    out.icon = res.now.icon;
}

/**
 * 从和风空气质量响应中提取 AQI 文本
 * 优先匹配 CN-MEE / AQI 索引，否则回退到首个索引，最后兜底为无数据
 */
function extractAqi(airData: QWeatherAirResponse): string {
    const indexes = airData.days?.[0]?.indexes;
    if (!indexes || indexes.length === 0) return globalT('weather_no_data');

    const aqiIndex =
        indexes.find(
            index =>
                index.name === 'AQI (CN)' ||
                index.name === 'cn-mee' ||
                index.name === 'QAQI' ||
                index.name === '绌烘皵璐ㄩ噺鎸囨暟' ||
                index.code === 'aqi' ||
                index.code === 'cn_mee'
        ) ?? indexes[0];

    if (!aqiIndex) return globalT('weather_no_data');
    return aqiIndex.aqi?.toString() || aqiIndex.aqiDisplay || globalT('weather_no_data');
}

/**
 * 获取空气质量
 */
async function fetchAirQuality(out: Partial<WeatherData>, address: WeatherAddress): Promise<void> {
    const response = await fetch_with_retry(
        `https://${config.api_host}/airquality/v1/daily/${address.latitude}/${address.longitude}?lang=${config.language_code}`,
        {
            method: 'GET',
            headers: {
                'X-QW-Api-Key': config.city_key!,
            },
        }
    );
    const airData: QWeatherAirResponse = await response.json();
    out.air = extractAqi(airData);
}

/**
 * 获取天气预警
 */
async function fetchWeatherAlert(out: Partial<WeatherData>, address: WeatherAddress): Promise<void> {
    const response = await fetch_with_retry(
        `https://${config.api_host}/weatheralert/v1/current/${address.latitude}/${address.longitude}?lang=${config.language_code}`,
        {
            method: 'GET',
            headers: {
                'X-QW-Api-Key': config.city_key!,
            },
        }
    );
    const alertData: QWeatherAlertResponse = await response.json();

    if (alertData && alertData.alerts && alertData.alerts.length > 0) {
        out.weatherAlert = alertData.alerts.map(alertList => ({
            alert: alertList.eventType?.name ?? alertList.typeName ?? '',
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
            // 预警码：新版 eventType.code / 顶层 icon / 旧版 type 三者兼容
            code: alertList.eventType?.code ?? alertList.icon ?? alertList.type ?? '',
            icon: alertList.icon ?? alertList.eventType?.code ?? alertList.type ?? '',
            status: alertList.messageType?.code ?? '',
        }));
    }
}

/**
 * 获取24小时预报
 */
async function fetch24hForecast(out: Partial<WeatherData>, address: WeatherAddress): Promise<void> {
    const response = await fetch_with_retry(
        `https://${config.api_host}/v7/weather/24h?location=${address.citynumber}&lang=${config.language_code}`,
        {
            method: 'GET',
            headers: {
                'X-QW-Api-Key': config.city_key!,
            },
        }
    );
    const hourlyData: QWeather24hResponse = await response.json();

    if (hourlyData?.hourly?.length) {
        const seven = hourlyData.hourly.slice(0, 7);
        out.sevenHourlyData = {
            updateTime: hourlyData.updateTime,
            Times: seven.map(hour => {
                const afterT = hour.fxTime?.split('T')[1];
                return afterT?.split('+')[0]?.substring(0, 5) ?? '--:--';
            }),
            Pops: seven.map(hour =>
                hour.pop !== undefined && hour.pop !== '' ? `${hour.pop}%` : '--'
            ),
            Temps: seven.map(hour => hour.temp),
            Icons: seven.map(hour => hour.icon),
            Texts: seven.map(hour => hour.text),
            Wind360s: seven.map(hour => hour.wind360),
            Winds: seven.map(hour => hour.windDir),
            WindLvs: seven.map(hour => hour.windScale),
            WindSpeeds: seven.map(hour => hour.windSpeed),
            Humidities: seven.map(hour => hour.humidity),
            Precips: seven.map(hour => hour.precip),
            Pressures: seven.map(hour => hour.pressure),
            Clouds: seven.map(hour => (hour.cloud !== '' ? hour.cloud : '--')),
            Dews: seven.map(hour => hour.dew),
            preciptype: [],
        };
    }
}

/**
 * 获取 3 天预报
 */
async function fetch3dForecast(out: Partial<WeatherData>, address: WeatherAddress): Promise<void> {
    const response = await fetch_with_retry(
        `https://${config.api_host}/v7/weather/3d?location=${address.citynumber}&lang=${config.language_code}`,
        {
            method: 'GET',
            headers: {
                'X-QW-Api-Key': config.city_key!,
            },
        }
    );
    const dailyData: QWeather3dResponse = await response.json();
    const today = dailyData?.daily?.[0];
    if (!today) return;

    out.temperature_max = today.tempMax;
    out.temperature_min = today.tempMin;
    out.feels_max = today.feelsLikeMax || today.tempMax;
    out.feels_min = today.feelsLikeMin || today.tempMin;
    out.sunrise = today.sunrise;
    out.sunset = today.sunset;
    out.moonphase = today.moonPhase;
    out.uvindex = today.uvIndex;
    out.rangetemperature = `${today.tempMin}~${today.tempMax}`;
    out.rangefeelstemperature = `${today.feelsLikeMin || today.tempMin}~${today.feelsLikeMax || today.tempMax}`;
}

/**
 * 妫€鏌ユ槸鍚﹁秴鍑哄厤璐归搴?
 */
function checkQuota(): boolean {
    return !config.qweather_api_paymode && weather_paymode();
}

/**
 * 和风天气 API 主函数
 *
 * 拉取数据后返回归一化片段，由调用方统一写入响应式状态。
 */
export async function qweather(
    address: WeatherAddress,
    _unit: WeatherUnit
): Promise<Partial<WeatherData>> {
    if (checkQuota()) {
        throw new Error(globalT('error_get_weather_data_over_usage'));
    }

    // 如果没有城市编号，先查询
    if (address.citynumber === '' || address.cityname !== address.checkcity) {
        await qweatherLookupCity(address);
    }

    // 首先获取必要的数据（nowWeather 是必需的，其他可以并行）
    const result: Partial<WeatherData> = {};
    await fetchNowWeather(result, address);

    // 并行获取可选数据
    if (!checkQuota()) {
        await Promise.all([
            fetchAirQuality(result, address).catch(() => {
                /* ignore errors */
            }),
            fetchWeatherAlert(result, address).catch(() => {
                /* ignore errors */
            }),
            fetch24hForecast(result, address).catch(() => {
                /* ignore errors */
            }),
            fetch3dForecast(result, address).catch(() => {
                /* ignore errors */
            }),
        ]);
    }

    return result;
}
