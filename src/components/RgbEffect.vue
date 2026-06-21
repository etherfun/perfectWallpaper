<!--
  RgbEffect.vue — RGB 灯光合成组件 (Phase 3)
  替换原 src/RGB.ts。

  原模块：
    - 把视频/图片/樱花/粒子/音频数据合成为 LED 灯光输出
    - 在 #RGBuse 上绘制（要 100x20 像素）
    - 注册 visibilitychange 监听器
    - 暴露 background2canvas(src, videoORimages)

  Phase 3 薄壳：保留全部副作用，由 WallpaperEffectController / propertyHandler
  控制 background2canvas 调用。
-->
<template>
    <!-- 兼容 #RGBuse 容器 — 由 index.html 预置 -->
</template>

<script setup lang="ts">
/**
 * Phase 3 RgbEffect 薄壳：
 *   - visibilitychange 监听器在 RGB.ts 顶层注册，保留
 *   - background2canvas() 由 WallpaperEffectController 调用
 */
import { useConfigStore } from '@/stores/config';

const config = useConfigStore();
const _ = (): boolean => Boolean(config.rgb_show);
</script>
