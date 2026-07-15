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
    <!-- 樱花 canvas — 从 index.html 迁移至此处 (Phase 7) -->
    <!-- v-show 由 Vue 响应式控制 display，比命令式 DOM 操作更可靠 -->
    <canvas id="sakura" style="visibility: hidden;" v-show="config.showSakura"></canvas>
    <canvas id="sakurashow" v-show="config.showSakura"></canvas>
    <!-- GLSL shader scripts 保留在 index.html — Vue SFC 编译器无法处理 script 标签内的 GLSL 内容 -->
</template>

<script setup lang="ts">
/**
 * Stage 5-C2 Sakura composable wrapper:
 *   - useSakura() handles transparency sync + showSakura toggle watching
 *   - exposes load/reloadEffect/resize/copyToDisplay for parent / debug
 *   - WebGL scene + RAF loop remains owned by src/sakura/* (single source)
 *
 * Phase 7 时序修复：canvas 元素从 index.html 迁移至本模板，不再随 DOM 就绪存在。
 * window.load 可能在 Vue mount 前触发，导致 sakuraLoad() 找不到 canvas 元素。
 * 在 onMounted 中检测 gl 状态并手动启动。
 */
import { onMounted } from 'vue';

import { makeCanvasHide, sakuraLoad } from '@/modules/sakura';
import { gl as sakuraGl } from '@/modules/sakura/state';
import { useSakura } from '@/modules/sakura/useSakura';
import { useConfigStore } from '@/stores/config';

const config = useConfigStore();
const sakura = useSakura();

const _ = (): boolean => Boolean(config.showSakura);

// 确保 WebGL 初始化：如果 window.load 已在 Vue mount 前触发，
// initSakura() 注册的 load 监听器找不到 canvas 元素。这里补一次。
// 必须尊重 showSakura 配置——关闭时不启动。
onMounted(() => {
    // 防重入：gl 已初始化则跳过（property handler 已启动 WebGL）
    if (sakuraGl) return;

    if (config.showSakura) {
        sakuraLoad();
    } else {
        // showSakura 关闭时确保 canvas 隐藏（useSakuraProperties 的 hide 逻辑
        // 可能在 canvas 不存在时跳过）。
        const canvas = document.getElementById('sakura') as HTMLCanvasElement | null;
        const canvasshow = document.getElementById('sakurashow') as HTMLCanvasElement | null;
        if (canvas && canvasshow) {
            makeCanvasHide(canvas, canvasshow);
        }
    }
});

defineExpose({
    load: sakura.load,
    reloadEffect: sakura.reloadEffect,
    resize: sakura.resize,
    copyToDisplay: sakura.copyToDisplay,
});
</script>
