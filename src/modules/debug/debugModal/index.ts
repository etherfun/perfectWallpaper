/**
 * 调试日志控制台模态框
 * 类似 DevTools Console 的界面
 *
 * 真 Vue 化：原 showDebugLogModal 动态创建 modal HTML 并渲染日志；
 * 现在只写 `debugModalState`（visible），弹窗结构由
 * DebugModal.vue 模板渲染。
 *
 * 拆分说明：日志渲染 → ./render，事件绑定与关闭 → ./events，
 * 响应式状态 → ./state。主入口与 window 全局导出保留在本文件，
 * 对外 API 与拆分前一致（showDebugLogModal / closeDebugLogModal /
 * toggleLogDetails）。
 */

import { debugLogger, type LogEntry } from '../../../utils/logger';
import { closeDebugLogModal, handleConsoleKeydown } from './events';
import { renderLogs, toggleLogDetails } from './render';
import { useDebugStore } from './store';

// Pinia 惰性访问：避免模块加载期无 Pinia 调用（Top-level useDebugStore() 在测试环境会报错）
function getState() {
    return useDebugStore();
}

/**
 * 显示调试日志控制台模态框（原创建 DOM；现写 visible 并渲染日志）
 */
export function showDebugLogModal(): void {
    getState().visible = true;

    const logs: LogEntry[] = debugLogger?.logs || [];

    renderLogs(logs);

    document.addEventListener('keydown', handleConsoleKeydown);
}

/** 刷新日志列表（外部/组件在日志变化后调用） */
export function refreshDebugLogs(): void {
    renderLogs(debugLogger?.logs || []);
}

// 导出到 window - 内联 onclick 处理需要全局访问
window.showDebugLogModal = showDebugLogModal;
window.closeDebugLogModal = closeDebugLogModal;
window.toggleLogDetails = toggleLogDetails;
