<!--
  FluidEffect.vue — 流体效果组件 (Stage 5-C2)
  替换原 src/fluid/* 模块（3 文件）。

  原模块：
    - FluidEffect 类管理 WebGL 流体模拟
    - 由 propertyHandler 在 fluidEffectEnabled 变化时启用/禁用
    - 通过 WallpaperEffectController.fluidEffect 引用

  Stage 5-C2 composable wrapper:
    - useFluidEffect() wraps the FluidEffect state machine
    - watches config.fluidEffectEnabled → auto enable/disable
    - auto-cleans on unmount (disable())
    - WebGL rendering stays in src/fluid/effect/* (single source of truth)
-->
<template>
    <!-- 流体 canvas 由原 FluidEffect 在 #fluid-effect 容器创建 — Vue 不重复渲染 -->
</template>

<script setup lang="ts">
/**
 * Stage 5-C2 FluidEffect composable wrapper:
 *   - useFluidEffect() lazy-instantiates FluidEffect.create() on first enable
 *   - watches config.fluidEffectEnabled → toggle the effect
 *   - onBeforeUnmount calls disable() to clean up WebGL resources
 */
import { useFluidEffect } from '@/composables/useFluidEffect';
import { useConfigStore } from '@/stores/config';

const config = useConfigStore();
const fluid = useFluidEffect();

const _ = (): boolean => Boolean(config.fluidEffectEnabled);

defineExpose({
    enable: fluid.enable,
    disable: fluid.disable,
    enableFullscreen: fluid.enableFullscreen,
    disableFullscreen: fluid.disableFullscreen,
    toggle: fluid.toggle,
});
</script>
