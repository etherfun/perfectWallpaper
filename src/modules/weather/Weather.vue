<!--
  Weather.vue — 天气组件（真 Vue 化）
  替换原 src/weather/* 模块 + index.html 中预置的 #weather 主面板。

  架构：
    - useWeatherStore（Pinia）为唯一状态源，提供 data / address / ui 等响应式状态
    - 模板直接绑定响应式数据，不再使用 elementManager DOM 写入
    - 预警 / 小时详情 tooltip 改为模板驱动（alertTip / hourlyTip ref），
      不再使用命令式 tooltip 模块
    - API 层（qweather/openmeteo 等）为纯函数 fetcher，由 store 编排调用
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
                        {{ data.temperature }}{{ unit.temp || '℃' }}
                    </div>
                    <div class="weather-text" id="weatherText">{{ data.weathernow }}</div>
                    <div v-if="showFeels" class="weather-feels" id="weatherFeels">
                        {{ $t('weather_feels_label') }} {{ data.feels }}{{ unit.temp || '℃' }}
                    </div>
                    <div v-if="showCity" class="weather-city" id="weatherCity">
                        {{ address.cityname }}
                    </div>
                </div>
                <div class="weather-right">
                    <div class="weather-right-content">
                        <!-- 主信息行 -->
                        <div class="weather-main-row">
                            <div class="weather-info-item temp-range" id="weatherTempRange">
                                {{ data.temperature_max }} ~ {{ data.temperature_min }}℃
                            </div>
                            <div
                                v-if="showHumidity"
                                class="weather-info-item humidity"
                                id="weatherHumidity"
                            >
                                {{ $t('weather_humidity_label') }}{{ data.humidity }}%
                            </div>
                            <div class="weather-info-item wind-direction" id="weatherWindDirection">
                                {{ data.wind }}
                            </div>
                            <div
                                v-if="showWindLevel"
                                class="weather-info-item wind-level"
                                id="weatherWindLevel"
                            >
                                {{ data.windLv }}{{ $t('weather_wind_level_label') }}
                            </div>
                            <div
                                v-if="showWindSpeed"
                                class="weather-info-item wind-speed"
                                id="weatherWindSpeed"
                            >
                                {{ data.windSpeed }}{{ unit.wind || 'km/h' }}
                            </div>
                            <div
                                v-if="showVisibility"
                                class="weather-info-item visibility"
                                id="weatherVisibility"
                            >
                                {{ $t('weather_visibility_label') }}{{ data.vis }}{{
                                    unit.vis || 'km'
                                }}
                            </div>
                        </div>
                        <!-- 详情行 -->
                        <div v-if="showDetailRow" class="weather-detail-row" id="weatherDetailRow">
                            <div class="weather-detail-item uv-index" id="weatherUvIndex">
                                {{ $t('weather_uv_label') }}{{ data.uvindex }}
                            </div>
                            <div v-if="showCloud" class="weather-info-item cloud" id="weatherCloud">
                                {{ $t('weather_cloud_label') }}{{ data.cloud }}%
                            </div>
                            <div class="weather-detail-item sunrise" id="weatherSunrise">
                                {{ $t('weather_sunrise_label') }}{{ formatTime(data.sunrise) }}
                            </div>
                            <div class="weather-detail-item sunset" id="weatherSunset">
                                {{ $t('weather_sunset_label') }}{{ formatTime(data.sunset) }}
                            </div>
                            <div
                                v-if="showMoonphase"
                                class="weather-detail-item moonphase"
                                id="weatherMoonphase"
                            >
                                {{ data.moonphase }}
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
                                    <div class="weather-alert-items">
                                        <span
                                            v-for="a in alertItems"
                                            :key="a.alert"
                                            class="weather-alert-item"
                                            :style="{ color: `rgb(${a.color})`, fontWeight: 'bold', marginRight: '10px' }"
                                            :data-id="a.ids.join(',')"
                                            @mouseenter="onAlertEnter($event, a.alert)"
                                            @mousemove="onAlertMove"
                                            @mouseleave="onAlertLeave"
                                        >{{ a.alert }}</span>
                                    </div>
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
                                        @mouseenter="onHourlyEnter($event, i)"
                                        @mousemove="onHourlyMove"
                                        @mouseleave="onHourlyLeave"
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

    <!-- 天气预警 tooltip（模板驱动，结构对齐旧 #weatherAlerttooltipCardTemplate） -->
    <div
        ref="alertTooltipRef"
        id="weatherAlertTooltip"
        class="weather-tooltip"
        :class="{ show: alertTip.show, glow: alertTip.show }"
        :style="{ left: alertTip.pos.left, top: alertTip.pos.top }"
    >
        <div class="tooltip-cards-container">
            <div
                v-for="(a, i) in alertTip.alerts"
                :key="a.id || i"
                class="tooltip-card glow"
                :style="{ '--alert-color': a.color }"
            >
                <div class="tooltip-header">
                    <div class="left">
                        <div class="tooltip-title">{{ a.alert }}</div>
                        <div class="sender">{{ a.sender }}</div>
                        <div class="tooltip-time">
                            <span class="text">{{ formatTime(a.releaseTime, true) }}</span>
                            <span class="state">{{ $t(`weather_alert_${a.status}`) }}</span>
                        </div>
                        <div class="tooltip-event">
                            <div class="event-severity">
                                <span class="text">{{ $t(`weather_alert_severity_${a.level}`) || a.level }}</span>
                            </div>
                            <div class="event-timing">
                                <span class="start" data-i18n="weather_alert_start_time">
                                    <span class="time">{{ formatTime(a.startTime, false) }}</span>
                                </span>
                                <br />
                                <span class="end" data-i18n="weather_alert_expect_end_time">
                                    <span class="time">{{ formatTime(a.endTime, false) }}</span>
                                </span>
                            </div>
                        </div>
                    </div>
                    <div class="tooltip-icon">
                        <template v-if="isIconUrl(alertIconCode(a))"><img :src="alertIconCode(a)" alt="" /></template>
                        <template v-else><span class="tooltip-icon-svg" v-html="alertIconSvg(alertIconCode(a))"></span></template>
                    </div>
                </div>
                <div class="tooltip-headline">{{ a.title }}</div>
                <div class="tooltip-description">{{ a.description }}</div>
                <div class="tooltip-criteria">{{ a.criteria }}</div>
                <div v-if="a.instruction" class="tooltip-instructions">
                    <strong data-i18n="weather_alert_action">{{ $t('weather_alert_action') }}</strong>
                    <ol>
                        <li v-for="(line, li) in a.instruction.split('\n')" :key="li">{{ line }}</li>
                    </ol>
                </div>
                <div class="tooltip-source">{{ a.source }}</div>
            </div>
        </div>
    </div>

    <!-- 小时详情 tooltip（模板驱动） -->
    <div
        ref="hourlyTooltipRef"
        id="weatherHourlyTooltip"
        role="document"
        :class="{ show: hourlyTip.show }"
        :style="{ left: hourlyTip.pos.left, top: hourlyTip.pos.top }"
    >
        <div class="popup-main" v-if="hourlyTip.index >= 0">
            <div>
                <div class="big-icon" id="pIcon">
                    <div id="pIconImg" class="icon-box" v-html="hourlyIconSvg"></div>
                    <div>
                        <div class="big-temp" id="pTemp">
                            {{ data.sevenHourlyData.Temps[hourlyTip.index] || '--' }}{{ unit.temp || '℃' }}
                        </div>
                        <div class="popup-sub" id="pText">
                            {{ data.sevenHourlyData.Texts[hourlyTip.index] }}
                        </div>
                    </div>
                </div>
            </div>
            <div>
                <div class="details-grid">
                    <div class="detail-item">
                        <div class="detail-label" data-i18n="weather_tooltip_relative_humidity">相对湿度</div>
                        <div class="detail-value" id="pHumidity">
                            {{ data.sevenHourlyData.Humidities[hourlyTip.index] || '--' }}%
                        </div>
                    </div>
                    <div class="detail-item">
                        <div class="detail-label" data-i18n="weather_tooltip_precipitation_rate">降水率 / 降水量</div>
                        <div class="detail-value" id="pPrecip">
                            {{ data.sevenHourlyData.Pops[hourlyTip.index] || '--' }} /
                            {{ data.sevenHourlyData.Precips[hourlyTip.index] || '--' }}mm
                        </div>
                    </div>
                    <div class="detail-item">
                        <div class="detail-label" data-i18n="weather_tooltip_pressure">气压</div>
                        <div class="detail-value" id="pPressure">
                            {{ data.sevenHourlyData.Pressures[hourlyTip.index] || '--' }}hPa
                        </div>
                    </div>
                    <div class="detail-item">
                        <div class="detail-label" data-i18n="weather_tooltip_cloud_cover">云量</div>
                        <div class="detail-value" id="pClouds">
                            {{ data.sevenHourlyData.Clouds[hourlyTip.index] || '--' }}%
                        </div>
                    </div>
                    <div class="detail-item">
                        <div class="detail-label" data-i18n="weather_tooltip_dew_point">露点</div>
                        <div class="detail-value" id="pDew">
                            {{ data.sevenHourlyData.Dews[hourlyTip.index] || '--' }}°C
                        </div>
                    </div>
                    <div class="detail-item">
                        <div class="detail-label" data-i18n="weather_tooltip_wind_direction">风向 / 角度</div>
                        <div class="detail-value" id="pWindDir">
                            {{ data.sevenHourlyData.Winds[hourlyTip.index] || '--' }} /
                            {{ data.sevenHourlyData.Wind360s[hourlyTip.index] || '--' }}°
                        </div>
                    </div>
                    <div class="detail-item">
                        <div class="detail-label" data-i18n="weather_tooltip_wind_level">风力等级</div>
                        <div class="detail-value" id="pWindLv">
                            {{ data.sevenHourlyData.WindLvs[hourlyTip.index] || '--' }}
                        </div>
                    </div>
                    <div class="detail-item">
                        <div class="detail-label" data-i18n="weather_tooltip_wind_speed">风速</div>
                        <div class="detail-value" id="pWindSpeed">
                            {{ data.sevenHourlyData.WindSpeeds[hourlyTip.index] || '--' }} m/s
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
/**
 * 天气组件脚本（store 驱动）
 *  - 所有响应式数据 / UI 状态 / 降水切换来自 useWeatherStore
 *  - 条件显示由 config.weather_api_choose 的允许列表 computed 驱动
 *  - 图标 v-html 绑定 getIconSvg() 结果（watch data.icon）— SVG 来源为本地
 *    qweather-icons 资源（受信任），已在 getIconSvg 缓存层限制路径；此处
 *    仅渲染受信任来源，预警 HTML 由 formatters.generateAlertHTML 经
 *    escapeHtml 消毒后产出
 *  - 预警 / 小时详情 tooltip 改为模板驱动（见下方模板）
 */

