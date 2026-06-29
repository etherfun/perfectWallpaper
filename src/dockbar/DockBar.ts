import { openDockbarItem } from '@/systemMonitor';
import { debugLogger } from '@/utils/logger';

import { showAddMenu } from './addMenu';
import { applyConfig } from './configApply';
import { DEFAULT_CONFIG, SERVER_URL } from './constants';
import { showContextMenu } from './contextMenu';
import { clearAllIconCache, loadIcon } from './iconCache';
import {
    animateEntrance,
    createItemElement,
    type DockDomRefs,
    queryDomElements,
    render,
} from './renderer';
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
        if (!this.refs) return;
        render(this.refs.itemsContainer, this.config.items, (item, imgEl) =>
            loadIcon(item, imgEl, SERVER_URL)
        );
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
        if (!this.refs) return;

        const itemEl = createItemElement(item, (it, imgEl) => loadIcon(it, imgEl, SERVER_URL));
        this.refs.itemsContainer.appendChild(itemEl);

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
        saveItems(this.config.items);
        if (!this.refs) return;

        const itemEl = this.refs.itemsContainer.querySelector(
            `[data-id="${itemId}"]`
        ) as HTMLElement | null;
        if (!itemEl) return;
        itemEl.style.transition = 'opacity 0.2s ease, transform 0.2s ease';
        itemEl.style.opacity = '0';
        itemEl.style.transform = 'scale(0.8)';
        setTimeout(() => itemEl.remove(), 200);
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
        if (this.refs) {
            if (enabled) {
                this.refs.container.style.removeProperty('display');
            } else {
                this.refs.container.style.display = 'none';
            }
        }
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
