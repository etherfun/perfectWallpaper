/**
 * Dock 栏响应式状态（真 Vue 化）
 *
 * renderer.render() 由「命令式创建 .dock-item DOM」改为「写入本状态」，
 * DockBar.vue 模板用 v-for 渲染 .dock-item。
 *
 * 保留的 DOM 写入：
 *   - 位置/CSS 变量/背景样式（configApply）— 样式层
 *   - 入场动画（animateEntrance）— 操作渲染后的 .dock-item inline style
 */
import { reactive } from 'vue';

import type { DockItem } from './types';

/** Dock 栏响应式状态（DockBar.vue 模板绑定） */
export const dockbarState = reactive({
    /** 是否显示（原 #dockbar style.display 写入，setEnabled 控制） */
    visible: false,
    /** 项目列表（原 render() 渲染到 #dockbar-items） */
    items: [] as DockItem[],
    /** 图标 URL 映射（key = item.id；异步解析完成后写入） */
    iconUrls: {} as Record<string, string>,
});

/** 设置项目列表（原 render 的职责） */
export function setDockItems(items: DockItem[]): void {
    dockbarState.items = [...items];
}

/** 设置 Dock 栏可见性（原 setEnabled 的 style.display 写入） */
export function setDockVisible(visible: boolean): void {
    dockbarState.visible = visible;
}

/** 设置某个项目的最终图标 URL（模板 :src 绑定） */
export function setDockIcon(itemId: string, url: string): void {
    dockbarState.iconUrls[itemId] = url;
}
