<!--
  SystemMonitor.vue — 系统监控组件 (Phase 2)
  替换原 src/systemMonitor/* 模块。

  Phase 2 策略同 Weather.vue — 薄壳包装 + 委托。
  实际 SystemMonitor 实例由 propertyHandlers/systemMonitorPropertyHandler.ts
  在用户启用 sysmon_enabled 时调用 initSystemMonitor() 创建。
-->
<template>
    <!-- 兼容 #system-monitor 容器 -->
</template>

<script setup lang="ts">
/**
 * Phase 2 SystemMonitor 薄壳：
 *   - 不自动启动 initSystemMonitor()
 *   - propertyHandler 控制实例生命周期
 *   - Phase 6 重写 propertyHandler 时接入 Pinia store
 */
import { useConfigStore } from '@/stores/config';

const config = useConfigStore();

// enabled 标记仅用于调试
const _ = (): boolean => Boolean(config.sysmon_enabled);
</script>
