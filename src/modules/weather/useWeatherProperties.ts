/**
 * useWeatherProperties — Vue 3 composable 包装 weather 属性处理
 *
 * Stage 3-2 (Phase 7 批次 3-2): 把 src/propertyHandlers/weatherPropertyHandler.ts
 * 的全部逻辑迁移到 composable。保持原 handler 的所有副作用（CSS 变量 /
 * Pinia patch / weather 区域 display / autoWeather 触发），不引入行为变更。
 *
 * 关键依赖（保留）：
 * - `weather_address` 模块顶层变量（不在 Pinia）— 用于 runtime 坐标
 * - `autoWeather / generateWeatherTable / weather_init / setWeatherUnitByName` —
 *   天气子模块的命令式 API
 * - `debounce / timerManager` — 通用工具
 */
import { useConfigStore } from '@/stores/config';
import { registerDeferred } from '@/utils/deferredScheduler';
import { elements } from '@/utils/elementManager';

import { WallpaperProperties } from '../../types/types';
import { logInitComplete } from '../../utils/_helpers';
import { timerManager } from '../../utils/timer';
import { debounce } from '../../utils/tool';
import {
    autoWeather,
    generateWeatherTable,
    weather_address,
    weather_init,
} from '../weather';
import { setWeatherUnitByName } from '../weather/weatherState';

const config = useConfigStore();

/**
 * 处理天气相关属性
 *
 * Stage 7-C (Phase 7 批次 2-C):
 *   - Pinia 字段改用 useConfigStore().$patch({...})。
 *   - weather_address.latitude 等运行时坐标仍用 module 顶层变量（不在 Pinia）。
 */
export function useWeatherProperties(properties: WallpaperProperties, FirstLoad: boolean): void {
    const store = useConfigStore();
    const patch: Record<string, unknown> = {};

    if (properties.getcitykey_qweather) {
        const v = properties.getcitykey_qweather.value;
        patch.city_key = v;
        config.city_key = v; // sync
    }

    if (properties.getAPIHOST_qweather) {
        const v = properties.getAPIHOST_qweather.value;
        patch.api_host = v;
        config.api_host = v; // sync
    }

    if (properties.getcityappid_tianqiapi) {
        const v = properties.getcityappid_tianqiapi.value;
        patch.weather_app_id = v;
        config.weather_app_id = v; // sync
    }

    if (properties.getcityappsecret_tianqiapi) {
        const v = properties.getcityappsecret_tianqiapi.value;
        patch.weather_app_secret = v;
        config.weather_app_secret = v; // sync
    }

    if (properties.getcitykey_visualcrossing) {
        const v = properties.getcitykey_visualcrossing.value;
        patch.visual_crossing_key = v;
        config.visual_crossing_key = v; // sync
    }

    if (properties.weather_updata) {
        const v = properties.weather_updata.value;
        patch.weather_updata = v;
        config.weather_updata = v; // sync
    }

    if (properties.weather_lang) {
        const v = properties.weather_lang.value;
        patch.weather_lang = v;
        config.weather_lang = v; // sync
    }

    if (properties.weather_unit) {
        const unit = properties.weather_unit.value;
        patch.weather_unit = unit;
        config.weather_unit = unit; // sync
        setWeatherUnitByName(unit || 'metric');
    }

    if (properties.weather_daliy_tip) {
        const v = properties.weather_daliy_tip.value;
        patch.weather_daily_tip = v;
        config.weather_daily_tip = v; // sync
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
            config.weather_api_choose = 2; // sync
            if (!FirstLoad) debounce(weather_init, 1500);
        }
    }

    if (properties.qweatherapi) {
        if (properties.qweatherapi.value) {
            patch.weather_api_choose = 1;
            config.weather_api_choose = 1; // sync
            if (!FirstLoad) debounce(weather_init, 1500);
        }
    }

    if (properties.qweatherapi_paymode) {
        const v = properties.qweatherapi_paymode.value;
        patch.qweather_api_paymode = v;
        config.qweather_api_paymode = v; // sync
    }

    if (properties.tianqiapi) {
        if (properties.tianqiapi.value) {
            patch.weather_api_choose = 3;
            config.weather_api_choose = 3; // sync
            if (!FirstLoad) debounce(weather_init, 1500);
        }
    }

    if (properties.visualcrossingapi) {
        if (properties.visualcrossingapi.value) {
            patch.weather_api_choose = 4;
            config.weather_api_choose = 4; // sync
            if (!FirstLoad) debounce(weather_init, 1500);
        }
    }

    if (properties.open_meteoapi) {
        if (properties.open_meteoapi.value) {
            patch.weather_api_choose = 5;
            config.weather_api_choose = 5; // sync
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

        const weather = elements.weather.weather;
        if (weather) {
            if (properties.weather_show.value) {
                weather.style.display = 'flex';
                weather.style.visibility = 'visible';
                autoWeather();
            } else {
                weather.style.display = 'none';
                weather.style.visibility = 'hidden';
            }
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

        // 监听天气容器尺寸变化，同步 --weather-height CSS 变量。
        // weather 容器由 Vue mount 后才存在，通过 deferredScheduler 延后挂载 observer。
        registerDeferred('weather:height-observer', () => {
            const weather = elements.weather.weather;
            if (!weather) return;

            const updateHeight = (): void => {
                const height = weather.getBoundingClientRect().height;
                if (!height) return;
                elements.body.style.setProperty('--weather-height', height + 'px');
            };

            updateHeight();
            const observer = new ResizeObserver(updateHeight);
            observer.observe(weather);
            return () => observer.disconnect();
        });
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
