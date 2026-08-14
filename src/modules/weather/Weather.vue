<!--
  Weather.vue — 天气组件（真 Vue 化）
  替换原 src/weather/* 模块 + index.html 中预置的 #weather 主面板。

  架构：
    - weatherState.ts 提供响应式 weather_data / weather_address / weatherUiState
    - 模板直接绑定响应式数据，不再使用 elementManager DOM 写入
    - API 层（qweather/openmeteo 等）与 WE 属性链路保持原样
-->

<template>
    <div id="weather" v-show="ui.visible">
        <div class="weather-container">
            <!-- 加载 / 错误状态 -->
            <div v-if="ui.loading" class="weather-loading">{{ $t('weather_loading') }}</div>
            <div v-else-if="ui.error" class="weather-error" style="color: #ff6b6b">
                {{ ui.error }}
            </div>

            <template v-else>
                <div class="weather-left">
                    <div class="weather-icon" id="weatherIcon" v-html="iconSvg"></div>
                    <div class="weather-temp" id="weatherTemp">
                        {{ weather_data.temperature }}{{ unit.temp || '℃' }}
                    </div>
                    <div class="weather-text" id="weatherText">{{ weather_data.weathernow }}</div>
                    <div v-if="showFeels" class="weather-feels" id="weatherFeels">
                        {{ $t('weather_feels_label') }} {{ weather_data.feels }}{{ unit.temp || '℃' }}
                    </div>
                    <div v-if="showCity" class="weather-city" id="weatherCity">
                        {{ weather_address.cityname }}
                    </div>
                </div>
                <div class="weather-right">
                    <div class="weather-right-content">
                        <!-- 主信息行 -->
                        <div class="weather-main-row">
                            <div class="weather-info-item temp-range" id="weatherTempRange">
                                {{ weather_data.temperature_max }} ~ {{ weather_data.temperature_min }}℃
                            </div>
                            <div
                                v-if="showHumidity"
                                class="weather-info-item humidity"
                                id="weatherHumidity"
                            >
                                {{ $t('weather_humidity_label') }}{{ weather_data.humidity }}%
                            </div>
                            <div class="weather-info-item wind-direction" id="weatherWindDirection">
                                {{ weather_data.wind }}
                            </div>
                            <div
                                v-if="showWindLevel"
                                class="weather-info-item wind-level"
                                id="weatherWindLevel"
                            >
                                {{ weather_data.windLv }}{{ $t('weather_wind_level_label') }}
                            </div>
                            <div
                                v-if="showWindSpeed"
                                class="weather-info-item wind-speed"
                                id="weatherWindSpeed"
                            >
                                {{ weather_data.windSpeed }}{{ unit.wind || 'km/h' }}
                            </div>
                            <div
                                v-if="showVisibility"
                                class="weather-info-item visibility"
                                id="weatherVisibility"
                            >
                                {{ $t('weather_visibility_label') }}{{ weather_data.vis }}{{
                                    unit.vis || 'km'
                                }}
                            </div>
                        </div>
                        <!-- 详情行 -->
                        <div v-if="showDetailRow" class="weather-detail-row" id="weatherDetailRow">
                            <div class="weather-detail-item uv-index" id="weatherUvIndex">
                                {{ $t('weather_uv_label') }}{{ weather_data.uvindex }}
                            </div>
                            <div v-if="showCloud" class="weather-info-item cloud" id="weatherCloud">
                                {{ $t('weather_cloud_label') }}{{ weather_data.cloud }}%
                            </div>
                            <div class="weather-detail-item sunrise" id="weatherSunrise">
                                {{ $t('weather_sunrise_label') }}{{ formatTime(weather_data.sunrise) }}
                            </div>
                            <div class="weather-detail-item sunset" id="weatherSunset">
                                {{ $t('weather_sunset_label') }}{{ formatTime(weather_data.sunset) }}
                            </div>
                            <div
                                v-if="showMoonphase"
                                class="weather-detail-item moonphase"
                                id="weatherMoonphase"
                            >
                                {{ weather_data.moonphase }}
                            </div>
                        </div>
                        <!-- 空气质量 / 预警行 -->
                        <div v-if="showAirRow" class="weather-air-row" id="weatherAirRow">
                            <div class="weather-air-item air-quality" id="weatherAirQuality">
                                {{ $t('weather_air_quality_label') }}
                            </div>
                            <div class="weather-air-item air-value" id="weatherAirValue">
                                {{ airQualityText }}
                            </div>
                            <div
                                v-if="alertHtml"
                                class="weather-alert-container"
                                id="weatherAlertContainer"
                            >
                                {{ $t('weather_alert_label') }}
                                <div class="weather-alert-items-warp">
                                    <div class="weather-alert-items" v-html="alertHtml"></div>
                                </div>
                            </div>
                        </div>
                        <!-- 降水/温度切换容器 -->
                        <div v-if="showPrecip" class="weather-precip-container" id="weatherPrecipContainer">
                            <div
                                class="precip-label"
                                id="weatherPrecipLabel"
                                :data-display-type="precipDisplayType"
                                :data-i18n="precipLabelKey"
                            >
                                {{ precipLabel }}
                            </div>
                            <div class="precip-content">
                                <div class="precip-times" id="weatherPrecipTimes">
                                    <span
                                        v-for="(t, i) in hourlyTimes"
                                        :key="'t' + i"
                                        class="precip-time-cell"
                                    >
                                        {{ t }}
                                    </span>
                                </div>
                                <div class="precip-values" id="weatherPrecipValues">
                                    <span
                                        v-for="(v, i) in hourlyValues"
                                        :key="'v' + i"
                                        class="precip-prob-cell"
                                        :class="precipCellClass"
                                    >
                                        {{ v }}
                                    </span>
                                </div>
                            </div>
                        </div>
                        <!-- 每日提示 -->
                        <div
                            v-if="tip"
                            class="weather-tip"
                            id="weatherTip"
                        >
                            {{ tip }}
                        </div>
                    </div>
                </div>
            </template>
        </div>
    </div>

    <!-- 天气预警 tooltip -->
    <div id="weatherAlertTooltip" class="weather-tooltip">
        <div class="tooltip-cards-container"></div>
    </div>

    <!-- 小时详情 tooltip -->
    <div id="weatherHourlyTooltip" role="document">
        <div class="popup-main">
            <div>
                <div class="big-icon" id="pIcon">
                    <div id="pIconImg" class="icon-box"></div>
                    <div>
                        <div class="big-temp" id="pTemp">--°</div>
                        <div class="popup-sub" id="pText" data-i18n="weather_tooltip_default_weather">
                            多云
                        </div>
                    </div>
                </div>
            </div>
            <div>
                <div class="details-grid">
                    <div class="detail-item">
                        <div class="detail-label" data-i18n="weather_tooltip_relative_humidity">
                            相对湿度
                        </div>
                        <div class="detail-value" id="pHumidity">--%</div>
                    </div>
                    <div class="detail-item">
                        <div class="detail-label" data-i18n="weather_tooltip_precipitation_rate">
                            降水率 / 降水量
                        </div>
                        <div class="detail-value" id="pPrecip">-- mm</div>
                    </div>
                    <div class="detail-item">
                        <div class="detail-label" data-i18n="weather_tooltip_pressure">气压</div>
                        <div class="detail-value" id="pPressure">-- hPa</div>
                    </div>
                    <div class="detail-item">
                        <div class="detail-label" data-i18n="weather_tooltip_cloud_cover">云量</div>
                        <div class="detail-value" id="pClouds">--%</div>
                    </div>
                    <div class="detail-item">
                        <div class="detail-label" data-i18n="weather_tooltip_dew_point">露点</div>
                        <div class="detail-value" id="pDew">--°C</div>
                    </div>
                    <div class="detail-item">
                        <div class="detail-label" data-i18n="weather_tooltip_wind_direction">
                            风向 / 角度
                        </div>
                        <div class="detail-value" id="pWindDir">— / —°</div>
                    </div>
                    <div class="detail-item">
                        <div class="detail-label" data-i18n="weather_tooltip_wind_level">风力等级</div>
                        <div class="detail-value" id="pWindLv">—</div>
                    </div>
                    <div class="detail-item">
                        <div class="detail-label" data-i18n="weather_tooltip_wind_speed">风速</div>
                        <div class="detail-value" id="pWindSpeed">— m/s</div>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <template id="weatherAlerttooltipCardTemplate">
        <div class="tooltip-card">
            <div class="tooltip-header">
                <div class="left">
                    <div class="tooltip-title"></div>
                    <div class="sender"></div>
                    <div class="tooltip-time"><span class="text"></span> <span class="state"></span></div>
                    <div class="tooltip-event">
                        <div class="event-severity"><span class="text"></span></div>
                        <div class="event-timing">
                            <span class="start" data-i18n="weather_alert_start_time">
                                <span class="time"></span>
                            </span>
                            <br />
                            <span class="end" data-i18n="weather_alert_expect_end_time">
                                <span class="time"></span>
                            </span>
                        </div>
                    </div>
                </div>
                <div class="tooltip-icon"></div>
            </div>
            <div class="tooltip-headline"></div>
            <div class="tooltip-description"></div>
            <div class="tooltip-criteria"></div>
            <div class="tooltip-instructions">
                <strong data-i18n="weather_alert_action"></strong>
                <ol></ol>
            </div>
            <div class="tooltip-source"></div>
        </div>
    </template>
</template>

<script setup lang="ts">
/**
 * 真 Vue 化脚本：
 *  - weather_data / weather_address / weatherUiState 来自 weatherState（reactive）
 *  - 条件显示由 config.weather_api_choose 的允许列表 computed 驱动
 *  - 图标 v-html 绑定 getIconSvg() 结果（watch weather_data.icon）
 *  - tooltip / 预警卡片等仍由命令式模块管理（保持原行为）
 */

