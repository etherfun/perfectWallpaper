/**
 * useWeatherProperties 鈥?Vue 3 composable 鍖呰 weather 灞炴€у鐞?
 *
 * Stage 3-2 (Phase 7 鎵规 3-2): 鎶?src/propertyHandlers/weatherPropertyHandler.ts
 * 鐨勫叏閮ㄩ€昏緫杩佺Щ鍒?composable銆備繚鎸佸師 handler 鐨勬墍鏈夊壇浣滅敤锛圕SS 鍙橀噺 /
 * Pinia patch / weather 鍖哄煙 display / autoWeather 瑙﹀彂锛夛紝涓嶅紩鍏ヨ涓哄彉鏇淬€?
 *
 * 鍏抽敭渚濊禆锛堜繚鐣欙級锛?
 * - `weather_address` 妯″潡椤跺眰鍙橀噺锛堜笉鍦?Pinia锛夆€?鐢ㄤ簬 runtime 鍧愭爣
 * - `autoWeather / generateWeatherTable / weather_init / setWeatherUnitByName` 鈥?
 *   澶╂皵瀛愭ā鍧楃殑鍛戒护寮?API
 * - `debounce / timerManager` 鈥?閫氱敤宸ュ叿
 */
import { useConfigStore } from '@/stores/config';
import { registerDeferred } from '@/utils/deferredScheduler';
import { elements } from '@/utils/elementManager';

import { WallpaperProperties } from '../../types/types';
import { logInitComplete } from '../../utils/helpers';
import { timerManager } from '../../utils/timer';
import { debounce } from '../../utils/tool';
import {
    autoWeather,
    generateWeatherTable,
    weather_address,
    weather_init,
} from '../weather';
import { setWeatherUnitByName } from '../weather/weatherState';

/**
 * 澶勭悊澶╂皵鐩稿叧灞炴€?
 *
 * Stage 7-C (Phase 7 鎵规 2-C):
 *   - Pinia 瀛楁鏀圭敤 useConfigStore().$patch({...})銆?
 *   - weather_address.latitude 绛夎繍琛屾椂鍧愭爣浠嶇敤 module 椤跺眰鍙橀噺锛堜笉鍦?Pinia锛夈€?
 */
export function useWeatherProperties(properties: WallpaperProperties, FirstLoad: boolean): void {
    const store = useConfigStore();
    const config = store;
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

    // 鏄惁澶╂皵
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

    // 澶╂皵棰滆壊
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

    // 澶╂皵閫忔槑搴?
    if (properties.weather_timetransparency) {
        elements.body.style.setProperty(
            '--weather-opacity',
            String(properties.weather_timetransparency.value / 100)
        );
        store.$patch({ weather_timetransparency: properties.weather_timetransparency.value });
    }

    // 澶╂皵鍦嗚
    if (properties.weather_roundedcorners) {
        elements.body.style.setProperty(
            '--weather-roundedcorners',
            String(properties.weather_roundedcorners.value)
        );
        store.$patch({ weather_roundedcorners: properties.weather_roundedcorners.value });

        // 鐩戝惉澶╂皵瀹瑰櫒灏哄鍙樺寲锛屽悓姝?--weather-height CSS 鍙橀噺銆?
        // weather 瀹瑰櫒鐢?Vue mount 鍚庢墠瀛樺湪锛岄€氳繃 deferredScheduler 寤跺悗鎸傝浇 observer銆?
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

    // 澶╂皵澶у皬
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

    // 澶╂皵浣嶇疆
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
