<!--
  PWParticles.vue — Alice 音频粒子组件 (Phase 3)
  替换原 src/PWParticles.ts。

  原模块：
    - 在 #canvas-particles 上绘制 Canvas 2D 粒子
    - 顶层有 wResize() 调用（W/H/canvas 引用）
    - 音频驱动粒子运动

  Phase 3 薄壳：保留原副作用。
-->
<template>
    <!-- 兼容 #canvas-particles 容器 — 由 index.html 预置 -->
</template>

<script setup lang="ts">
/**
 * Phase 3 PWParticles 薄壳：
 *   - 不在 onMounted 主动初始化
 *   - 原 PWParticles.ts 顶层副作用继续工作
 */
import { useConfigStore } from '@/stores/config';

const config = useConfigStore();
const _ = (): boolean => Boolean(config.visual_audio_model === 3);
</script>