import { computed, ref, watch } from 'vue';

import { useConfigStore } from '@/stores/config';
import { globalT } from '@/utils/i18n';

import { getAirQualityText, generateAlertHTML } from './formatters';
import {
    API_ICUFREE,
    API_OPENMETEO,
    API_QWEATHER,
    API_VISUALCROSSING,
    API_YIKETIANQI,
    EMPTY_ICON_CODE,
} from './constants';
import { getIconSvg, iconSvgPath } from './index';
import { getWeatherTips } from './tips';
import { formatTime } from './utils';
import {
    getWeatherUnit,
    showTemperatureInsteadOfPrecip,
    weather_address,
    weather_data,
    weatherUiState,
} from './weatherState';

const config = useConfigStore();
const ui = weatherUiState;

// 允许列表常量（与原 updaters.ts 保持一致）
const API_WITH_FEELS = [API_QWEATHER, API_YIKETIANQI, API_VISUALCROSSING, API_OPENMETEO];
const API_WITH_CITY = [API_QWEATHER, API_ICUFREE, API_YIKETIANQI, API_VISUALCROSSING];
const API_WITH_HUMIDITY = [API_QWEATHER, API_YIKETIANQI, API_VISUALCROSSING, API_OPENMETEO];
const API_WITH_WIND_LEVEL = [API_QWEATHER, API_ICUFREE];
const API_WITH_WIND_SPEED = [API_QWEATHER, API_YIKETIANQI, API_VISUALCROSSING, API_OPENMETEO];
const API_WITH_VISIBILITY = [API_QWEATHER];
const API_WITH_DETAIL = [API_QWEATHER, API_YIKETIANQI, API_VISUALCROSSING, API_OPENMETEO];
const API_WITH_CLOUD = [API_QWEATHER, API_VISUALCROSSING, API_OPENMETEO];
const API_WITH_MOON = [API_QWEATHER, API_VISUALCROSSING];
const API_WITH_AIR = [API_QWEATHER, API_ICUFREE, API_YIKETIANQI];
const API_WITH_PRECIP = [API_QWEATHER, API_VISUALCROSSING, API_OPENMETEO];
const API_ICON_FETCH = [API_QWEATHER, API_VISUALCROSSING, API_OPENMETEO];

