<!--
  DockBar.vue — Dock 栏组件 (Phase 2)
  替换原 src/dockbar/* 模块。

  Phase 2 策略同 Weather/SystemMonitor — 薄壳包装 + 委托。
  DockBar 实例由 propertyHandlers/dockbarPropertyHandler.ts 在用户启用
  dockbar_enabled 时调用 initDockBar() 创建。
-->
<template>
    <!-- 兼容 #dock-bar 容器 -->
</template>

<script setup lang="ts">
/**
 * Phase 2 DockBar 薄壳：
 *   - 不自动启动 initDockBar()
 *   - propertyHandler 控制实例生命周期
 *   - Phase 6 重写 propertyHandler 时接入 Pinia store
 */
import { useConfigStore } from '@/stores/config';

const config = useConfigStore();
const _ = (): boolean => Boolean(config.dockbar_enabled);
</script>
