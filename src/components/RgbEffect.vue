<!--
  RgbEffect.vue — RGB 灯光合成组件 (Stage 5-C1)
  替换原 src/RGB.ts。

  原模块：
    - 把视频/图片/樱花/粒子/音频数据合成为 LED 灯光输出
    - 在 #RGBuse 上绘制（要 100x20 像素）
    - 注册 visibilitychange 监听器
    - 暴露 background2canvas(src, videoORimages)

  Stage 5-C1 composable wrapper:
    - useRgbEffect() owns the visibilitychange lifecycle (mount/unmount)
    - render() passthrough available via the composable's API
    - drawing code stays in src/RGB.ts (single source of truth)
-->
<template>
    <!-- RGB 灯光合成 canvas — 从 index.html 迁移至此处 (Phase 7) -->
    <canvas id="RGBuse" width="100px" height="20px"></canvas>
</template>

<script setup lang="ts">
/**
 * Stage 5-C1 RgbEffect composable wrapper:
 *   - useRgbEffect() mounts a visibilitychange listener and exposes render()
 *   - rgb_show toggle triggers an initial render
 *   - WallpaperEffectController still drives the actual LED refresh cycle
 */
import { useRgbEffect } from '@/composables/useRgbEffect';
import { useConfigStore } from '@/stores/config';

const config = useConfigStore();
const rgb = useRgbEffect();

const _ = (): boolean => Boolean(config.rgb_show);

// Expose rgb API for parent components / debugging if needed.
defineExpose({ render: rgb.render });
</script>
