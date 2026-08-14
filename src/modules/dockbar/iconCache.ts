import { clearIconCache as clearIconCacheApi, fetchIcon as fetchIconApi } from '@/modules/systemMonitor';
import { debugLogger } from '@/utils/logger';

import { DEFAULT_ICON, SERVER_URL } from './constants';
import type { DockItem } from './types';

export function getDefaultIcon(): string {
    return DEFAULT_ICON;
}

export function loadIcon(
    item: DockItem,
    imgEl: HTMLImageElement,
    serverUrl: string = SERVER_URL
): void {
    imgEl.src = getDefaultIcon();

    if (item.type === 'url' && item.url) {
        loadUrlIcon(item.url, imgEl);
        return;
    }

    if (item.path) {
        loadPathIcon(item.path, imgEl, serverUrl);
    }
}

/**
 * 解析项目图标的最终 URL（真 Vue 化，供模板 :src 绑定）。
 * 与 loadIcon 的行为一致：data:/http 前缀直接使用；
 * url/path 类型走 localStorage 缓存 + fetch/Image 探测。
 */
export function resolveIconUrl(
    item: DockItem,
    serverUrl: string = SERVER_URL
): Promise<string> {
    if (item.type === 'url' && item.url) {
        return resolveUrlIcon(item.url);
    }

    if (item.path) {
        return resolvePathIcon(item.path, serverUrl);
    }

    return Promise.resolve(getDefaultIcon());
}

/** 解析 URL 类型图标（favicon.svg → favicon.ico → 默认图标） */
function resolveUrlIcon(url: string): Promise<string> {
    return new Promise(resolve => {
        try {
            const urlObj = new URL(url);
            const domain = urlObj.hostname;
            const cacheKey = `icon_${domain}`;

            const cached = localStorage.getItem(cacheKey);
            if (cached) {
                resolve(cached);
                return;
            }

            const svgFaviconUrl = `${urlObj.origin}/favicon.svg`;
            const svgImg = new Image();
            svgImg.onload = () => {
                localStorage.setItem(cacheKey, svgFaviconUrl);
                resolve(svgFaviconUrl);
            };
            svgImg.onerror = () => {
                const icoFaviconUrl = `${urlObj.origin}/favicon.ico`;
                const icoImg = new Image();
                icoImg.onload = () => {
                    localStorage.setItem(cacheKey, icoFaviconUrl);
                    resolve(icoFaviconUrl);
                };
                icoImg.onerror = () => {
                    resolve(getDefaultIcon());
                };
                icoImg.src = icoFaviconUrl;
            };
            svgImg.src = svgFaviconUrl;
        } catch (e) {
            debugLogger.error('[DockBar] Icon load failed', { url, error: e });
            resolve(getDefaultIcon());
        }
    });
}

/** 解析文件/应用类型图标（localStorage 缓存 → 服务端提取） */
function resolvePathIcon(path: string, serverUrl: string): Promise<string> {
    const cacheKey = `icon_${path}`;

    const cached = localStorage.getItem(cacheKey);
    if (cached) {
        return Promise.resolve(cached);
    }

    return fetchIconApi(serverUrl, path, true /* bypassCache */)
        .then(data => {
            if (data && data.icon) {
                cacheIcon(cacheKey, data.icon);
                return data.icon;
            }
            return getDefaultIcon();
        })
        .catch(err => {
            debugLogger.error('[DockBar] Failed to load icon', { path, error: err });
            return getDefaultIcon();
        });
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

    fetchIconApi(serverUrl, path, true /* bypassCache */)
        .then(data => {
            if (data && data.icon) {
                imgEl.onerror = () => {
                    imgEl.src = getDefaultIcon();
                };
                imgEl.src = data.icon;
                cacheIcon(cacheKey, data.icon);
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

    const result = await clearIconCacheApi(serverUrl);
    debugLogger.info('[DockBar] Cleared icon cache', {
        serverEntries: result?.cleared ?? 0,
        localStorageEntries: keys.length,
    });
}
