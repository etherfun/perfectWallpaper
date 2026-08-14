/**
 * 调试日志控制台模态框 — 日志渲染
 *
 * 真 Vue 化：原 renderLogs 通过 innerHTML 写 DOM；现在改为写入
 * `debugModalState`（filtered / logCountText / statusText 等），
 * DebugModal.vue 模板 v-for 渲染日志行。
 *
 * 展开状态（expandedLogs Set）保留在响应式状态中，模板直接绑定，
 * 无需再重渲染整表。
 */

import type { LogEntry } from '../../../utils/logger';
import { debugModalState } from './state';

/**
 * 格式化时间戳为时分秒
 */
export function formatTime(date: Date): string {
    const h = date.getHours().toString().padStart(2, '0');
    const m = date.getMinutes().toString().padStart(2, '0');
    const s = date.getSeconds().toString().padStart(2, '0');
    const ms = date.getMilliseconds().toString().padStart(3, '0');
    return `${h}:${m}:${s}.${ms}`;
}

/**
 * 获取日志级别颜色
 */
export function getLevelColor(level: number): { bg: string; text: string; label: string } {
    switch (level) {
        case 0:
            return { bg: '#3c3c3c', text: '#9e9e9e', label: 'DEBUG' };
        case 1:
            return { bg: '#0a45a5', text: '#64b5f6', label: 'INFO' };
        case 2:
            return { bg: '#8a5a00', text: '#ffb74d', label: 'WARN' };
        case 3:
            return { bg: '#a50000', text: '#ef5350', label: 'ERROR' };
        case 4:
            return { bg: '#6a0080', text: '#ce93d8', label: 'CRITICAL' };
        default:
            return { bg: '#333', text: '#fff', label: 'LOG' };
    }
}

/** 日志是否展开（原 expandedLogs.has） */
export function isLogExpanded(id: number): boolean {
    return debugModalState.expanded.has(id);
}

/**
 * 切换日志详情展开状态（原 toggleLogDetails：更新 Set 后重渲染；
 * 模板绑定 expanded，无需重渲染）
 */
export function toggleLogDetails(id: number): void {
    if (debugModalState.expanded.has(id)) {
        debugModalState.expanded.delete(id);
    } else {
        debugModalState.expanded.add(id);
    }
}

/** 供折叠全部按钮使用的展开状态清理 */
export function clearExpandedLogs(): void {
    debugModalState.expanded.clear();
}

/**
 * 渲染日志列表：应用过滤/搜索，写入响应式状态。
 * 原实现读取 DOM（.debug-filter-btn.active / #debug-search-input value），
 * 现改为读取 debugModalState.filterLevel / searchText。
 */
export function renderLogs(logs: LogEntry[]): void {
    debugModalState.logs = [...logs];

    const filterLevel = debugModalState.filterLevel;
    const searchText = debugModalState.searchText.toLowerCase();

    let filteredLogs = logs;
    if (filterLevel >= 0) {
        filteredLogs = filteredLogs.filter(log => log.level === filterLevel);
    }
    if (searchText) {
        filteredLogs = filteredLogs.filter(
            log =>
                log.message.toLowerCase().includes(searchText) ||
                (log.extraData &&
                    JSON.stringify(log.extraData).toLowerCase().includes(searchText))
        );
    }

    debugModalState.filtered = filteredLogs;
    debugModalState.logCountText = `${logs.length} 条日志`;
    debugModalState.searchCountText = searchText ? `${filteredLogs.length}/${logs.length}` : '';
    debugModalState.statusText = searchText
        ? `找到 ${filteredLogs.length} 条匹配`
        : `共 ${logs.length} 条`;
    debugModalState.emptyText = searchText ? '无匹配结果' : '暂无日志';
    debugModalState.hasLogs = filteredLogs.length > 0;
}
