import { WallpaperProperties } from './types';
import { config } from '../utils/config';
import { debugLogger } from '../utils/logger';
import { timerManager } from '../utils/timer';
import { elements } from '@/utils/elementManager';
import { weather_address, weather_init, generateWeatherTable, autoWeather } from '../weather';
import { setWeatherUnitByName } from '../weather/weatherState';
import { debounce } from '../utils/tool';

// ResizeObserver for weather height tracking
let weatherResizeObserver: ResizeObserver | null = null;

const weather = elements.weather.weather as HTMLElement;

/**
 * 处理天气相关属性
 * @param properties 属性对象
 * @param FirstLoad 是否首次加载
 */
export function handleWeatherProperties(
    properties: WallpaperProperties,
    FirstLoad: boolean
): void {

    if (properties.getcitykey_qweather) {
        config.city_key = properties.getcitykey_qweather.value;
    }

    if (properties.getAPIHOST_qweather) {
        config.api_host = properties.getAPIHOST_qweather.value;
    }

    if (properties.getcityappid_tianqiapi) {
        config.weather_app_id = properties.getcityappid_tianqiapi.value;
    }

    if (properties.getcityappsecret_tianqiapi) {
        config.weather_app_secret = properties.getcityappsecret_tianqiapi.value;
    }

    if (properties.getcitykey_visualcrossing) {
        config.visual_crossing_key = properties.getcitykey_visualcrossing.value;
    }

    if (properties.weather_updata) {
        config.weather_update = properties.weather_updata.value;
    }

    if (properties.weather_lang) {
        config.weather_lang = properties.weather_lang.value;
    }

    if (properties.weather_unit) {
        config.weather_unit = properties.weather_unit.value;
        setWeatherUnitByName(config.weather_unit || "metric");
    }

    if (properties.weather_daliy_tip) {
        config.weather_daily_tip = properties.weather_daliy_tip.value;
        if (!FirstLoad) {
            generateWeatherTable();
        }
        // Toggle border-bottom of precip container based on daily tip visibility
        if (elements.weather.precipContainer) {
            elements.weather.precipContainer.style.borderBottomWidth = properties.weather_daliy_tip.value ? '1px' : '0';
        }
    }

    if (properties.weather_lat_latitude) {
        weather_address.latitude = String(properties.weather_lat_latitude.value);
        config.weather_latitude = String(properties.weather_lat_latitude.value);
        if (!FirstLoad) debounce(weather_init, 1500);
    }

    if (properties.weather_lat_longitude) {
        weather_address.longitude = String(properties.weather_lat_longitude.value);
        config.weather_longitude = String(properties.weather_lat_longitude.value);
        if (!FirstLoad) debounce(weather_init, 1500);
    }

    if (properties.weather_CityText) {
        weather_address.cityname = properties.weather_CityText.value;
        config.weather_city_text = properties.weather_CityText.value;
        if (!FirstLoad) debounce(weather_init, 1500);
    }

    if (properties.freeapi) {
        if (properties.freeapi.value) {
            config.weather_api_choose = 2;
            if (FirstLoad === false) {
                debounce(weather_init, 1500);
            }
        }
    }

    if (properties.qweatherapi) {
        if (properties.qweatherapi.value) {
            config.weather_api_choose = 1;
            if (FirstLoad === false) {
                debounce(weather_init, 1500);
            }
        }
    }

    if (properties.qweatherapi_paymode) {
        config.qweather_api_paymode = properties.qweatherapi_paymode.value;
    }

    if (properties.tianqiapi) {
        if (properties.tianqiapi.value) {
            config.weather_api_choose = 3;
            if (FirstLoad === false) {
                debounce(weather_init, 1500);
            }
        }
    }

    if (properties.visualcrossingapi) {
        if (properties.visualcrossingapi.value) {
            config.weather_api_choose = 4;
            if (FirstLoad === false) {
                debounce(weather_init, 1500);
            }
        }
    }

    if (properties.open_meteoapi) {
        if (properties.open_meteoapi.value) {
            config.weather_api_choose = 5;
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
        const c = properties.weather_Color.value.split(' ').map((c) => Math.ceil(parseFloat(c) * 255)) as [number, number, number];
        elements.body.style.setProperty("--weather-color", `rgb(${c})`);
        config.weather_color = c;
    }

    if (properties.weather_blurcolor_show) {
        elements.body.style.setProperty("--weather-blur-enabled", properties.weather_blurcolor_show.value ? '1' : '0');
        config.weather_blurcolor_show = properties.weather_blurcolor_show.value;
    }

    if (properties.weather_blurcolor) {
        const c = properties.weather_blurcolor.value.split(' ').map((c) => Math.ceil(parseFloat(c) * 255)) as [number, number, number];
        elements.body.style.setProperty("--weather-blur-color", c.join(', '));
        config.weather_blurcolor = c;
    }

    if (properties.weather_yakeli_show) {
        elements.body.style.setProperty("--weather-yakeli-enabled", properties.weather_yakeli_show.value ? '1' : '0');
        config.weather_yakeli_show = properties.weather_yakeli_show.value;
    }

    if (properties.weather_yakelicolor) {
        const c = properties.weather_yakelicolor.value.split(' ').map((c) => Math.ceil(parseFloat(c) * 255)) as [number, number, number];
        elements.body.style.setProperty("--weather-yakeli-color", c.join(', '));
        config.weather_yakelic_color = c;
    }

    if (properties.weather_yakeli) {
        elements.body.style.setProperty("--weather-yakeli", String(properties.weather_yakeli.value / 100));
        config.weather_yakeli = properties.weather_yakeli.value;
    }

    if (properties.weather_bluryakeli) {
        elements.body.style.setProperty("--weather-blur-yakeli", String(properties.weather_bluryakeli.value) + 'px');
        config.weather_bluryakeli = properties.weather_bluryakeli.value;
    }

    // 天气透明度
    if (properties.weather_timetransparency) {
        elements.body.style.setProperty("--weather-opacity", String(properties.weather_timetransparency.value / 100));
        config.weather_timetransparency = properties.weather_timetransparency.value;
    }

    // 天气圆角
    if (properties.weather_roundedcorners) {
        elements.body.style.setProperty("--weather-roundedcorners", String(properties.weather_roundedcorners.value));
        config.weather_roundedcorners = properties.weather_roundedcorners.value;

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
        elements.body.style.setProperty("--weather-font-size", Math.floor(window.innerHeight / 900 * s) + 'px');
        config.weather_size = s;
    }

    if (properties.weather_showwidth) {
        if (properties.weather_showwidth.value === 0) {
            elements.body.style.setProperty("--weather-show-width", 'auto');
        } else {
            const s = properties.weather_showwidth.value / 100;
            elements.body.style.setProperty("--weather-show-width", window.innerWidth * s + "px");
        }
        config.weather_showwidth = properties.weather_showwidth.value;
    }

    // 天气位置
    if (properties.weatherX) {
        elements.body.style.setProperty("--weather-left", `${properties.weatherX.value}%`);
        config.weather_x = properties.weatherX.value;
    }

    if (properties.weatherY) {
        elements.body.style.setProperty("--weather-top", `${properties.weatherY.value}%`);
        config.weather_y = properties.weatherY.value;
    }

    if (FirstLoad) {
        debugLogger.info('[Weather] 天气参数初始化完成');
        config.weather_init_complete = true;
    }
}
