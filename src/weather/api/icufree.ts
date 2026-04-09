import { fetch_with_retry } from '../../utils/tool';
import type { WeatherAddress, WeatherData } from '../types';

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
 */
export async function icufree(
  weather_address: WeatherAddress,
  weather_data: WeatherData
): Promise<void> {
  const response = await fetch_with_retry(
    `https://api.icufree.com/weather.php?cityname=${weather_address.cityname}`,
    {},
    3
  );
  const res: IcuFreeResponse = await response.json();
  
  weather_address.cityname = res.cityname;
  weather_data.temperature = res.feels;
  weather_data.weathernow = res.weathernow;
  weather_data.wind = res.wind.slice(0, -1);
  weather_data.windLv = res.windLv.slice(0, -1);
  weather_data.temperature_max = res.high;
  weather_data.temperature_min = res.low;
}

