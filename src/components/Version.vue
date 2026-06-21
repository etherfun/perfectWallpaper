<!--
  Version.vue — 更新日志弹窗组件 (Phase 4)
  替换原 src/version/* 模块。

  原模块：
    - versionManager 类管理更新日志模态框
    - SimpleMarkdown 解析 changelog
    - 暴露 VERSION_HISTORY_PROMISE / versionConfig

  Phase 4 薄壳：保留原 versionManager 类，由 propertyHandler 在
  wallpaper_updata_open_on_update 启用时打开弹窗。
-->
<template>
    <!-- 更新日志弹窗 DOM 由 versionManager 动态创建 -->
</template>

<script setup lang="ts">
/**
 * Phase 4 Version 薄壳：
 *   - 不在 onMounted 自动打开
 *   - 由 propertyHandler 控制 versionManager.showVersionModal()
 *   - SimpleMarkdown 由旧 simple-markdown.ts 继续提供
 */
import { useConfigStore } from '@/stores/config';

const config = useConfigStore();
const _ = (): boolean => Boolean(config.wallpaper_updata_open_on_update);
</script>
