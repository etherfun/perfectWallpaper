import { clearIconCache as clearIconCacheApi, fetchIcon as fetchIconApi } from '@/modules/systemMonitor';
import { debugLogger } from '@/utils/logger';

/** 容错 localStorage 封装：隐私模式 / 配额满时不抛，统一走 debugLogger */
function safeGet(key: string): string | null {
    try { return localStorage.getItem(key); } catch (e) { debugLogger.warn('[DockBar] localStorage.getItem failed', { key, error: e }); return null; }
}
function safeSet(key: string, value: string): void {
    try { localStorage.setItem(key, value); } catch (e) { debugLogger.warn('[DockBar] localStorage.setItem failed', { key, error: e }); }
}
function safeRemove(key: string): void {
    try { localStorage.removeItem(key); } catch (e) { debugLogger.warn('[DockBar] localStorage.removeItem failed', { key, error: e }); }
}
function safeKeys(): string[] {
    try { return Object.keys(localStorage).filter(k => k.startsWith(ICON_CACHE_PREFIX)); } catch { return []; }
}

import { DEFAULT_ICON, ICON_CACHE_PREFIX, SERVER_URL } from './constants';
import type { DockItem } from './types';

/** data:/http 前缀的图标可被 <img> 直接使用，无需解析 */
export function isDirectIconUrl(icon: string): boolean {
    return icon.startsWith('data:') || icon.startsWith('http');
}

/** 图标缓存键：域名或路径 */
function iconCacheKey(key: string): string {
    return `${ICON_CACHE_PREFIX}${key}`;
}

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
            const cacheKey = iconCacheKey(urlObj.hostname);

            const cached = safeGet(cacheKey);
            if (cached) {
                resolve(cached);
                return;
            }

            const svgFaviconUrl = `${urlObj.origin}/favicon.svg`;
            const svgImg = new Image();
            svgImg.onload = () => {
                safeSet(cacheKey, svgFaviconUrl);
                resolve(svgFaviconUrl);
            };
            svgImg.onerror = () => {
                const icoFaviconUrl = `${urlObj.origin}/favicon.ico`;
                const icoImg = new Image();
                icoImg.onload = () => {
                    safeSet(cacheKey, icoFaviconUrl);
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
    const cacheKey = iconCacheKey(path);

    const cached = safeGet(cacheKey);
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
        const cacheKey = iconCacheKey(urlObj.hostname);

        const cached = safeGet(cacheKey);
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
            safeSet(cacheKey, svgFaviconUrl);
        };
        imgEl.onerror = () => {
            const icoFaviconUrl = `${urlObj.origin}/favicon.ico`;
            imgEl.onload = () => {
                safeSet(cacheKey, icoFaviconUrl);
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
    const cacheKey = iconCacheKey(path);

    const cached = safeGet(cacheKey);
    if (cached) {
        imgEl.onerror = () => {
            safeRemove(cacheKey);
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
        safeSet(key, icon);
    } catch (e) {
        debugLogger.warn('[DockBar] LocalStorage cache failed, cleaning up', { error: e });
        cleanupIconCache();
        try {
            safeSet(key, icon);
        } catch (e2) {
            debugLogger.error('[DockBar] Failed to cache icon after cleanup', { error: e2 });
        }
    }
}

function iconCacheKeys(): string[] {
    return safeKeys();
}

export function cleanupIconCache(): void {
    const keys = iconCacheKeys();
    const toRemove = keys.slice(0, Math.floor(keys.length / 2));
    toRemove.forEach(k => safeRemove(k));
}

export async function clearAllIconCache(serverUrl: string = SERVER_URL): Promise<void> {
    const keys = iconCacheKeys();
    keys.forEach(k => safeRemove(k));

    const result = await clearIconCacheApi(serverUrl);
    debugLogger.info('[DockBar] Cleared icon cache', {
        serverEntries: result?.cleared ?? 0,
        localStorageEntries: keys.length,
    });
}
