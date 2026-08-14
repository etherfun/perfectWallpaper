<!--
  DebugModal.vue — 调试日志控制台组件（真 Vue 化）
  替换原 debugModal 动态创建的调试面板 DOM。

  架构：
    - debugModal/state.ts 提供 debugModalState 响应式状态（visible /
      filtered / filterLevel / searchText / expanded 等），模板直接绑定
    - debugModal/render.ts 的渲染函数 → 写 filtered 等状态（原 innerHTML）
    - debugModal/events.ts 保留关闭/复制/清空/过滤/搜索逻辑；
      按钮事件由模板 @click 转发（原 bindConsoleEvents 的 getElementById 绑定）
    - debugLogger 数据源保留（debugLogger.logs 为唯一日志来源）
    - 键盘监听（ESC / Ctrl+F）保留：showDebugLogModal 时绑定，
      closeDebugLogModal / 不可见时解绑

  保留的 DOM 写入：
    - 自动滚动（组件 watch filtered 后 nextTick 设置 scrollTop）
    - 剪贴板复制（clipboardCopy 的 textarea 兜底）
-->
<template>
    <!-- visible: 原 #debug-log-modal 创建/移除，改 v-if 绑定 -->
    <div v-if="debugModalState.visible" id="debug-log-modal" class="debug-console-modal">
        <div class="debug-console-overlay" @click="onOverlayClick"></div>
        <div class="debug-console-container">
            <!-- 标题栏 -->
            <div class="debug-console-header">
                <div class="debug-console-title">
                    <span class="debug-console-icon">>_</span>
                    <span>调试控制台</span>
                </div>
                <div class="debug-console-controls">
                    <span class="debug-log-count" id="debug-log-count">{{
                        debugModalState.logCountText
                    }}</span>
                    <button
                        class="debug-console-btn"
                        id="debug-btn-collapse"
                        title="折叠所有"
                        @click="onCollapse"
                    >
                        ▢
                    </button>
                    <button
                        class="debug-console-btn debug-btn-close"
                        id="debug-btn-close"
                        title="关闭 (Esc)"
                        @click="onClose"
                    >
                        ×
                    </button>
                </div>
            </div>

            <!-- 工具栏 -->
            <div class="debug-console-toolbar">
                <div class="debug-toolbar-left">
                    <button
                        class="debug-filter-btn"
                        :class="{ active: debugModalState.filterLevel === -1 }"
                        data-level="-1"
                        @click="onFilter(-1)"
                    >
                        全部
                    </button>
                    <button
                        v-for="lvl in FILTER_LEVELS"
                        :key="lvl.level"
                        class="debug-filter-btn"
                        :class="{ active: debugModalState.filterLevel === lvl.level }"
                        :data-level="lvl.level"
                        :data-level-name="lvl.name"
                        @click="onFilter(lvl.level)"
                    >
                        {{ lvl.name }}
                    </button>
                </div>
                <div class="debug-toolbar-right">
                    <div class="debug-search-box">
                        <input
                            type="text"
                            id="debug-search-input"
                            placeholder="搜索日志..."
                            :value="debugModalState.searchText"
                            @input="onSearchInput"
                        />
                        <span class="debug-search-count" id="debug-search-count">{{
                            debugModalState.searchCountText
                        }}</span>
                    </div>
                    <button class="debug-console-btn" id="debug-btn-copy" title="复制所有日志" @click="onCopy">
                        复制
                    </button>
                    <button
                        class="debug-console-btn"
                        id="debug-btn-clear"
                        title="清空日志"
                        @click="onClear"
                    >
                        清空
                    </button>
                </div>
            </div>

            <!-- 日志列表 -->
            <div class="debug-console-body" id="debug-console-body" ref="bodyRef">
                <!-- hasLogs: 原 emptyState style.display 写入 -->
                <div
                    class="debug-console-empty"
                    id="debug-console-empty"
                    v-show="!debugModalState.hasLogs"
                >
                    <span>{{ debugModalState.emptyText }}</span>
                </div>
                <div class="debug-log-list" id="debug-log-list">
                    <!-- 日志行: 原 renderLogs innerHTML，改 v-for -->
                    <div
                        v-for="(log, idx) in debugModalState.filtered"
                        :key="log.id"
                        class="debug-log-entry"
                        :class="{ 'debug-log-error': log.level >= 3 }"
                        :data-id="log.id"
                    >
                        <div class="debug-log-row" @click="onToggleDetails(log.id)">
                            <span class="debug-log-line">{{ idx + 1 }}</span>
                            <span class="debug-log-time">{{ formatTime(log.timestamp) }}</span>
                            <span
                                class="debug-log-level"
                                :style="levelStyle(log.level)"
                                >{{ levelLabel(log.level) }}</span
                            >
                            <span class="debug-log-message">{{ log.message }}</span>
                            <span class="debug-log-expand">{{
                                hasExtra(log) ? (isExpanded(log.id) ? '▼' : '▶') : ''
                            }}</span>
                        </div>
                        <!-- expanded: 原 style.display 写入，改 v-show -->
                        <div
                            v-if="hasExtra(log)"
                            class="debug-log-details"
                            :id="`debug-details-${log.id}`"
                            v-show="isExpanded(log.id)"
                        >
                            <pre class="debug-log-extra">{{ extraText(log) }}</pre>
                        </div>
                    </div>
                </div>
            </div>

            <!-- 状态栏 -->
            <div class="debug-console-status">
                <span id="debug-status-info">{{ debugModalState.statusText }}</span>
                <div class="debug-status-right">
                    <label class="debug-auto-scroll">
                        <input
                            type="checkbox"
                            id="debug-auto-scroll"
                            v-model="debugModalState.autoScroll"
                            checked
                        />
                        自动滚动
                    </label>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
