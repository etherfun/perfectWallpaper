<!--
  FluidEffect.vue — 流体效果组件 (Phase 3)
  替换原 src/fluid/* 模块（3 文件）。

  原模块：
    - FluidEffect 类管理 WebGL 流体模拟
    - 由 propertyHandler 在 fluidEffectEnabled 变化时启用/禁用
    - 通过 WallpaperEffectController.fluidEffect 引用

  Phase 3 薄壳：保留原 FluidEffect 类。
-->
<template>
    <!-- 流体 canvas 由原 FluidEffect 在 #fluid-effect 容器创建 — Vue 不重复渲染 -->
</template>

<script setup lang="ts">
/**
 * Phase 3 FluidEffect 薄壳：
 *   - 不在 onMounted 主动创建 FluidEffect 实例
 *   - 由 propertyHandler 控制启用 / 禁用
 */
import { useConfigStore } from '@/stores/config';

const config = useConfigStore();
const _ = (): boolean => Boolean(config.fluidEffectEnabled);
</script>
