<!--
  PWLine.vue — 折线音频可视化组件 (Phase 3)
  替换原 src/PWLine.ts。

  原模块：
    - 在 #CanLine 上绘制 Canvas 2D 折线音频频谱
    - 暴露 PWLineInit() / setCTXLine() / drawWave()
    - main.ts 启动时调用 PWLineInit()
    - WallpaperEffectController 在 audio 数据到达时调用 drawWave

  Phase 3 薄壳：保留原启动逻辑。
-->
<template>
    <!-- 兼容 #CanLine 容器 — 由 index.html 预置 -->
</template>

<script setup lang="ts">
/**
 * Phase 3 PWLine 薄壳：
 *   - 不在 onMounted 调用 PWLineInit()
 *   - 音频数据流维持原 WallpaperEffectController → 原 PWLine.drawWave 链路
 */
import { useConfigStore } from '@/stores/config';

const config = useConfigStore();
const _ = (): boolean => Boolean(config.PWLine_show_bool);
</script>
