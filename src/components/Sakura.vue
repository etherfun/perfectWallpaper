<!--
  Sakura.vue — 樱花 WebGL 特效组件 (Phase 3)
  替换原 src/sakura/* 模块（10 文件）。

  Phase 3 策略 — 薄壳包装：
    原模块包含：
      - WebGL 上下文初始化
      - GLSL 着色器编译（sakura_point_vsh / sakura_point_fsh / fx_*）
      - requestAnimationFrame 主循环
      - 樱花粒子位置/速度更新
      - 自适应窗口 resize

    Phase 3 仅提供 Vue 入口挂载点。
    实际渲染由 src/sakura/index.ts 的全局副作用（sakuraLoad/sakuraReLoadEffect
    等）继续响应 propertyHandler（visual_audio_model/sakurabackground）触发。

  index.html 预置的 <canvas id="sakura"> / <canvas id="sakurashow">
  与 GLSL 脚本标签 <script id="sakura_point_vsh"> 等保持原状。
-->
<template>
    <!-- 兼容 #sakura / #sakurashow 容器 — 由 index.html 预置 -->
</template>

<script setup lang="ts">
/**
 * Phase 3 Sakura 薄壳：
 *   - 不在 onMounted 自动启动樱花
 *   - 由 propertyHandler 在 showSakura 变化时通过 sakuraLoad/removesakura 控制
 *   - Phase 6 改写为 composable 时挂载到 store 响应
 */
import { useConfigStore } from '@/stores/config';

const config = useConfigStore();
const _ = (): boolean => Boolean(config.showSakura);
</script>
