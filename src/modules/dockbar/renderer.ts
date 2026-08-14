import { debugLogger } from '@/utils/logger';

import { setDockItems } from './state';
import type { DockItem } from './types';

export interface DockDomRefs {
    container: HTMLElement;
    background: HTMLElement;
    itemsContainer: HTMLElement;
    addButton: HTMLElement | null;
}

export function queryDomElements(): DockDomRefs | null {
    const container = document.getElementById('dockbar');
    if (!container) {
        debugLogger.error('[DockBar] DOM elements not found in HTML', { missing: 'dockbar' });
        return null;
    }

    const background = container.querySelector<HTMLElement>('.dockbar-background');
    const itemsContainer = document.getElementById('dockbar-items');
    const addButton = document.getElementById('dockbar-add-btn');

    if (!background) {
        debugLogger.error('[DockBar] DOM elements not found in HTML', {
            missing: '.dockbar-background',
        });
        return null;
    }

    if (!itemsContainer) {
        debugLogger.error('[DockBar] DOM elements not found in HTML', { missing: 'dockbar-items' });
        return null;
    }

    return { container, background, itemsContainer, addButton };
}

export function createItemElement(
    item: DockItem,
    loadIcon: (item: DockItem, imgEl: HTMLImageElement) => void
): HTMLElement {
    const el = document.createElement('div');
    el.className = 'dock-item';
    el.dataset.id = item.id;

    const iconEl = document.createElement('img');
    iconEl.className = 'dock-item-icon';
    iconEl.alt = item.name;
    iconEl.title = item.name;

    if (item.icon.startsWith('data:') || item.icon.startsWith('http')) {
        iconEl.src = item.icon;
    } else {
        loadIcon(item, iconEl);
    }

    el.appendChild(iconEl);
    return el;
}

/**
 * 渲染项目列表（真 Vue 化）。
 * 不再命令式创建 .dock-item DOM，改为写入响应式状态，
 * 由 DockBar.vue 模板 v-for 渲染。
 */
export function render(items: DockItem[]): void {
    setDockItems(items);
}

export async function animateEntrance(
    itemsContainer: HTMLElement,
    yakeliEnabled: boolean
): Promise<void> {
    const items = itemsContainer.querySelectorAll('.dock-item');
    if (items.length === 0) return;

    items.forEach(item => {
        const el = item as HTMLElement;
        el.style.opacity = '0';
        el.style.transform = 'scale(0.8) translateY(10px)';
        el.style.transition = 'none';
    });

    await waitForIcons(itemsContainer);

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

    if (yakeliEnabled) {
        setTimeout(
            () => {
                const container = itemsContainer.closest('.dockbar-container');
                container?.classList.add('yakeli-pulse');
            },
            items.length * baseDelay + 200
        );
    }
}

export async function waitForIcons(itemsContainer: HTMLElement): Promise<void> {
    const images = itemsContainer.querySelectorAll('.dock-item-icon');
    const promises: Promise<void>[] = [];

    images.forEach(img => {
        const imageEl = img as HTMLImageElement;
        if (!imageEl.complete) {
            promises.push(
                new Promise(resolve => {
                    imageEl.onload = () => resolve();
                    imageEl.onerror = () => resolve();
                })
            );
        }
    });

    if (promises.length > 0) {
        await Promise.all(promises);
    }

    await new Promise(resolve => setTimeout(resolve, 100));
}
