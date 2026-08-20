import { fetch_with_retry } from '../../../utils/tool';
import type { WeatherAddress, WeatherData, WeatherUnit } from '../types';

interface IcuFreeResponse {
    cityname: string;
    feels: string;
    weathernow: string;
    wind: string;
    windLv: string;
    high: string;
    low: string;
}

/**
 * 免费天气API (icufree) 实现
 * Case 2: icufree
 *
 * 拉取数据后返回归一化片段，由调用方统一写入响应式状态。
 */
export async function icufree(
    address: WeatherAddress,
    _unit: WeatherUnit
): Promise<Partial<WeatherData>> {
    const response = await fetch_with_retry(
        `https://api.icufree.com/weather.php?cityname=${address.cityname}`,
        {},
        3
    );
    const res: IcuFreeResponse = await response.json();

    if (!res.cityname || !res.feels) {
        throw new Error('Invalid ICUFree API response: missing required fields');
    }

    address.cityname = res.cityname;
    return {
        temperature: res.feels,
        weathernow: res.weathernow ?? '',
        wind: (res.wind ?? '').slice(0, -1),
        windLv: (res.windLv ?? '').slice(0, -1),
        temperature_max: res.high ?? '',
        temperature_min: res.low ?? '',
    };
}
