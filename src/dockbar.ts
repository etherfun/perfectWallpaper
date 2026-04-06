/**
 * DockBar Module
 * 任务栏模块 - 提供应用程序、文件和网页链接的快速访问
 * 特性：亚克力模糊效果、动画入场效果、localStorage持久化
 */

// Dock项数据类型
interface DockItem {
    id: string;
    name: string;
    icon: string;
    type: 'app' | 'file' | 'url';
    path?: string;
    url?: string;
}

// 配置类型
interface DockBarConfig {
    enabled: boolean;
    position: 'bottom' | 'top' | 'left' | 'right';
    positionX: number;
    positionY: number;
    showAddButton: boolean;
    iconSize: number;
    spacing: number;
    yakeliEnabled: boolean;
    yakeliIntensity: number;
    blurIntensity: number;
    yakeliColorR: number;
    yakeliColorG: number;
    yakeliColorB: number;
    roundedCorners: number;
    items: DockItem[];
}

const DEFAULT_CONFIG: DockBarConfig = {
    enabled: true,
    position: 'bottom',
    positionX: 50,
    positionY: 100,
    showAddButton: true,
    iconSize: 48,
    spacing: 12,
    yakeliEnabled: true,
    yakeliIntensity: 0.5,
    blurIntensity: 10,
    yakeliColorR: 255,
    yakeliColorG: 255,
    yakeliColorB: 255,
    roundedCorners: 50,
    items: []
};

const STORAGE_KEY = 'perfectwall_dockbar_items';

class DockBar {
    // Pre-built DOM elements from index.html
    private container: HTMLElement | null = null;
    private background: HTMLElement | null = null;
    private itemsContainer: HTMLElement | null = null;
    private addButton: HTMLElement | null = null;

    private config: DockBarConfig = { ...DEFAULT_CONFIG };
    private enabled: boolean = true;
    private iconLoadPromises: Map<string, Promise<void>> = new Map();

    // 服务器配置
    private serverUrl: string = 'http://localhost:27420';

    constructor() {
        this.init();
    }

    private init(): void {
        this.createElements();
        this.loadItems();
        this.render();
        this.animateEntrance();
        this.setupEventListeners();
    }

    private createElements(): void {
        this.container = document.getElementById('dockbar');
        this.background = this.container?.querySelector('.dockbar-background') || null;
        this.itemsContainer = document.getElementById('dockbar-items');
        this.addButton = document.getElementById('dockbar-add-btn');

        if (!this.container || !this.background) {
            console.error('[DockBar] DOM elements not found in HTML');
            return;
        }

        this.applyConfig();
    }

