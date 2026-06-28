/**
 * 天气相关 DOM 元素
 *
 * lazy getter：天气元素由 Weather.vue 和天气模块动态渲染，
 * 不在静态 index.html 中。
 */
import { makeLazyMap, makeLazyIdMap } from '../lazyMap';

const weatherIdSelectors = makeLazyIdMap({
    weather: 'weather',
    icon: 'weatherIcon',
    temp: 'weatherTemp',
    text: 'weatherText',
    feels: 'weatherFeels',
    city: 'weatherCity',
    tempRange: 'weatherTempRange',
    humidity: 'weatherHumidity',
    windDirection: 'weatherWindDirection',
    windLevel: 'weatherWindLevel',
    windSpeed: 'weatherWindSpeed',
    visibility: 'weatherVisibility',
    detailRow: 'weatherDetailRow',
    uvIndex: 'weatherUvIndex',
    cloud: 'weatherCloud',
    sunrise: 'weatherSunrise',
    sunset: 'weatherSunset',
    moonphase: 'weatherMoonphase',
    airRow: 'weatherAirRow',
    airQuality: 'weatherAirQuality',
    airValue: 'weatherAirValue',
    alertContainer: 'weatherAlertContainer',
    precipContainer: 'weatherPrecipContainer',
    precipLabel: 'weatherPrecipLabel',
    precipTimes: 'weatherPrecipTimes',
    precipValues: 'weatherPrecipValues',
    tip: 'weatherTip',
});

const containerSelectors = {
    container: '#weather .weather-container',
    leftContainer: '.weather-left',
    rightContainer: '.weather-right',
} as const;

export const weatherElements = {
    weather: weatherIdSelectors.weather,
    container: (() => {
        const map = makeLazyMap<keyof typeof containerSelectors>(containerSelectors);
        return map.container;
    })(),
    leftContainer: (() => {
        const map = makeLazyMap<keyof typeof containerSelectors>(containerSelectors);
        return map.leftContainer;
    })(),
    rightContainer: (() => {
        const map = makeLazyMap<keyof typeof containerSelectors>(containerSelectors);
        return map.rightContainer;
    })(),
    icon: weatherIdSelectors.icon,
    temp: weatherIdSelectors.temp,
    text: weatherIdSelectors.text,
    feels: weatherIdSelectors.feels,
    city: weatherIdSelectors.city,
    tempRange: weatherIdSelectors.tempRange,
    humidity: weatherIdSelectors.humidity,
    windDirection: weatherIdSelectors.windDirection,
    windLevel: weatherIdSelectors.windLevel,
    windSpeed: weatherIdSelectors.windSpeed,
    visibility: weatherIdSelectors.visibility,
    detailRow: weatherIdSelectors.detailRow,
    uvIndex: weatherIdSelectors.uvIndex,
    cloud: weatherIdSelectors.cloud,
    sunrise: weatherIdSelectors.sunrise,
    sunset: weatherIdSelectors.sunset,
    moonphase: weatherIdSelectors.moonphase,
    airRow: weatherIdSelectors.airRow,
    airQuality: weatherIdSelectors.airQuality,
    airValue: weatherIdSelectors.airValue,
    alertContainer: weatherIdSelectors.alertContainer,
    precipContainer: weatherIdSelectors.precipContainer,
    precipLabel: weatherIdSelectors.precipLabel,
    precipTimes: weatherIdSelectors.precipTimes,
    precipValues: weatherIdSelectors.precipValues,
    tip: weatherIdSelectors.tip,
};
