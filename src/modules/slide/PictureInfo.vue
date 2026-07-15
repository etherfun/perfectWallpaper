<!--
  PictureInfo.vue — 图片信息组件 (Phase 2 顺带迁移的小组件)
  原 src/slide/sources/*.ts 模块负责根据 wallpapermode 显示图片元数据。
  没有专门的 .ts 入口，依赖 propertyHandler (slidePropertyHandler) 触发。

  Phase 2 提供 Vue 入口，propertyHandler 行为不变。
-->
<template>
    <!-- 兼容 #picture_info 或 .pictures-info 容器 -->
</template>

<script setup lang="ts">
import { useConfigStore } from '@/stores/config';

const config = useConfigStore();
// picturesinfo_show 控制图片信息显示
const _ = (): boolean => Boolean(config.picturesinfo_show);
</script>
