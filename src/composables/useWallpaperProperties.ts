/**
 * 三层回退 composable — Wallpaper Engine 推送层
 *
 * 注册 window.wallpaperPropertyListener.applyUserProperties 监听器（高优先级）。
 * WE 推送时把值合并进 useConfigStore，并转发到 src/propertyHandlers/* 的原链路。
 *
 * 注：
 *   - 不替代 src/propertyHandlers/wallpaperPropertyListener.ts 的旧实现
 *   - Vue 组件通过 Pinia store 响应；旧 .ts 模块通过 config 单例响应（两套并存）
 *   - Phase 8 验证时若发现需要，可让 config 单例与 Pinia store 共享同一个 reactive
 */

import { useConfigStore } from '@/stores/config';

type PushProperties = Record<string, { value: unknown }>;

/**
 * 注册一个 mock-friendly 的 window.wallpaperPropertyListener：
 * - 若 window.wallpaperPropertyListener 已被 setupWallpaperPropertyListener() 占用，
 *   包装它的 applyUserProperties，在转发前先 patch Pinia store
 * - 否则直接挂一个 fallback，仅 patch Pinia store（用于独立浏览器模式）
 */
export function useWallpaperProperties(): void {
    const store = useConfigStore();
    if (typeof window === 'undefined') {
        return;
    }
    const existing = (window as unknown as { wallpaperPropertyListener?: { applyUserProperties?: (p: PushProperties) => void } }).wallpaperPropertyListener;

    if (existing && typeof existing.applyUserProperties === 'function') {
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
    } else {
        (window as unknown as { wallpaperPropertyListener: { applyUserProperties: (p: PushProperties) => void } }).wallpaperPropertyListener = {
            applyUserProperties: (properties: PushProperties) => {
                store.applyUserProperties(properties);
                console.log('[WallpaperProperties] standalone fallback applied', Object.keys(properties).length);
            },
        };
        console.log('[WallpaperProperties] installed standalone fallback listener');
    }
}
