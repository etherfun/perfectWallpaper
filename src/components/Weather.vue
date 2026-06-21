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
    <!-- 兼容 #weather 容器：Vue 不重新渲染 DOM，让旧 weatherPropertyHandler 控制其内容 -->
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
