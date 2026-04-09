/**
 * Version module - Version update manager and markdown utilities
 */

export { SimpleMarkdown } from './simple-markdown';

import { config } from "../utils/config";
import { i18n } from "../utils/i18n";
import { waitAndExecute } from "../utils/timer";
import { fetch_with_retry } from "../utils/tool";
import { SimpleMarkdown } from './simple-markdown';

// 版本历史数据Promise
export const VERSION_HISTORY_PROMISE = fetch_with_retry("update/history.json").then(res => res.json());

/**
 * Version history entry structure
 */
export interface VersionHistoryEntry {
    version: string;
    date: string;
    titleKey?: string;
    title?: string;
    changes?: string[];
}

export const versionConfig = {
    CURRENT_VERSION: "1.7.3",

    MODAL_SIZE: {
        width: "65%",
        height: "93%",
        maxWidth: "90%",
        maxHeight: "95%",
    },

    VERSION_HISTORY: [] as VersionHistoryEntry[],

    STORAGE_KEY: "perfectwall_version",

    SHOW_SETTINGS: {
        autoCloseDelay: 60000,
        animationDuration: 400,
        showOnFirstLoad: false,
        showOnUpdate: Boolean(localStorage.getItem("perfectwall_version_show_update")),
        enableHistoryNavigation: true,
        enableMarkdown: true,
        defaultView: "current"
    },

    IMAGE_SETTINGS: {
        maxHeight: "40vh",
        borderRadius: "12px",
        showImage: true,
        lazyLoad: true
    }
};

class versionManager {
    private updateModal: HTMLElement | null = null;
    private isInitialized = false;
    private currentVersion: string;
    private isNewVersion = false;
    private selectedVersion: string | null = null;
    private countdownInterval: ReturnType<typeof setInterval> | null = null;
    private remainingSeconds = 0;
    private countdownActive = false;
    private mouseMoveHandler: ((event: MouseEvent) => void) | null = null;
    private lastMouseMoveTime = 0;
    private isMouseMoving = true;
    private mouseMoveTimer: ReturnType<typeof setTimeout> | null = null;
    private mouseMoveTimeout = 3000; // 3秒无鼠标移动后开始计时
    private userInteractionHandler: (() => void) | null = null;

    constructor() {
        this.currentVersion = versionConfig.CURRENT_VERSION;
        this.isNewVersion = this.checkVersionUpdate();
        this.lastMouseMoveTime = Date.now();
    }

    private checkVersionUpdate(): boolean {
        const storedVersion = localStorage.getItem(versionConfig.STORAGE_KEY);
        if (!storedVersion) {
            localStorage.setItem(versionConfig.STORAGE_KEY, this.currentVersion);
            return versionConfig.SHOW_SETTINGS.showOnFirstLoad;
        }

        const isNewVersion = storedVersion !== this.currentVersion;
        if (isNewVersion) {
            localStorage.setItem(versionConfig.STORAGE_KEY, this.currentVersion);
        }

        return isNewVersion && versionConfig.SHOW_SETTINGS.showOnUpdate;
    }

    async initUpdateModal(): Promise<void> {
        if (this.isInitialized) return;

        // 如果不是新版本且没有手动触发，则不创建弹窗
        if (!this.isNewVersion) return;

        try {
            // 加载版本历史
            versionConfig.VERSION_HISTORY = await VERSION_HISTORY_PROMISE;

            // 创建弹窗HTML
            this.createModalHTML();

            // 绑定事件
            this.bindEvents();

            this.isInitialized = true;

            // 显示弹窗
            setTimeout(() => {
                this.showModal();
            }, 2000);
        } catch (error) {
            console.error("初始化版本弹窗失败:", error);
        }
    }

    // 创建弹窗HTML
    private createModalHTML(): void {
        // 移除已有的弹窗
        const existingModal = document.getElementById('version-modal');
        if (existingModal) {
            existingModal.remove();
        }

        // 直接插入HTML（与JS版本一致）
        document.body.insertAdjacentHTML('beforeend', this.getModalHTML());

        // 获取弹窗元素
        this.updateModal = document.getElementById('version-modal');

        // 绑定事件
        this.bindEvents();

        // 填充内容
        this.fillModalContent();

        // 设置当前版本为选中版本
        this.selectedVersion = this.currentVersion;
    }

