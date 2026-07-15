/**
 * Composable — Wallpaper Engine 属性推送桥接层
 *
 * 包装 window.wallpaperPropertyListener.applyUserProperties，
 * 在 WE 推送时把值合并进 useConfigStore，再转发到 src/propertyHandlers/* 的原链路。
 *
 * 注：
 *   - 不替代 src/propertyHandlers/wallpaperPropertyListener.ts 的旧实现
 *   - Vue 组件通过 Pinia store 响应；旧 .ts 模块通过 config 单例响应（两套并存）
 */

import { useConfigStore } from '@/stores/config';

type PushProperties = Record<string, { value: unknown }>;

/**
 * 包装已有的 window.wallpaperPropertyListener.applyUserProperties：
 * 在转发给旧链路之前先 patch Pinia store。
 */
export function useWallpaperProperties(): void {
    const store = useConfigStore();
    if (typeof window === 'undefined') {
        return;
    }
    const existing = (
        window as unknown as {
            wallpaperPropertyListener?: { applyUserProperties?: (p: PushProperties) => void };
        }
    ).wallpaperPropertyListener;

    if (!existing || typeof existing.applyUserProperties !== 'function') {
        console.warn('[WallpaperProperties] no wallpaperPropertyListener found — WE not injected yet');
        return;
    }

    const originalApply = existing.applyUserProperties;
    existing.applyUserProperties = (properties: PushProperties) => {
        try {
            store.applyUserProperties(properties);
        } catch (err) {
            console.warn('[WallpaperProperties] failed to patch store', err);
        }
        originalApply(properties);
    };
    console.log('[WallpaperProperties] patched existing window.wallpaperPropertyListener');
}
