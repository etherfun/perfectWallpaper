/**
 * 调试日志控制台模态框
 * 类似 DevTools Console 的界面
 */

import { debugLogger, type LogEntry } from './utils/logger';
import { escapeHtml } from './utils/string';

/**
 * 复制文本到剪态板
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
 * 格式化时间戳为时分秒
 */
function formatTime(date: Date): string {
    const h = date.getHours().toString().padStart(2, '0');
    const m = date.getMinutes().toString().padStart(2, '0');
    const s = date.getSeconds().toString().padStart(2, '0');
    const ms = date.getMilliseconds().toString().padStart(3, '0');
    return `${h}:${m}:${s}.${ms}`;
}

/**
 * 获取日志级别颜色
 */
function getLevelColor(level: number): { bg: string; text: string; label: string } {
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

/**
 * 显示调试日志控制台模态框
 */
export function showDebugLogModal(): void {
    const existingModal = document.getElementById('debug-log-modal');
    if (existingModal) {
        document.body.removeChild(existingModal);
    }

    const logs: LogEntry[] = debugLogger?.logs || [];

    const modalHTML = `
    <div id="debug-log-modal" class="debug-console-modal">
        <div class="debug-console-overlay"></div>
        <div class="debug-console-container">
            <!-- 标题栏 -->
            <div class="debug-console-header">
                <div class="debug-console-title">
                    <span class="debug-console-icon">>_</span>
                    <span>调试控制台</span>
                </div>
                <div class="debug-console-controls">
                    <span class="debug-log-count" id="debug-log-count">${logs.length} 条日志</span>
                    <button class="debug-console-btn" id="debug-btn-collapse" title="折叠所有">▢</button>
                    <button class="debug-console-btn debug-btn-close" id="debug-btn-close" title="关闭 (Esc)">×</button>
                </div>
            </div>

            <!-- 工具栏 -->
            <div class="debug-console-toolbar">
                <div class="debug-toolbar-left">
                    <button class="debug-filter-btn active" data-level="-1">全部</button>
                    <button class="debug-filter-btn" data-level="3" data-level-name="ERROR">ERROR</button>
                    <button class="debug-filter-btn" data-level="2" data-level-name="WARN">WARN</button>
                    <button class="debug-filter-btn" data-level="1" data-level-name="INFO">INFO</button>
                    <button class="debug-filter-btn" data-level="0" data-level-name="DEBUG">DEBUG</button>
                </div>
                <div class="debug-toolbar-right">
                    <div class="debug-search-box">
                        <input type="text" id="debug-search-input" placeholder="搜索日志..." />
                        <span class="debug-search-count" id="debug-search-count"></span>
                    </div>
                    <button class="debug-console-btn" id="debug-btn-copy" title="复制所有日志">复制</button>
                    <button class="debug-console-btn" id="debug-btn-clear" title="清空日志">清空</button>
                </div>
            </div>

            <!-- 日志列表 -->
            <div class="debug-console-body" id="debug-console-body">
                <div class="debug-console-empty" id="debug-console-empty" style="display: ${logs.length === 0 ? 'flex' : 'none'}">
                    <span>暂无日志</span>
                </div>
                <div class="debug-log-list" id="debug-log-list"></div>
            </div>

            <!-- 状态栏 -->
            <div class="debug-console-status">
                <span id="debug-status-info">就绪</span>
                <div class="debug-status-right">
                    <label class="debug-auto-scroll">
                        <input type="checkbox" id="debug-auto-scroll" checked />
                        自动滚动
                    </label>
                </div>
            </div>
        </div>
    </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHTML);

    renderLogs(logs);

    bindConsoleEvents();

    document.addEventListener('keydown', handleConsoleKeydown);
}

/**
 * 渲染日志列表
 */
function renderLogs(logs: LogEntry[]): void {
    const logList = document.getElementById('debug-log-list') as HTMLElement;
    const emptyState = document.getElementById('debug-console-empty') as HTMLElement;
    const logCount = document.getElementById('debug-log-count') as HTMLElement;
    const statusInfo = document.getElementById('debug-status-info') as HTMLElement;

    if (!logList) return;

    const activeFilter = document.querySelector('.debug-filter-btn.active') as HTMLElement;
    const filterLevel = activeFilter ? parseInt(activeFilter.dataset.level || '-1') : -1;
    const searchText =
        (document.getElementById('debug-search-input') as HTMLInputElement)?.value.toLowerCase() ||
        '';

    let filteredLogs = logs;
    if (filterLevel >= 0) {
        filteredLogs = filteredLogs.filter(log => log.level === filterLevel);
    }
    if (searchText) {
        filteredLogs = filteredLogs.filter(
            log =>
                log.message.toLowerCase().includes(searchText) ||
                (log.extraData && JSON.stringify(log.extraData).toLowerCase().includes(searchText))
        );
    }

    logCount.textContent = `${logs.length} 条日志`;
    const searchCount = document.getElementById('debug-search-count');
    if (searchCount) {
        searchCount.textContent = searchText ? `${filteredLogs.length}/${logs.length}` : '';
    }
    statusInfo.textContent = searchText
        ? `找到 ${filteredLogs.length} 条匹配`
        : `共 ${logs.length} 条`;

    if (filteredLogs.length === 0) {
        emptyState.style.display = 'flex';
        emptyState.querySelector('span')!.textContent = searchText ? '无匹配结果' : '暂无日志';
        logList.innerHTML = '';
        return;
    }

    emptyState.style.display = 'none';

    logList.innerHTML = filteredLogs
        .map((log, idx) => {
            const colors = getLevelColor(log.level);
            const hasExtra = log.extraData && Object.keys(log.extraData).length > 0;
            const extraStr = hasExtra ? JSON.stringify(log.extraData, null, 2) : '';

            return `
        <div class="debug-log-entry ${log.level >= 3 ? 'debug-log-error' : ''}" data-id="${log.id}">
            <div class="debug-log-row" onclick="toggleLogDetails(${log.id})">
                <span class="debug-log-line">${idx + 1}</span>
                <span class="debug-log-time">${formatTime(new Date(log.timestamp))}</span>
                <span class="debug-log-level" style="background:${colors.bg};color:${colors.text}">${colors.label}</span>
                <span class="debug-log-message">${escapeHtml(log.message)}</span>
                <span class="debug-log-expand">${hasExtra ? (isLogExpanded(log.id) ? '▼' : '▶') : ''}</span>
            </div>
            ${
                hasExtra
                    ? `
            <div class="debug-log-details" id="debug-details-${log.id}" style="display:${isLogExpanded(log.id) ? 'block' : 'none'}">
                <pre class="debug-log-extra">${escapeHtml(extraStr)}</pre>
            </div>
            `
                    : ''
            }
        </div>
        `;
        })
        .join('');

    const body = document.getElementById('debug-console-body');
    const autoScroll = document.getElementById('debug-auto-scroll') as HTMLInputElement;
    if (autoScroll?.checked && body) {
        body.scrollTop = body.scrollHeight;
    }
}

const expandedLogs = new Set<number>();

function isLogExpanded(id: number): boolean {
    return expandedLogs.has(id);
}

function toggleLogDetails(id: number): void {
    if (expandedLogs.has(id)) {
        expandedLogs.delete(id);
    } else {
        expandedLogs.add(id);
    }
    const logs: LogEntry[] = debugLogger?.logs || [];
    renderLogs(logs);
}

function bindConsoleEvents(): void {
    document.getElementById('debug-btn-close')?.addEventListener('click', closeDebugLogModal);

    document.getElementById('debug-btn-collapse')?.addEventListener('click', () => {
        expandedLogs.clear();
        const logs: LogEntry[] = debugLogger?.logs || [];
        renderLogs(logs);
    });

    document.getElementById('debug-btn-clear')?.addEventListener('click', () => {
        if (debugLogger) {
            debugLogger.clearLogs();
            expandedLogs.clear();
            renderLogs([]);
        }
    });

    document.getElementById('debug-btn-copy')?.addEventListener('click', () => {
        const logs: LogEntry[] = debugLogger?.logs || [];
        const text = logs
            .map(
                log =>
                    `[${log.timeString}] [${log.levelName}] ${log.message}` +
                    (log.extraData ? `\n${JSON.stringify(log.extraData, null, 2)}` : '')
            )
            .join('\n\n');
        clipboardCopy(text);

        const statusInfo = document.getElementById('debug-status-info');
        if (statusInfo) {
            statusInfo.textContent = '已复制到剪贴板';
            setTimeout(() => {
                statusInfo.textContent = '就绪';
            }, 2000);
        }
    });

    document.querySelectorAll('.debug-filter-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document
                .querySelectorAll('.debug-filter-btn')
                .forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            const logs: LogEntry[] = debugLogger?.logs || [];
            renderLogs(logs);
        });
    });

    const searchInput = document.getElementById('debug-search-input') as HTMLInputElement;
    searchInput?.addEventListener('input', () => {
        const logs: LogEntry[] = debugLogger?.logs || [];
        renderLogs(logs);
    });

    document
        .querySelector('.debug-console-overlay')
        ?.addEventListener('click', e => e.stopPropagation());
}

/**
 * 处理键盘事件
 */
function handleConsoleKeydown(e: KeyboardEvent): void {
    const modal = document.getElementById('debug-log-modal');
    if (!modal) {
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

/**
 * 关闭调试日志模态框
 */
export function closeDebugLogModal(): void {
    const modal = document.getElementById('debug-log-modal');
    if (modal) {
        document.body.removeChild(modal);
    }
    document.removeEventListener('keydown', handleConsoleKeydown);
}

// 导出到 window - 内联 onclick 处理需要全局访问
window.showDebugLogModal = showDebugLogModal;
window.closeDebugLogModal = closeDebugLogModal;
window.toggleLogDetails = toggleLogDetails;
