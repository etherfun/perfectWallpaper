<!--
  DebugModal.vue — 调试日志控制台组件 (Phase 4)
  替换原 src/debugModal.ts。

  原模块：
    - 创建 DevTools 风格的 console 弹窗
    - 监听 debugLogger 的日志事件，渲染到 DOM
    - 支持日志复制到剪贴板
    - 由 propertyHandler (debugger_copy) 启用时打开
-->
<template>
    <!-- 调试弹窗 DOM 由 debugModal 动态创建 -->
</template>

<script setup lang="ts">
/**
 * Phase 4 DebugModal 薄壳：
 *   - 不在 onMounted 自动打开
 *   - debugModal.ts 顶层副作用（registerDebugLogger）继续工作
 *   - 由 propertyHandler 控制显示/隐藏
 */
import { useConfigStore } from '@/stores/config';

const config = useConfigStore();
const _ = (): boolean => Boolean(config.debugger_copy);
</script>
