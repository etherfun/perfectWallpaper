/**
 * 调试日志控制台 — Pinia store
 *
 * 取代原 debugModal/state.ts 的模块级 reactive 单例 debugModalState，
 * 成为调试控制台的唯一响应式状态源。消费方通过 useDebugStore() 获取同一实例，
 * 用法与旧单例一致（debugModalState.visible / .filtered / .expanded 等）。
 */

import { defineStore } from 'pinia';
import { reactive } from 'vue';

import type { LogEntry } from '../../../utils/logger';

export const useDebugStore = defineStore('debug', () => {
    const state = reactive({
        /** 是否显示（原 #debug-log-modal 存在性） */
        visible: false,
        /** 全部日志快照（每次刷新时从 debugLogger.logs 同步） */
        logs: [] as LogEntry[],
        /** 过滤/搜索后的显示列表（模板 v-for） */
        filtered: [] as LogEntry[],
        /** 当前过滤级别（-1 = 全部，原 .debug-filter-btn.active data-level） */
        filterLevel: -1,
        /** 搜索文本（原 #debug-search-input value） */
        searchText: '',
        /** 展开的日志 id（原 expandedLogs Set） */
        expanded: new Set<number>(),
        /** 日志总数文本（原 #debug-log-count textContent） */
        logCountText: '0 条日志',
        /** 搜索命中文本（原 #debug-search-count textContent） */
        searchCountText: '',
        /** 状态栏文本（原 #debug-status-info textContent） */
        statusText: '就绪',
        /** 空状态文本（原 .debug-console-empty span，暂无日志/无匹配结果） */
        emptyText: '暂无日志',
        /** 是否有可显示日志（原 emptyState style.display 写入） */
        hasLogs: true,
        /** 是否自动滚动到底部（原 #debug-auto-scroll checked） */
        autoScroll: true,
    });
    return state;
});
