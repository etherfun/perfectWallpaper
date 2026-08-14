/**
 * useWeatherProperties — Vue 3 composable 包装 weather 属性处理
 *
 * Stage 3-2 (Phase 7 批次 3-2): 把 src/propertyHandlers/weatherPropertyHandler.ts
 * 的全部逻辑迁移到 composable。保持原 handler 的所有副作用（CSS 变量 /
 * Pinia patch / weather 区域 display / autoWeather 触发），不引入行为变更。
 *
 * 关键依赖（保留）：
 * - `weather_address` 模块顶层变量（不在 Pinia）…用于 runtime 坐标
 * - `autoWeather / generateWeatherTable / weather_init / setWeatherUnitByName` —
 *   天气子模块的命令式 API
 * - `debounce / timerManager` — 通用工具
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
import { setWeatherUnitByName, weatherUiState } from '../weather/weatherState';

/** WE 属性变化后触发天气刷新的防抖间隔（ms） */
const REFRESH_DEBOUNCE_MS = 1500;

/** 将 WE 浮点颜色（0~1 空格分隔）转换为 0~255 RGB 数组 */
function parseWEColor(value: string): number[] {
    return value.split(' ').map(c => Math.ceil(parseFloat(c) * 255));
}

/**
 * 同步单个 WE 属性到 Pinia patch 与 config 单例。
 * patch 在函数末尾批量生效；config 同步赋值保证后续读取立即可见。
 */
function syncProperty<T extends object>(
    prop: { value: unknown } | undefined,
    key: string,
    patch: Record<string, unknown>,
    config: T
): void {
    if (!prop) return;
    const v = prop.value;
    patch[key] = v;
    (config as Record<string, unknown>)[key] = v;
}

/** 选择天气 API（写入 weather_api_choose），非首次加载时防抖刷新数据 */
function selectWeatherApi<T extends object>(
    prop: { value: boolean } | undefined,
    apiId: number,
    patch: Record<string, unknown>,
    config: T,
    FirstLoad: boolean
): void {
    if (!prop?.value) return;
    syncProperty({ value: apiId }, 'weather_api_choose', patch, config);
    if (!FirstLoad) debounce(weather_init, REFRESH_DEBOUNCE_MS);
}

/** 更新天气坐标/城市文本到模块状态，非首次加载时防抖刷新数据 */
function updateLocation(
    key: 'latitude' | 'longitude' | 'cityname',
    value: string,
    patch: Record<string, unknown>,
    FirstLoad: boolean
): void {
    weather_address[key] = value;
    const patchKey =
        key === 'latitude'
            ? 'weather_latitude'
            : key === 'longitude'
              ? 'weather_longitude'
              : 'weather_city_text';
    patch[patchKey] = value;
    if (!FirstLoad) debounce(weather_init, REFRESH_DEBOUNCE_MS);
}

/**
 * 处理天气相关属性
 *
 * Stage 7-C (Phase 7 批次 2-C):
 *   - Pinia 字段改用 useConfigStore().$patch({...})。
 *   - weather_address.latitude 等运行时坐标仍用 module 顶层变量（不在 Pinia）。
 */
export function useWeatherProperties(properties: WallpaperProperties, FirstLoad: boolean): void {
    const store = useConfigStore();
    const config = store;
    const patch: Record<string, unknown> = {};

    // 各 API 的密钥 / 主机配置
    syncProperty(properties.getcitykey_qweather, 'city_key', patch, config);
    syncProperty(properties.getAPIHOST_qweather, 'api_host', patch, config);
    syncProperty(properties.getcityappid_tianqiapi, 'weather_app_id', patch, config);
    syncProperty(properties.getcityappsecret_tianqiapi, 'weather_app_secret', patch, config);
    syncProperty(properties.getcitykey_visualcrossing, 'visual_crossing_key', patch, config);
    syncProperty(properties.weather_updata, 'weather_updata', patch, config);
    syncProperty(properties.weather_lang, 'weather_lang', patch, config);
    syncProperty(properties.qweatherapi_paymode, 'qweather_api_paymode', patch, config);

    if (properties.weather_unit) {
        const unit = properties.weather_unit.value;
        syncProperty({ value: unit }, 'weather_unit', patch, config);
        setWeatherUnitByName(unit || 'metric');
    }

    if (properties.weather_daliy_tip) {
        const v = properties.weather_daliy_tip.value;
        syncProperty({ value: v }, 'weather_daily_tip', patch, config);
        if (!FirstLoad) {
            generateWeatherTable();
        }
    }

    // 坐标 / 城市文本
    if (properties.weather_lat_latitude) {
        updateLocation('latitude', String(properties.weather_lat_latitude.value), patch, FirstLoad);
    }
    if (properties.weather_lat_longitude) {
        updateLocation(
            'longitude',
            String(properties.weather_lat_longitude.value),
            patch,
            FirstLoad
        );
    }
    if (properties.weather_CityText) {
        updateLocation('cityname', properties.weather_CityText.value, patch, FirstLoad);
    }

    // API 选择
    selectWeatherApi(properties.freeapi, 2, patch, config, FirstLoad);
    selectWeatherApi(properties.qweatherapi, 1, patch, config, FirstLoad);
    selectWeatherApi(properties.tianqiapi, 3, patch, config, FirstLoad);
    selectWeatherApi(properties.visualcrossingapi, 4, patch, config, FirstLoad);
    selectWeatherApi(properties.open_meteoapi, 5, patch, config, FirstLoad);

    // Apply batch first so weather_show dispatch reads fresh values if needed
    if (Object.keys(patch).length > 0) {
        store.$patch(patch);
    }

    // 是否天气
    if (properties.weather_show) {
        timerManager.remove('updataWeather');

        weatherUiState.visible = properties.weather_show.value === true;
        if (properties.weather_show.value) {
            autoWeather();
        }
    }

    // 天气颜色（原 handler 为立即单独 $patch，保持时序一致）
    if (properties.weather_Color) {
        const c = parseWEColor(properties.weather_Color.value);
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
        const c = parseWEColor(properties.weather_blurcolor.value);
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
        const c = parseWEColor(properties.weather_yakelicolor.value);
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
            `${properties.weather_bluryakeli.value}px`
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
        // weather 容器由 Vue mount 后才存在，通过 deferredScheduler 延迟挂载 observer。
        registerDeferred('weather:height-observer', () => {
            const weather = elements.weather.weather;
            if (!weather) return;

            const updateHeight = (): void => {
                const height = weather.getBoundingClientRect().height;
                if (!height) return;
                elements.body.style.setProperty('--weather-height', `${height}px`);
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
        const v = properties.weather_showwidth.value;
        if (v === 0) {
            elements.body.style.setProperty('--weather-show-width', 'auto');
        } else {
            elements.body.style.setProperty(
                '--weather-show-width',
                `${window.innerWidth * (v / 100)}px`
            );
        }
        store.$patch({ weather_showwidth: v });
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
