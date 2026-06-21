import { elements } from '@/utils/elementManager';
import { useConfigStore } from '@/stores/config';

import { timerManager } from '../utils/timer';
import { debounce } from '../utils/tool';
import { autoWeather, generateWeatherTable, weather_address, weather_init } from '../weather';
import { setWeatherUnitByName } from '../weather/weatherState';
import { logInitComplete } from './_helpers';
import { WallpaperProperties } from './types';

const weather = elements.weather.weather as HTMLElement;

/**
 * 处理天气相关属性
 *
 * Stage 7-C (Phase 7 批次 2-C):
 *   - Pinia 字段改用 useConfigStore().$patch({...})。
 *   - weather_address.latitude 等运行时坐标仍用 module 顶层变量（不在 Pinia）。
 */
export function handleWeatherProperties(properties: WallpaperProperties, FirstLoad: boolean): void {
    const store = useConfigStore();
    const patch: Record<string, unknown> = {};

    if (properties.getcitykey_qweather) {
        patch.city_key = properties.getcitykey_qweather.value;
    }

    if (properties.getAPIHOST_qweather) {
        patch.api_host = properties.getAPIHOST_qweather.value;
    }

    if (properties.getcityappid_tianqiapi) {
        patch.weather_app_id = properties.getcityappid_tianqiapi.value;
    }

    if (properties.getcityappsecret_tianqiapi) {
        patch.weather_app_secret = properties.getcityappsecret_tianqiapi.value;
    }

    if (properties.getcitykey_visualcrossing) {
        patch.visual_crossing_key = properties.getcitykey_visualcrossing.value;
    }

    if (properties.weather_updata) {
        patch.weather_updata = properties.weather_updata.value;
    }

    if (properties.weather_lang) {
        patch.weather_lang = properties.weather_lang.value;
    }

    if (properties.weather_unit) {
        const unit = properties.weather_unit.value;
        patch.weather_unit = unit;
        setWeatherUnitByName(unit || 'metric');
    }

    if (properties.weather_daliy_tip) {
        patch.weather_daily_tip = properties.weather_daliy_tip.value;
        if (!FirstLoad) {
            generateWeatherTable();
        }
        if (elements.weather.precipContainer) {
            elements.weather.precipContainer.style.borderBottomWidth = properties.weather_daliy_tip
                .value
                ? '1px'
                : '0';
        }
    }

    if (properties.weather_lat_latitude) {
        weather_address.latitude = String(properties.weather_lat_latitude.value);
        patch.weather_latitude = String(properties.weather_lat_latitude.value);
        if (!FirstLoad) debounce(weather_init, 1500);
    }

    if (properties.weather_lat_longitude) {
        weather_address.longitude = String(properties.weather_lat_longitude.value);
        patch.weather_longitude = String(properties.weather_lat_longitude.value);
        if (!FirstLoad) debounce(weather_init, 1500);
    }

    if (properties.weather_CityText) {
        weather_address.cityname = properties.weather_CityText.value;
        patch.weather_city_text = properties.weather_CityText.value;
        if (!FirstLoad) debounce(weather_init, 1500);
    }

    if (properties.freeapi) {
        if (properties.freeapi.value) {
            patch.weather_api_choose = 2;
            if (!FirstLoad) debounce(weather_init, 1500);
        }
    }

    if (properties.qweatherapi) {
        if (properties.qweatherapi.value) {
            patch.weather_api_choose = 1;
            if (!FirstLoad) debounce(weather_init, 1500);
        }
    }

    if (properties.qweatherapi_paymode) {
        patch.qweather_api_paymode = properties.qweatherapi_paymode.value;
    }

    if (properties.tianqiapi) {
        if (properties.tianqiapi.value) {
            patch.weather_api_choose = 3;
            if (!FirstLoad) debounce(weather_init, 1500);
        }
    }

    if (properties.visualcrossingapi) {
        if (properties.visualcrossingapi.value) {
            patch.weather_api_choose = 4;
            if (!FirstLoad) debounce(weather_init, 1500);
        }
    }

    if (properties.open_meteoapi) {
        if (properties.open_meteoapi.value) {
            patch.weather_api_choose = 5;
            if (!FirstLoad) debounce(weather_init, 1500);
        }
    }

    // Apply batch first so weather_show dispatch reads fresh values if needed
    if (Object.keys(patch).length > 0) {
        store.$patch(patch);
    }

    // 是否天气
    if (properties.weather_show) {
        timerManager.remove('updataWeather');

        if (properties.weather_show.value) {
            weather.style.display = 'flex';
            weather.style.visibility = 'visible';
            autoWeather();
        } else {
            weather.style.display = 'none';
            weather.style.visibility = 'hidden';
        }
    }

    // 天气颜色
    if (properties.weather_Color) {
        const c = properties.weather_Color.value
            .split(' ')
            .map(c => Math.ceil(parseFloat(c) * 255));
        elements.body.style.setProperty('--weather-color', `rgb(${c})`);
        store.$patch({ weather_color: c as [number, number, number] });
    }

    if (properties.weather_blurcolor_show) {
        elements.body.style.setProperty(
            '--weather-blur-enabled',
            properties.weather_blurcolor_show.value ? '1' : '0'
        );
        store.$patch({ weather_blurcolor_show: properties.weather_blurcolor_show.value });
    }

    if (properties.weather_blurcolor) {
        const c = properties.weather_blurcolor.value
            .split(' ')
            .map(c => Math.ceil(parseFloat(c) * 255));
        elements.body.style.setProperty('--weather-blur-color', c.join(', '));
        store.$patch({ weather_blurcolor: c as [number, number, number] });
    }

    if (properties.weather_yakeli_show) {
        elements.body.style.setProperty(
            '--weather-yakeli-enabled',
            properties.weather_yakeli_show.value ? '1' : '0'
        );
        store.$patch({ weather_yakeli_show: properties.weather_yakeli_show.value });
    }

    if (properties.weather_yakelicolor) {
        const c = properties.weather_yakelicolor.value
            .split(' ')
            .map(c => Math.ceil(parseFloat(c) * 255));
        elements.body.style.setProperty('--weather-yakeli-color', c.join(', '));
        store.$patch({ weather_yakelic_color: c as [number, number, number] });
    }

    if (properties.weather_yakeli) {
        elements.body.style.setProperty(
            '--weather-yakeli',
            String(properties.weather_yakeli.value / 100)
        );
        store.$patch({ weather_yakeli: properties.weather_yakeli.value });
    }

    if (properties.weather_bluryakeli) {
        elements.body.style.setProperty(
            '--weather-blur-yakeli',
            String(properties.weather_bluryakeli.value) + 'px'
        );
        store.$patch({ weather_bluryakeli: properties.weather_bluryakeli.value });
    }

    // 天气透明度
    if (properties.weather_timetransparency) {
        elements.body.style.setProperty(
            '--weather-opacity',
            String(properties.weather_timetransparency.value / 100)
        );
        store.$patch({ weather_timetransparency: properties.weather_timetransparency.value });
    }

    // 天气圆角
    if (properties.weather_roundedcorners) {
        elements.body.style.setProperty(
            '--weather-roundedcorners',
            String(properties.weather_roundedcorners.value)
        );
        store.$patch({ weather_roundedcorners: properties.weather_roundedcorners.value });

        const updateHeight = () => {
            const height = weather.getBoundingClientRect().height;
            if (!height) return;
            elements.body.style.setProperty('--weather-height', height + 'px');
        };

        updateHeight();

        const observer = new ResizeObserver(updateHeight);
        observer.observe(weather);
    }

    // 天气大小
    if (properties.weather_size) {
        const s = properties.weather_size.value;
        elements.body.style.setProperty(
            '--weather-font-size',
            Math.floor((window.innerHeight / 900) * s) + 'px'
        );
        store.$patch({ weather_size: s });
    }

    if (properties.weather_showwidth) {
        if (properties.weather_showwidth.value === 0) {
            elements.body.style.setProperty('--weather-show-width', 'auto');
        } else {
            const s = properties.weather_showwidth.value / 100;
            elements.body.style.setProperty('--weather-show-width', window.innerWidth * s + 'px');
        }
        store.$patch({ weather_showwidth: properties.weather_showwidth.value });
    }

    // 天气位置
    if (properties.weatherX) {
        elements.body.style.setProperty('--weather-left', `${properties.weatherX.value}%`);
        store.$patch({ weather_x: properties.weatherX.value });
    }

    if (properties.weatherY) {
        elements.body.style.setProperty('--weather-top', `${properties.weatherY.value}%`);
        store.$patch({ weather_y: properties.weatherY.value });
    }

    if (FirstLoad) {
        logInitComplete('[Weather]', '天气', FirstLoad);
        store.$patch({ weather_init_complete: true });
    }
}
