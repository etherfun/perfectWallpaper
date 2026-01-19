// 版本历史数据Promise
const VERSION_HISTORY_PROMISE = fetch_with_retry("update/history.json").then(res => res.json());

const EnhancedVersionConfig = {
    // 当前版本号
    CURRENT_VERSION: "1.7.0",

    // 弹窗尺寸设置
    MODAL_SIZE: {
        width: "65%",
        height: "93%",
    },

    // 版本更新历史
    VERSION_HISTORY: [],

    // 本地存储键名
    STORAGE_KEY: "perfectwall_version",

    // 弹窗显示设置
    SHOW_SETTINGS: {
        autoCloseDelay: 20000,
        animationDuration: 400,
        showOnFirstLoad: true,
        showOnUpdate: true,
        enableHistoryNavigation: true,
        enableMarkdown: true,
        defaultView: "current"
    },

    // 图片设置
    IMAGE_SETTINGS: {
        maxHeight: "40vh",
        borderRadius: "12px",
        showImage: true,
        lazyLoad: true
    }
};

// 增强版Markdown解析器
class SimpleMarkdown {
    static parse(text) {
        if (!text) return '';

        // 处理代码块（多行）
        const codeBlockRegex = /```(\w*)\n([\s\S]*?)\n```/g;
        let processedText = text;
        const codeBlocks = [];
        let match;
        let blockIndex = 0;

        // 提取并替换代码块
        while ((match = codeBlockRegex.exec(text)) !== null) {
            const language = match[1] || '';
            const code = match[2];
            const placeholder = `__CODE_BLOCK_${blockIndex}__`;
            codeBlocks.push({
                placeholder,
                html: `<pre class="md-code-block"><code class="language-${language}">${this.escapeHtml(code)}</code></pre>`
            });
            processedText = processedText.replace(match[0], placeholder);
            blockIndex++;
        }

        // 按行处理
        const lines = processedText.split('\n');
        let inList = false;
        let listItems = [];
        let result = '';

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            const trimmedLine = line.trim();

            // 空行
            if (trimmedLine === '') {
                if (inList && listItems.length > 0) {
                    result += this.renderListHtml(listItems);
                    listItems = [];
                    inList = false;
                }
                result += '<div class="md-empty-line"></div>';
                continue;
            }

            // 标题
            if (trimmedLine.startsWith('## ')) {
                if (inList && listItems.length > 0) {
                    result += this.renderListHtml(listItems);
                    listItems = [];
                    inList = false;
                }
                result += `<h3 class="md-title">${this.processInlineMarkdown(trimmedLine.substring(3))}</h3>`;
                continue;
            }
            if (trimmedLine.startsWith('### ')) {
                if (inList && listItems.length > 0) {
                    result += this.renderListHtml(listItems);
                    listItems = [];
                    inList = false;
                }
                result += `<h4 class="md-subtitle">${this.processInlineMarkdown(trimmedLine.substring(4))}</h4>`;
                continue;
            }

            // 列表项（支持多种标记：-, *, + 以及 --, --- 等嵌套标记）
            // 注意：这里使用原始行(line)而不是trimmedLine来获取前导空格
            const listMatch = line.match(/^([\s]*)([-*+]+)\s+(.*)$/);
            if (listMatch) {
                const spaces = listMatch[1].length;
                const markers = listMatch[2];  // 可能是 -、--、---、*、**、*** 等
                const content = listMatch[3];
                
                // 计算缩进级别
                let indentLevel;
                
                if (markers.length === 1) {
                    // 单个标记：使用空格缩进
                    // 每2个空格算一级缩进
                    indentLevel = Math.floor(spaces / 2);
                } else {
                    // 多个标记：使用标记数量表示层级
                    // 例如：-- 表示一级缩进，--- 表示两级缩进
                    indentLevel = markers.length - 1;
                    
                    // 如果还有空格缩进，也加上
                    if (spaces > 0) {
                        indentLevel += Math.floor(spaces / 2);
                    }
                }
                
                // 新的列表项
                if (!inList) {
                    inList = true;
                }
                listItems.push({
                    indent: indentLevel,
                    content: this.processInlineMarkdown(content.trim())
                });
                continue;
            }

            // 普通段落
            if (inList && listItems.length > 0) {
                result += this.renderListHtml(listItems);
                listItems = [];
                inList = false;
            }
            
            // 处理段落中的内联标记
            const processedLine = this.processInlineMarkdown(trimmedLine);
            result += `<p class="md-paragraph">${processedLine}</p>`;
        }

