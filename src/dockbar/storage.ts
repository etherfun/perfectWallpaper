import { debugLogger } from '@/utils/logger';

import { STORAGE_KEY } from './constants';
import type { DockItem } from './types';

export function loadItems(): DockItem[] {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
            const data = JSON.parse(stored);
            return data.items || [];
        }
    } catch (e) {
        debugLogger.error('[DockBar] Failed to load items', { error: e });
    }
    return [];
}

export function saveItems(items: DockItem[]): void {
    try {
        localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify({
                items,
                version: 1,
            })
        );
    } catch (e) {
        debugLogger.error('[DockBar] Failed to save items', { error: e });
    }
}
