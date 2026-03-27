import { i18n } from '../utils/i18n';
import { WeatherUnit, WeatherLang } from './types';

// 全局单位配置
export let wunit: WeatherUnit = {
    temp: "℃",
    precip: "mm",
    precip_1: "mm/h",
    snow: "cm",
    snow_1: "cm/h",
    wind: "km/h",
    vis: "km",
    pressure: "hPa",
    solarradiation: "w/m²",
    temperature_code: "celsius",
    wind_speed_code: "kmh",
    precipitation_code: "mm"
};

/**
 * 根据单位设置选择单位配置
 * @param weatherUnit - 单位设置值：metric, us, uk, base
 */
export function weather_unit_choose(weatherUnit: string = "metric"): void {
    switch (weatherUnit) {
        case "metric":
            wunit = {
                temp: "℃",
                precip: "mm",
                precip_1: "mm/h",
                snow: "cm",
                snow_1: "cm/h",
                wind: "km/h",
                vis: "km",
                pressure: "hPa",
                solarradiation: "w/m²",
                temperature_code: "celsius",
                wind_speed_code: "kmh",
                precipitation_code: "mm"
            };
            break;
        case "us":
            wunit = {
                temp: "℉",
                precip: "in",
                precip_1: "in/h",
                snow: "in",
                snow_1: "in/h",
                wind: "mi/h",
                vis: "mi",
                pressure: "mb",
                solarradiation: "w/m²",
                temperature_code: "fahrenheit",
                wind_speed_code: "mph",
                precipitation_code: "inch"
            };
            break;
        case "uk":
            wunit = {
                temp: "℃",
                precip: "mm",
                precip_1: "mm/h",
                snow: "cm",
                snow_1: "cm/h",
                wind: "mi/h",
                vis: "mi",
                pressure: "mb",
                solarradiation: "w/m²",
                temperature_code: "celsius",
                wind_speed_code: "kmh",
                precipitation_code: "mm"
            };
            break;
        case "base":
            wunit = {
                temp: "K",
                precip: "mm",
                precip_1: "mm/h",
                snow: "cm",
                snow_1: "cm/h",
                wind: "m/s",
                vis: "km",
                pressure: "mb",
                solarradiation: "w/m²",
                temperature_code: "kelvin",
                wind_speed_code: "ms",
                precipitation_code: "mm"
            };
            break;
    }
}
