/**
 * Version module - Version manager class with modal UI, countdown, and interaction logic
 *
 * 真 Vue 化：原 createModalHTML / getModalHTML / createFallbackModal /
 * bindEvents / bindGlobalEvents 动态创建弹窗 DOM 并绑定事件，现全部改为
 * 写入 `versionUiState`，由 Version.vue 模板渲染；按钮点击由模板 @click
 * 转发到本类方法。对外 API（initUpdateModal / showModal / hideModal /
 * showVersionInfo / updateConfig / detectUserInteraction / selectVersion）
 * 与拆分前一致。
 */

import { globalT, i18n } from '@/utils/i18n';
import { escapeHtml } from '@/utils/string';

import {
    VERSION_HISTORY_PROMISE,
    versionConfig,
    type VersionHistoryEntry,
} from './config';
import { SimpleMarkdown } from './simple-markdown';
import { buildGithubImageUrl } from './imageSource';
import { useVersionStore, type VersionListItem } from './store';

// 惰性访问：避免模块顶层无 Pinia 调用（测试/非 App 场景会报错）
function getVersionState() {
    return useVersionStore();
}
const _versionStateProxy = new Proxy(
    {},
    {
        get(_target, prop: string | symbol) {
            return (getVersionState() as unknown as Record<string | symbol, unknown>)[prop];
        },
        set(_target, prop: string | symbol, value: unknown) {
            (getVersionState() as unknown as Record<string | symbol, unknown>)[prop] = value;
            return true;
        },
        has(_target, prop: string | symbol) {
            return prop in getVersionState();
        },
    }
) as unknown as ReturnType<typeof useVersionStore>;
const versionUiState = _versionStateProxy;

/**
 * 安全的 i18n 取值函数 —— 直接读取原始消息字典，绕过 vue-i18n 消息编译器。
 *
 * 原因：vue-i18n 9 的 t() 在编译消息时会解析 linked message 语法（@:key），
 * 而 changelog 内容中的 "BiliBili@小星星" 等文本会被误判为无效的 linked
 * format 并抛出 SyntaxError 10 (INVALID_LINKED_FORMAT)。
 *
 * 本函数直接从 getLocaleMessage() 获取原始字符串，不经过编译器。
 * 如果找不到对应 key，回退到 globalT() 处理缺失 key 的回退逻辑。
 */
function safeT(key: string): string {
    try {
        const composer = i18n.global as unknown as {
            locale: { value: string };
            getLocaleMessage: (locale: string) => Record<string, unknown> | undefined;
            fallbackLocale?: { value: string };
        };
        const locale: string = composer.locale.value;
        // 优先查当前 locale 的原始消息
        const localeMsg = composer.getLocaleMessage(locale)?.[key];
        if (typeof localeMsg === 'string') return localeMsg;
        // 查 fallback locale
        const fallback =
            typeof composer.fallbackLocale?.value === 'string'
                ? composer.fallbackLocale.value
                : 'zh-CN';
        if (fallback !== locale) {
            const fbMsg = composer.getLocaleMessage(fallback)?.[key];
            if (typeof fbMsg === 'string') return fbMsg;
        }
    } catch {
        // 任何异常回退到 globalT（不会在此场景下发生，但安全兜底）
    }
    return globalT(key);
}

