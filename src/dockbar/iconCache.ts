import { debugLogger } from '@/utils/logger';

import { DEFAULT_ICON, SERVER_URL } from './constants';
import type { DockItem } from './types';

export function getDefaultIcon(): string {
    return DEFAULT_ICON;
}

export function loadIcon(item: DockItem, imgEl: HTMLImageElement, serverUrl: string = SERVER_URL): void {
    imgEl.src = getDefaultIcon();

    if (item.type === 'url' && item.url) {
        loadUrlIcon(item.url, imgEl);
        return;
    }

    if (item.path) {
        loadPathIcon(item.path, imgEl, serverUrl);
    }
}

function loadUrlIcon(url: string, imgEl: HTMLImageElement): void {
    try {
        const urlObj = new URL(url);
        const domain = urlObj.hostname;
        const cacheKey = `icon_${domain}`;

        const cached = localStorage.getItem(cacheKey);
        if (cached) {
            imgEl.onload = () => {};
            imgEl.onerror = () => {
                imgEl.src = getDefaultIcon();
            };
            imgEl.src = cached;
            return;
        }

        const svgFaviconUrl = `${urlObj.origin}/favicon.svg`;
        imgEl.onload = () => {
            localStorage.setItem(cacheKey, svgFaviconUrl);
        };
        imgEl.onerror = () => {
            const icoFaviconUrl = `${urlObj.origin}/favicon.ico`;
            imgEl.onload = () => {
                localStorage.setItem(cacheKey, icoFaviconUrl);
            };
            imgEl.onerror = () => {
                imgEl.src = getDefaultIcon();
            };
            imgEl.src = icoFaviconUrl;
        };
        imgEl.src = svgFaviconUrl;
    } catch (e) {
        debugLogger.error('[DockBar] Icon load failed', { url, error: e });
        imgEl.src = getDefaultIcon();
    }
}

function loadPathIcon(path: string, imgEl: HTMLImageElement, serverUrl: string): void {
    const cacheKey = `icon_${path}`;

    const cached = localStorage.getItem(cacheKey);
    if (cached) {
        imgEl.onerror = () => {
            localStorage.removeItem(cacheKey);
            loadPathIcon(path, imgEl, serverUrl);
        };
        imgEl.src = cached;
        return;
    }

    const timestamp = Date.now();
    fetch(`${serverUrl}/api/icon?path=${encodeURIComponent(path)}&t=${timestamp}`)
        .then(res => res.json())
        .then(data => {
            if (data.success && data.data.icon) {
                imgEl.onerror = () => {
                    imgEl.src = getDefaultIcon();
                };
                imgEl.src = data.data.icon;
                cacheIcon(cacheKey, data.data.icon);
            }
        })
        .catch(err => {
            debugLogger.error('[DockBar] Failed to load icon', { path, error: err });
            imgEl.src = getDefaultIcon();
        });
}

function cacheIcon(key: string, icon: string): void {
    try {
        localStorage.setItem(key, icon);
    } catch (e) {
        debugLogger.warn('[DockBar] LocalStorage cache failed, cleaning up', { error: e });
        cleanupIconCache();
        try {
            localStorage.setItem(key, icon);
        } catch (e2) {
            debugLogger.error('[DockBar] Failed to cache icon after cleanup', { error: e2 });
        }
    }
}

export function cleanupIconCache(): void {
    const keys = Object.keys(localStorage).filter(k => k.startsWith('icon_'));
    const toRemove = keys.slice(0, Math.floor(keys.length / 2));
    toRemove.forEach(k => localStorage.removeItem(k));
}

export async function clearAllIconCache(serverUrl: string = SERVER_URL): Promise<void> {
    const keys = Object.keys(localStorage).filter(k => k.startsWith('icon_'));
    keys.forEach(k => localStorage.removeItem(k));

    try {
        const res = await fetch(`${serverUrl}/api/icon/cache`, { method: 'POST' });
        const data = await res.json();
        debugLogger.info('[DockBar] Cleared icon cache', {
            serverEntries: data.data?.cleared || 0,
            localStorageEntries: keys.length,
        });
    } catch (e) {
        debugLogger.error('[DockBar] Failed to clear server cache', { error: e });
    }
}
