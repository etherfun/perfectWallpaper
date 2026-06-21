<!--
  PlayerControl.vue — 媒体播放控制组件 (Phase 2)
  替换原 src/player_control/* 模块。

  特殊性：
    player_control/bootstrap.ts 在 import 时立刻注册 4 个 wallpaperRegisterMedia*
    监听器（无 new 类、无构造副作用）。这意味着：
      - SFC 自身不需要主动 mount 任何东西
      - 监听器已在 bundle.ts import './player_control' 时注册
      - Phase 2 仅提供 Vue 包装入口，便于 Phase 6 接入 store

  实际渲染：index.html 预置的 #player_control 由旧 titleDisplay/audioBar
  /playbackState 模块响应 window event 后填充。
-->
<template>
    <!-- 兼容 #player_control 容器 -->
</template>

<script setup lang="ts">
/**
 * Phase 2 PlayerControl 薄壳：
 *   - 不主动注册监听器（已在 bundle.ts 阶段由 bootstrap.ts 注册）
 *   - Phase 6 改写为 useWEMediaEvents composable 时会迁移到这里
 */
import { onBeforeUnmount } from 'vue';

import { useConfigStore } from '@/stores/config';

const config = useConfigStore();
const _ = (): boolean => Boolean(config.player_control_show);

onBeforeUnmount(() => {
    // Phase 6 之前：监听器由 bootstrap.ts 注册，全局生效，无需卸载
    // Phase 6 之后：在此处清理 composable 注册的监听器
});
</script>