export class versionManager {
    private isInitialized = false;
    /** 防止异步初始化时的竞态条件 */
    private initializing = false;
    /** 保存最近一次 contentError，供后续展示降级内容 */
    private contentError: string | null = null;
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
        // ESC 关闭（原 bindEvents 在弹窗创建时绑定；模板常驻后改为构造时绑定一次）
        document.addEventListener('keydown', this.escKeyHandler);
    }

    /** ESC 关闭弹窗（原 bindEvents 内 document keydown 监听） */
    private escKeyHandler = (e: KeyboardEvent): void => {
        if (e.key === 'Escape' && versionUiState.visible) {
            this.hideModal();
        }
    };

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

        // 用户点过"不再显示"（dontShowAgain 写入 perfectwall_disable_updates）
        // 则永久不自动弹——该 key 此前只写不读，导致"不再显示"实际未生效。
        if (localStorage.getItem('perfectwall_disable_updates') === 'true') {
            return false;
        }

        return isNewVersion && versionConfig.SHOW_SETTINGS.showOnUpdate;
    }

    async initUpdateModal(): Promise<void> {
        if (this.isInitialized || this.initializing) return;

        // 首次加载不应因 !isNewVersion 直接 return，否则历史数据永远不会
        // 填充，首帧若恰好满足 show 条件就会展示空白内容。
        // 先把内容准备好，是否自动弹出由外层调用方决定。
        this.initializing = true;
        try {
            // 加载版本历史（幂等：VERSION_HISTORY_PROMISE 单例）
            versionConfig.VERSION_HISTORY = await VERSION_HISTORY_PROMISE;

            // 填充响应式状态（原 createModalHTML + fillModalContent）
            this.fillModalContent();

            this.isInitialized = true;

            // 仅在新版本时自动弹
            if (!this.isNewVersion) return;

            // 显示弹窗
            setTimeout(() => {
                this.showModal();
            }, 2000);
        } catch (error) {
            console.error('初始化版本弹窗失败:', error);
            // 兜底：至少给出空壳，避免 detailContentHtml 永远空白
            try {
                this.createFallbackModal();
                this.isInitialized = true;
            } catch {}
        } finally {
            this.initializing = false;
        }
    }

    // 显示弹窗
    showModal(): void {
        // 弹窗已打开时不再重复打开
        if (versionUiState.visible) return;

        // 显示弹窗（保留原 100ms 延迟，触发 .show 过渡动画）
        setTimeout(() => {
            versionUiState.visible = true;

            // 开始倒计时
            if (versionConfig.SHOW_SETTINGS.autoCloseDelay > 0) {
                this.startCountdown();
            }
        }, 100);
    }

    // 隐藏弹窗
    hideModal(): void {
        // 停止倒计时
        this.stopCountdown();

        // 清理所有链接复制通知
        this.cleanupLinkNotifications();

        // 移除用户交互检测
        this.removeUserInteractionDetection();

        // 标记为未初始化，让下一次 showVersionInfo 能重建
        this.isInitialized = false;

        // 隐藏弹窗（原 classList.remove('show') + 动画后移除 DOM；
        // 模板常驻，仅移除 .show class）
        versionUiState.visible = false;
    }

    // 开始倒计时
    private startCountdown(): void {
        // 重置倒计时时间
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

    // 停止倒计时
    private stopCountdown(): void {
        this.countdownActive = false;

        // 清除倒计时器
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
        versionUiState.countdownText = '';
        versionUiState.countdownWarning = false;
    }

    // 更新倒数显示
    private updateCountdownDisplay(): void {
        if (this.remainingSeconds > 0) {
            versionUiState.countdownText = ` (${this.remainingSeconds}s)`;
            // 使用CSS类控制样式
            versionUiState.countdownWarning = this.remainingSeconds <= 5;
        } else {
            versionUiState.countdownText = '';
            versionUiState.countdownWarning = false;
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
            // 已经超过3秒无鼠标移动，开始倒计时
            this.startCountdownTimer();
        } else {
            // 等待到无鼠标移动状态
            const waitTime = this.mouseMoveTimeout - timeSinceLastMove;

            this.mouseMoveTimer = setTimeout(() => {
                this.startCountdownTimer();
            }, waitTime);
        }
    }

    // 开始倒计时器
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

    // 重置倒计时
    private resetCountdown(): void {
        // 重置剩余时间
        this.remainingSeconds = Math.floor(versionConfig.SHOW_SETTINGS.autoCloseDelay / 1000);

        // 更新显示
        this.updateCountdownDisplay();

        // 重新检查鼠标状态
        this.checkMouseStateAndStartCountdown();
    }

    // 设置用户交互检测
    // 原实现监听弹窗元素 click/touch；模板常驻后改监听 document。
    // 行为等价：弹窗外的点击会命中遮罩 → hideModal()，不会改变倒计时结果。
    private setupUserInteractionDetection(): void {
        // 移除旧的监听器
        this.removeUserInteractionDetection();

        // 创建交互处理器
        this.userInteractionHandler = () => {
            this.handleUserInteraction();
        };

        // 添加各种交互事件监听
        document.addEventListener('click', this.userInteractionHandler);
        document.addEventListener('touchstart', this.userInteractionHandler);
        document.addEventListener('touchmove', this.userInteractionHandler);
    }

    // 移除用户交互检测
    private removeUserInteractionDetection(): void {
        if (this.userInteractionHandler) {
            document.removeEventListener('click', this.userInteractionHandler);
            document.removeEventListener('touchstart', this.userInteractionHandler);
            document.removeEventListener('touchmove', this.userInteractionHandler);
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

    // 禁用未来更新提示
    private disableFutureUpdates(): void {
        versionConfig.SHOW_SETTINGS.showOnUpdate = false;
        versionConfig.SHOW_SETTINGS.showOnFirstLoad = false;

        localStorage.setItem('perfectwall_disable_updates', 'true');
    }

    // 手动显示版本信息
    async showVersionInfo(): Promise<void> {
        // 弹窗已打开时不再重复打开
        if (versionUiState.visible) return;

        // 防止异步初始化期间的竞态条件
        if (this.initializing) {
            // 已有初始化在进行中，等待完成后再展示
            const waitForInit = (): Promise<void> => {
                return new Promise(resolve => {
                    const check = (): void => {
                        if (this.isInitialized || !this.initializing) {
                            resolve();
                        } else {
                            setTimeout(check, 50);
                        }
                    };
                    check();
                });
            };
            await waitForInit();
            this.showModal();
            return;
        }

        // 如果从未初始化过，先加载版本历史
        if (!this.isInitialized) {
            this.initializing = true;
            try {
                versionConfig.VERSION_HISTORY = await VERSION_HISTORY_PROMISE;
                this.fillModalContent();
                this.isInitialized = true;
            } catch (error) {
                console.error('初始化版本弹窗失败:', error);
                // 即使加载失败，也尝试显示降级弹窗
                this.createFallbackModal();
                this.isInitialized = true;
            } finally {
                this.initializing = false;
            }
        }
        this.showModal();
    }

    /** 创建降级弹窗（版本历史/更新内容加载失败时的备用显示） */
    private createFallbackModal(): void {
        versionUiState.isFallback = true;
        versionUiState.isNewVersion = false;
        versionUiState.modalTitle = globalT('version_info_title');
        versionUiState.loading = false;
        versionUiState.versionList = [];
        versionUiState.detailContentHtml = '';
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

    /** 版本列表项点击（模板 @click；原 bindGlobalEvents 的委托逻辑） */
    selectVersionFromList(version: string): void {
        this.selectVersionInternal(version);
    }

    /** 不再显示按钮（模板 @click；原 bindEvents 内 dontShowBtn 处理） */
    dontShowAgain(): void {
        this.disableFutureUpdates();
        this.hideModal();
    }

    // 填充弹窗内容（原 createModalHTML + fillModalContent 的 DOM 写入 →
    // 写 versionUiState，模板渲染）
    private fillModalContent(): void {
        versionUiState.isFallback = false;
        versionUiState.isNewVersion = this.isNewVersion;
        versionUiState.modalTitle = this.isNewVersion
            ? globalT('version_update_title')
            : globalT('version_info_title');
        versionUiState.currentVersion = this.currentVersion;
        // 首次初始化时 this.selectedVersion 仍为 null，直接渲染会因
        // getVersionInfo(null) 返回空而导致右侧详情空白。默认选中当前版本。
        if (this.selectedVersion == null) {
            this.selectedVersion = this.currentVersion;
        }
        versionUiState.selectedVersion = this.selectedVersion;
        versionUiState.loading = false;

        // 填充版本列表（原 renderVersionList innerHTML 写入）
        versionUiState.totalCountText =
            versionConfig.VERSION_HISTORY.length + ' ' + globalT('version_units');
        versionUiState.versionList = this.buildVersionListData();

        // 填充当前版本详情（原 #detail-version-title / meta / content 写入）
        this.updateVersionDetail();
    }

    // 渲染纯文本更新内容（变更文本需转义，避免 v-html 注入）
    private renderPlainChanges(changes: unknown): string {
        if (!changes || !Array.isArray(changes)) return '';
        return `<ul class="plain-changes-list">${(changes as unknown[])
            .map((change: unknown) => `<li>${escapeHtml(String(change))}</li>`)
            .join('')}</ul>`;
    }

    // 渲染版本详情内容
    private renderVersionDetailContent(versionInfo: unknown): string {
        if (!versionInfo) return '<div class="no-data">' + globalT('version_no_data') + '</div>';

        const info = versionInfo as Record<string, unknown>;

        return `
            <div class="version-detail">
                ${
                    versionConfig.IMAGE_SETTINGS.showImage &&
                    info.image &&
                    (info.image as string).trim() !== ''
                        ? `
                    <div class="version-image-container">
                        <div class="version-image-stack">
                            <!-- 底层：本地压缩版，立即显示（撑起布局） -->
                            <img class="version-image version-image-local"
                                 src="${escapeHtml(info.image as string)}"
                                 style="max-height: ${escapeHtml(versionConfig.IMAGE_SETTINGS.maxHeight)}; width: auto; max-width: 100%;"
                                 ${versionConfig.IMAGE_SETTINGS.lazyLoad ? 'loading="lazy"' : ''}>
                            <!-- 顶层：GitHub 原图（交错 PNG 渐进式加载），
                                 加载完成后由 applyImageSourceFallback 加 .loaded 淡入覆盖 -->
                            <img class="version-image version-image-github"
                                 data-github="${escapeHtml(this.resolveGithubImageUrl(info))}"
                                 alt="">
                        </div>
                        <div class="image-info">
                            <div class="image-description">
                                ${SimpleMarkdown.parse(info.imageAlt as string) || escapeHtml(globalT('version_image_default_alt'))}
                            </div>
                        </div>
                    </div>
                `
                        : ''
                }

                <div class="version-changes">
                    <h4>${globalT('version_changes_title')}</h4>
                    <div class="changes-content">
                        ${
                            versionConfig.SHOW_SETTINGS.enableMarkdown
                                ? SimpleMarkdown.parse(
                                      ((info.changes as string[]) || []).join('\n')
                                  )
                                : this.renderPlainChanges(info.changes)
                        }
                    </div>
                </div>
            </div>
        `;
    }

    // 构建版本列表数据（原 renderVersionList 的 innerHTML → 数据对象数组）
    private buildVersionListData(): VersionListItem[] {
        const allHistory = this.getAllVersionHistory();

        return allHistory.map((history: VersionHistoryEntry) => {
            const versionInfo = this.getVersionInfo(history.version);
            const isCurrent = history.version === this.currentVersion;
            const isSelected = history.version === this.selectedVersion;

            return {
                version: history.version,
                date: history.date,
                title:
                    (versionInfo?.title as string) ||
                    (history.titleKey ? globalT(history.titleKey) : '') ||
                    globalT('version_fallback_title_with_version') + ' ' + history.version,
                isCurrent,
                isSelected,
            };
        });
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

        const rawInfo = versionConfig.VERSION_HISTORY.find(
            (info: VersionHistoryEntry) => info.version === targetVersion
        );

        if (!rawInfo) {
            return null;
        }

        return this.processVersionInfoWithI18n(rawInfo);
    }

    // 处理版本信息的i18n转换
    private processVersionInfoWithI18n(
        rawInfo: VersionHistoryEntry
    ): Record<string, unknown> | null {
        if (!rawInfo) return null;

        const processedInfo: Record<string, unknown> = { ...rawInfo };

        // 处理标题
        if (rawInfo.titleKey) {
            processedInfo.title = safeT(rawInfo.titleKey);
        } else if (rawInfo.title) {
            processedInfo.title = rawInfo.title;
        } else {
            processedInfo.title = safeT('version_fallback_title') + rawInfo.version;
        }

        // 处理图片替代文本
        if (rawInfo.imageAltKey) {
            processedInfo.imageAlt = safeT(rawInfo.imageAltKey);
        } else if (rawInfo.imageAlt) {
            processedInfo.imageAlt = rawInfo.imageAlt;
        } else {
            processedInfo.imageAlt = safeT('version_image_default_alt');
        }

        // 处理更新内容
        if (rawInfo.changesKey) {
            const changesText = safeT(rawInfo.changesKey);
            processedInfo.changes = changesText
                .split('\n')
                .filter((line: string) => line.trim() !== '');
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
    private getAllVersionHistory(): VersionHistoryEntry[] {
        if (!versionConfig.VERSION_HISTORY || !Array.isArray(versionConfig.VERSION_HISTORY)) {
            return [];
        }

        return versionConfig.VERSION_HISTORY.sort(
            (a: VersionHistoryEntry, b: VersionHistoryEntry) => {
                const dateA = new Date(a.date);
                const dateB = new Date(b.date);
                return dateB.getTime() - dateA.getTime();
            }
        );
    }

    // 选择版本（更新右侧详情）
    private selectVersionInternal(version: string): void {
        if (!version || this.selectedVersion === version) return;

        // 更新选中的版本
        this.selectedVersion = version;

        // 更新左侧列表选中状态（原 updateVersionListSelection class 写入）
        versionUiState.selectedVersion = version;
        versionUiState.versionList.forEach(item => {
            item.isSelected = item.version === version;
        });

        // 更新右侧详情内容
        this.updateVersionDetail();
    }

    // 更新版本详情（原 #detail-version-title / meta / content innerHTML 写入 →
    // 写 versionUiState，模板渲染）
    private updateVersionDetail(): void {
        const versionInfo = this.getVersionInfo(this.selectedVersion ?? undefined);

        versionUiState.selectedVersion = this.selectedVersion ?? '';

        if (versionInfo) {
            // 更新标题
            versionUiState.detailTitle =
                (versionInfo.title as string) || `版本 v${versionInfo.version}`;

            // 更新元信息（.detail-version / .detail-date / .current-badge）
            versionUiState.detailVersion = versionInfo.version as string;
            versionUiState.detailDate = versionInfo.date as string;

            // 更新内容（含 SimpleMarkdown 解析结果，模板 v-html）
            versionUiState.detailContentHtml = this.renderVersionDetailContent(versionInfo);
        } else {
            versionUiState.detailTitle = '';
            versionUiState.detailVersion = '';
            versionUiState.detailDate = '';
            versionUiState.detailContentHtml = '';
        }

        // 详情渲染后，附图优先加载 GitHub 原图，超时/失败回退本地压缩版。
        // v-html 的 DOM 更新在 Vue 下一帧才生效，故延迟到 rAF 再定位 <img>。
        if (typeof requestAnimationFrame === 'function') {
            requestAnimationFrame(() => this.applyImageSourceFallback());
        } else {
            this.applyImageSourceFallback();
        }
    }

    /**
     * 由版本信息推导 GitHub 原图 URL：
     * 优先用 imageOriginal 覆盖，否则按 image 路径从 GITHUB_IMAGE.baseUrl 推导。
     */
    private resolveGithubImageUrl(info: Record<string, unknown>): string {
        const cfg = versionConfig.GITHUB_IMAGE;
        if (cfg.enabled && info.imageOriginal && (info.imageOriginal as string).trim() !== '') {
            return info.imageOriginal as string;
        }
        if (
            cfg.enabled &&
            info.image &&
            (info.image as string).trim() !== ''
        ) {
            return buildGithubImageUrl(info.image as string, cfg.baseUrl);
        }
        return (info.image as string) || '';
    }

    /**
     * 附图双图层加载策略：
     * - 底层 version-image-local：本地压缩版，模板 src 立即显示（用户无感知等待）
     * - 顶层 version-image-github：GitHub 原图（交错 PNG 渐进式加载），
     *   加载成功后加 .loaded 淡入覆盖；失败/超时则移除顶层图，保持本地版。
     */
    private applyImageSourceFallback(): void {
        const cfg = versionConfig.GITHUB_IMAGE;
        if (!cfg.enabled) return;

        const container = document.getElementById('version-detail-content');
        if (!container) return;
        const localImg = container.querySelector<HTMLImageElement>('img.version-image-local');
        const githubImg = container.querySelector<HTMLImageElement>('img.version-image-github');
        if (!localImg || !githubImg) return;

        const githubUrl = githubImg.getAttribute('data-github');
        if (!githubUrl) return;

        let settled = false;
        // 原图失败/超时：移除顶层图，保持本地压缩版显示
        const fail = (): void => {
            if (settled) return;
            settled = true;
            githubImg.remove();
        };

        // 本地压缩版已由模板 src 立即显示（底层）
        // GitHub 原图异步加载（交错 PNG 边下载边渲染），成功后淡入覆盖
        githubImg.src = githubUrl;
        githubImg.onerror = fail;

        // 超时未加载成功则放弃原图
        const timer = window.setTimeout(fail, cfg.timeoutMs);
        githubImg.onload = () => {
            if (settled) return;
            settled = true;
            window.clearTimeout(timer);
            // 触发 CSS opacity 过渡，淡入覆盖本地版
            githubImg.classList.add('loaded');
        };
    }
}
