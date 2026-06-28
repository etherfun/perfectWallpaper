<!--
  Weather.vue — 天气组件 (Phase 2)
  替换原 src/weather/* 模块。

  Phase 2 实现策略 — "薄壳包装 + 委托"：
    1. 模板输出空挂载点（实际 DOM 由 index.html 预置的 #weather 提供）
    2. <script setup> 在 onMounted 时调用 propertyHandler 已注册的 init 逻辑：
       - propertyHandlers/weatherPropertyHandler.ts 通过 initSystemMonitor / autoWeather
         在用户启用 weather_show 时调用旧类
    3. Phase 8 验收时决定是否继续深挖（完全替换 5 个 API handler）

  Property → 启动链路（Phase 2 保持原链路）：
    WE → wallpaperPropertyListener.applyUserProperties → handleWeatherProperties
       → config.weather_init_complete=true → debounce(weather_init) 或 autoWeather()
-->
<template>
    <!-- 天气提示工具 + 小时详情 + 预警卡片模板 — 从 index.html 迁移至此处 (Phase 7) -->
    <div id="weatherAlertTooltip" class="weather-tooltip">
        <div class="tooltip-cards-container"></div>
    </div>
    <div id="weatherHourlyTooltip" role="document">
        <div class="popup-main">
            <div>
                <div class="big-icon" id="pIcon">
                    <div id="pIconImg" class="icon-box"></div>
                    <div>
                        <div class="big-temp" id="pTemp">--°</div>
                        <div class="popup-sub" id="pText" data-i18n="weather_tooltip_default_weather">多云</div>
                    </div>
                </div>
            </div>

            <div>
                <div class="details-grid">
                    <div class="detail-item">
                        <div class="detail-label" data-i18n="weather_tooltip_relative_humidity">相对湿度</div>
                        <div class="detail-value" id="pHumidity">--%</div>
                    </div>
                    <div class="detail-item">
                        <div class="detail-label" data-i18n="weather_tooltip_precipitation_rate">降水率 / 降水量</div>
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
                        <div class="detail-label" data-i18n="weather_tooltip_wind_direction">风向 / 角度</div>
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
            <!-- 头部信息 -->
            <div class="tooltip-header">
                <div class="left">
                    <div class="tooltip-title"></div>
                    <div class="sender"></div>
                    <div class="tooltip-time"><span class="text"></span> <span class="state"></span></div>

                    <!-- 事件信息 -->
                    <div class="tooltip-event">
                        <div class="event-severity"><span class="text"></span></div>
                        <div class="event-timing">
                            <span class="start" data-i18n="weather_alert_start_time"><span class="time"></span></span>
                            <br>
                            <span class="end" data-i18n="weather_alert_expect_end_time">
                                <span class="time"></span>
                            </span>
                        </div>
                    </div>
                </div>
                <!--图标-->
                <div class="tooltip-icon"></div>
            </div>

            <!-- 预警信息 -->
            <div class="tooltip-headline"></div>
            <div class="tooltip-description"></div>

            <!-- 预警标准 -->
            <div class="tooltip-criteria"></div>

            <!-- 防范措施 -->
            <div class="tooltip-instructions">
                <strong data-i18n="weather_alert_action"></strong>
                <ol></ol>
            </div>

            <!-- 数据来源 -->
            <div class="tooltip-source"></div>
        </div>
    </template>
</template>

<script setup lang="ts">
/**
 * Phase 2 Weather 薄壳：
 *   - 不在 onMounted 自动启动 weather_init（避免与 propertyHandler 重复触发）
 *   - 仅作为 propertyHandler 注入的接入点 — Phase 6 会改写 propertyHandler
 *     直接操作 useConfigStore / useRuntimeStore，不再 import 旧 weather 模块。
 *
 * 模板输出空挂载点；所有 DOM 由 index.html 预置的 #weather 提供，
 * 旧 src/weather/* 模块 + weatherPropertyHandler 继续负责实际渲染。
 */
import { useConfigStore } from '@/stores/config';

const config = useConfigStore();

// 响应式地反映 user 是否启用天气显示（仅用于 UI 调试）
const enabled = (): boolean => Boolean(config.weather_show);
</script>
