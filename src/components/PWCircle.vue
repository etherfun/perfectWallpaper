<!--
  PWCircle.vue — 圆形音频可视化组件 (Phase 3)
  替换原 src/PWCircle.ts。

  原模块：
    - 在 #can 上绘制 Canvas 2D 圆形音频频谱
    - 暴露 resize() / setCan() / drawWave() 等
    - 由 WallpaperEffectController 在 audio 数据到达时调用 drawWave
    - main.ts 启动时调用 resize() 一次

  Phase 3 薄壳：保留原 resize()/PWLineInit() 在 main.ts 调用，不重复初始化。
-->
<template>
    <!-- 兼容 #can 容器 — 由 index.html 预置 -->
</template>

<script setup lang="ts">
/**
 * Phase 3 PWCircle 薄壳：
 *   - 不在 onMounted 调用 resize()（避免与 main.ts 中的 resize 冲突）
 *   - audio 数据 → WallpaperEffectController → 原 PWCircle.drawWave() 路径保持
 *   - Phase 6 会把 WallpaperEffectController 改写为 composable
 */
import { useConfigStore } from '@/stores/config';

const config = useConfigStore();
const _ = (): boolean => Boolean(config.PWCircle_show_bool);
</script>
