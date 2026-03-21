/**
 * Weather Property Handler
 * 处理天气相关的属性监听
 */

import { WallpaperProperties } from './types';
import { appConfig } from '../../utils/config';
import { debugLogger } from '../../utils/logger';
import { timerManager } from '../../utils/timer';

declare let weather_address: {
    cityname: string;
    latitude: string;
    longitude: string;
};
declare let weather: HTMLElement;
declare let bodyElement: HTMLElement;
declare let h: number;
declare let w: number;
declare let weather_init: () => void;
declare let debounce: <T extends (...args: any[]) => any>(func: T, wait: number) => (...args: Parameters<T>) => void;
declare let generateWeatherTable: () => Promise<void>;
declare let weather_lang_choose: () => void;
declare let weather_unit_choose: () => void;
declare let autoWeather: () => void;

export interface WeatherPropertyHandlerResult {
    // weatherInitComplate 现在通过 appConfig 管理
}

/**
 * 处理天气相关属性
 * @param properties 属性对象
 * @param FirstLoad 是否首次加载
 * @returns 处理结果
 */
export function handleWeatherProperties(
    properties: WallpaperProperties,
    FirstLoad: boolean
): WeatherPropertyHandlerResult {
    const result: WeatherPropertyHandlerResult = {};

    // 获取key 和风天气api
    if (properties.getcitykey_qweather) {
        appConfig.setCityKey(properties.getcitykey_qweather.value);
    }

    // 获取API host 和风天气api
    if (properties.getAPIHOST_qweather) {
        appConfig.setApiHost(properties.getAPIHOST_qweather.value);
    }

    // 获取appid&appsecret 天气api
    if (properties.getcityappid_tianqiapi) {
        appConfig.setWeatherAppId(properties.getcityappid_tianqiapi.value);
    }

    if (properties.getcityappsecret_tianqiapi) {
        appConfig.setWeatherAppSecret(properties.getcityappsecret_tianqiapi.value);
    }

    // VisualCrossing_Key
    if (properties.getcitykey_visualcrossing) {
        appConfig.setVisualCrossingKey(properties.getcitykey_visualcrossing.value);
    }

    // 天气更新时间
    if (properties.weather_updata) {
        appConfig.setWeatherUpdate(properties.weather_updata.value);
    }

    // 显示语言
    if (properties.weather_lang) {
        appConfig.setWeatherLang(properties.weather_lang.value);
        weather_lang_choose();
    }

    // 显示单位
    if (properties.weather_unit) {
        appConfig.setWeatherUnit(properties.weather_unit.value);
        weather_unit_choose();
    }

    if (properties.weather_daliy_tip) {
        if (FirstLoad === false) {
            generateWeatherTable();
        }
    }

    if (properties.weather_lat_latitude) {
        weather_address.latitude = String(properties.weather_lat_latitude.value);
        if (!FirstLoad) debounce(weather_init, 1500);
    }

    if (properties.weather_lat_longitude) {
        weather_address.longitude = String(properties.weather_lat_longitude.value);
        if (!FirstLoad) debounce(weather_init, 1500);
    }

    // 获取天气城市优先获取
    if (properties.weather_CityText) {
        weather_address.cityname = properties.weather_CityText.value;
        if (!FirstLoad) debounce(weather_init, 1500);
    }

    // API选择
    if (properties.freeapi) {
        if (properties.freeapi.value) {
            appConfig.setWeatherApiChoose("2");
            if (FirstLoad === false) {
                debounce(weather_init, 1500);
            }
        }
    }

    if (properties.qweatherapi) {
        if (properties.qweatherapi.value) {
            appConfig.setWeatherApiChoose("1");
            if (FirstLoad === false) {
                debounce(weather_init, 1500);
            }
        }
    }

    if (properties.qweatherapi_paymode) {
        appConfig.setQweatherApiPaymode(properties.qweatherapi_paymode.value);
    }

    if (properties.tianqiapi) {
        if (properties.tianqiapi.value) {
            appConfig.setWeatherApiChoose("3");
            if (FirstLoad === false) {
                debounce(weather_init, 1500);
            }
        }
    }

    if (properties.visualcrossingapi) {
        if (properties.visualcrossingapi.value) {
            appConfig.setWeatherApiChoose("4");
            if (FirstLoad === false) {
                debounce(weather_init, 1500);
            }
        }
    }

    if (properties.open_meteoapi) {
        if (properties.open_meteoapi.value) {
            appConfig.setWeatherApiChoose("5");
            if (FirstLoad === false) {
                debounce(weather_init, 1500);
            }
        }
    }

    // 是否天气
    if (properties.weather_show) {
        timerManager.remove('updataWeather');

        if (properties.weather_show.value) {
            weather.style.display = "flex";
            weather.style.visibility = "visible";
            autoWeather();
        } else {
            weather.style.display = "none";
            weather.style.visibility = "hidden";
        }
    }

    // 天气颜色
    if (properties.weather_Color) {
        const c = properties.weather_Color.value.split(' ').map((c) => Math.ceil(parseFloat(c) * 255));
        bodyElement.style.setProperty("--weather-color", `rgb(${c})`);
        appConfig.setWeatherColor(c);
    }

    if (properties.weather_blurcolor_show) {
        bodyElement.style.setProperty("--weather-blur-enabled", properties.weather_blurcolor_show.value ? '1' : '0');
        appConfig.setWeatherBlurcolorShow(properties.weather_blurcolor_show.value);
    }

    if (properties.weather_blurcolor) {
        const c = properties.weather_blurcolor.value.split(' ').map((c) => Math.ceil(parseFloat(c) * 255));
        bodyElement.style.setProperty("--weather-blur-color", c.join(', '));
        appConfig.setWeatherBlurcolor(c);
    }

    if (properties.weather_yakeli_show) {
        bodyElement.style.setProperty("--weather-yakeli-enabled", properties.weather_yakeli_show.value ? '1' : '0');
        appConfig.setWeatherYakeliShow(properties.weather_yakeli_show.value);
    }

    if (properties.weather_yakelicolor) {
        const c = properties.weather_yakelicolor.value.split(' ').map((c) => Math.ceil(parseFloat(c) * 255));
        bodyElement.style.setProperty("--weather-yakeli-color", c.join(', '));
        appConfig.setWeatherYakelicColor(c);
    }

    if (properties.weather_yakeli) {
        bodyElement.style.setProperty("--weather-yakeli", String(properties.weather_yakeli.value / 100));
        appConfig.setWeatherYakeli(properties.weather_yakeli.value);
    }

    if (properties.weather_bluryakeli) {
        bodyElement.style.setProperty("--weather-blur-yakeli", String(properties.weather_bluryakeli.value) + 'px');
        appConfig.setWeatherBluryakeli(properties.weather_bluryakeli.value);
    }

    // 天气透明度
    if (properties.weather_timetransparency) {
        bodyElement.style.setProperty("--weather-opacity", String(properties.weather_timetransparency.value / 100));
    }

    // 天气圆角
    if (properties.weather_roundedcorners) {
        bodyElement.style.setProperty("--weather-roundedcorners", String(properties.weather_roundedcorners.value));

        const updateHeight = () => {
            const height = weather.getBoundingClientRect().height;
            if (!height) return;
            bodyElement.style.setProperty("--weather-height", height + "px");
        };

        updateHeight();

        const observer = new ResizeObserver(updateHeight);
        observer.observe(weather);
    }

    // 天气大小
    if (properties.weather_size) {
        const s = properties.weather_size.value;
        bodyElement.style.setProperty("--weather-font-size", Math.floor(h / 900 * s) + 'px');
    }

    if (properties.weather_showwidth) {
        if (properties.weather_showwidth.value === 0) {
            bodyElement.style.setProperty("--weather-show-width", 'auto');
        } else {
            const s = properties.weather_showwidth.value / 100;
            bodyElement.style.setProperty("--weather-show-width", w * s + "px");
        }
    }

    // 天气位置
    if (properties.weatherX) {
        bodyElement.style.setProperty("--weather-left", `${properties.weatherX.value}%`);
    }

    if (properties.weatherY) {
        bodyElement.style.setProperty("--weather-top", `${properties.weatherY.value}%`);
    }

    if (FirstLoad) {
        debugLogger.info('[Weather] 天气参数初始化完成');
        appConfig.setWeatherInitComplete(true);
    }

    return result;
}
