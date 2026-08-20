/**
 * 调试日志控制台模态框 — 事件绑定与关闭
 *
 * 真 Vue 化：原 bindConsoleEvents 通过 getElementById 绑定按钮/输入事件；
 * 现在按钮点击改为 DebugModal.vue 模板 @click，本文件保留关闭/键盘/复制/
 * 清空/折叠/过滤/搜索的动作逻辑（写 debugModalState）。
 */

import { debugLogger, type LogEntry } from '../../../utils/logger';
import { clearExpandedLogs, renderLogs } from './render';
import { useDebugStore } from './store';

// Pinia 惰性访问：避免模块加载期顶层 useDebugStore() 无 Pinia
function getState() {
    return useDebugStore();
}

/**
 * 复制文本到剪贴板
 */
function clipboardCopy(text: string): void {
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text);
    } else {
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        try {
            document.execCommand('copy');
        } catch (err) {
            console.error('复制失败:', err);
        }
        document.body.removeChild(textarea);
    }
}

/**
 * 关闭调试日志模态框（原移除 DOM；现写 visible + 解绑键盘监听）
 */
export function closeDebugLogModal(): void {
    getState().visible = false;
    document.removeEventListener('keydown', handleConsoleKeydown);
}

/** 复制所有日志（原 debug-btn-copy 处理；含状态栏提示） */
export function copyDebugLogs(): void {
    const logs: LogEntry[] = debugLogger?.logs || [];
    const text = logs
        .map(
            log =>
                `[${log.timeString}] [${log.levelName}] ${log.message}` +
                (log.extraData ? `\n${JSON.stringify(log.extraData, null, 2)}` : '')
        )
        .join('\n\n');
    clipboardCopy(text);

    getState().statusText = '已复制到剪贴板';
    setTimeout(() => {
        getState().statusText = '就绪';
    }, 2000);
}

/** 折叠所有日志（原 debug-btn-collapse 处理） */
export function collapseDebugLogs(): void {
    clearExpandedLogs();
    renderLogs(debugLogger?.logs || []);
}

/** 清空日志（原 debug-btn-clear 处理） */
export function clearDebugLogs(): void {
    if (debugLogger) {
        debugLogger.clearLogs();
        clearExpandedLogs();
        renderLogs([]);
    }
}

/** 设置过滤级别并刷新（原 .debug-filter-btn 处理） */
export function setDebugFilter(level: number): void {
    getState().filterLevel = level;
    renderLogs(debugLogger?.logs || []);
}

/** 设置搜索文本并刷新（原 #debug-search-input input 处理） */
export function setDebugSearch(text: string): void {
    getState().searchText = text;
    renderLogs(debugLogger?.logs || []);
}

/**
 * 处理键盘事件（ESC 关闭 / Ctrl+F 聚焦搜索框）。
 * 弹窗关闭（visible=false）时自动解绑，与原实现按 DOM 存在性解绑等价。
 */
function handleConsoleKeydown(e: KeyboardEvent): void {
    if (!getState().visible) {
        document.removeEventListener('keydown', handleConsoleKeydown);
        return;
    }

    if (e.key === 'Escape') {
        closeDebugLogModal();
    } else if (e.key === 'f' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        (document.getElementById('debug-search-input') as HTMLInputElement)?.focus();
    }
}

/** 供主模块绑定键盘监听 */
export { handleConsoleKeydown };
