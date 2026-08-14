/**
 * 调试日志控制台模态框 — 响应式状态（真 Vue 化）
 *
 * DebugModal.vue 模板直接绑定本状态：
 *   - visible    → v-if 显隐（原 showDebugLogModal/closeDebugLogModal 的
 *                  创建/移除 DOM）
 *   - filtered   → v-for 渲染日志行（原 renderLogs innerHTML）
 *   - expanded   → 日志详情展开状态（原 expandedLogs Set + 重渲染）
 *   - filterLevel / searchText → 过滤与搜索（原 DOM 读取）
 *   - logCountText / statusText / emptyText → 状态栏文本（原 textContent 写入）
 */
import { reactive } from 'vue';

import type { LogEntry } from '../../../utils/logger';

/** 调试控制台 UI 响应式状态 */
export const debugModalState = reactive({
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
