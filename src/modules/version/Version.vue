<!--
  Version.vue — 更新日志弹窗组件（真 Vue 化）
  替换原 versionManager 动态创建的弹窗 DOM。

  架构：
    - state.ts 提供 versionUiState 响应式状态（visible / versionList /
      detailContentHtml / countdownText 等），模板直接绑定
    - versionManager 类只写状态（init/show/hide/倒计时/内容填充），
      不再 createModalHTML / insertAdjacentHTML / innerHTML 写 DOM
    - 弹窗结构 v-show + .show class 渲染（保留原 CSS 过渡动画）
    - 右侧详情内容（含 SimpleMarkdown 解析结果）v-html 渲染
    - 按钮点击经 runtimeStore.versionManager 转发到 versionManager 方法
      （懒读取实例，避免 import 顶层副作用）

  保留的 DOM 写入：
    - 链接复制通知（simple-markdown.ts showCopyNotification → #link-notification-container）
    - cleanupLinkNotifications 清理通知 DOM
-->
<template>
    <!-- visible: 原 #version-modal .show class 写入，改 :class 绑定 -->
    <div id="version-modal" class="version-modal" :class="{ show: versionUiState.visible }">
        <div class="modal-overlay" @click="onOverlayClick"></div>
        <!-- 尺寸: 原 getModalHTML 内联 style 写入 -->
        <div class="modal-content" :style="versionUiState.modalSize">
            <div class="modal-header">
                <div class="header-left">
                    <h2 class="modal-title">
                        <i class="version-icon">📫</i>
                        {{ versionUiState.modalTitle }}
                    </h2>
                    <div class="version-indicator">
                        <span v-if="versionUiState.isNewVersion" class="new-badge">NEW</span>
                    </div>
                </div>
                <button class="modal-close" id="modal-close" @click="onClose">&times;</button>
            </div>

            <div class="modal-body">
                <!-- 正常双栏布局 -->
                <div v-if="!versionUiState.isFallback" class="two-column-layout">
                    <div class="version-list-column">
                        <div class="version-list-header">
                            <h3>{{ historyTitle }}</h3>
                            <div class="version-list-count">
                                <span class="total-count">{{ versionUiState.totalCountText }}</span>
                            </div>
                        </div>
                        <div class="version-list-container" id="version-list-container">
                            <!-- loading: 原 loading-indicator 静态 HTML -->
                            <div v-if="versionUiState.loading" class="loading-indicator">
                                <div class="loading-spinner"></div>
                                <div class="loading-text">{{ loadingText }}</div>
                            </div>
                            <!-- 版本列表: 原 renderVersionList innerHTML，改 v-for -->
                            <template v-else>
                                <div
                                    v-for="item in versionUiState.versionList"
                                    :key="item.version"
                                    class="version-list-item"
                                    :class="{ current: item.isCurrent, selected: item.isSelected }"
                                    :data-version="item.version"
                                    @click="onSelectVersion(item.version)"
                                >
                                    <div class="version-item-header">
                                        <div class="version-item-left">
                                            <span class="version-number">v{{ item.version }}</span>
                                            <span
                                                v-if="item.isCurrent"
                                                class="current-indicator"
                                                >{{ currentBadgeText }}</span
                                            >
                                        </div>
                                        <div class="version-item-right">
                                            <span class="version-date">{{ item.date }}</span>
                                        </div>
                                    </div>
                                    <div class="version-item-title">{{ item.title }}</div>
                                </div>
                            </template>
                        </div>
                    </div>

                    <div class="version-detail-column">
                        <div class="version-detail-header">
                            <h3 id="detail-version-title">{{ versionUiState.detailTitle }}</h3>
                            <div class="version-detail-meta" id="detail-version-meta">
                                <span class="detail-version">v{{ versionUiState.detailVersion }}</span>
                                <span class="detail-date">{{ versionUiState.detailDate }}</span>
                                <!-- current-badge: 原 updateVersionDetail meta innerHTML 分支 -->
                                <span
                                    v-if="
                                        versionUiState.selectedVersion ===
                                        versionUiState.currentVersion
                                    "
                                    class="current-badge"
                                    >{{ currentVersionText }}</span
                                >
                            </div>
                        </div>
                        <div
                            class="version-detail-content"
                            id="version-detail-content"
                            v-html="versionUiState.detailContentHtml"
                        ></div>
                        <!-- 链接复制通知容器（simple-markdown 注入通知） -->
                        <div
                            class="link-notification-container"
                            id="link-notification-container"
                        ></div>
                        <!-- 滚动提示 -->
                        <div class="scroll-hint" id="scroll-hint">{{ scrollHintText }}</div>
                    </div>
                </div>
                <!-- 降级弹窗内容（原 createFallbackModal 结构） -->
                <div
                    v-else
                    style="
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        padding: 40px;
                    "
                >
                    <div class="no-data">{{ noDataText }}</div>
                </div>
            </div>

            <div class="modal-footer">
                <div class="footer-left" v-if="!versionUiState.isFallback">
                    <button
                        class="action-btn secondary-btn"
                        id="dont-show-btn"
                        @click="onDontShow"
                    >
                        {{ dontShowText }}
                    </button>
                </div>
                <div class="footer-right">
                    <button class="action-btn" id="understand-btn" @click="onUnderstand">
                        {{ understandText
                        }}<span
                            class="countdown-text"
                            id="countdown-text"
                            :class="{ 'countdown-warning': versionUiState.countdownWarning }"
                            >{{ versionUiState.countdownText }}</span
                        >
                    </button>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
