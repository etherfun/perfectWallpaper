<!--
  Sakura.vue — 樱花 WebGL 特效组件 (Stage 5-C2)
  替换原 src/sakura/* 模块（10 文件）。

  原模块包含：
    - WebGL 上下文初始化
    - GLSL 着色器编译（sakura_point_vsh / sakura_point_fsh / fx_*）
    - requestAnimationFrame 主循环
    - 樱花粒子位置/速度更新
    - 自适应窗口 resize

  Stage 5-C2 composable wrapper:
    - useSakura() exposes load/reloadEffect/resize/copyToDisplay/
      applyTransparency as Vue API
    - watches showSakura + sakura_transparency for reactive sync
    - WebGL drawing stays in src/sakura/* (single source of truth)
    - propertyHandler continues to drive sakuraLoad/removesakura via
      the legacy module (no behavior change)

  index.html 预置的 <canvas id="sakura"> / <canvas id="sakurashow">
  与 GLSL 脚本标签 <script id="sakura_point_vsh"> 等保持原状。
-->
<template>
    <!-- 兼容 #sakura / #sakurashow 容器 — 由 index.html 预置 -->
</template>

<script setup lang="ts">
/**
 * Stage 5-C2 Sakura composable wrapper:
 *   - useSakura() handles transparency sync + showSakura toggle watching
 *   - exposes load/reloadEffect/resize/copyToDisplay for parent / debug
 *   - WebGL scene + RAF loop remains owned by src/sakura/* (single source)
 */
import { useSakura } from '@/composables/useSakura';
import { useConfigStore } from '@/stores/config';

const config = useConfigStore();
const sakura = useSakura();

const _ = (): boolean => Boolean(config.showSakura);

defineExpose({
    load: sakura.load,
    reloadEffect: sakura.reloadEffect,
    resize: sakura.resize,
    copyToDisplay: sakura.copyToDisplay,
});
</script>
