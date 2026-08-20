import { useConfigStore } from "@/stores/config";

import { fetch_with_retry } from '../../../utils/tool';
import type { WeatherAddress, WeatherData, WeatherUnit } from '../types';

const config = useConfigStore();

interface YiKeTianQiResponse {
    city: string;
    tem: string;
    wea: string;
    win: string;
    win_speed: string;
    win_meter: string;
    tem_day: string;
    tem_night: string;
    air: string;
    pressure: string;
    humidity: string;
}

/**
 * 一刻天气API (yiketianqi) 实现
 * Case 3: yiketianqi
 *
 * 拉取数据后返回归一化片段，由调用方统一写入响应式状态。
 */
export async function yiketianqi(
    address: WeatherAddress,
    _unit: WeatherUnit
): Promise<Partial<WeatherData>> {
    const response = await fetch_with_retry(
        `https://v1.yiketianqi.com/free/day?appid=${config.weather_app_id}&appsecret=${config.weather_app_secret}&unescape=1&city=${address.cityname}`,
        {},
        3
    );
    const res: YiKeTianQiResponse = await response.json();

    address.cityname = res.city;
    return {
        temperature: res.tem,
        weathernow: res.wea,
        wind: res.win,
        windLv: res.win_speed,
        windSpeed: res.win_meter,
        temperature_max: res.tem_day,
        temperature_min: res.tem_night,
        air: res.air,
        pressure: res.pressure,
        humidity: res.humidity,
    };
}