/**
 * 本组件职责：
 *   1. 渲染 <div id="version-modal"> 完整弹窗结构（对齐原 getModalHTML）
 *   2. 模板绑定 versionUiState（显隐 / 版本列表 / 详情 v-html / 倒计时）
 *   3. 按钮点击转发到 runtimeStore.versionManager 对应方法
 *      （懒读取实例；versionManager 由 bundle.ts → src/modules/version
 *       side-effect 创建并挂载到 runtimeStore）
 *
 * versionManager 仍负责：fetch history.json、SimpleMarkdown 解析、i18n、
 * 倒计时/鼠标检测/交互检测逻辑。
 */
import { useRuntimeStore } from '@/stores/runtime';
import { globalT } from '@/utils/i18n';

import type { versionManager } from './manager';
import { useVersionStore } from './store';

const versionUiState = useVersionStore();

const runtimeStore = useRuntimeStore();

/** 懒读取版本管理器实例（测试环境下可能未初始化 → 按钮 no-op） */
function manager(): versionManager | undefined {
    return runtimeStore.versionManager as versionManager | undefined;
}

// i18n 文案（原 getModalHTML / fillModalContent 中 globalT 取值）
const historyTitle = globalT('version_history_title');
const loadingText = globalT('version_loading');
const currentBadgeText = globalT('version_current_badge');
const currentVersionText = globalT('version_current_version');
const scrollHintText = globalT('version_scroll_hint');
const dontShowText = globalT('version_dont_show_again');
const understandText = globalT('version_i_understand');
const noDataText = globalT('version_no_data');

/** 关闭按钮（原 bindEvents: stopCountdown + hideModal；hideModal 内含 stop） */
function onClose(): void {
    manager()?.hideModal();
}

/** 我知道了按钮（原 bindEvents: stopCountdown + hideModal） */
function onUnderstand(): void {
    manager()?.hideModal();
}

/** 不再显示按钮（原 bindEvents: stopCountdown + disableFutureUpdates + hideModal） */
function onDontShow(): void {
    manager()?.dontShowAgain();
}

/** 遮罩点击关闭（原 bindEvents overlay click） */
function onOverlayClick(): void {
    manager()?.hideModal();
}

/** 版本列表项点击（原 bindGlobalEvents 委托到 selectVersionInternal） */
function onSelectVersion(version: string): void {
    manager()?.selectVersionFromList(version);
}
</script>
