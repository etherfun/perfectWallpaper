/**
 * Version module - Version update manager and markdown utilities
 */

export { SimpleMarkdown } from './simple-markdown';

import { useConfigStore } from '@/stores/config';
import { useRuntimeStore } from '@/stores/runtime';
import { globalT, i18n } from '@/utils/i18n';

const runtimeStore = useRuntimeStore();
import { waitAndExecute } from '../../utils/timer';

const config = useConfigStore();
import { fetch_with_retry } from '../../utils/tool';
import { SimpleMarkdown } from './simple-markdown';

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
        const composer = (i18n.global as any);
        const locale: string = composer.locale.value;
        // 浼樺厛鏌ュ綋鍓?locale 鐨勫師濮嬫秷鎭?
        const localeMsg = composer.getLocaleMessage(locale)?.[key];
        if (typeof localeMsg === 'string') return localeMsg;
        // 鏌?fallback locale
        const fallback = typeof composer.fallbackLocale?.value === 'string'
            ? composer.fallbackLocale.value
            : 'zh-CN';
        if (fallback !== locale) {
            const fbMsg = composer.getLocaleMessage(fallback)?.[key];
            if (typeof fbMsg === 'string') return fbMsg;
        }
    } catch {
        // 浠讳綍寮傚父鍥為€€鍒?globalT锛堜笉浼氬湪姝ゅ満鏅笅鍙戠敓锛屼絾瀹夊叏鍏滃簳锛?
    }
    return globalT(key);
}

// 鐗堟湰鍘嗗彶鏁版嵁Promise
export const VERSION_HISTORY_PROMISE = fetch_with_retry('update/history.json').then(res =>
    res.json()
);

export interface VersionHistoryEntry {
    version: string;
    date: string;
    titleKey?: string;
    title?: string;
    imageAltKey?: string;
    imageAlt?: string;
    changesKey?: string;
    changes?: string[];
}

export const versionConfig = {
    CURRENT_VERSION: '2.1.0',

    MODAL_SIZE: {
        width: '65%',
        height: '93%',
        maxWidth: '90%',
        maxHeight: '95%',
    },

    VERSION_HISTORY: [] as VersionHistoryEntry[],

    STORAGE_KEY: 'perfectwall_version',

    SHOW_SETTINGS: {
        autoCloseDelay: 60000,
        animationDuration: 400,
        showOnFirstLoad: false,
        showOnUpdate: localStorage.getItem('perfectwall_version_show_update') === 'true',
        enableHistoryNavigation: true,
        enableMarkdown: true,
        defaultView: 'current',
    },

    IMAGE_SETTINGS: {
        maxHeight: '40vh',
        borderRadius: '12px',
        showImage: true,
        lazyLoad: true,
    },
};

class versionManager {
    private updateModal: HTMLElement | null = null;
    private isInitialized = false;
    /** 闃叉寮傛鍒濆鍖栨椂鐨勭珵鎬佹潯浠?*/
    private initializing = false;
    /** 淇濆瓨鏈€杩戜竴娆?contentError锛屼緵鍚庣画灞曠ず闄嶇骇鍐呭 */
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
    private mouseMoveTimeout = 3000; // 3绉掓棤榧犳爣绉诲姩鍚庡紑濮嬭鏃?
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
        if (this.isInitialized || this.initializing) return;

        // 濡傛灉涓嶆槸鏂扮増鏈笖娌℃湁鎵嬪姩瑙﹀彂锛屽垯涓嶅垱寤哄脊绐?
        if (!this.isNewVersion) return;