        // 处理最后可能存在的列表
        if (inList && listItems.length > 0) {
            result += this.renderListHtml(listItems);
        }

        // 恢复代码块
        codeBlocks.forEach(block => {
            result = result.replace(block.placeholder, block.html);
        });

        return result;
    }

    // 处理内联Markdown（粗体、删除线、行内代码、链接）
    static processInlineMarkdown(text) {
        if (!text) return '';
        
        // 转义HTML特殊字符
        let processed = this.escapeHtml(text);
        
        // 处理链接 [文本](url) - 点击复制链接并弹窗提示
        processed = processed.replace(/\[([^\[\]]+)\]\(([^\)]+)\)/g, '<a href="javascript:void(0)" class="md-link" data-url="$2" onclick="SimpleMarkdown.copyLink(this)">$1</a>');
        
        // 处理行内代码 `code`
        processed = processed.replace(/`([^`]+)`/g, '<code class="md-inline-code">$1</code>');
        
        // 处理粗体 **bold**
        processed = processed.replace(/\*\*([^*]+)\*\*/g, '<strong class="md-bold">$1</strong>');
        
        // 处理删除线 ~~strikethrough~~
        processed = processed.replace(/~~([^~]+)~~/g, '<del class="md-strikethrough">$1</del>');
        
        return processed;
    }

    // 渲染列表HTML（支持嵌套）
    static renderListHtml(items) {
        if (!items || items.length === 0) return '';
        
        let html = '<ul class="md-list">';
        let currentIndent = 0;
        
        for (let i = 0; i < items.length; i++) {
            const item = items[i];
            
            // 处理嵌套
            if (item.indent > currentIndent) {
                // 开始嵌套列表
                html += '<ul class="md-nested-list">';
                currentIndent = item.indent;
            } else if (item.indent < currentIndent) {
                // 结束嵌套列表
                html += '</ul>';
                currentIndent = item.indent;
            }
            
            html += `<li class="md-list-item">${item.content}</li>`;
        }
        
        // 关闭所有嵌套列表
        while (currentIndent > 0) {
            html += '</ul>';
            currentIndent--;
        }
        
        html += '</ul>';
        return html;
    }

    // 转义HTML特殊字符
    static escapeHtml(text) {
        if (!text) return '';
        return text
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    // 向后兼容的renderList方法
    static renderList(items) {
        if (!items || !Array.isArray(items)) return '';
        return `<ul class="md-list">${items.map(item =>
            `<li class="md-list-item">${this.processInlineMarkdown(item)}</li>`
        ).join('')}</ul>`;
    }

    // 复制链接并显示提示
    static copyLink(linkElement) {
        const url = linkElement.getAttribute('data-url');
        if (!url) return;

        // 复制到剪贴板
        this.copyToClipboard(url);

        // 显示提示
        this.showCopyNotification(url);

        // 添加点击反馈效果
        linkElement.classList.add('link-copied');
        setTimeout(() => {
            linkElement.classList.remove('link-copied');
        }, 1000);
    }

    // 复制文本到剪贴板
    static copyToClipboard(text) {
        try {
            // 使用现代剪贴板API
            if (navigator.clipboard && navigator.clipboard.writeText) {
                navigator.clipboard.writeText(text);
                return true;
            }
            
            // 备用方法：使用textarea
            const textarea = document.createElement('textarea');
            textarea.value = text;
            textarea.style.position = 'fixed';
            textarea.style.opacity = '0';
            document.body.appendChild(textarea);
            textarea.select();
            
            try {
                const successful = document.execCommand('copy');
                document.body.removeChild(textarea);
                return successful;
            } catch (err) {
                document.body.removeChild(textarea);
                return false;
            }
        } catch (error) {
            return false;
        }
    }

    // 显示复制通知
    static showCopyNotification(url) {
        // 移除已有的通知
        const existingNotification = document.querySelector('.link-copy-notification');
        if (existingNotification) {
            existingNotification.remove();
        }

        // 创建通知元素
        const notification = document.createElement('div');
        notification.className = 'link-copy-notification';
        notification.innerHTML = `
            <div class="notification-content">
                <div class="notification-icon">📋</div>
                <div class="notification-text">
                    <div class="notification-title">链接已复制</div>
                    <div class="notification-url">${this.truncateUrl(url, 40)}</div>
                    <div class="notification-hint">请在浏览器地址栏中粘贴访问</div>
                </div>
                <button class="notification-close">&times;</button>
            </div>
        `;

        // 尝试添加到版本弹窗内的容器
        const versionModal = document.getElementById('version-modal');
        const linkNotificationContainer = document.getElementById('link-notification-container');
        
        if (versionModal && linkNotificationContainer) {
            // 版本弹窗存在，添加到弹窗内的容器
            linkNotificationContainer.appendChild(notification);
            
            // 使用requestAnimationFrame确保DOM更新后添加动画
            requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                    notification.classList.add('show');
                });
            });
        } else {
            // 版本弹窗不存在，添加到页面body（备用）
            document.body.appendChild(notification);
            
            // 显示通知
            setTimeout(() => {
                notification.classList.add('show');
            }, 10);
        }

        // 绑定关闭按钮事件
        const closeBtn = notification.querySelector('.notification-close');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                this.hideNotification(notification);
            });
        }

        // 监听动画结束事件，动画结束后移除元素
        notification.addEventListener('animationend', (event) => {
            if (event.animationName === 'slideInOut') {
                this.removeNotification(notification);
            }
        });

        // 监听动画取消事件
        notification.addEventListener('animationcancel', () => {
            this.removeNotification(notification);
        });
    }

    // 隐藏通知
    static hideNotification(notification) {
        if (!notification) return;
        
        // 移除show类，这将停止动画并立即隐藏通知
        notification.classList.remove('show');
        
        // 立即移除元素
        this.removeNotification(notification);
    }

    // 移除通知元素
    static removeNotification(notification) {
        if (!notification) return;
        
        // 短暂延迟后移除元素，确保动画状态已更新
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 10);
    }

    // 截断URL显示
    static truncateUrl(url, maxLength) {
        if (!url || url.length <= maxLength) return url;
        
        const half = Math.floor(maxLength / 2) - 2;
        return url.substring(0, half) + '...' + url.substring(url.length - half);
    }
}

// 增强版版本管理器
class versionManager {
    constructor() {
        this.currentVersion = EnhancedVersionConfig.CURRENT_VERSION;
        this.storedVersion = this.getStoredVersion();

        this.isNewVersion = this.checkVersionUpdate();
        this.updateModal = null;
        this.selectedVersion = this.currentVersion;
        this.isInitialized = false;
        this.isDataLoaded = false; // 数据加载状态

        // 倒数计时相关属性
        this.countdownInterval = null;
        this.remainingSeconds = Math.floor(EnhancedVersionConfig.SHOW_SETTINGS.autoCloseDelay / 1000);
        this.countdownActive = false;

        // 鼠标移动检测相关属性
        this.mouseMoveTimer = null;
        this.mouseMoveTimeout = 3000; // 3秒无鼠标移动后开始计时
        this.lastMouseMoveTime = Date.now();
        this.isMouseMoving = false;
        this.mouseMoveHandler = null;

        // 交互检测相关属性
        this.userInteractionHandler = null;
        this.interactionTimeout = 2000; // 2秒无交互后重置鼠标移动检测

        this.bindGlobalEvents();
    }

    // 刷新弹窗内容
    refreshModalContent() {
        if (!this.updateModal) return;
        
        // 刷新版本列表
        const listContainer = document.getElementById('version-list-container');
        if (listContainer) {
            listContainer.innerHTML = this.renderVersionList();
        }
        
        // 刷新版本计数
        const countElement = document.querySelector('.total-count');
        if (countElement) {
            countElement.textContent = EnhancedVersionConfig.VERSION_HISTORY.length + " " + i18n('version_units');
        }
        
        // 刷新当前版本详情
        this.updateVersionDetail();
    }

    // 获取本地存储的版本号
    getStoredVersion() {
        try {
            return localStorage.getItem(EnhancedVersionConfig.STORAGE_KEY) || "0.0.0";
        } catch (error) {
            console.error("读取本地存储失败:", error);
            return "0.0.0";
        }
    }

    // 保存当前版本号到本地存储
    saveCurrentVersion() {
        try {
            localStorage.setItem(EnhancedVersionConfig.STORAGE_KEY, this.currentVersion);
        } catch (error) {
        }
    }

    // 检查是否有版本更新
    checkVersionUpdate() {

        if (this.storedVersion === "0.0.0" && EnhancedVersionConfig.SHOW_SETTINGS.showOnFirstLoad) {
            return true; // 首次加载
        }

        const comparisonResult = this.compareVersions(this.currentVersion, this.storedVersion);

        if (comparisonResult > 0) {
            return true; // 有新版本
        }

        return false; // 没有更新
    }

    // 比较版本号（增强版，支持包含字母的版本号如 1.5.0.beta.1）
    compareVersions(versionA, versionB) {
        const partsA = this.parseVersionParts(versionA);
        const partsB = this.parseVersionParts(versionB);

        for (let i = 0; i < Math.max(partsA.length, partsB.length); i++) {
            const a = partsA[i] || 0;
            const b = partsB[i] || 0;

            // 如果两个部分都是数字，直接比较
            if (typeof a === 'number' && typeof b === 'number') {
                if (a > b) return 1;
                if (a < b) return -1;
            }
            // 如果一个是数字，一个是字符串，数字优先
            else if (typeof a === 'number' && typeof b === 'string') {
                return 1; // 数字版本 > 字母版本（如 1.5.0 > 1.5.0.beta.1）
            }
            else if (typeof a === 'string' && typeof b === 'number') {
                return -1; // 字母版本 < 数字版本
            }
            // 如果两个都是字符串，按字母顺序比较
            else if (typeof a === 'string' && typeof b === 'string') {
                if (a > b) return 1;
                if (a < b) return -1;
            }
        }

        return 0;
    }

    // 解析版本号各部分，支持数字和字母
    parseVersionParts(version) {
        if (!version) return [];

        return version.split('.').map(part => {
            // 尝试转换为数字
            const num = Number(part);
            if (!isNaN(num) && part.trim() !== '') {
                return num;
            }
            // 如果是字母或字母数字组合，返回字符串
            return part.toLowerCase(); // 转换为小写以确保比较的一致性
        });
    }

    // 获取指定版本的更新信息（带i18n处理）
    getVersionInfo(version) {
        // 如果没有提供版本参数，使用当前选中的版本
        const targetVersion = version !== undefined ? version : this.selectedVersion;

        // 检查版本参数是否有效
        if (!targetVersion) {
            return null;
        }

        // 检查数据是否已加载
        if (!EnhancedVersionConfig.VERSION_HISTORY || !Array.isArray(EnhancedVersionConfig.VERSION_HISTORY)) {
            return null;
        }

        // 查找匹配的版本信息
        const rawInfo = EnhancedVersionConfig.VERSION_HISTORY.find(info =>
            info.version === targetVersion
        );

        if (!rawInfo) {
            return null;
        }

        // 处理i18n转换
        return this.processVersionInfoWithI18n(rawInfo);
    }

    // 处理版本信息的i18n转换
    processVersionInfoWithI18n(rawInfo) {
        if (!rawInfo) return null;

        const processedInfo = { ...rawInfo };

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
            processedInfo.changes = changesText.split('\n').filter(line => line.trim() !== '');
        } else if (rawInfo.changes) {
            processedInfo.changes = rawInfo.changes;
        } else {
            processedInfo.changes = [];
        }

        return processedInfo;
    }

    // 获取当前版本的更新信息
    getCurrentVersionInfo() {
        return this.getVersionInfo(this.currentVersion);
    }

    // 获取所有更新历史（按日期降序排列，最新的在前面）
    getAllVersionHistory() {
        if (!EnhancedVersionConfig.VERSION_HISTORY || !Array.isArray(EnhancedVersionConfig.VERSION_HISTORY)) {
            return [];
        }
        
        return EnhancedVersionConfig.VERSION_HISTORY.sort((a, b) => {
            // 首先按日期排序（降序：最新的在前面）
            const dateA = this.parseDate(a.date);
            const dateB = this.parseDate(b.date);

            if (dateB.getTime() !== dateA.getTime()) {
                return dateB.getTime() - dateA.getTime(); // 日期降序
            }

            // 如果日期相同，按版本号排序（降序：版本号大的在前面）
            return this.compareVersions(b.version, a.version);
        });
    }

    // 解析日期字符串为Date对象
    parseDate(dateStr) {
        if (!dateStr) return new Date(0);

        try {
            // 支持多种日期格式：YYYY-M-D, YYYY-MM-DD
            const parts = dateStr.split('-').map(part => parseInt(part, 10));
            if (parts.length >= 3) {
                // 注意：月份是0-based（0=一月）
                return new Date(parts[0], parts[1] - 1, parts[2]);
            }
            return new Date(dateStr);
        } catch (error) {
            return new Date(0);
        }
    }

    // 初始化版本更新弹窗
    async initUpdateModal() {
        if (!this.isNewVersion && !EnhancedVersionConfig.SHOW_SETTINGS.showOnFirstLoad) {
            return;
        }

        try {
            // 加载版本历史数据
            if (!this.isDataLoaded) {
                try {
                    const historyData = await VERSION_HISTORY_PROMISE;
                    EnhancedVersionConfig.VERSION_HISTORY = historyData;
                    this.isDataLoaded = true;
                } catch (error) {
                    console.error("加载版本历史数据失败:", error);
                    EnhancedVersionConfig.VERSION_HISTORY = [];
                    this.isDataLoaded = true;
                }
            }
            
            // 创建弹窗
            this.createModalHTML();
            this.showModal();
            this.saveCurrentVersion();
            this.isInitialized = true;
        } catch (error) {
            console.error("初始化版本更新弹窗失败:", error);
            // 即使失败也尝试创建弹窗（使用空数据）
            this.createModalHTML();
            this.showModal();
            this.saveCurrentVersion();
            this.isInitialized = true;
        }
    }

    // 创建弹窗HTML
    createModalHTML() {
        const modalHTML = `
            <div id="version-modal" class="version-modal">
                <div class="modal-overlay"></div>
                <div class="modal-content" style="
                    width: ${EnhancedVersionConfig.MODAL_SIZE.width};
                    max-width: ${EnhancedVersionConfig.MODAL_SIZE.maxWidth};
                    height: ${EnhancedVersionConfig.MODAL_SIZE.height};
                    max-height: ${EnhancedVersionConfig.MODAL_SIZE.maxHeight};
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

        // 添加到页面
        document.body.insertAdjacentHTML('beforeend', modalHTML);

        // 获取弹窗元素
        this.updateModal = document.getElementById('version-modal');

        // 绑定事件
        this.bindEvents();
        
        // 填充内容（数据应该已经加载）
        this.fillModalContent();
    }
    
    // 填充弹窗内容
    fillModalContent() {
        // 填充版本列表
        const listContainer = document.getElementById('version-list-container');
        const countElement = document.querySelector('.total-count');
        
        if (listContainer && countElement) {
            listContainer.innerHTML = this.renderVersionList();
            countElement.textContent = EnhancedVersionConfig.VERSION_HISTORY.length + " " + i18n('version_units');
        }
        
        // 填充当前版本详情
        const versionInfo = this.getCurrentVersionInfo();
        
        // 更新标题
        const titleElement = document.getElementById('detail-version-title');
        if (titleElement && versionInfo) {
            titleElement.textContent = versionInfo.title || `版本 v${versionInfo.version}`;
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
    }

    // 渲染纯文本更新内容
    renderPlainChanges(changes) {
        if (!changes || !Array.isArray(changes)) return '';

        return `<ul class="plain-changes-list">${changes.map(change =>
            `<li>${change}</li>`
        ).join('')}</ul>`;
    }

    // 渲染版本详情内容
    renderVersionDetailContent(versionInfo) {
        if (!versionInfo) return '<div class="no-data">' + i18n('version_no_data') + '</div>';

        return `
            <div class="version-detail">
                ${EnhancedVersionConfig.IMAGE_SETTINGS.showImage && versionInfo.image && versionInfo.image.trim() !== '' ? `
                    <div class="version-image-container">
                        <img src="${versionInfo.image}" 
                             class="version-image"
                             style="max-height: ${EnhancedVersionConfig.IMAGE_SETTINGS.maxHeight}; width: auto; max-width: 100%;
                             ${EnhancedVersionConfig.IMAGE_SETTINGS.lazyLoad ? 'loading="lazy"' : ''}>
                        <div class="image-info">
                            <div class="image-description">
                                ${SimpleMarkdown.parse(versionInfo.imageAlt) || i18n('version_image_default_alt')}
                            </div>
                        </div>
                    </div>
                ` : ''}
                
                <div class="version-changes">
                    <h4>${i18n('version_changes_title')}</h4>
                    <div class="changes-content">
                        ${EnhancedVersionConfig.SHOW_SETTINGS.enableMarkdown ?
                SimpleMarkdown.parse(versionInfo.changes.join('\n')) :
                this.renderPlainChanges(versionInfo.changes)
            }
                    </div>
                </div>
            </div>
        `;
    }

    // 渲染版本列表（用于左侧栏）
    renderVersionList() {
        const allHistory = this.getAllVersionHistory();
        
        return allHistory.map((history, index) => {
            const versionInfo = this.getVersionInfo(history.version);
            const isCurrent = history.version === this.currentVersion;
            const isSelected = history.version === this.selectedVersion;
            
            return `
                <div class="version-list-item ${isCurrent ? 'current' : ''} ${isSelected ? 'selected' : ''}" 
                     data-version="${history.version}"
                     onclick="if(window.versionManager) window.versionManager.selectVersion('${history.version}')">
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
                        ${versionInfo?.title || i18n(history.titleKey) || i18n('version_fallback_title_with_version') + ' ' + history.version}
                    </div>
                </div>
            `;
        }).join('');
    }

    // 选择版本（更新右侧详情）
    selectVersion(version) {
        if (!version || this.selectedVersion === version) return;
        
        // 检测用户交互
        this.detectUserInteraction();
        
        // 更新选中的版本
        this.selectedVersion = version;
        
        // 更新左侧列表选中状态
        this.updateVersionListSelection();
        
        // 更新右侧详情内容
        this.updateVersionDetail();
    }

    // 更新版本列表选中状态
    updateVersionListSelection() {
        const listItems = document.querySelectorAll('.version-list-item');
        listItems.forEach(item => {
            const version = item.dataset.version;
            item.classList.toggle('selected', version === this.selectedVersion);
        });
    }

    // 更新版本详情
    updateVersionDetail() {
        const versionInfo = this.getVersionInfo(this.selectedVersion);
        
        // 更新标题
        const titleElement = document.getElementById('detail-version-title');
        if (titleElement && versionInfo) {
            titleElement.textContent = versionInfo.title || `版本 v${versionInfo.version}`;
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

    // 绑定全局事件（在构造函数中调用）
    bindGlobalEvents() {
        // 版本列表项点击事件
        const self = this; // 保存this引用
        document.addEventListener('click', function (e) {
            const versionItem = e.target.closest('.version-list-item');

            if (versionItem) {
                const version = versionItem.dataset.version;

                // 检测用户交互
                self.detectUserInteraction();
                self.selectVersion(version);
            }
        });
    }

    // 绑定事件
    bindEvents() {
        // 关闭按钮
        const closeBtn = document.getElementById('modal-close');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                // 停止倒数计时
                this.stopCountdown();
                this.hideModal();
            });
        }

        // 我知道了按钮
        const understandBtn = document.getElementById('understand-btn');
        if (understandBtn) {
            understandBtn.addEventListener('click', () => {
                // 停止倒数计时
                this.stopCountdown();
                this.hideModal();
            });
        }

        // 不再显示按钮
        const dontShowBtn = document.getElementById('dont-show-btn');
        if (dontShowBtn) {
            dontShowBtn.addEventListener('click', () => {
                // 停止倒数计时
                this.stopCountdown();
                this.disableFutureUpdates();
                this.hideModal();
            });
        }

        // 点击遮罩层关闭
        const overlay = this.updateModal?.querySelector('.modal-overlay');
        if (overlay) {
            overlay.addEventListener('click', () => this.hideModal());
        }

        // 弹窗内点击事件检测用户交互
        const modalContent = this.updateModal?.querySelector('.modal-content');
        if (modalContent) {
            modalContent.addEventListener('click', (e) => {
                // 阻止事件冒泡到遮罩层
                e.stopPropagation();
                // 检测用户交互
                this.detectUserInteraction();
            });
        }

        // ESC键关闭
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.updateModal?.classList.contains('show')) {
                this.hideModal();
            }
        });

        // 注意：自动关闭现在由倒数计时器处理，不需要额外的setTimeout
    }

    // 开始倒数计时（带鼠标移动检测）
    startCountdown() {
        // 重置倒数时间
        this.remainingSeconds = Math.floor(EnhancedVersionConfig.SHOW_SETTINGS.autoCloseDelay / 1000);
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

    // 设置鼠标移动检测
    setupMouseMoveDetection() {
        // 移除旧的监听器（如果存在）
        if (this.mouseMoveHandler) {
            document.removeEventListener('mousemove', this.mouseMoveHandler);
        }

        // 创建新的鼠标移动处理器
        this.mouseMoveHandler = (event) => {
            this.handleMouseMove(event);
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
    handleMouseMove(event) {
        this.lastMouseMoveTime = Date.now();
        this.isMouseMoving = true;

        // 如果计时器正在运行，重置它
        if (this.countdownActive && this.countdownInterval) {
            this.resetCountdown();
        }
    }

    // 检测用户交互（包括翻页、滚动等操作）
    detectUserInteraction() {
        this.lastMouseMoveTime = Date.now();
        this.isMouseMoving = true;

        // 如果计时器正在运行，重置它
        if (this.countdownActive && this.countdownInterval) {
            this.resetCountdown();
        }

    }

    // 检查鼠标状态并开始倒数计时
    checkMouseStateAndStartCountdown() {
        // 清除现有的鼠标状态检查定时器
        if (this.mouseMoveTimer) {
            clearTimeout(this.mouseMoveTimer);
        }

        const now = Date.now();
        const timeSinceLastMove = now - this.lastMouseMoveTime;

        if (timeSinceLastMove >= this.mouseMoveTimeout) {
            // 已经超过3秒无鼠标移动，开始倒数计时
            this.startActualCountdown();
        } else {
            // 等待到无鼠标移动状态
            const waitTime = this.mouseMoveTimeout - timeSinceLastMove;

            this.mouseMoveTimer = setTimeout(() => {
                this.startActualCountdown();
            }, waitTime);
        }
    }

    // 开始实际的倒数计时
    startActualCountdown() {
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
    resetCountdown() {
        // 重置剩余时间
        this.remainingSeconds = Math.floor(EnhancedVersionConfig.SHOW_SETTINGS.autoCloseDelay / 1000);

        // 更新显示
        this.updateCountdownDisplay();

        // 重新检查鼠标状态
        this.checkMouseStateAndStartCountdown();
    }

    // 停止倒数计时
    stopCountdown() {
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
    updateCountdownDisplay() {
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

    // 显示弹窗
    showModal() {
        if (!this.updateModal) return;

        // 显示弹窗
        setTimeout(() => {
            this.updateModal.classList.add('show');

            // 开始倒数计时
            if (EnhancedVersionConfig.SHOW_SETTINGS.autoCloseDelay > 0) {
                this.startCountdown();
            }
        }, 100);
    }



    // 隐藏弹窗
    hideModal() {
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
        }, EnhancedVersionConfig.SHOW_SETTINGS.animationDuration);
    }

    // 清理所有链接复制通知
    cleanupLinkNotifications() {
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
    disableFutureUpdates() {
        EnhancedVersionConfig.SHOW_SETTINGS.showOnUpdate = false;
        EnhancedVersionConfig.SHOW_SETTINGS.showOnFirstLoad = false;

        localStorage.setItem('perfectwall_disable_updates', 'true');
    }

    // 设置用户交互检测
    setupUserInteractionDetection() {
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
    removeUserInteractionDetection() {
        if (this.userInteractionHandler && this.updateModal) {
            this.updateModal.removeEventListener('click', this.userInteractionHandler);
            this.updateModal.removeEventListener('touchstart', this.userInteractionHandler);
            this.updateModal.removeEventListener('touchmove', this.userInteractionHandler);
            this.userInteractionHandler = null;
        }
    }

    // 处理用户交互
    handleUserInteraction() {
        // 重置鼠标移动时间，模拟鼠标移动
        this.lastMouseMoveTime = Date.now();
        this.isMouseMoving = true;

        // 如果计时器正在运行，重置它
        if (this.countdownActive && this.countdownInterval) {
            this.resetCountdown();
        }
    }

    // 手动显示版本信息
    showVersionInfo() {
        if (!this.isInitialized) {
            this.createModalHTML();
        }
        this.showModal();
    }

    // 更新版本配置（外部调用）
    updateConfig(newConfig) {
        Object.assign(EnhancedVersionConfig, newConfig);
        this.currentVersion = EnhancedVersionConfig.CURRENT_VERSION;
        this.isNewVersion = this.checkVersionUpdate();
    }
}

// 创建全局增强版版本管理器实例
window.versionManager = new versionManager();

document.addEventListener('click', function (e) {
    const versionItem = e.target.closest('.version-list-item');

    if (versionItem && window.versionManager) {
        const version = versionItem.dataset.version;

        // 检测用户交互
        window.versionManager.detectUserInteraction();
        window.versionManager.selectVersion(version);
    }
});

// 页面加载完成后初始化
$(document).ready(function () {
    // 确保版本管理器已创建
    if (!window.versionManager) {
        window.versionManager = new versionManager();
    }
    
    // 延迟显示，确保其他内容已加载
    setTimeout(async () => {
        if (window.versionManager) {
            try {
                await window.versionManager.initUpdateModal();
            } catch (error) {
                console.error("初始化版本弹窗失败:", error);
            }
        }
    }, 2000);
});

// 提供手动显示版本信息的方法
window.showVersionInfo = function() {
    if (window.versionManager) {
        window.versionManager.showVersionInfo();
    }
};

// 导出
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        versionManager,
        EnhancedVersionConfig,
        SimpleMarkdown
    };
}