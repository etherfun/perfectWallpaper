<!--
  PWParticles.vue — Alice 音频粒子组件 (Stage 5-C1)
  替换原 src/PWParticles.ts。

  原模块：
    - 在 #canvas-particles 上绘制 Canvas 2D 粒子
    - 顶层有 wResize() 调用（W/H/canvas 引用）
    - 音频驱动粒子运动

  Stage 5-C1 composable wrapper:
    - usePWParticles() owns resize listener + RAF lifecycle (mount/unmount)
    - exposes start/stop/createPoint/draw/connect passthroughs
    - drawing code stays in src/PWParticles.ts (single source of truth)
-->
<template>
    <!-- Alice 音频粒子 canvas — 从 index.html 迁移至此处 (Phase 7) -->
    <canvas id="canvas-particles"></canvas>
</template>

<script setup lang="ts">
import { usePWParticles } from './usePWParticles';
import { useConfigStore } from '@/stores/config';

const config = useConfigStore();
const particles = usePWParticles();

const _ = (): boolean => Boolean(config.visual_audio_model === 3);

defineExpose({
    start: particles.start,
    stop: particles.stop,
    resize: particles.resize,
});
</script>