    private setupEventListeners(): void {
        // 添加按钮点击
        this.addButton?.addEventListener('click', () => {
            this.showAddMenu();
        });

        // 容器点击事件代理
        this.itemsContainer?.addEventListener('click', (e) => {
            const target = e.target as HTMLElement;
            const item = target.closest('.dock-item') as HTMLElement | null;
            if (item) {
                const itemId = item.dataset.id;
                const dockItem = this.config.items.find(i => i.id === itemId);
                if (dockItem) {
                    this.openItem(dockItem);
                }
            }
        });

        // 右键菜单删除
        this.itemsContainer?.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            const target = e.target as HTMLElement;
            const item = target.closest('.dock-item') as HTMLElement | null;
            if (item) {
                const itemId = item.dataset.id;
                this.showContextMenu(itemId, e as MouseEvent);
            }
        });
    }

    private loadItems(): void {
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            if (stored) {
                const data = JSON.parse(stored);
                this.config.items = data.items || [];
            }
        } catch (e) {
            console.error('[DockBar] Failed to load items:', e);
            this.config.items = [];
        }
    }

    private saveItems(): void {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify({
                items: this.config.items,
                version: 1
            }));
        } catch (e) {
            console.error('[DockBar] Failed to save items:', e);
        }
    }

    private render(): void {
        if (!this.itemsContainer) return;

        this.itemsContainer.innerHTML = '';

        this.config.items.forEach(item => {
            const itemEl = this.createItemElement(item);
            this.itemsContainer?.appendChild(itemEl);
        });
    }

    private createItemElement(item: DockItem): HTMLElement {
        const el = document.createElement('div');
        el.className = 'dock-item';
        el.dataset.id = item.id;

        const iconEl = document.createElement('img');
        iconEl.className = 'dock-item-icon';
        iconEl.alt = item.name;
        iconEl.title = item.name;

        // 如果是URL类型的图标，直接使用
        if (item.icon.startsWith('data:') || item.icon.startsWith('http')) {
            iconEl.src = item.icon;
        } else {
            // 否则从服务器获取图标
            this.loadIcon(item, iconEl);
        }

        el.appendChild(iconEl);

        return el;
    }

    private loadIcon(item: DockItem, imgEl: HTMLImageElement): void {
        // 默认先显示占位图
        imgEl.src = this.getDefaultIcon();

        // URL 类型：直接使用网站的 favicon.ico
        if (item.type === 'url' && item.url) {
            try {
                const urlObj = new URL(item.url);
                const domain = urlObj.hostname;
                const cacheKey = `icon_${domain}`;

                const cached = localStorage.getItem(cacheKey);
                if (cached) {
                    imgEl.onload = () => {};
                    imgEl.onerror = () => {
                        imgEl.src = this.getDefaultIcon();
                    };
                    imgEl.src = cached;
                    return;
                }

                // 直接使用网站的 favicon.ico
                const faviconUrl = `${urlObj.origin}/favicon.ico`;
                imgEl.onerror = () => {
                    imgEl.src = this.getDefaultIcon();
                };
                imgEl.src = faviconUrl;
                localStorage.setItem(cacheKey, faviconUrl);
            } catch (e) {
                imgEl.src = this.getDefaultIcon();
            }
            return;
        }

        // 应用/文件类型：从服务器获取图标
        if (item.path) {
            const cacheKey = `icon_${item.path}`;

            // 检查 localStorage 缓存（持久化）
            const cached = localStorage.getItem(cacheKey);
            if (cached) {
                imgEl.onerror = () => {
                    // 缓存失效，删除并重新获取
                    localStorage.removeItem(cacheKey);
                    this.loadIcon(item, imgEl);
                };
                imgEl.src = cached;
                return;
            }

            // 从服务器获取
            fetch(`${this.serverUrl}/api/dockbar/icon?path=${encodeURIComponent(item.path)}`)
                .then(res => res.json())
                .then(data => {
                    if (data.success && data.data.icon) {
                        imgEl.onerror = () => {
                            imgEl.src = this.getDefaultIcon();
                        };
                        imgEl.src = data.data.icon;
                        // 保存到 localStorage 持久化缓存
                        try {
                            localStorage.setItem(cacheKey, data.data.icon);
                        } catch (e) {
                            // localStorage 可能满，清除旧数据重试
                            this.cleanupIconCache();
                            try {
                                localStorage.setItem(cacheKey, data.data.icon);
                            } catch (e2) {
                                console.error('[DockBar] Failed to cache icon:', e2);
                            }
                        }
                    }
                })
                .catch(err => {
                    console.error('[DockBar] Failed to load icon:', err);
                    // 使用默认图标
                    imgEl.src = this.getDefaultIcon();
                });
            return;
        }
    }

    private cleanupIconCache(): void {
        // 清除最早的图标缓存，保留一半
        const keys = Object.keys(localStorage).filter(k => k.startsWith('icon_'));
        const toRemove = keys.slice(0, Math.floor(keys.length / 2));
        toRemove.forEach(k => localStorage.removeItem(k));
    }

    private getDefaultIcon(): string {
        // 返回一个简单的默认图标 (1x1 pixel)
        return 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
    }

    private async animateEntrance(): Promise<void> {
        const items = this.itemsContainer?.querySelectorAll('.dock-item');
        if (!items || items.length === 0) return;

        // 初始状态：不可见，缩小
        items.forEach((item) => {
            const el = item as HTMLElement;
            el.style.opacity = '0';
            el.style.transform = 'scale(0.8) translateY(10px)';
            el.style.transition = 'none';
        });

        // 等待图标加载
        await this.waitForIcons();

        // 错开入场，overshooting缓动
        const easing = 'cubic-bezier(0.34, 1.56, 0.64, 1)';
        const baseDelay = 100;

        items.forEach((item, index) => {
            const el = item as HTMLElement;
            setTimeout(() => {
                el.style.transition = `opacity 0.4s ${easing}, transform 0.4s ${easing}`;
                el.style.opacity = '1';
                el.style.transform = 'scale(1) translateY(0)';
            }, index * baseDelay);
        });

        // 入场完成后亚克力脉冲效果
        if (this.config.yakeliEnabled) {
            setTimeout(() => {
                this.container?.classList.add('yakeli-pulse');
            }, items.length * baseDelay + 200);
        }
    }

    private async waitForIcons(): Promise<void> {
        const images = this.itemsContainer?.querySelectorAll('.dock-item-icon');
        if (!images) return;

        const promises: Promise<void>[] = [];

        images.forEach((img) => {
            const imageEl = img as HTMLImageElement;
            if (!imageEl.complete) {
                promises.push(new Promise((resolve) => {
                    imageEl.onload = () => resolve();
                    imageEl.onerror = () => resolve();
                }));
            }
        });

        if (promises.length > 0) {
            await Promise.all(promises);
        }

        // 额外等待一小段时间确保渲染完成
        await new Promise(resolve => setTimeout(resolve, 100));
    }

    private openItem(item: DockItem): void {
        fetch(`${this.serverUrl}/api/dockbar/open`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                type: item.type,
                path: item.path,
                url: item.url
            })
        })
            .then(res => res.json())
            .then(data => {
                if (!data.success) {
                    console.error('[DockBar] Failed to open item:', data.error);
                }
            })
            .catch(err => {
                console.error('[DockBar] Failed to open item:', err);
            });
    }

    private showAddMenu(): void {
        // 壁纸引擎只支持左键点击，使用伪弹窗对话框
        const overlay = document.createElement('div');
        overlay.className = 'dockbar-dialog';
        overlay.innerHTML = `
            <div class="dockbar-dialog-content">
                <h3>添加项目</h3>
                <div class="dockbar-dialog-type">
                    <button class="type-btn active" data-type="app">应用程序</button>
                    <button class="type-btn" data-type="file">文件</button>
                    <button class="type-btn" data-type="url">网页链接</button>
                </div>
                <div class="dockbar-dialog-fields">
                    <div class="field" id="path-field">
                        <label>路径</label>
                        <button id="dockbar-browse" class="browse-btn">选择文件...</button>
                    </div>
                    <div class="field" id="url-field" style="display:none;">
                        <label>网页链接</label>
                        <button id="paste-url-btn" class="paste-btn">从剪贴板获取</button>
                        <div class="url-presets" id="url-presets"></div>
                    </div>
                </div>
                <div class="dockbar-dialog-actions">
                    <button id="dockbar-cancel">取消</button>
                    <button id="dockbar-add-confirm">添加</button>
                </div>
            </div>
        `;

        document.body.appendChild(overlay);

        // URL 预设选项
        const urlPresets = [
            { name: 'Google', url: 'https://www.google.com' },
            { name: 'GitHub', url: 'https://github.com' },
            { name: 'YouTube', url: 'https://www.youtube.com' },
            { name: 'Bilibili', url: 'https://www.bilibili.com' },
            { name: 'Wikipedia', url: 'https://www.wikipedia.org' },
        ];

        const typeBtns = overlay.querySelectorAll('.type-btn');
        const pathField = overlay.querySelector('#path-field') as HTMLElement;
        const urlField = overlay.querySelector('#url-field') as HTMLElement;
        const urlPresetsEl = overlay.querySelector('#url-presets') as HTMLElement;
        const browseBtn = overlay.querySelector('#dockbar-browse') as HTMLButtonElement;
        const pasteUrlBtn = overlay.querySelector('#paste-url-btn') as HTMLButtonElement;
        const cancelBtn = overlay.querySelector('#dockbar-cancel') as HTMLButtonElement;
        const confirmBtn = overlay.querySelector('#dockbar-add-confirm') as HTMLButtonElement;

        let selectedType = 'app';
        let selectedPath = '';
        let selectedUrl = '';

        // 填充 URL 预设
        urlPresets.forEach(preset => {
            const btn = document.createElement('button');
            btn.className = 'url-preset-btn';
            btn.textContent = preset.name;
            btn.dataset.url = preset.url;
            urlPresetsEl.appendChild(btn);
        });

        const closeDialog = () => {
            overlay.remove();
        };

        // 类型切换
        typeBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                typeBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                selectedType = (btn as HTMLElement).dataset.type || 'app';
                selectedPath = '';
                selectedUrl = '';

                // 清除选中状态
                overlay.querySelectorAll('.url-preset-btn').forEach(b => b.classList.remove('selected'));
                overlay.querySelectorAll('.browse-btn').forEach(b => b.classList.remove('selected'));
                overlay.querySelectorAll('.paste-btn').forEach(b => b.classList.remove('selected'));
                if (browseBtn) browseBtn.textContent = '选择文件...';
                if (pasteUrlBtn) pasteUrlBtn.textContent = '从剪贴板获取';

                if (selectedType === 'url') {
                    pathField.style.display = 'none';
                    urlField.style.display = 'block';
                } else {
                    pathField.style.display = 'block';
                    urlField.style.display = 'none';
                }
            });
        });

        // URL 预设选择
        overlay.querySelectorAll('.url-preset-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                overlay.querySelectorAll('.url-preset-btn').forEach(b => b.classList.remove('selected'));
                overlay.querySelectorAll('.paste-btn').forEach(b => b.classList.remove('selected'));
                btn.classList.add('selected');
                selectedUrl = (btn as HTMLElement).dataset.url || '';
            });
        });

        // 粘贴按钮（暂时禁用）
        pasteUrlBtn?.addEventListener('click', () => {
            pasteUrlBtn.textContent = '功能开发中';
            setTimeout(() => {
                pasteUrlBtn.textContent = '从剪贴板获取';
            }, 1500);
        });

        // 浏览文件
        browseBtn?.addEventListener('click', async () => {
            browseBtn.textContent = '选择中...';
            browseBtn.disabled = true;
            try {
                const response = await fetch(`${this.serverUrl}/api/dockbar/select-file?type=${selectedType}`);
                const data = await response.json();
                if (data.success && data.data.path) {
                    selectedPath = data.data.path;
                    browseBtn.textContent = data.data.name || selectedPath.split('\\').pop() || '已选择';
                    browseBtn.classList.add('selected');
                } else {
                    browseBtn.textContent = '选择文件...';
                }
            } catch (e) {
                console.error('[DockBar] Failed to select file:', e);
                browseBtn.textContent = '选择文件...';
            }
            browseBtn.disabled = false;
        });

        cancelBtn?.addEventListener('click', closeDialog);

        // ========== 排序管理界面 ==========
        const manageSection = document.createElement('div');
        manageSection.className = 'dockbar-dialog-manage';
        manageSection.innerHTML = `
            <h4>管理项目</h4>
            <div class="manage-list" id="manage-list"></div>
        `;
        overlay.querySelector('.dockbar-dialog-content')?.appendChild(manageSection);

        // 填充管理列表
        const manageList = manageSection.querySelector('#manage-list') as HTMLElement;
        const self = this;

        // 刷新管理列表函数
        function refreshManageList() {
            manageList.innerHTML = '';
            self.config.items.forEach((item: DockItem, index: number) => {
                const itemRow = document.createElement('div');
                itemRow.className = 'manage-item';
                itemRow.dataset.index = String(index);

                const typeLabel = item.type === 'url' ? '链接' : item.type === 'file' ? '文件' : '软件';
                itemRow.innerHTML = `
                    <span class="manage-item-icon"><img src="${self.getDefaultIcon()}" /></span>
                    <span class="manage-item-name">${item.name}</span>
                    <span class="manage-item-type">${typeLabel}</span>
                    <button class="manage-up-btn" ${index === 0 ? 'disabled' : ''}>↑</button>
                    <button class="manage-down-btn" ${index === self.config.items.length - 1 ? 'disabled' : ''}>↓</button>
                    <button class="manage-delete-btn">×</button>
                `;
                manageList.appendChild(itemRow);

                // 加载图标
                const iconImg = itemRow.querySelector('.manage-item-icon img') as HTMLImageElement;
                self.loadIcon(item, iconImg);
            });

            // 绑定事件
            manageList.querySelectorAll('.manage-up-btn').forEach((btn, i) => {
                btn.addEventListener('click', () => {
                    if (i > 0) {
                        const temp = self.config.items[i];
                        self.config.items[i] = self.config.items[i - 1];
                        self.config.items[i - 1] = temp;
                        self.saveItems();
                        self.render();
                        refreshManageList();
                    }
                });
            });

            manageList.querySelectorAll('.manage-down-btn').forEach((btn, i) => {
                btn.addEventListener('click', () => {
                    if (i < self.config.items.length - 1) {
                        const temp = self.config.items[i];
                        self.config.items[i] = self.config.items[i + 1];
                        self.config.items[i + 1] = temp;
                        self.saveItems();
                        self.render();
                        refreshManageList();
                    }
                });
            });

            manageList.querySelectorAll('.manage-delete-btn').forEach((btn, i) => {
                btn.addEventListener('click', () => {
                    self.removeItem(self.config.items[i].id);
                    self.render();
                    refreshManageList();
                });
            });
        }

        // 初始渲染和绑定
        refreshManageList();

        confirmBtn?.addEventListener('click', () => {
            let name = '';
            let path = '';
            let url = '';

            if (selectedType === 'url') {
                if (!selectedUrl) return;
                url = selectedUrl;
                name = urlPresets.find(p => p.url === selectedUrl)?.name || '网页链接';
            } else {
                if (!selectedPath) return;
                path = selectedPath;
                name = selectedPath.split('\\').pop()?.replace(/\.[^/.]+$/, '') || '应用程序';
            }

            const newItem: DockItem = {
                id: `dock_${Date.now()}`,
                name,
                icon: '',
                type: selectedType as 'app' | 'file' | 'url',
                path: path || undefined,
                url: url || undefined
            };

            this.addItem(newItem);
            closeDialog();
        });

        // 移除点击外部关闭的功能，只能通过按钮关闭
    }

    private showContextMenu(itemId: string | undefined, event: MouseEvent): void {
        if (!itemId) return;

        // 移除已存在的菜单
        const existing = document.querySelector('.dockbar-context-menu');
        existing?.remove();

        const menu = document.createElement('div');
        menu.className = 'dockbar-context-menu';
        menu.innerHTML = `
            <div class="menu-item delete">删除</div>
        `;

        menu.style.left = `${event.clientX}px`;
        menu.style.top = `${event.clientY}px`;

        menu.querySelector('.delete')?.addEventListener('click', () => {
            this.removeItem(itemId);
            menu.remove();
        });

        document.body.appendChild(menu);

        // 点击外部关闭
        const closeMenu = (e: MouseEvent) => {
            if (!menu.contains(e.target as Node)) {
                menu.remove();
                document.removeEventListener('click', closeMenu);
            }
        };
        setTimeout(() => document.addEventListener('click', closeMenu), 0);
    }

    public addItem(item: DockItem): void {
        this.config.items.push(item);
        this.saveItems();

        const itemEl = this.createItemElement(item);
        this.itemsContainer?.appendChild(itemEl);

        // 新项目动画
        itemEl.style.opacity = '0';
        itemEl.style.transform = 'scale(0.8) translateY(10px)';
        setTimeout(() => {
            itemEl.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
            itemEl.style.opacity = '1';
            itemEl.style.transform = 'scale(1) translateY(0)';
        }, 50);
    }

    public removeItem(itemId: string): void {
        this.config.items = this.config.items.filter(i => i.id !== itemId);
        this.saveItems();

        const itemEl = this.itemsContainer?.querySelector(`[data-id="${itemId}"]`) as HTMLElement | null;
        if (itemEl) {
            itemEl.style.transition = 'opacity 0.2s ease, transform 0.2s ease';
            itemEl.style.opacity = '0';
            itemEl.style.transform = 'scale(0.8)';
            setTimeout(() => itemEl.remove(), 200);
        }
    }

    public updateConfig(newConfig: Partial<DockBarConfig>): void {
        const wasEnabled = this.config.enabled;
        this.config = { ...this.config, ...newConfig };

        if (newConfig.enabled !== undefined && newConfig.enabled !== wasEnabled) {
            this.setEnabled(newConfig.enabled);
        }

        this.applyConfig();
    }

    private applyConfig(): void {
        if (!this.container || !this.background) return;

        // 定位 - 使用X和Y百分比定位
        this.container.style.left = `${this.config.positionX}%`;
        this.container.style.right = 'auto';

        switch (this.config.position) {
            case 'top':
                this.container.style.top = `${this.config.positionY}%`;
                this.container.style.bottom = 'auto';
                break;
            case 'bottom':
                this.container.style.top = 'auto';
                this.container.style.bottom = `${100 - this.config.positionY}%`;
                break;
            case 'left':
                this.container.style.top = `${this.config.positionY}%`;
                this.container.style.bottom = 'auto';
                break;
            case 'right':
                this.container.style.top = `${this.config.positionY}%`;
                this.container.style.bottom = 'auto';
                break;
        }

        // 根据位置调整transform
        let transform = '';
        switch (this.config.position) {
            case 'top':
                transform = 'translateX(-50%)';
                break;
            case 'bottom':
                transform = 'translateX(-50%)';
                break;
            case 'left':
                transform = 'translateY(-50%)';
                break;
            case 'right':
                transform = 'translateY(-50%)';
                break;
        }
        this.container.style.transform = transform;

        // 亚克力效果
        document.body.style.setProperty('--dockbar-yakeli-enabled', this.config.yakeliEnabled ? '1' : '0');
        document.body.style.setProperty('--dockbar-yakeli', String(this.config.yakeliIntensity));
        document.body.style.setProperty('--dockbar-blur-yakeli', `${this.config.blurIntensity}px`);
        document.body.style.setProperty('--dockbar-yakeli-color', `${this.config.yakeliColorR}, ${this.config.yakeliColorG}, ${this.config.yakeliColorB}`);
        document.body.style.setProperty('--dockbar-icon-size', `${this.config.iconSize}px`);
        document.body.style.setProperty('--dockbar-spacing', `${this.config.spacing}px`);
        document.body.style.setProperty('--dockbar-roundedcorners', String(this.config.roundedCorners));

        // 应用到背景
        this.background.style.backgroundColor = `rgba(${this.config.yakeliColorR}, ${this.config.yakeliColorG}, ${this.config.yakeliColorB}, ${this.config.yakeliEnabled ? this.config.yakeliIntensity : 0})`;
        this.background.style.backdropFilter = this.config.yakeliEnabled ? `blur(${this.config.blurIntensity}px)` : 'none';

        // 圆角
        const borderRadius = (this.config.iconSize / 2) * (this.config.roundedCorners / 100);
        this.background.style.borderRadius = `${borderRadius}px`;

        // 添加按钮显示/隐藏
        if (this.addButton) {
            this.addButton.style.display = this.config.showAddButton ? '' : 'none';
        }
    }

    public setEnabled(enabled: boolean): void {
        this.enabled = enabled;
        if (this.container) {
            this.container.style.display = enabled ? '' : 'none';
        }
    }

    public isEnabled(): boolean {
        return this.enabled;
    }

    public destroy(): void {
        instance = null;
    }
}

// 导出单例
let instance: DockBar | null = null;

export function initDockBar(): DockBar {
    if (!instance) {
        instance = new DockBar();
    }
    return instance;
}

export function getDockBar(): DockBar | null {
    return instance;
}

export { DockBar };