        this.initializing = true;
        try {
            // 鍔犺浇鐗堟湰鍘嗗彶
            versionConfig.VERSION_HISTORY = await VERSION_HISTORY_PROMISE;

            // 鍒涘缓寮圭獥HTML
            this.createModalHTML();

            this.isInitialized = true;

            // 鏄剧ず寮圭獥
            setTimeout(() => {
                this.showModal();
            }, 2000);
        } catch (error) {
            console.error('鍒濆鍖栫増鏈脊绐楀け璐?', error);
        } finally {
            this.initializing = false;
        }
    }

    // 鍒涘缓寮圭獥HTML
    private createModalHTML(): void {
        // 绉婚櫎宸叉湁鐨勫脊绐?
        const existingModal = document.getElementById('version-modal');
        if (existingModal) {
            existingModal.remove();
        }

        // 鐩存帴鎻掑叆HTML锛堜笌JS鐗堟湰涓€鑷达級
        document.body.insertAdjacentHTML('beforeend', this.getModalHTML());

        // 鑾峰彇寮圭獥鍏冪礌
        this.updateModal = document.getElementById('version-modal');

        // 缁戝畾浜嬩欢
        this.bindEvents();

        // 濉厖鍐呭
        this.fillModalContent();

        // 璁剧疆褰撳墠鐗堟湰涓洪€変腑鐗堟湰
        this.selectedVersion = this.currentVersion;
    }

    // 鑾峰彇寮圭獥HTML
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
                                <i class="version-icon">馃摫</i>
                                ${this.isNewVersion ? globalT('version_update_title') : globalT('version_info_title')}
                            </h2>
                            <div class="version-indicator">
                                ${this.isNewVersion ? '<span class="new-badge">NEW</span>' : ''}
                            </div>
                        </div>
                        <button class="modal-close" id="modal-close">&times;</button>
                    </div>

                    <div class="modal-body">
                        <div class="two-column-layout">
                            <!-- 宸︿晶鐗堟湰鍒楄〃 -->
                            <div class="version-list-column">
                                <div class="version-list-header">
                                    <h3>${globalT('version_history_title')}</h3>
                                    <div class="version-list-count">
                                        <span class="total-count">0</span>
                                    </div>
                                </div>

                                <div class="version-list-container" id="version-list-container">
                                    <div class="loading-indicator">
                                        <div class="loading-spinner"></div>
                                        <div class="loading-text">${globalT('version_loading')}</div>
                                    </div>
                                </div>
                            </div>

                            <!-- 鍙充晶鐗堟湰璇︽儏 -->
                            <div class="version-detail-column">
                                <div class="version-detail-header">
                                    <h3 id="detail-version-title">${globalT('version_current_tab')}</h3>
                                    <div class="version-detail-meta" id="detail-version-meta">
                                        <span class="detail-version">v${this.currentVersion}</span>
                                        <span class="detail-date"></span>
                                    </div>
                                </div>

                                <div class="version-detail-content" id="version-detail-content">
                                    <div class="loading-indicator">
                                        <div class="loading-spinner"></div>
                                        <div class="loading-text">${globalT('version_loading_details')}</div>
                                    </div>
                                </div>

                                <!-- 閾炬帴澶嶅埗閫氱煡瀹瑰櫒 -->
                                <div class="link-notification-container" id="link-notification-container"></div>

                                <!-- 婊氬姩鎻愮ず -->
                                <div class="scroll-hint" id="scroll-hint">
                                    ${globalT('version_scroll_hint')}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="modal-footer">
                        <div class="footer-left">
                            <button class="action-btn secondary-btn" id="dont-show-btn">
                                ${globalT('version_dont_show_again')}
                            </button>
                        </div>
                        <div class="footer-right">
                            <button class="action-btn" id="understand-btn">
                                ${globalT('version_i_understand')}
                                <span class="countdown-text" id="countdown-text"></span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    // 缁戝畾浜嬩欢
    private bindEvents(): void {
        if (!this.updateModal) return;

        // 鍏抽棴鎸夐挳
        const closeBtn = document.getElementById('modal-close');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                this.stopCountdown();
                this.hideModal();
            });
        }

        // 鎴戠煡閬撲簡鎸夐挳
        const understandBtn = document.getElementById('understand-btn');
        if (understandBtn) {
            understandBtn.addEventListener('click', () => {
                this.stopCountdown();
                this.hideModal();
            });
        }

        // 涓嶅啀鏄剧ず鎸夐挳
        const dontShowBtn = document.getElementById('dont-show-btn');
        if (dontShowBtn) {
            dontShowBtn.addEventListener('click', () => {
                this.stopCountdown();
                this.disableFutureUpdates();
                this.hideModal();
            });
        }

        // 鐐瑰嚮閬僵灞傚叧闂?
        const overlay = this.updateModal.querySelector('.modal-overlay');
        if (overlay) {
            overlay.addEventListener('click', () => this.hideModal());
        }

        // ESC閿叧闂?
        document.addEventListener('keydown', e => {
            if (e.key === 'Escape' && this.updateModal?.classList.contains('show')) {
                this.hideModal();
            }
        });
    }

    // 鏄剧ず寮圭獥
    showModal(): void {
        if (!this.updateModal) return;
        // 寮圭獥宸叉墦寮€鏃朵笉鍐嶉噸澶嶆墦寮€
        if (this.updateModal.classList.contains('show')) return;

        // 鏄剧ず寮圭獥
        setTimeout(() => {
            if (!this.updateModal) return;
            this.updateModal.classList.add('show');

            // 寮€濮嬪€掓暟璁℃椂
            if (versionConfig.SHOW_SETTINGS.autoCloseDelay > 0) {
                this.startCountdown();
            }
        }, 100);
    }

    // 闅愯棌寮圭獥
    hideModal(): void {
        if (!this.updateModal) return;

        // 鍋滄鍊掓暟璁℃椂
        this.stopCountdown();

        // 娓呯悊鎵€鏈夐摼鎺ュ鍒堕€氱煡
        this.cleanupLinkNotifications();

        // 绉婚櫎鐢ㄦ埛浜や簰妫€娴?
        this.removeUserInteractionDetection();

        // 鏍囪涓烘湭鍒濆鍖栵紝璁╀笅涓€娆?showVersionInfo 鑳介噸寤?
        this.isInitialized = false;

        // 闅愯棌寮圭獥
        this.updateModal.classList.remove('show');

        // 鍔ㄧ敾缁撴潫鍚庣Щ闄ゅ厓绱?
        const modalRef = this.updateModal;
        setTimeout(() => {
            if (modalRef && modalRef.parentNode) {
                modalRef.parentNode.removeChild(modalRef);
            }
            if (this.updateModal === modalRef) {
                this.updateModal = null;
            }
        }, versionConfig.SHOW_SETTINGS.animationDuration);
    }

    // 寮€濮嬪€掓暟璁℃椂
    private startCountdown(): void {
        // 閲嶇疆鍊掓暟鏃堕棿
        this.remainingSeconds = Math.floor(versionConfig.SHOW_SETTINGS.autoCloseDelay / 1000);
        this.countdownActive = true;

        // 鏇存柊鎸夐挳鏄剧ず
        this.updateCountdownDisplay();

        // 娓呴櫎宸叉湁鐨勮鏃跺櫒
        if (this.countdownInterval) {
            clearInterval(this.countdownInterval);
        }

        // 璁剧疆榧犳爣绉诲姩妫€娴?
        this.setupMouseMoveDetection();

        // 寮€濮嬫鏌ラ紶鏍囩姸鎬?
        this.checkMouseStateAndStartCountdown();
    }

    // 鍋滄鍊掓暟璁℃椂
    private stopCountdown(): void {
        this.countdownActive = false;

        // 娓呴櫎鍊掓暟璁℃椂鍣?
        if (this.countdownInterval) {
            clearInterval(this.countdownInterval);
            this.countdownInterval = null;
        }

        // 娓呴櫎榧犳爣绉诲姩妫€娴嬪畾鏃跺櫒
        if (this.mouseMoveTimer) {
            clearTimeout(this.mouseMoveTimer);
            this.mouseMoveTimer = null;
        }

        // 绉婚櫎榧犳爣绉诲姩鐩戝惉鍣?
        if (this.mouseMoveHandler) {
            document.removeEventListener('mousemove', this.mouseMoveHandler);
            this.mouseMoveHandler = null;
        }

        // 绉婚櫎鐢ㄦ埛浜や簰妫€娴?
        this.removeUserInteractionDetection();

        // 鎭㈠鎸夐挳鍘熷鏂囨湰
        const countdownText = document.getElementById('countdown-text');
        if (countdownText) {
            countdownText.textContent = '';
        }
    }

    // 鏇存柊鍊掓暟鏄剧ず
    private updateCountdownDisplay(): void {
        const countdownText = document.getElementById('countdown-text');
        if (countdownText) {
            if (this.remainingSeconds > 0) {
                countdownText.textContent = ` (${this.remainingSeconds}s)`;

                // 浣跨敤CSS绫绘帶鍒舵牱寮?
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

    // 璁剧疆榧犳爣绉诲姩妫€娴?
    private setupMouseMoveDetection(): void {
        // 绉婚櫎鏃х殑鐩戝惉鍣紙濡傛灉瀛樺湪锛?
        if (this.mouseMoveHandler) {
            document.removeEventListener('mousemove', this.mouseMoveHandler);
        }

        // 鍒涘缓鏂扮殑榧犳爣绉诲姩澶勭悊鍣?
        this.mouseMoveHandler = () => {
            this.handleMouseMove();
        };

        // 娣诲姞榧犳爣绉诲姩鐩戝惉鍣?
        document.addEventListener('mousemove', this.mouseMoveHandler);

        // 璁剧疆鐢ㄦ埛浜や簰妫€娴?
        this.setupUserInteractionDetection();

        // 閲嶇疆榧犳爣绉诲姩鏃堕棿
        this.lastMouseMoveTime = Date.now();
        this.isMouseMoving = true;
    }

    // 澶勭悊榧犳爣绉诲姩浜嬩欢
    private handleMouseMove(): void {
        this.lastMouseMoveTime = Date.now();
        this.isMouseMoving = true;

        // 濡傛灉璁℃椂鍣ㄦ鍦ㄨ繍琛岋紝閲嶇疆瀹?
        if (this.countdownActive && this.countdownInterval) {
            this.resetCountdown();
        }
    }

    // 妫€鏌ラ紶鏍囩姸鎬佸苟寮€濮嬪€掓暟
    private checkMouseStateAndStartCountdown(): void {
        // 娓呴櫎鐜版湁鐨勯紶鏍囩姸鎬佹鏌ュ畾鏃跺櫒
        if (this.mouseMoveTimer) {
            clearTimeout(this.mouseMoveTimer);
        }

        const now = Date.now();
        const timeSinceLastMove = now - this.lastMouseMoveTime;

        if (timeSinceLastMove >= this.mouseMoveTimeout) {
            // 宸茬粡瓒呰繃3绉掓棤榧犳爣绉诲姩锛屽紑濮嬪€掓暟璁℃椂
            this.startCountdownTimer();
        } else {
            // 绛夊緟鍒版棤榧犳爣绉诲姩鐘舵€?
            const waitTime = this.mouseMoveTimeout - timeSinceLastMove;

            this.mouseMoveTimer = setTimeout(() => {
                this.startCountdownTimer();
            }, waitTime);
        }
    }

    // 寮€濮嬪€掓暟璁℃椂鍣?
    private startCountdownTimer(): void {
        // 娓呴櫎宸叉湁鐨勮鏃跺櫒
        if (this.countdownInterval) {
            clearInterval(this.countdownInterval);
        }

        // 寮€濮嬫柊鐨勮鏃跺櫒
        this.countdownInterval = setInterval(() => {
            if (this.remainingSeconds > 0) {
                this.remainingSeconds--;
                this.updateCountdownDisplay();
            } else {
                // 鍊掓暟缁撴潫锛岃嚜鍔ㄥ叧闂脊绐?
                this.stopCountdown();
                this.hideModal();
            }
        }, 1000);
    }

    // 閲嶇疆鍊掓暟璁℃椂
    private resetCountdown(): void {
        // 閲嶇疆鍓╀綑鏃堕棿
        this.remainingSeconds = Math.floor(versionConfig.SHOW_SETTINGS.autoCloseDelay / 1000);

        // 鏇存柊鏄剧ず
        this.updateCountdownDisplay();

        // 閲嶆柊妫€鏌ラ紶鏍囩姸鎬?
        this.checkMouseStateAndStartCountdown();
    }

    // 璁剧疆鐢ㄦ埛浜や簰妫€娴?
    private setupUserInteractionDetection(): void {
        // 绉婚櫎鏃х殑鐩戝惉鍣?
        this.removeUserInteractionDetection();

        // 鍒涘缓浜や簰澶勭悊鍣?
        this.userInteractionHandler = () => {
            this.handleUserInteraction();
        };

        // 娣诲姞鍚勭浜や簰浜嬩欢鐩戝惉
        const modal = this.updateModal;
        if (modal) {
            // 鐐瑰嚮浜嬩欢
            modal.addEventListener('click', this.userInteractionHandler);

            // 瑙︽懜浜嬩欢锛堢Щ鍔ㄧ锛?
            modal.addEventListener('touchstart', this.userInteractionHandler);
            modal.addEventListener('touchmove', this.userInteractionHandler);
        }
    }

    // 绉婚櫎鐢ㄦ埛浜や簰妫€娴?
    private removeUserInteractionDetection(): void {
        if (this.userInteractionHandler && this.updateModal) {
            this.updateModal.removeEventListener('click', this.userInteractionHandler);
            this.updateModal.removeEventListener('touchstart', this.userInteractionHandler);
            this.updateModal.removeEventListener('touchmove', this.userInteractionHandler);
            this.userInteractionHandler = null;
        }
    }

    // 澶勭悊鐢ㄦ埛浜や簰
    private handleUserInteraction(): void {
        // 閲嶇疆榧犳爣绉诲姩鏃堕棿锛屾ā鎷熼紶鏍囩Щ鍔?
        this.lastMouseMoveTime = Date.now();
        this.isMouseMoving = true;

        // 濡傛灉璁℃椂鍣ㄦ鍦ㄨ繍琛岋紝閲嶇疆瀹?
        if (this.countdownActive && this.countdownInterval) {
            this.resetCountdown();
        }
    }

    // 娓呯悊鎵€鏈夐摼鎺ュ鍒堕€氱煡
    private cleanupLinkNotifications(): void {
        // 娓呯悊鐗堟湰寮圭獥鍐呯殑閫氱煡
        const linkNotificationContainer = document.getElementById('link-notification-container');
        if (linkNotificationContainer) {
            linkNotificationContainer.innerHTML = '';
        }

        // 娓呯悊椤甸潰涓婄殑閫氱煡锛堝鐢ㄦ儏鍐碉級
        const pageNotifications = document.querySelectorAll('.link-copy-notification');
        pageNotifications.forEach(notification => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        });
    }

    // 缁戝畾鍏ㄥ眬浜嬩欢锛堝湪鏋勯€犲嚱鏁颁腑璋冪敤锛?
    private bindGlobalEvents(): void {
        // 鐗堟湰鍒楄〃椤圭偣鍑讳簨浠?
        document.addEventListener('click', e => {
            const versionItem = (e.target as HTMLElement).closest('.version-list-item');

            if (versionItem) {
                const version = (versionItem as HTMLElement).dataset.version;
                this.selectVersionInternal(version || '');
            }
        });
    }

    // 绂佺敤鏈潵鏇存柊鎻愮ず
    private disableFutureUpdates(): void {
        versionConfig.SHOW_SETTINGS.showOnUpdate = false;
        versionConfig.SHOW_SETTINGS.showOnFirstLoad = false;

        localStorage.setItem('perfectwall_disable_updates', 'true');
    }

    // 鎵嬪姩鏄剧ず鐗堟湰淇℃伅
    async showVersionInfo(): Promise<void> {
        // 寮圭獥宸叉墦寮€鏃朵笉鍐嶉噸澶嶆墦寮€
        if (this.updateModal?.classList.contains('show')) return;

        // 闃叉寮傛鍒濆鍖栨湡闂寸殑绔炴€佹潯浠?
        if (this.initializing) {
            // 宸叉湁鍒濆鍖栧湪杩涜涓紝绛夊緟瀹屾垚鍚庡啀灞曠ず
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

        // 濡傛灉浠庢湭鍒濆鍖栬繃锛屽厛鍔犺浇鐗堟湰鍘嗗彶
        if (!this.isInitialized) {
            this.initializing = true;
            try {
                versionConfig.VERSION_HISTORY = await VERSION_HISTORY_PROMISE;
                this.createModalHTML();
                // createModalHTML() 鍐呴儴宸茶皟鐢?bindEvents锛屾澶勪笉鍐嶉噸澶?
                this.isInitialized = true;
            } catch (error) {
                console.error('鍒濆鍖栫増鏈脊绐楀け璐?', error);
                // 鍗充娇鍔犺浇澶辫触锛屼篃灏濊瘯鏄剧ず闄嶇骇寮圭獥
                this.createFallbackModal();
                this.isInitialized = true;
            } finally {
                this.initializing = false;
            }
        }
        this.showModal();
    }

    /** 鍒涘缓闄嶇骇寮圭獥锛堢増鏈巻鍙?鏇存柊鍐呭鍔犺浇澶辫触鏃剁殑澶囩敤鏄剧ず锛?*/
    private createFallbackModal(): void {
        const existingModal = document.getElementById('version-modal');
        if (existingModal) {
            existingModal.remove();
        }

        document.body.insertAdjacentHTML('beforeend', `
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
                                <i class="version-icon">馃摫</i>
                                ${globalT('version_info_title')}
                            </h2>
                        </div>
                        <button class="modal-close" id="modal-close">&times;</button>
                    </div>
                    <div class="modal-body" style="display:flex;align-items:center;justify-content:center;padding:40px;">
                        <div class="no-data">${globalT('version_no_data')}</div>
                    </div>
                    <div class="modal-footer">
                        <div class="footer-right">
                            <button class="action-btn" id="understand-btn">${globalT('version_i_understand')}</button>
                        </div>
                    </div>
                </div>
            </div>
        `);

        this.updateModal = document.getElementById('version-modal');
        this.bindEvents();
    }

    // 鏇存柊鐗堟湰閰嶇疆锛堝閮ㄨ皟鐢級
    updateConfig(newConfig: Partial<typeof versionConfig>): void {
        Object.assign(versionConfig, newConfig);
        this.currentVersion = versionConfig.CURRENT_VERSION;
        this.isNewVersion = this.checkVersionUpdate();
    }

    // 妫€娴嬬敤鎴蜂氦浜掞紙渚涘閮ㄨ皟鐢級
    detectUserInteraction(): void {
        this.handleUserInteraction();
    }

    // 閫夋嫨鐗堟湰锛堜緵澶栭儴璋冪敤锛?
    selectVersion(version: string): void {
        this.selectedVersion = version;
        // 杩欓噷鍙互娣诲姞鏇存柊鐗堟湰璇︽儏鐨勯€昏緫
    }

    // 濉厖寮圭獥鍐呭
    private fillModalContent(): void {
        // 濉厖鐗堟湰鍒楄〃
        const listContainer = document.getElementById('version-list-container');
        const countElement = document.querySelector('.total-count');

        if (listContainer && countElement) {
            listContainer.innerHTML = this.renderVersionList();
            countElement.textContent =
                versionConfig.VERSION_HISTORY.length + ' ' + globalT('version_units');
        }

        // 濉厖褰撳墠鐗堟湰璇︽儏
        const versionInfo = this.getCurrentVersionInfo();

        // 鏇存柊鏍囬
        const titleElement = document.getElementById('detail-version-title');
        if (titleElement && versionInfo) {
            titleElement.textContent =
                (versionInfo.title as string) || `鐗堟湰 v${versionInfo.version}`;
        }

        // 鏇存柊鍏冧俊鎭?
        const metaElement = document.getElementById('detail-version-meta');
        if (metaElement && versionInfo) {
            metaElement.innerHTML = `
                <span class="detail-version">v${versionInfo.version}</span>
                <span class="detail-date">${versionInfo.date}</span>
            `;
        }

        // 鏇存柊鍐呭
        const contentElement = document.getElementById('version-detail-content');
        if (contentElement && versionInfo) {
            contentElement.innerHTML = this.renderVersionDetailContent(versionInfo);
        }

        // 缁戝畾鍏ㄥ眬浜嬩欢锛堢増鏈垪琛ㄧ偣鍑荤瓑锛?
        this.bindGlobalEvents();
    }

    // 娓叉煋绾枃鏈洿鏂板唴瀹?
    private renderPlainChanges(changes: unknown): string {
        if (!changes || !Array.isArray(changes)) return '';

        return `<ul class="plain-changes-list">${(changes as unknown[])
            .map((change: unknown) => `<li>${change}</li>`)
            .join('')}</ul>`;
    }

    // 娓叉煋鐗堟湰璇︽儏鍐呭
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
                        <img src="${info.image}"
                             class="version-image"
                             style="max-height: ${versionConfig.IMAGE_SETTINGS.maxHeight}; width: auto; max-width: 100%;
                             ${versionConfig.IMAGE_SETTINGS.lazyLoad ? 'loading="lazy"' : ''}">
                        <div class="image-info">
                            <div class="image-description">
                                ${SimpleMarkdown.parse(info.imageAlt as string) || globalT('version_image_default_alt')}
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

    // 娓叉煋鐗堟湰鍒楄〃锛堢敤浜庡乏渚ф爮锛?
    private renderVersionList(): string {
        const allHistory = this.getAllVersionHistory();

        return allHistory
            .map((history: VersionHistoryEntry) => {
                const versionInfo = this.getVersionInfo(history.version);
                const isCurrent = history.version === this.currentVersion;
                const isSelected = history.version === this.selectedVersion;

                return `
                <div class="version-list-item ${isCurrent ? 'current' : ''} ${isSelected ? 'selected' : ''}"
                     data-version="${history.version}">
                    <div class="version-item-header">
                        <div class="version-item-left">
                            <span class="version-number">v${history.version}</span>
                            ${isCurrent ? '<span class="current-indicator">' + globalT('version_current_badge') + '</span>' : ''}
                        </div>
                        <div class="version-item-right">
                            <span class="version-date">${history.date}</span>
                        </div>
                    </div>
                    <div class="version-item-title">
                        ${versionInfo?.title || (history.titleKey ? globalT(history.titleKey) : '') || globalT('version_fallback_title_with_version') + ' ' + history.version}
                    </div>
                </div>
            `;
            })
            .join('');
    }

    // 鑾峰彇鎸囧畾鐗堟湰鐨勬洿鏂颁俊鎭紙甯18n澶勭悊锛?
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

    // 澶勭悊鐗堟湰淇℃伅鐨刬18n杞崲
    private processVersionInfoWithI18n(
        rawInfo: VersionHistoryEntry
    ): Record<string, unknown> | null {
        if (!rawInfo) return null;

        const processedInfo: Record<string, unknown> = { ...rawInfo };

        // 澶勭悊鏍囬
        if (rawInfo.titleKey) {
            processedInfo.title = safeT(rawInfo.titleKey);
        } else if (rawInfo.title) {
            processedInfo.title = rawInfo.title;
        } else {
            processedInfo.title = safeT('version_fallback_title') + rawInfo.version;
        }

        // 澶勭悊鍥剧墖鏇夸唬鏂囨湰
        if (rawInfo.imageAltKey) {
            processedInfo.imageAlt = safeT(rawInfo.imageAltKey);
        } else if (rawInfo.imageAlt) {
            processedInfo.imageAlt = rawInfo.imageAlt;
        } else {
            processedInfo.imageAlt = safeT('version_image_default_alt');
        }

        // 澶勭悊鏇存柊鍐呭
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

    // 鑾峰彇褰撳墠鐗堟湰鐨勬洿鏂颁俊鎭?
    private getCurrentVersionInfo(): Record<string, unknown> | null {
        return this.getVersionInfo(this.currentVersion);
    }

    // 鑾峰彇鎵€鏈夋洿鏂板巻鍙诧紙鎸夋棩鏈熼檷搴忔帓鍒楋紝鏈€鏂扮殑鍦ㄥ墠闈級
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

    // 閫夋嫨鐗堟湰锛堟洿鏂板彸渚ц鎯咃級
    private selectVersionInternal(version: string): void {
        if (!version || this.selectedVersion === version) return;

        // 鏇存柊閫変腑鐨勭増鏈?
        this.selectedVersion = version;

        // 鏇存柊宸︿晶鍒楄〃閫変腑鐘舵€?
        this.updateVersionListSelection();

        // 鏇存柊鍙充晶璇︽儏鍐呭
        this.updateVersionDetail();
    }

    // 鏇存柊鐗堟湰鍒楄〃閫変腑鐘舵€?
    private updateVersionListSelection(): void {
        const listItems = document.querySelectorAll('.version-list-item');
        listItems.forEach(item => {
            const ver = (item as HTMLElement).dataset.version;
            item.classList.toggle('selected', ver === this.selectedVersion);
        });
    }

    // 鏇存柊鐗堟湰璇︽儏
    private updateVersionDetail(): void {
        const versionInfo = this.getVersionInfo(this.selectedVersion ?? undefined);

        // 鏇存柊鏍囬
        const titleElement = document.getElementById('detail-version-title');
        if (titleElement && versionInfo) {
            titleElement.textContent =
                (versionInfo.title as string) || `鐗堟湰 v${versionInfo.version}`;
        }

        // 鏇存柊鍏冧俊鎭?
        const metaElement = document.getElementById('detail-version-meta');
        if (metaElement && versionInfo) {
            metaElement.innerHTML = `
                <span class="detail-version">v${versionInfo.version}</span>
                <span class="detail-date">${versionInfo.date}</span>
                ${
                    versionInfo.version === this.currentVersion
                        ? '<span class="current-badge">' +
                          globalT('version_current_version') +
                          '</span>'
                        : ''
                }
            `;
        }

        // 鏇存柊鍐呭
        const contentElement = document.getElementById('version-detail-content');
        if (contentElement) {
            contentElement.innerHTML = this.renderVersionDetailContent(versionInfo);
        }
    }
}

// 鍒涘缓鍏ㄥ眬鐗堟湰绠＄悊鍣ㄥ疄渚嬪苟鎸傝浇鍒?runtime
const versionManagerInstance = new versionManager();
runtimeStore.versionManager = versionManagerInstance;

// 鏆撮湶 SimpleMarkdown 鍒板叏灞€浣滅敤鍩燂紝浣?onclick="SimpleMarkdown.copyLink(this)" 鑳芥甯稿伐浣?
window.SimpleMarkdown = SimpleMarkdown;

// 绛夊緟鍒濆鍖栧畬鎴?
waitAndExecute(
    () => {
        const complete = config.update_init_complete === true;
        return complete;
    },
    () => {
        if (!runtimeStore.versionManager) {
            runtimeStore.versionManager = new versionManager();
        }

        // 寤惰繜鏄剧ず锛岀‘淇濆叾浠栧唴瀹瑰凡鍔犺浇
        setTimeout(async () => {
            if (runtimeStore.versionManager) {
                try {
                     
                    await (runtimeStore.versionManager as any).initUpdateModal();
                } catch (error) {
                    console.error('鍒濆鍖栫増鏈脊绐楀け璐?', error);
                }
            }
        }, 2000);
    },
    500,
    15000
);

// 瀵煎嚭
export { versionManager };