    // 获取弹窗HTML
    private getModalHTML(): string {
        return `
            <div id="version-modal" class="version-modal">
                <div class="modal-overlay"></div>
                <div class="modal-content" style="
                    width: ${versionConfig.MODAL_SIZE.width};
                    max-width: ${versionConfig.MODAL_SIZE.maxWidth};
                    height: ${versionConfig.MODAL_SIZE.height};
                    max-height: ${versionConfig.MODAL_SIZE.maxHeight};
                ">
                    <div class="modal-header">
                        <div class="header-left">
                            <h2 class="modal-title">
                                <i class="version-icon">📱</i>
                                ${this.isNewVersion ? i18n('version_update_title') : i18n('version_info_title')}
                            </h2>
                            <div class="version-indicator">
                                ${this.isNewVersion ? '<span class="new-badge">NEW</span>' : ''}
                            </div>
                        </div>
                        <button class="modal-close" id="modal-close">&times;</button>
                    </div>

                    <div class="modal-body">
                        <div class="two-column-layout">
                            <!-- 左侧版本列表 -->
                            <div class="version-list-column">
                                <div class="version-list-header">
                                    <h3>${i18n('version_history_title')}</h3>
                                    <div class="version-list-count">
                                        <span class="total-count">0</span>
                                    </div>
                                </div>

                                <div class="version-list-container" id="version-list-container">
                                    <div class="loading-indicator">
                                        <div class="loading-spinner"></div>
                                        <div class="loading-text">${i18n('version_loading')}</div>
                                    </div>
                                </div>
                            </div>

                            <!-- 右侧版本详情 -->
                            <div class="version-detail-column">
                                <div class="version-detail-header">
                                    <h3 id="detail-version-title">${i18n('version_current_tab')}</h3>
                                    <div class="version-detail-meta" id="detail-version-meta">
                                        <span class="detail-version">v${this.currentVersion}</span>
                                        <span class="detail-date"></span>
                                    </div>
                                </div>

                                <div class="version-detail-content" id="version-detail-content">
                                    <div class="loading-indicator">
                                        <div class="loading-spinner"></div>
                                        <div class="loading-text">${i18n('version_loading_details')}</div>
                                    </div>
                                </div>

                                <!-- 链接复制通知容器 -->
                                <div class="link-notification-container" id="link-notification-container"></div>

                                <!-- 滚动提示 -->
                                <div class="scroll-hint" id="scroll-hint">
                                    ${i18n('version_scroll_hint')}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="modal-footer">
                        <div class="footer-left">
                            <button class="action-btn secondary-btn" id="dont-show-btn">
                                ${i18n('version_dont_show_again')}
                            </button>
                        </div>
                        <div class="footer-right">
                            <button class="action-btn" id="understand-btn">
                                ${i18n('version_i_understand')}
                                <span class="countdown-text" id="countdown-text"></span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    // 绑定事件
    private bindEvents(): void {
        if (!this.updateModal) return;

        // 关闭按钮
        const closeBtn = document.getElementById('modal-close');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                this.stopCountdown();
                this.hideModal();
            });
        }

        // 我知道了按钮
        const understandBtn = document.getElementById('understand-btn');
        if (understandBtn) {
            understandBtn.addEventListener('click', () => {
                this.stopCountdown();
                this.hideModal();
            });
        }

        // 不再显示按钮
        const dontShowBtn = document.getElementById('dont-show-btn');
        if (dontShowBtn) {
            dontShowBtn.addEventListener('click', () => {
                this.stopCountdown();
                this.disableFutureUpdates();
                this.hideModal();
            });
        }

        // 点击遮罩层关闭
        const overlay = this.updateModal.querySelector('.modal-overlay');
        if (overlay) {
            overlay.addEventListener('click', () => this.hideModal());
        }

        // ESC键关闭
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.updateModal?.classList.contains('show')) {
                this.hideModal();
            }
        });
    }

    // 显示弹窗
    showModal(): void {
        if (!this.updateModal) return;

        // 显示弹窗
        setTimeout(() => {
            this.updateModal!.classList.add('show');

            // 开始倒数计时
            if (versionConfig.SHOW_SETTINGS.autoCloseDelay > 0) {
                this.startCountdown();
            }
        }, 100);
    }

    // 隐藏弹窗
    hideModal(): void {
        if (!this.updateModal) return;

        // 停止倒数计时
        this.stopCountdown();

        // 清理所有链接复制通知
        this.cleanupLinkNotifications();

        // 移除用户交互检测
        this.removeUserInteractionDetection();

        // 隐藏弹窗
        this.updateModal.classList.remove('show');

        // 动画结束后移除元素
        setTimeout(() => {
            if (this.updateModal && this.updateModal.parentNode) {
                this.updateModal.parentNode.removeChild(this.updateModal);
                this.updateModal = null;
                this.isInitialized = false;
            }
        }, versionConfig.SHOW_SETTINGS.animationDuration);
    }

    // 开始倒数计时
    private startCountdown(): void {
        // 重置倒数时间
        this.remainingSeconds = Math.floor(versionConfig.SHOW_SETTINGS.autoCloseDelay / 1000);
        this.countdownActive = true;

        // 更新按钮显示
        this.updateCountdownDisplay();

        // 清除已有的计时器
        if (this.countdownInterval) {
            clearInterval(this.countdownInterval);
        }

        // 设置鼠标移动检测
        this.setupMouseMoveDetection();

        // 开始检查鼠标状态
        this.checkMouseStateAndStartCountdown();
    }

    // 停止倒数计时
    private stopCountdown(): void {
        this.countdownActive = false;

        // 清除倒数计时器
        if (this.countdownInterval) {
            clearInterval(this.countdownInterval);
            this.countdownInterval = null;
        }

        // 清除鼠标移动检测定时器
        if (this.mouseMoveTimer) {
            clearTimeout(this.mouseMoveTimer);
            this.mouseMoveTimer = null;
        }

        // 移除鼠标移动监听器
        if (this.mouseMoveHandler) {
            document.removeEventListener('mousemove', this.mouseMoveHandler);
            this.mouseMoveHandler = null;
        }

        // 移除用户交互检测
        this.removeUserInteractionDetection();

        // 恢复按钮原始文本
        const countdownText = document.getElementById('countdown-text');
        if (countdownText) {
            countdownText.textContent = '';
        }
    }

    // 更新倒数显示
    private updateCountdownDisplay(): void {
        const countdownText = document.getElementById('countdown-text');
        if (countdownText) {
            if (this.remainingSeconds > 0) {
                countdownText.textContent = ` (${this.remainingSeconds}s)`;

                // 使用CSS类控制样式
                countdownText.className = 'countdown-text';
                if (this.remainingSeconds <= 5) {
                    countdownText.classList.add('countdown-warning');
                }
            } else {
                countdownText.textContent = '';
                countdownText.className = 'countdown-text';
            }
        }
    }

    // 设置鼠标移动检测
    private setupMouseMoveDetection(): void {
        // 移除旧的监听器（如果存在）
        if (this.mouseMoveHandler) {
            document.removeEventListener('mousemove', this.mouseMoveHandler);
        }

        // 创建新的鼠标移动处理器
        this.mouseMoveHandler = () => {
            this.handleMouseMove();
        };

        // 添加鼠标移动监听器
        document.addEventListener('mousemove', this.mouseMoveHandler);

        // 设置用户交互检测
        this.setupUserInteractionDetection();

        // 重置鼠标移动时间
        this.lastMouseMoveTime = Date.now();
        this.isMouseMoving = true;
    }

    // 处理鼠标移动事件
    private handleMouseMove(): void {
        this.lastMouseMoveTime = Date.now();
        this.isMouseMoving = true;

        // 如果计时器正在运行，重置它
        if (this.countdownActive && this.countdownInterval) {
            this.resetCountdown();
        }
    }

    // 检查鼠标状态并开始倒数
    private checkMouseStateAndStartCountdown(): void {
        // 清除现有的鼠标状态检查定时器
        if (this.mouseMoveTimer) {
            clearTimeout(this.mouseMoveTimer);
        }

        const now = Date.now();
        const timeSinceLastMove = now - this.lastMouseMoveTime;

        if (timeSinceLastMove >= this.mouseMoveTimeout) {
            // 已经超过3秒无鼠标移动，开始倒数计时
            this.startCountdownTimer();
        } else {
            // 等待到无鼠标移动状态
            const waitTime = this.mouseMoveTimeout - timeSinceLastMove;

            this.mouseMoveTimer = setTimeout(() => {
                this.startCountdownTimer();
            }, waitTime);
        }
    }

    // 开始倒数计时器
    private startCountdownTimer(): void {
        // 清除已有的计时器
        if (this.countdownInterval) {
            clearInterval(this.countdownInterval);
        }

        // 开始新的计时器
        this.countdownInterval = setInterval(() => {
            if (this.remainingSeconds > 0) {
                this.remainingSeconds--;
                this.updateCountdownDisplay();
            } else {
                // 倒数结束，自动关闭弹窗
                this.stopCountdown();
                this.hideModal();
            }
        }, 1000);
    }

    // 重置倒数计时
    private resetCountdown(): void {
        // 重置剩余时间
        this.remainingSeconds = Math.floor(versionConfig.SHOW_SETTINGS.autoCloseDelay / 1000);

        // 更新显示
        this.updateCountdownDisplay();

        // 重新检查鼠标状态
        this.checkMouseStateAndStartCountdown();
    }

    // 设置用户交互检测
    private setupUserInteractionDetection(): void {
        // 移除旧的监听器
        this.removeUserInteractionDetection();

        // 创建交互处理器
        this.userInteractionHandler = () => {
            this.handleUserInteraction();
        };

        // 添加各种交互事件监听
        const modal = this.updateModal;
        if (modal) {
            // 点击事件
            modal.addEventListener('click', this.userInteractionHandler);

            // 触摸事件（移动端）
            modal.addEventListener('touchstart', this.userInteractionHandler);
            modal.addEventListener('touchmove', this.userInteractionHandler);
        }
    }

    // 移除用户交互检测
    private removeUserInteractionDetection(): void {
        if (this.userInteractionHandler && this.updateModal) {
            this.updateModal.removeEventListener('click', this.userInteractionHandler);
            this.updateModal.removeEventListener('touchstart', this.userInteractionHandler);
            this.updateModal.removeEventListener('touchmove', this.userInteractionHandler);
            this.userInteractionHandler = null;
        }
    }

    // 处理用户交互
    private handleUserInteraction(): void {
        // 重置鼠标移动时间，模拟鼠标移动
        this.lastMouseMoveTime = Date.now();
        this.isMouseMoving = true;

        // 如果计时器正在运行，重置它
        if (this.countdownActive && this.countdownInterval) {
            this.resetCountdown();
        }
    }

    // 清理所有链接复制通知
    private cleanupLinkNotifications(): void {
        // 清理版本弹窗内的通知
        const linkNotificationContainer = document.getElementById('link-notification-container');
        if (linkNotificationContainer) {
            linkNotificationContainer.innerHTML = '';
        }

        // 清理页面上的通知（备用情况）
        const pageNotifications = document.querySelectorAll('.link-copy-notification');
        pageNotifications.forEach(notification => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        });
    }

    // 绑定全局事件（在构造函数中调用）
    private bindGlobalEvents(): void {
        // 版本列表项点击事件
        document.addEventListener('click', (e) => {
            const versionItem = (e.target as HTMLElement).closest('.version-list-item');

            if (versionItem) {
                const version = (versionItem as HTMLElement).dataset.version;
                this.selectVersionInternal(version || '');
            }
        });
    }

    // 禁用未来更新提示
    private disableFutureUpdates(): void {
        versionConfig.SHOW_SETTINGS.showOnUpdate = false;
        versionConfig.SHOW_SETTINGS.showOnFirstLoad = false;

        localStorage.setItem('perfectwall_disable_updates', 'true');
    }

    // 手动显示版本信息
    async showVersionInfo(): Promise<void> {
        // 如果从未初始化过，先加载版本历史
        if (!this.isInitialized) {
            try {
                versionConfig.VERSION_HISTORY = await VERSION_HISTORY_PROMISE;
                this.createModalHTML();
                this.bindEvents();
                this.isInitialized = true;
            } catch (error) {
                console.error("初始化版本弹窗失败:", error);
                return;
            }
        }
        this.showModal();
    }

    // 更新版本配置（外部调用）
    updateConfig(newConfig: Partial<typeof versionConfig>): void {
        Object.assign(versionConfig, newConfig);
        this.currentVersion = versionConfig.CURRENT_VERSION;
        this.isNewVersion = this.checkVersionUpdate();
    }

    // 检测用户交互（供外部调用）
    detectUserInteraction(): void {
        this.handleUserInteraction();
    }

    // 选择版本（供外部调用）
    selectVersion(version: string): void {
        this.selectedVersion = version;
        // 这里可以添加更新版本详情的逻辑
    }

    // 填充弹窗内容
    private fillModalContent(): void {
        // 填充版本列表
        const listContainer = document.getElementById('version-list-container');
        const countElement = document.querySelector('.total-count');

        if (listContainer && countElement) {
            listContainer.innerHTML = this.renderVersionList();
            countElement.textContent = versionConfig.VERSION_HISTORY.length + " " + i18n('version_units');
        }

        // 填充当前版本详情
        const versionInfo = this.getCurrentVersionInfo();

        // 更新标题
        const titleElement = document.getElementById('detail-version-title');
        if (titleElement && versionInfo) {
            titleElement.textContent = (versionInfo.title as string) || `版本 v${versionInfo.version}`;
        }

        // 更新元信息
        const metaElement = document.getElementById('detail-version-meta');
        if (metaElement && versionInfo) {
            metaElement.innerHTML = `
                <span class="detail-version">v${versionInfo.version}</span>
                <span class="detail-date">${versionInfo.date}</span>
            `;
        }

        // 更新内容
        const contentElement = document.getElementById('version-detail-content');
        if (contentElement && versionInfo) {
            contentElement.innerHTML = this.renderVersionDetailContent(versionInfo);
        }

        // 绑定全局事件（版本列表点击等）
        this.bindGlobalEvents();
    }

    // 渲染纯文本更新内容
    private renderPlainChanges(changes: unknown): string {
        if (!changes || !Array.isArray(changes)) return '';

        return `<ul class="plain-changes-list">${(changes as unknown[]).map((change: unknown) =>
            `<li>${change}</li>`
        ).join('')}</ul>`;
    }

    // 渲染版本详情内容
    private renderVersionDetailContent(versionInfo: unknown): string {
        if (!versionInfo) return '<div class="no-data">' + i18n('version_no_data') + '</div>';

        const info = versionInfo as Record<string, unknown>;

        return `
            <div class="version-detail">
                ${versionConfig.IMAGE_SETTINGS.showImage && info.image && (info.image as string).trim() !== '' ? `
                    <div class="version-image-container">
                        <img src="${info.image}"
                             class="version-image"
                             style="max-height: ${versionConfig.IMAGE_SETTINGS.maxHeight}; width: auto; max-width: 100%;
                             ${versionConfig.IMAGE_SETTINGS.lazyLoad ? 'loading="lazy"' : ''}">
                        <div class="image-info">
                            <div class="image-description">
                                ${SimpleMarkdown.parse(info.imageAlt as string) || i18n('version_image_default_alt')}
                            </div>
                        </div>
                    </div>
                ` : ''}

                <div class="version-changes">
                    <h4>${i18n('version_changes_title')}</h4>
                    <div class="changes-content">
                        ${versionConfig.SHOW_SETTINGS.enableMarkdown ?
                SimpleMarkdown.parse(((info.changes as string[]) || []).join('\n')) :
                this.renderPlainChanges(info.changes)
            }
                    </div>
                </div>
            </div>
        `;
    }

    // 渲染版本列表（用于左侧栏）
    private renderVersionList(): string {
        const allHistory = this.getAllVersionHistory();

        return allHistory.map((history: VersionHistoryEntry) => {
            const versionInfo = this.getVersionInfo(history.version);
            const isCurrent = history.version === this.currentVersion;
            const isSelected = history.version === this.selectedVersion;

            return `
                <div class="version-list-item ${isCurrent ? 'current' : ''} ${isSelected ? 'selected' : ''}"
                     data-version="${history.version}">
                    <div class="version-item-header">
                        <div class="version-item-left">
                            <span class="version-number">v${history.version}</span>
                            ${isCurrent ? '<span class="current-indicator">' + i18n('version_current_badge') + '</span>' : ''}
                        </div>
                        <div class="version-item-right">
                            <span class="version-date">${history.date}</span>
                        </div>
                    </div>
                    <div class="version-item-title">
                        ${versionInfo?.title || (history.titleKey ? i18n(history.titleKey) : '') || i18n('version_fallback_title_with_version') + ' ' + history.version}
                    </div>
                </div>
            `;
        }).join('');
    }

    // 获取指定版本的更新信息（带i18n处理）
    private getVersionInfo(version?: string): Record<string, unknown> | null {
        const targetVersion = version !== undefined ? version : this.selectedVersion;

        if (!targetVersion) {
            return null;
        }

        if (!versionConfig.VERSION_HISTORY || !Array.isArray(versionConfig.VERSION_HISTORY)) {
            return null;
        }

        const rawInfo = versionConfig.VERSION_HISTORY.find((info: VersionHistoryEntry) => info.version === targetVersion);

        if (!rawInfo) {
            return null;
        }

        return this.processVersionInfoWithI18n(rawInfo);
    }

    // 处理版本信息的i18n转换
    private processVersionInfoWithI18n(rawInfo: any): Record<string, unknown> | null {
        if (!rawInfo) return null;

        const processedInfo: Record<string, unknown> = { ...rawInfo };

        // 处理标题
        if (rawInfo.titleKey) {
            processedInfo.title = i18n(rawInfo.titleKey);
        } else if (rawInfo.title) {
            processedInfo.title = rawInfo.title;
        } else {
            processedInfo.title = i18n('version_fallback_title') + rawInfo.version;
        }

        // 处理图片替代文本
        if (rawInfo.imageAltKey) {
            processedInfo.imageAlt = i18n(rawInfo.imageAltKey);
        } else if (rawInfo.imageAlt) {
            processedInfo.imageAlt = rawInfo.imageAlt;
        } else {
            processedInfo.imageAlt = i18n('version_image_default_alt');
        }

        // 处理更新内容
        if (rawInfo.changesKey) {
            const changesText = i18n(rawInfo.changesKey);
            processedInfo.changes = changesText.split('\n').filter((line: string) => line.trim() !== '');
        } else if (rawInfo.changes) {
            processedInfo.changes = rawInfo.changes;
        } else {
            processedInfo.changes = [];
        }

        return processedInfo;
    }

    // 获取当前版本的更新信息
    private getCurrentVersionInfo(): Record<string, unknown> | null {
        return this.getVersionInfo(this.currentVersion);
    }

    // 获取所有更新历史（按日期降序排列，最新的在前面）
    private getAllVersionHistory(): any[] {
        if (!versionConfig.VERSION_HISTORY || !Array.isArray(versionConfig.VERSION_HISTORY)) {
            return [];
        }

        return versionConfig.VERSION_HISTORY.sort((a: any, b: any) => {
            const dateA = new Date(a.date);
            const dateB = new Date(b.date);
            return dateB.getTime() - dateA.getTime();
        });
    }

    // 选择版本（更新右侧详情）
    private selectVersionInternal(version: string): void {
        if (!version || this.selectedVersion === version) return;

        // 更新选中的版本
        this.selectedVersion = version;

        // 更新左侧列表选中状态
        this.updateVersionListSelection();

        // 更新右侧详情内容
        this.updateVersionDetail();
    }

    // 更新版本列表选中状态
    private updateVersionListSelection(): void {
        const listItems = document.querySelectorAll('.version-list-item');
        listItems.forEach(item => {
            const ver = (item as HTMLElement).dataset.version;
            item.classList.toggle('selected', ver === this.selectedVersion);
        });
    }

    // 更新版本详情
    private updateVersionDetail(): void {
        const versionInfo = this.getVersionInfo(this.selectedVersion ?? undefined);

        // 更新标题
        const titleElement = document.getElementById('detail-version-title');
        if (titleElement && versionInfo) {
            titleElement.textContent = (versionInfo.title as string) || `版本 v${versionInfo.version}`;
        }

        // 更新元信息
        const metaElement = document.getElementById('detail-version-meta');
        if (metaElement && versionInfo) {
            metaElement.innerHTML = `
                <span class="detail-version">v${versionInfo.version}</span>
                <span class="detail-date">${versionInfo.date}</span>
                ${versionInfo.version === this.currentVersion ?
                    '<span class="current-badge">' + i18n('version_current_version') + '</span>' : ''}
            `;
        }

        // 更新内容
        const contentElement = document.getElementById('version-detail-content');
        if (contentElement) {
            contentElement.innerHTML = this.renderVersionDetailContent(versionInfo);
        }
    }
}

// 创建全局版本管理器实例并挂载到 runtime
const versionManagerInstance = new versionManager();
if (config.runtime) {
    config.runtime.versionManager = versionManagerInstance;
}

// 暴露 SimpleMarkdown 到全局作用域，使 onclick="SimpleMarkdown.copyLink(this)" 能正常工作
window.SimpleMarkdown = SimpleMarkdown;

// 等待初始化完成
waitAndExecute(
    () => {
        const complete = config.update_init_complete === true;
        return complete;
    },
    () => {
        if (!config.runtime.versionManager) {
            config.runtime.versionManager = new versionManager();
        }

        // 延迟显示，确保其他内容已加载
        setTimeout(async () => {
            if (config.runtime.versionManager) {
                try {
                    await config.runtime.versionManager.initUpdateModal();
                } catch (error) {
                    console.error("初始化版本弹窗失败:", error);
                }
            }
        }, 2000);
    },
    500, 15000);

// 导出
export { versionManager };