/**
 * 本组件职责：
 *   1. 渲染 <div id="debug-log-modal"> 完整弹窗结构（对齐原 modalHTML）
 *   2. 模板绑定 debugModalState（显隐 / 日志行 / 过滤 / 搜索 / 展开）
 *   3. 按钮/输入事件转发到 debugModal/events 的动作函数
 *   4. 日志刷新后自动滚动到底部（原 renderLogs 内 scrollTop 写入）
 *
 * showDebugLogModal（wallpaperPropertyListener 调用）与
 * closeDebugLogModal（window 全局导出）只操作 debugModalState，
 * 本组件常驻 App 根组件，v-if 渲染弹窗。
 */
import { nextTick, ref, watch } from 'vue';

import type { LogEntry } from '@/utils/logger';
import { useConfigStore } from '@/stores/config';

import {
    clearDebugLogs,
    closeDebugLogModal,
    collapseDebugLogs,
    copyDebugLogs,
    setDebugFilter,
    setDebugSearch,
} from './debugModal/events';
import { formatTime, getLevelColor, toggleLogDetails } from './debugModal/render';
import { debugModalState } from './debugModal/state';

const config = useConfigStore();
const _ = (): boolean => Boolean(config.debugger_copy);

/** 过滤按钮配置（原静态 HTML 的 data-level 列表） */
const FILTER_LEVELS = [
    { level: 3, name: 'ERROR' },
    { level: 2, name: 'WARN' },
    { level: 1, name: 'INFO' },
    { level: 0, name: 'DEBUG' },
];

/** 日志滚动容器（自动滚动用） */
const bodyRef = ref<HTMLElement | null>(null);

/** 过滤按钮（原 .debug-filter-btn click 处理） */
function onFilter(level: number): void {
    setDebugFilter(level);
}

/** 搜索输入（原 #debug-search-input input 处理） */
function onSearchInput(event: Event): void {
    setDebugSearch((event.target as HTMLInputElement).value);
}

/** 关闭按钮 / 遮罩点击（原 debug-btn-close / overlay 处理） */
function onClose(): void {
    closeDebugLogModal();
}

function onOverlayClick(): void {
    // 原实现 overlay click 仅 stopPropagation，防止事件穿透到外部；
    // 模板中 overlay 无子元素，行为等价
}

/** 折叠所有（原 debug-btn-collapse 处理） */
function onCollapse(): void {
    collapseDebugLogs();
}

/** 清空日志（原 debug-btn-clear 处理） */
function onClear(): void {
    clearDebugLogs();
}

/** 复制所有日志（原 debug-btn-copy 处理） */
function onCopy(): void {
    copyDebugLogs();
}

/** 展开/折叠日志详情（原 toggleLogDetails 全局函数） */
function onToggleDetails(id: number): void {
    toggleLogDetails(id);
}

/** 级别徽章样式（原 style 内联写入） */
function levelStyle(level: number): { background: string; color: string } {
    const colors = getLevelColor(level);
    return { background: colors.bg, color: colors.text };
}

/** 级别标签 */
function levelLabel(level: number): string {
    return getLevelColor(level).label;
}

/** 是否有额外数据（原 hasExtra 判断） */
function hasExtra(log: LogEntry): boolean {
    return Boolean(log.extraData && Object.keys(log.extraData).length > 0);
}

/** 额外数据文本（原 JSON.stringify(extraData, null, 2)） */
function extraText(log: LogEntry): string {
    return hasExtra(log) ? JSON.stringify(log.extraData, null, 2) : '';
}

/** 是否展开（原 isLogExpanded） */
function isExpanded(id: number): boolean {
    return debugModalState.expanded.has(id);
}

/** 日志列表刷新后自动滚动到底部（原 renderLogs 内 scrollTop 写入） */
watch(
    () => debugModalState.filtered,
    async () => {
        await nextTick();
        if (debugModalState.autoScroll && bodyRef.value) {
            bodyRef.value.scrollTop = bodyRef.value.scrollHeight;
        }
    }
);
</script>
