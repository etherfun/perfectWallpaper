<!--
  Background.vue — 背景切换组件 (Phase 5)
  替换原 src/slide/* (5 文件) + src/video.ts。

  原模块：
    - slide.changeBackground() 按 wallpapermode 切换
    - 9 种 wallpapermode 各自数据源 (Bing/NASA/Picsum/次元/Windows 聚焦...)
    - video.ts 控制 <video> / <audio> 元素

  Phase 5 薄壳：保留全部原模块，由 propertyHandler (backgroundPropertyHandler)
  在 wallpapermode 变化时调用 changeBackground()。
-->
<template>
    <!-- #background-container / #background-layer1/2 / <video> / <audio> 由 index.html 预置 -->
</template>

<script setup lang="ts">
/**
 * Phase 5 Background 薄壳：
 *   - 不在 onMounted 主动切换
 *   - 由 backgroundPropertyHandler 在 wallpapermode 变化时调用 slide.changeBackground()
 */
import { useConfigStore } from '@/stores/config';

const config = useConfigStore();
const _ = (): number => Number(config.wallpapermode ?? 1);
</script>