import { computed, ref, useTemplateRef, watch } from 'vue';
import { storeToRefs } from 'pinia';

import { useConfigStore } from '@/stores/config';

import {
    API_ICUFREE,
    API_OPENMETEO,
    API_QWEATHER,
    API_VISUALCROSSING,
    API_YIKETIANQI,
    EMPTY_ICON_CODE,
} from './constants';
import { getIconSvg, iconSvgPath } from './icons';
import { useWeatherStore } from './store';
import { formatTime } from './utils';
import { tooltipPosition } from './tooltipPosition';

const config = useConfigStore();
const store = useWeatherStore();
// Pinia setup store 返回的 reactive/ref 需用 storeToRefs 保持响应式，直接解构会丢失响应
const { data, address, ui, showTemperatureInsteadOfPrecip } = storeToRefs(store);

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

const unit = computed(() => store.unitConfig);

// tooltip 容器改为模板 ref，避免 document.getElementById 破坏封装/SSR 竞态
const alertTooltipRef = useTemplateRef<HTMLElement>('alertTooltipRef');
const hourlyTooltipRef = useTemplateRef<HTMLElement>('hourlyTooltipRef');

const iconSvg = ref('');
// 预警图标缓存（icon 码 → svg 文本），用于 tooltip 右侧图标
const alertIconCache = ref<Record<string, string>>({});
function isIconUrl(icon: string): boolean {
    return icon.startsWith('http') || icon.startsWith('data:') || icon.startsWith('/');
}
// 解析预警图标码：优先 eventType.code，回退到 icon 字段（QWeather 两者值一致）
function alertIconCode(a: { code: string; icon: string }): string {
    return a.code || a.icon || '';
}
function alertIconSvg(icon: string): string {
    if (!icon || isIconUrl(icon)) return '';
    const cached = alertIconCache.value[icon];
    if (cached !== undefined) return cached;
    // 预警图标仅有普通版（无 -fill），优先取非 fill，失败再试 -fill
    void getIconSvg(iconSvgPath(icon, false)).then(svg => {
        if (svg) {
            alertIconCache.value = { ...alertIconCache.value, [icon]: svg };
        } else {
            void getIconSvg(iconSvgPath(icon, true)).then(svg2 => {
                alertIconCache.value = { ...alertIconCache.value, [icon]: svg2 || '' };
            });
        }
    });
    return '';
}
watch(
    () => data.value.icon,
    async icon => {
        if (!icon) return;
        if (!API_ICON_FETCH.includes(api.value)) return;
        const svg = await getIconSvg(iconSvgPath(icon, true));
        iconSvg.value = svg || (await getIconSvg(iconSvgPath(EMPTY_ICON_CODE, true)));
    },
    { immediate: true }
);

