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
import { useWeatherStore } from '../weather';

/** 将 WE 浮点颜色（0~1 空格分隔）转换为 0~255 RGB 数组 */
function parseWEColor(value: string): number[] {
    return value.split(' ').map(c => Math.ceil(parseFloat(c) * 255));
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
    const weather = useWeatherStore();

    // 各 API 的密钥 / 主机配置（直接写入 config store，响应式等价原 batch patch）
    if (properties.getcitykey_qweather) store.city_key = properties.getcitykey_qweather.value;
    if (properties.getAPIHOST_qweather) store.api_host = properties.getAPIHOST_qweather.value;
    if (properties.getcityappid_tianqiapi)
        store.weather_app_id = properties.getcityappid_tianqiapi.value;
    if (properties.getcityappsecret_tianqiapi)
        store.weather_app_secret = properties.getcityappsecret_tianqiapi.value;
    if (properties.getcitykey_visualcrossing)
        store.visual_crossing_key = properties.getcitykey_visualcrossing.value;
    if (properties.weather_updata) store.weather_updata = properties.weather_updata.value;
    if (properties.weather_lang) store.weather_lang = properties.weather_lang.value;
    if (properties.qweatherapi_paymode)
        store.qweather_api_paymode = properties.qweatherapi_paymode.value;

    if (properties.weather_unit) {
        weather.setUnitName(properties.weather_unit.value || 'metric');
    }

    if (properties.weather_daliy_tip) {
        weather.setDailyTip(!!properties.weather_daliy_tip.value, FirstLoad);
    }

    // 坐标 / 城市文本
    if (properties.weather_lat_latitude)
        weather.setLocationField('latitude', String(properties.weather_lat_latitude.value), FirstLoad);
    if (properties.weather_lat_longitude)
        weather.setLocationField(
            'longitude',
            String(properties.weather_lat_longitude.value),
            FirstLoad
        );
    if (properties.weather_CityText)
        weather.setLocationField('cityname', properties.weather_CityText.value, FirstLoad);

    // API 选择
    if (properties.freeapi?.value) weather.setApiChoice(2, FirstLoad);
    if (properties.qweatherapi?.value) weather.setApiChoice(1, FirstLoad);
    if (properties.tianqiapi?.value) weather.setApiChoice(3, FirstLoad);
    if (properties.visualcrossingapi?.value) weather.setApiChoice(4, FirstLoad);
    if (properties.open_meteoapi?.value) weather.setApiChoice(5, FirstLoad);

    // 是否天气
    if (properties.weather_show) {
        const show = properties.weather_show.value === true;
        weather.setVisible(show);
        elements.body.style.setProperty('--weather-visibility', show ? 'visible' : 'hidden');
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
    }

    // 监听天气容器尺寸变化，同步 --weather-height CSS 变量。
    // 圆角公式依赖 --weather-height；不能仅在 weather_roundedcorners 推送时才监听，
    // 否则首屏或后续高度变化（数据加载、降水切换）不会更新，导致 border-radius 失效。
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
