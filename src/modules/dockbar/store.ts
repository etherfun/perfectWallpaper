/**
 * Dock 栏 — Pinia store
 *
 * 取代原 dockbar/state.ts 的模块级 reactive 单例 dockbarState，
 * 成为 Dock 栏的唯一响应式状态源。模板（DockBar.vue）通过 useDockbarStore()
 * 绑定；命令式代码（DockBar.ts / renderer.ts）通过下方导出的委托式 setter
 * 写入，保持与原导入 API 一致。
 */

import { defineStore } from 'pinia';
import { reactive } from 'vue';

import type { DockItem } from './types';

export const useDockbarStore = defineStore('dockbar', () => {
    const state = reactive({
        /** 是否显示（原 #dockbar style.display 写入，setEnabled 控制） */
        visible: false,
        /** 项目列表（原 render() 渲染到 #dockbar-items） */
        items: [] as DockItem[],
        /** 图标 URL 映射（key = item.id；异步解析完成后写入） */
        iconUrls: {} as Record<string, string>,
    });
    return state;
});

/** 设置项目列表（原 render 的职责） */
export function setDockItems(items: DockItem[]): void {
    useDockbarStore().items = [...items];
}

/** 设置 Dock 栏可见性（原 setEnabled 的 style.display 写入） */
export function setDockVisible(visible: boolean): void {
    useDockbarStore().visible = visible;
}

/** 设置某个项目的最终图标 URL（模板 :src 绑定） */
export function setDockIcon(itemId: string, url: string): void {
    useDockbarStore().iconUrls[itemId] = url;
}
