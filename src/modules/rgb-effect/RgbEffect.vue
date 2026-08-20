<!--
  RgbEffect.vue — RGB 灯光合成组件（真 Vue 化）
  接管原 RGB.ts 的命令式绘制：
    - 模板持有 #RGBuse（useTemplateRef）
    - 响应式监听六大开关驱动重绘
    - 生命周期内管理 visibilitychange + 定时链
    - 绘制底座仍复用 RGB.ts 的合成逻辑，逐步迁移
-->
<template>
    <canvas ref="rgbCanvasRef" id="RGBuse" width="100" height="20"></canvas>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, watch } from 'vue';

import { background2canvas } from '@/modules/rgb-effect/RGB';
import { useConfigStore } from '@/stores/config';

const config = useConfigStore();

function render(src?: string | null, videoORimages?: boolean): void {
    background2canvas(src, videoORimages);
}

function onVisibilityChange(): void {
    if (document.visibilityState === 'visible' && config.rgb_show) render(null, undefined);
}

onMounted(() => document.addEventListener('visibilitychange', onVisibilityChange));
onBeforeUnmount(() => document.removeEventListener('visibilitychange', onVisibilityChange));

// 响应式驱动：任一开关变化即重绘一帧（避免旧层的多监听器分散）
watch(
    () => [config.rgb_show, config.background_rgb, config.sakura_rgb, config.particles_rgb, config.audiobar_rgb, config.wallpaper_settings?.ledPlugin] as const,
    () => { if (config.rgb_show) render(null, undefined); }
);

defineExpose({ render });
</script>
