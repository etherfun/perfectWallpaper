import { openDockbarItem } from '@/modules/systemMonitor';
import { debugLogger } from '@/utils/logger';

import { applyConfig } from './configApply';
import { DEFAULT_CONFIG, SERVER_URL } from './constants';
import { showContextMenu } from './contextMenu';
import { clearAllIconCache, isDirectIconUrl, resolveIconUrl } from './iconCache';
import { showAddMenu } from './menu/addMenu';
import {
    animateEntrance,
    type DockDomRefs,
    queryDomElements,
    render,
} from './renderer';
import { setDockIcon, setDockItems, setDockVisible } from './state';
import { loadItems, saveItems } from './storage';
import type { DockBarConfig, DockItem } from './types';

export class DockBar {
    private refs: DockDomRefs | null = null;
    private config: DockBarConfig = { ...DEFAULT_CONFIG };
    private enabled = false;

    constructor() {
        this.init();
    }

    private init(): void {
        const refs = queryDomElements();
        if (!refs) return;
        this.refs = refs;

        this.config.items = loadItems();
        applyConfig(refs.container, refs.background, refs.addButton, this.config);
        this.setEnabled(this.config.enabled);
        this.renderItems();
        this.setupEventListeners();
        // 首次渲染时 Vue v-for 可能尚未挂载，动画由 DockBar.vue nextTick 后
        // 调用 playEntranceAnimation() 保证执行；这里调用作为兜底（no-op 无害）。
        void animateEntrance(refs.itemsContainer, this.config.yakeliEnabled);
    }

    /**
     * 延时初始化：如果构造函数执行时 DOM 尚不存在（Vue 尚未 mount），
     * 则在 DOM 就绪后由 DockBar.vue 的 onMounted 调用本方法。
     * 幂等方法——已初始化则跳过。
     */
    ensureInitialized(): void {
        if (this.refs) return;
        this.init();
    }

    private renderItems(): void {
        // 真 Vue 化：写入响应式状态，由 DockBar.vue v-for 渲染
        render(this.config.items);
        // 异步解析非 data:/http 图标的最终 URL，写入 iconUrls 状态
        this.config.items.forEach(item => {
            if (isDirectIconUrl(item.icon)) {
                setDockIcon(item.id, item.icon);
            } else {
                void resolveIconUrl(item, SERVER_URL).then(url => setDockIcon(item.id, url));
            }
        });
    }

    /**
     * 播放入场动画（等 Vue v-for 渲染完成后由 DockBar.vue 调用）。
     */
    public playEntranceAnimation(): void {
        if (!this.refs) return;
        void animateEntrance(this.refs.itemsContainer, this.config.yakeliEnabled);
    }

    private setupEventListeners(): void {
        if (!this.refs) return;

        this.refs.addButton?.addEventListener('click', () => this.openAddMenu());

        this.refs.itemsContainer?.addEventListener('click', e => {
            const target = e.target as HTMLElement;
            const item = target.closest('.dock-item') as HTMLElement | null;
            if (!item) return;
            const itemId = item.dataset.id;
            const dockItem = this.config.items.find(i => i.id === itemId);
            if (dockItem) this.openItem(dockItem);
        });

        this.refs.itemsContainer?.addEventListener('contextmenu', e => {
            e.preventDefault();
            const target = e.target as HTMLElement;
            const item = target.closest('.dock-item') as HTMLElement | null;
            if (!item) return;
            showContextMenu(item.dataset.id, e as MouseEvent, id => this.removeItem(id));
        });
    }

    private openAddMenu(): void {
        showAddMenu({
            serverUrl: SERVER_URL,
            existingItems: this.config.items,
            onAdd: item => this.addItem(item),
            onManageChange: newItems => this.replaceItems(newItems),
        });
    }

    public addItem(item: DockItem): void {
        this.config.items.push(item);
        saveItems(this.config.items);
        render(this.config.items);
        void resolveIconUrl(item, SERVER_URL).then(url => setDockIcon(item.id, url));

        // 入场动画：等 Vue 渲染出新 item 后操作其 inline style（双 rAF 保证已挂载）
        const itemId = item.id;
        requestAnimationFrame(() => {
            const itemEl = this.refs?.itemsContainer.querySelector(
                `[data-id="${itemId}"]`
            ) as HTMLElement | null;
            if (!itemEl) return;
            itemEl.style.opacity = '0';
            itemEl.style.transform = 'scale(0.8) translateY(10px)';
            itemEl.style.transition = 'none';
            requestAnimationFrame(() => {
                itemEl.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
                itemEl.style.opacity = '1';
                itemEl.style.transform = 'scale(1) translateY(0)';
            });
        });
    }

    public removeItem(itemId: string): void {
        const itemEl = this.refs?.itemsContainer.querySelector(
            `[data-id="${itemId}"]`
        ) as HTMLElement | null;

        this.config.items = this.config.items.filter(i => i.id !== itemId);
        saveItems(this.config.items);

        if (!itemEl) {
            setDockItems(this.config.items);
            return;
        }

        // 退场动画：0.2s 淡出后从响应式状态移除
        itemEl.style.transition = 'opacity 0.2s ease, transform 0.2s ease';
        itemEl.style.opacity = '0';
        itemEl.style.transform = 'scale(0.8)';
        setTimeout(() => setDockItems(this.config.items), 200);
    }

    private replaceItems(newItems: DockItem[]): void {
        this.config.items = newItems;
        saveItems(this.config.items);
        this.renderItems();
    }

    private openItem(item: DockItem): void {
        void openDockbarItem(SERVER_URL, {
            type: item.type,
            ...(item.path !== undefined && { path: item.path }),
            ...(item.url !== undefined && { url: item.url }),
        }).then(opened => {
            if (!opened) {
                debugLogger.error('[DockBar] Failed to open item', { item: item.id });
            }
        });
    }

    public updateConfig(newConfig: Partial<DockBarConfig>): void {
        const wasEnabled = this.config.enabled;
        this.config = { ...this.config, ...newConfig };

        if (newConfig.enabled !== undefined && newConfig.enabled !== wasEnabled) {
            this.setEnabled(newConfig.enabled);
        }

        if (this.refs) {
            applyConfig(
                this.refs.container,
                this.refs.background,
                this.refs.addButton,
                this.config
            );
        }
    }

    public setEnabled(enabled: boolean): void {
        this.enabled = enabled;
        // 真 Vue 化：写入响应式状态，DockBar.vue 用 v-show 绑定
        setDockVisible(enabled);
    }

    public isEnabled(): boolean {
        return this.enabled;
    }

    public async clearAllIconCache(): Promise<void> {
        await clearAllIconCache(SERVER_URL);
    }

    public destroy(): void {
        instance = null;
    }
}

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
