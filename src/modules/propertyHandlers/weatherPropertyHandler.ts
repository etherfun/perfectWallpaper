/**
 * Weather Property Handler
 * 处理天气相关的属性监听
 */

import { WallpaperProperties } from './types';
import { config } from '../../utils/config';
import { debugLogger } from '../../utils/logger';
import { timerManager } from '../../utils/timer';
import { elements } from '@/utils/elementManager';
import { weather_address, weather_init, generateWeatherTable, autoWeather, weather_unit_choose } from '../weather';
import { debounce } from '../../utils/timer';

// 获取天气元素
const weather = elements.weather.weather as HTMLElement;

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
        config.cityKey = properties.getcitykey_qweather.value;
    }

    // 获取API host 和风天气api
    if (properties.getAPIHOST_qweather) {
        config.apiHost = properties.getAPIHOST_qweather.value;
    }

    // 获取appid&appsecret 天气api
    if (properties.getcityappid_tianqiapi) {
        config.weatherAppId = properties.getcityappid_tianqiapi.value;
    }

    if (properties.getcityappsecret_tianqiapi) {
        config.weatherAppSecret = properties.getcityappsecret_tianqiapi.value;
    }

    // VisualCrossing_Key
    if (properties.getcitykey_visualcrossing) {
        config.visualCrossingKey = properties.getcitykey_visualcrossing.value;
    }

    // 天气更新时间
    if (properties.weather_updata) {
        config.weatherUpdate = properties.weather_updata.value;
    }

    // 显示语言
    if (properties.weather_lang) {
        config.weatherLang = properties.weather_lang.value;
    }

    // 显示单位
    if (properties.weather_unit) {
        config.weatherUnit = properties.weather_unit.value;
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
            config.weatherApiChoose = "2";
            if (FirstLoad === false) {
                debounce(weather_init, 1500);
            }
        }
    }

    if (properties.qweatherapi) {
        if (properties.qweatherapi.value) {
            config.weatherApiChoose = "1";
            if (FirstLoad === false) {
                debounce(weather_init, 1500);
            }
        }
    }

    if (properties.qweatherapi_paymode) {
        config.qweatherApiPaymode = properties.qweatherapi_paymode.value;
    }

    if (properties.tianqiapi) {
        if (properties.tianqiapi.value) {
            config.weatherApiChoose = "3";
            if (FirstLoad === false) {
                debounce(weather_init, 1500);
            }
        }
    }

    if (properties.visualcrossingapi) {
        if (properties.visualcrossingapi.value) {
            config.weatherApiChoose = "4";
            if (FirstLoad === false) {
                debounce(weather_init, 1500);
            }
        }
    }

    if (properties.open_meteoapi) {
        if (properties.open_meteoapi.value) {
            config.weatherApiChoose = "5";
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
        elements.body.style.setProperty("--weather-color", `rgb(${c})`);
        config.weatherColor = c;
    }

    if (properties.weather_blurcolor_show) {
        elements.body.style.setProperty("--weather-blur-enabled", properties.weather_blurcolor_show.value ? '1' : '0');
        config.weatherBlurcolorShow = properties.weather_blurcolor_show.value;
    }

    if (properties.weather_blurcolor) {
        const c = properties.weather_blurcolor.value.split(' ').map((c) => Math.ceil(parseFloat(c) * 255));
        elements.body.style.setProperty("--weather-blur-color", c.join(', '));
        config.weatherBlurcolor = c;
    }

    if (properties.weather_yakeli_show) {
        elements.body.style.setProperty("--weather-yakeli-enabled", properties.weather_yakeli_show.value ? '1' : '0');
        config.weatherYakeliShow = properties.weather_yakeli_show.value;
    }

    if (properties.weather_yakelicolor) {
        const c = properties.weather_yakelicolor.value.split(' ').map((c) => Math.ceil(parseFloat(c) * 255));
        elements.body.style.setProperty("--weather-yakeli-color", c.join(', '));
        config.weatherYakelicColor = c;
    }

    if (properties.weather_yakeli) {
        elements.body.style.setProperty("--weather-yakeli", String(properties.weather_yakeli.value / 100));
        config.weatherYakeli = properties.weather_yakeli.value;
    }

    if (properties.weather_bluryakeli) {
        elements.body.style.setProperty("--weather-blur-yakeli", String(properties.weather_bluryakeli.value) + 'px');
        config.weatherBluryakeli = properties.weather_bluryakeli.value;
    }

    // 天气透明度
    if (properties.weather_timetransparency) {
        elements.body.style.setProperty("--weather-opacity", String(properties.weather_timetransparency.value / 100));
    }

    // 天气圆角
    if (properties.weather_roundedcorners) {
        elements.body.style.setProperty("--weather-roundedcorners", String(properties.weather_roundedcorners.value));

        const updateHeight = () => {
            const height = weather.getBoundingClientRect().height;
            if (!height) return;
            elements.body.style.setProperty("--weather-height", height + "px");
        };

        updateHeight();

        const observer = new ResizeObserver(updateHeight);
        observer.observe(weather);
    }

    // 天气大小
    if (properties.weather_size) {
        const s = properties.weather_size.value;
        elements.body.style.setProperty("--weather-font-size", Math.floor(config.screenHeight / 900 * s) + 'px');
    }

    if (properties.weather_showwidth) {
        if (properties.weather_showwidth.value === 0) {
            elements.body.style.setProperty("--weather-show-width", 'auto');
        } else {
            const s = properties.weather_showwidth.value / 100;
            elements.body.style.setProperty("--weather-show-width", config.screenWidth * s + "px");
        }
    }

    // 天气位置
    if (properties.weatherX) {
        elements.body.style.setProperty("--weather-left", `${properties.weatherX.value}%`);
    }

    if (properties.weatherY) {
        elements.body.style.setProperty("--weather-top", `${properties.weatherY.value}%`);
    }

    if (FirstLoad) {
        debugLogger.info('[Weather] 天气参数初始化完成');
        config.weatherInitComplete = true;
    }

    return result;
}
