<!--
  FullscreenLyrics.vue — 全屏歌词组件 (Phase 4)
  替换原 src/fullscreenLyrics/* 模块（10 文件）。

  原模块：
    - FullscreenLyrics 类管理 SMTC / WebSocket 歌词获取
    - lyricsRenderer 渲染歌词（当前/前一句/后一句）
    - wordHighlight 字级别高亮
    - visibility 控制可见性
    - 由 propertyHandler (fullscreen_lyrics_enabled) 启用时启动

  Phase 4 薄壳：保留全部模块，由 propertyHandler 控制启用。
-->
<template>
    <!-- 全屏歌词容器 DOM 由 FullscreenLyrics 类动态创建 -->
</template>

<script setup lang="ts">
import { useConfigStore } from '@/stores/config';

const config = useConfigStore();
const _ = (): boolean => Boolean(config.fullscreen_lyrics_enabled);
</script>
