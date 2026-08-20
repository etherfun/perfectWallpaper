<!--
  DockBar.vue — Dock 栏组件（真 Vue 化）
  替换原 src/dockbar/* 模块的命令式渲染。

  架构：
    - state.ts 提供 dockbarState 响应式状态（visible / items / iconUrls）
    - renderer.render() 写入 items；DockBar.ts setEnabled 写入 visible
    - 本组件用 v-for 渲染 .dock-item、v-show 控制显示
    - 事件委托（点击打开 / 右键菜单）仍由 DockBar.ts 监听 #dockbar-items，
      通过 .dock-item 的 data-id 定位项目 — 与 v-for 渲染完全兼容
    - 入场动画（animateEntrance）由 DockBar.ts playEntranceAnimation 提供，
      本组件在 nextTick（v-for 挂载）后调用
-->

<template>
    <!-- visible: 原 DockBar.setEnabled() 的 style.display 写入，改 v-show 绑定 -->
    <div id="dockbar" v-show="dockbarState.visible">
        <div class="dockbar-background">
            <div class="dockbar-items" id="dockbar-items">
                <div
                    v-for="item in dockbarState.items"
                    :key="item.id"
                    class="dock-item"
                    :data-id="item.id"
                >
                    <img
                        class="dock-item-icon"
                        :src="iconUrl(item)"
                        :alt="item.name"
                        :title="item.name"
                        @error="onIconError(item)"
                    />
                </div>
            </div>
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
 * 监听器注册与事件委托由 DockBar.ts 负责（DockBar.vue onMounted 触发 init）。
 *
 * 本组件职责：
 *   1. 渲染 <div id="dockbar"> 容器（含 #dockbar-items / #dockbar-add-btn）
 *   2. v-for 渲染 .dock-item（对齐 renderer.render 的 DOM 结构）
 *   3. v-show 绑定 dockbarState.visible（对齐 setEnabled）
 *   4. 图标加载失败时清理缓存重试（对齐 loadPathIcon 的缓存失效重试）
 */
import { nextTick, onMounted } from 'vue';
import { useConfigStore } from '@/stores/config';
import { initDockBar } from '@/modules/dockbar';

import { DEFAULT_ICON, ICON_CACHE_PREFIX, SERVER_URL } from './constants';
import { isDirectIconUrl, resolveIconUrl } from './iconCache';
import { useDockbarStore, setDockIcon } from './store';

const dockbarState = useDockbarStore();
import type { DockItem } from './types';

const config = useConfigStore();

onMounted(async () => {
    const dockbar = initDockBar();
    dockbar.ensureInitialized();

    // 同步 Pinia store 当前值到 DockBar。
    // dockbar_enabled 不在 BUILTIN_DEFAULTS 中，初始为 undefined。
    // 此时用 setEnabled(false) 保持隐藏，等 WE 推送后再更新。
    dockbar.setEnabled(config.dockbar_enabled === true);

    // 等 v-for 渲染完成后播放入场动画
    await nextTick();
    dockbar.playEntranceAnimation();
});

/** 图标 URL：优先异步解析结果；data:/http 直接使用；否则占位图 */
function iconUrl(item: DockItem): string {
    const resolved = dockbarState.iconUrls[item.id];
    if (resolved !== undefined) return resolved;
    if (isDirectIconUrl(item.icon)) return item.icon;
    return DEFAULT_ICON;
}

/** 图标加载失败：path 类型缓存失效时清缓存重取（对齐 loadPathIcon 逻辑） */
function onIconError(item: DockItem): void {
    if (!item.path) return;
    const cacheKey = `${ICON_CACHE_PREFIX}${item.path}`;
    try {
        if (localStorage.getItem(cacheKey) === null) return;
        localStorage.removeItem(cacheKey);
    } catch { return; }
    void resolveIconUrl(item, SERVER_URL).then(url => setDockIcon(item.id, url));
}
</script>