// 预警图标预加载：数据到达即 fetch，对齐主图标 watch(data.value.icon) 模式，
// 避免依赖 hover 时 alertIconCache 响应式重渲染的不确定性
watch(
    () => data.value.weatherAlert,
    alerts => {
        if (!alerts?.length) return;
        if (!API_ICON_FETCH.includes(api.value)) return;
        for (const a of alerts) {
            const code = alertIconCode(a);
            if (!code || alertIconCache.value[code] !== undefined) continue;
            void getIconSvg(iconSvgPath(code, false)).then(svg => {
                if (svg) {
                    alertIconCache.value = { ...alertIconCache.value, [code]: svg };
                } else {
                    void getIconSvg(iconSvgPath(code, true)).then(svg2 => {
                        alertIconCache.value = { ...alertIconCache.value, [code]: svg2 || '' };
                    });
                }
            });
        }
    },
    { immediate: true }
);

const airQualityText = computed(() => store.airQualityText);
// 保留 alertHtml 兼容（若外部仍用），但模板已改 v-for 不再依赖 v-html
const alertHtml = computed(() => store.alertHtml);
const alertItems = computed(() => store.alertItems);
const tip = computed(() => store.tip);
const hourlyIconSvg = computed(() => {
    if (hourlyTip.value.index < 0) return iconSvg.value;
    const code = data.value.sevenHourlyData.Icons[hourlyTip.value.index];
    if (code && alertIconCache.value[code]) return alertIconCache.value[code] as string;
    return iconSvg.value;
});

