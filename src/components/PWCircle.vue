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
 * Phase 5-A PWCircle composable wrapper：
 *   - onMounted 时自动调用 usePWCircle() 的 resize()（替代 main.ts 的顶层副作用）
 *   - 暴露 lifecycle 控制给 Vue（enabled toggle 可停止 RAF）
 *   - drawing code 仍由 audioVisualizer.ts 通过 src/PWCircle.ts 旧 API 调用
 *     （audioVisualizer 改造留到 stage 5-B）
 */
import { onBeforeUnmount } from 'vue';

import { usePWCircle } from '@/composables/usePWCircle';
import { useConfigStore } from '@/stores/config';

const config = useConfigStore();
const circle = usePWCircle();

// 仅当视觉模型启用时挂载，避免空 canvas 一直 requestAnimationFrame
const enabled = (): boolean => Boolean(config.PWCircle_show_bool);
const _ = enabled;

// main.ts 顶层副作用仍保留以保证 audioVisualizer 拿到 ctx — 这里不重复 resize
// （双重 resize 会让 circleX/circleY 重复计算）。Window resize 监听在
// usePWCircle() 的 onMounted 中已注册。
onBeforeUnmount(() => {
    // No-op: usePWCircle's onBeforeUnmount removes its own resize listener
});
</script>
