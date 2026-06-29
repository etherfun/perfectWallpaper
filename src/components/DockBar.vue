<!--
  DockBar.vue — Dock 栏组件 (Phase 2)
  替换原 src/dockbar/* 模块。

  与原 src/dockbar/*（命令式模块）的契约：
    - 必须存在 <div id="dockbar"> + .dockbar-background + #dockbar-items，
      否则 renderer.queryDomElements() 返回 null，DockBar 无法初始化。
    - 本组件渲染容器结构，命令式模块在其中追加/管理 .dock-item 元素。
-->
<template>
    <div id="dockbar" v-show="config.dockbar_enabled !== false">
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
 *   - 渲染容器 DOM，由命令式 DockBar 类填充内容
 *   - onMounted 中延时初始化 DockBar——确保 Vue 模板 DOM 已就绪
 *     之后才调用 ensureInitialized()，解决 WE 提前推送属性时
 *     queryDomElements 返回 null 的问题。
 *   - 初始化后从 Pinia store 读取当前配置同步到 DockBar 实例。
 */
import { onMounted } from 'vue';
import { useConfigStore } from '@/stores/config';
import { getDockBar, initDockBar } from '@/dockbar';

const config = useConfigStore();

onMounted(() => {
    const dockbar = initDockBar();
    dockbar.ensureInitialized();

    // 同步 Pinia store 当前值到 DockBar（WE 在 Vue mount 前推送的属性已在
    // useWallpaperProperties 包装器中写入 store，但 dockbar.init() 用的是
    // DEFAULT_CONFIG，需覆盖为 store 中的值）
    if (config.dockbar_enabled !== undefined) {
        dockbar.setEnabled(config.dockbar_enabled);
    }
});
</script>