// 降水/温度切换（直接复用 store 的派生）
const precipLabel = computed(() => store.precipLabel);
const precipLabelKey = computed(() => store.precipLabelKey);
const precipDisplayType = computed(() => store.precipDisplayType);
const precipCellClass = computed(() => store.precipCellClass);
const hourlyTimes = computed(() => store.hourlyTimes);
const hourlyValues = computed(() => store.hourlyValues);

// ===== 模板驱动 tooltip 状态 =====
const alertTip = ref<{ show: boolean; pos: { left: string; top: string }; alerts: typeof data.value.weatherAlert }>(
    { show: false, pos: { left: '0px', top: '0px' }, alerts: [] }
);
const hourlyTip = ref<{ show: boolean; pos: { left: string; top: string }; index: number }>({
    show: false,
    pos: { left: '0px', top: '0px' },
    index: -1,
});

let alertHideTimer: number | null = null;
function onAlertEnter(e: MouseEvent, name: string): void {
    if (alertHideTimer) { clearTimeout(alertHideTimer); alertHideTimer = null; }
    if (name === '' || name === '一切正常') return;
    const matched = data.value.weatherAlert.filter(a => a.alert === name);
    // 旧链路在 mouseenter 时同步驱动图标 fetch 并在 then 中 innerHTML；
    // 这里改为触发缓存，v-html 的二次响应式更新会带出图标，避免首帧空白
    for (const a of matched) {
        // 预警图标使用预警码（eventType.code），与本地 QWeather-Icons 中按码命名的 SVG 一致；
        // 回退到 icon 字段（QWeather 两者值一致），避免 eventType.code 缺失时图标空白
        const icon = alertIconCode(a);
        if (icon && alertIconCache.value[icon] === undefined) {
            void getIconSvg(iconSvgPath(icon, false)).then(svg => {
                if (svg) {
                    alertIconCache.value = { ...alertIconCache.value, [icon]: svg };
                } else {
                    void getIconSvg(iconSvgPath(icon, true)).then(svg2 => {
                        alertIconCache.value = { ...alertIconCache.value, [icon]: svg2 || '' };
                    });
                }
            });
        }
    }
    alertTip.value = {
        show: true,
        pos: tooltipPosition(e, alertTooltipRef.value),
        alerts: matched,
    };
}
function onAlertMove(e: MouseEvent): void {
    if (!alertTip.value.show) return;
    alertTip.value.pos = tooltipPosition(e, alertTooltipRef.value);
}
function onAlertLeave(): void {
    alertTip.value.show = false;
    // 延时 250ms 再清数据，避免鼠标短暂离开再移回时的闪烁（对齐旧 hideTooltipAfter）
    if (alertHideTimer) clearTimeout(alertHideTimer);
    alertHideTimer = window.setTimeout(() => {
        if (!alertTip.value.show) alertTip.value.alerts = [];
        alertHideTimer = null;
    }, 250);
}
function onHourlyEnter(e: MouseEvent, i: number): void {
    const svg = data.value.sevenHourlyData.Icons[i];
    if (svg !== undefined && !alertIconCache.value[svg]) {
        void getIconSvg(iconSvgPath(svg, true)).then(s => {
            alertIconCache.value = { ...alertIconCache.value, [svg]: s || '' };
        });
    }
    hourlyTip.value = {
        show: true,
        pos: tooltipPosition(e, hourlyTooltipRef.value),
        index: i,
    };
}
function onHourlyMove(e: MouseEvent): void {
    if (!hourlyTip.value.show) return;
    hourlyTip.value.pos = tooltipPosition(e, hourlyTooltipRef.value);
}
function onHourlyLeave(): void {
    hourlyTip.value.show = false;
}
</script>
