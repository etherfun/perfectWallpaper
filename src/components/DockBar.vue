<!--
  DockBar.vue — Dock 栏组件 (Phase 2)
  替换原 src/dockbar/* 模块。

  与原 src/dockbar/*（命令式模块）的契约：
    - 必须存在 <div id="dockbar"> + .dockbar-background + #dockbar-items，
      否则 renderer.queryDomElements() 返回 null，DockBar 无法初始化。
    - 本组件渲染容器结构，命令式模块在其中追加/管理 .dock-item 元素。
-->
<template>
    <div id="dockbar">
        <div class="dockbar-background">
            <div class="dockbar-items" id="dockbar-items"></div>
            <button class="dockbar-add-btn" id="dockbar-add-btn" title="添加项目">
                <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
                </svg>
            </button>
        </div>
    </div>
</template>

<script setup lang="ts">
/**
 * Phase 2 DockBar 薄壳：
 *   - 不自动启动 initDockBar()
 *   - propertyHandler 控制实例生命周期
 *   - 本组件仅渲染必要的容器 DOM，由命令式模块填充
 */
import { useConfigStore } from '@/stores/config';

const config = useConfigStore();
void config;
</script>
