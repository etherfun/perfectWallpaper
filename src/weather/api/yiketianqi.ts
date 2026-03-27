import type { WeatherAddress, WeatherData } from '../../types/weather';
import { fetch_with_retry } from '../../utils/tool';
import { config } from '../../utils/config';

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
 */
export async function yiketianqi(
  weather_address: WeatherAddress,
  weather_data: WeatherData
): Promise<void> {
  const response = await fetch_with_retry(
    `https://v1.yiketianqi.com/free/day?appid=${config.weatherAppId}&appsecret=${config.weatherAppSecret}&unescape=1&city=${weather_address.cityname}`,
    {},
    3
  );
  const res: YiKeTianQiResponse = await response.json();
  
  weather_data.cityname = res.city;
  weather_data.temperature = res.tem;
  weather_data.weathernow = res.wea;
  weather_data.wind = res.win;
  weather_data.windLv = res.win_speed;
  weather_data.windSpeed = res.win_meter;
  weather_data.temperature_max = res.tem_day;
  weather_data.temperature_min = res.tem_night;
  weather_data.air = res.air;
  weather_data.pressure = res.pressure;
  weather_data.humidity = res.humidity;
}

export default yiketianqi;
