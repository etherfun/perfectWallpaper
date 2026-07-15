import { getDefaultIcon, loadIcon } from './iconCache';
import type { DockItem } from './types';

export interface ManageListCallbacks {
    onChange: (newItems: DockItem[]) => void;
}

export function refreshManageList(
    container: HTMLElement,
    items: DockItem[],
    callbacks: ManageListCallbacks
): void {
    container.innerHTML = '';
    items.forEach((item, index) => {
        const itemRow = document.createElement('div');
        itemRow.className = 'manage-item';
        itemRow.dataset.index = String(index);

        const typeLabel = item.type === 'url' ? '链接' : item.type === 'file' ? '文件' : '软件';
        itemRow.innerHTML = `
            <span class="manage-item-icon"><img src="${getDefaultIcon()}" /></span>
            <span class="manage-item-name">${item.name}</span>
            <span class="manage-item-type">${typeLabel}</span>
            <button class="manage-up-btn" ${index === 0 ? 'disabled' : ''}>↑</button>
            <button class="manage-down-btn" ${index === items.length - 1 ? 'disabled' : ''}>↓</button>
            <button class="manage-delete-btn">×</button>
        `;
        container.appendChild(itemRow);

        const iconImg = itemRow.querySelector('.manage-item-icon img') as HTMLImageElement;
        loadIcon(item, iconImg);
    });

    container.querySelectorAll('.manage-up-btn').forEach((btn, i) => {
        btn.addEventListener('click', () => {
            if (i <= 0) return;
            const newItems = [...items];
            const a = newItems[i - 1];
            const b = newItems[i];
            if (a === undefined || b === undefined) return;
            newItems[i - 1] = b;
            newItems[i] = a;
            callbacks.onChange(newItems);
        });
    });

    container.querySelectorAll('.manage-down-btn').forEach((btn, i) => {
        btn.addEventListener('click', () => {
            if (i >= items.length - 1) return;
            const newItems = [...items];
            const a = newItems[i + 1];
            const b = newItems[i];
            if (a === undefined || b === undefined) return;
            newItems[i + 1] = b;
            newItems[i] = a;
            callbacks.onChange(newItems);
        });
    });

    container.querySelectorAll('.manage-delete-btn').forEach((btn, i) => {
        btn.addEventListener('click', () => {
            const target = items[i];
            if (!target) return;
            callbacks.onChange(items.filter(item => item.id !== target.id));
        });
    });
}