const api = computed(() => config.weather_api_choose ?? 0);

const showFeels = computed(() => API_WITH_FEELS.includes(api.value));
const showCity = computed(() => API_WITH_CITY.includes(api.value));
const showHumidity = computed(() => API_WITH_HUMIDITY.includes(api.value));
const showWindLevel = computed(() => API_WITH_WIND_LEVEL.includes(api.value));
const showWindSpeed = computed(() => API_WITH_WIND_SPEED.includes(api.value));
const showVisibility = computed(() => API_WITH_VISIBILITY.includes(api.value));
const showDetailRow = computed(() => API_WITH_DETAIL.includes(api.value));
const showCloud = computed(() => API_WITH_CLOUD.includes(api.value));
const showMoonphase = computed(() => API_WITH_MOON.includes(api.value));
const showAirRow = computed(() => API_WITH_AIR.includes(api.value));
const showPrecip = computed(() => API_WITH_PRECIP.includes(api.value));

const unit = computed(() => getWeatherUnit());

const iconSvg = ref('');
watch(
    () => weather_data.icon,
    async icon => {
        if (!icon) return;
        if (!API_ICON_FETCH.includes(api.value)) return;
        const svg = await getIconSvg(iconSvgPath(icon, true));
        if (svg) {
            iconSvg.value = svg;
        } else {
            iconSvg.value = await getIconSvg(iconSvgPath(EMPTY_ICON_CODE, true));
        }
    },
    { immediate: true }
);

const airQualityText = computed(() => getAirQualityText(weather_data.air));
const alertHtml = computed(() => generateAlertHTML());
const tip = computed(() => (config.weather_daily_tip ? getWeatherTips(weather_data) : ''));

// 降水/温度切换
const precipLabel = computed(() =>
    showTemperatureInsteadOfPrecip.value
        ? globalT('weather_show_temperature')
        : globalT('weather_show_precipprob')
);
const precipLabelKey = computed(() =>
    showTemperatureInsteadOfPrecip.value ? 'weather_show_temperature' : 'weather_show_precipprob'
);
const precipDisplayType = computed(() =>
    showTemperatureInsteadOfPrecip.value ? 'temperature' : 'precipitation'
);
const precipCellClass = computed(() =>
    showTemperatureInsteadOfPrecip.value ? 'precip-temp-cell' : 'precip-prob-cell'
);
const hourlyTimes = computed(() => weather_data.sevenHourlyData.Times);
const hourlyValues = computed(() => {
    const data = showTemperatureInsteadOfPrecip.value
        ? weather_data.sevenHourlyData.Temps
        : weather_data.sevenHourlyData.Pops;
    const u = showTemperatureInsteadOfPrecip.value ? unit.value.temp || '℃' : '';
    return data.map((v, i) => `${v || '--'}${u}`);
});
</script>
