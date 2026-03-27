/**
 * 天气 API 统一导出
 * 支持的 API:
 * - qweather: 和风天气API
 * - icufree: 免费天气API
 * - yiketianqi: 一刻天气API
 * - visualcrossing: Visual Crossing API
 * - openmeteo: Open-Meteo API
 *
 * All API handler signatures are validated via WeatherAPIHandler in weather/index.ts
 * where the apiHandlers map is typed as { [key: number]: () => Promise<WeatherAPIHandler> }.
 */

export { qweather, default as qweatherApi } from './qweather';
export { icufree, default as icufreeApi } from './icufree';
export { yiketianqi, default as yiketianqiApi } from './yiketianqi';
export { visualcrossing, default as visualcrossingApi } from './visualcrossing';
export { openmeteo, default as openmeteoApi } from './openmeteo';

export type {
  QWeatherCityResponse,
  QWeatherNowResponse,
  QWeather24hResponse,
  QWeather3dResponse,
  QWeatherAirResponse,
  QWeatherAlertResponse,
  OPEN_METEO_TO_QWEATHER,
  initSevenHourlyData
} from './types';
