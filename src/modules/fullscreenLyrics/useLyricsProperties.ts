/**
 * useLyricsProperties — Vue 3 composable 包装全屏歌词属性处理
 *
 * Stage 3-1 (Phase 7 批次 3-1): 把 src/propertyHandlers/lyricsPropertyHandler.ts
 * 的全部逻辑迁移到 composable。保持原 handler 的所有副作用（fullscreenLyrics 实例
 * 调用 + Pinia patch），不引入行为变更。
 *
 * 注意：lyrics handler 是唯一不依赖 elementManager 的 handler，
 * 直接 Pinia $patch + 调 fullscreenLyrics 实例方法。
 */
import { useConfigStore } from '@/stores/config';

import { fullscreenLyrics } from '../fullscreenLyrics';
import { logInitComplete } from '../propertyHandlers/_helpers';
import { WallpaperProperties } from '../propertyHandlers/types';

/**
 * 处理全屏歌词相关属性
 * @param properties 属性对象
 * @param FirstLoad 是否首次加载
 *
 * Stage 7-B: 改写 config.xxx = ... 为 useConfigStore().$patch({...})，
 * 解除本 handler 对 src/utils/config 单例的依赖（Stage 3.5 准备）。
 */
export function useLyricsProperties(properties: WallpaperProperties, FirstLoad: boolean): void {
    const store = useConfigStore();
    const patch: Record<string, unknown> = {};
    let fullscreenLyricsShow = false;

    if (properties.fullscreen_lyrics_enabled) {
        const enabled = properties.fullscreen_lyrics_enabled.value;
        patch.fullscreen_lyrics_enabled = enabled;
        fullscreenLyricsShow = enabled;
    }

    if (properties.fullscreen_lyrics_show_translation) {
        patch.fullscreen_lyrics_show_translation =
            properties.fullscreen_lyrics_show_translation.value;
    }

    if (properties.fullscreen_lyrics_show_roman) {
        patch.fullscreen_lyrics_show_roman = properties.fullscreen_lyrics_show_roman.value;
    }

    if (properties.fullscreen_lyrics_delay) {
        patch.fullscreen_lyrics_delay = properties.fullscreen_lyrics_delay.value;
    }

    if (properties.fullscreen_lyrics_enable_blur) {
        patch.fullscreen_lyrics_enable_blur = properties.fullscreen_lyrics_enable_blur.value;
    }

    if (properties.fullscreen_lyrics_hide_other) {
        patch.fullscreen_lyrics_hide_other = properties.fullscreen_lyrics_hide_other.value;
    }

    if (properties.fullscreen_lyrics_show_clock) {
        patch.fullscreen_lyrics_show_clock = properties.fullscreen_lyrics_show_clock.value;
    }

    // Apply patch first so fullscreenLyrics.setConfig reads up-to-date values.
    if (Object.keys(patch).length > 0) {
        store.$patch(patch);
    }

    // Now call side-effects with values pulled from the (patched) store.
    if (fullscreenLyricsShow) {
        fullscreenLyrics.show();
    } else if (properties.fullscreen_lyrics_enabled) {
        fullscreenLyrics.hide();
    }

    // Re-apply the rest of the config to the live fullscreenLyrics instance.
    fullscreenLyrics.setConfig({
        showTranslation: store.fullscreen_lyrics_show_translation === true,
        showRoman: store.fullscreen_lyrics_show_roman === true,
        delay: store.fullscreen_lyrics_delay,
        enableBlur: store.fullscreen_lyrics_enable_blur === true,
        hideOtherElements: store.fullscreen_lyrics_hide_other === true,
        showClock: store.fullscreen_lyrics_show_clock === true,
    });

    if (FirstLoad) {
        if (store.fullscreen_lyrics_enabled === true) fullscreenLyrics.show();
        logInitComplete('[FullscreenLyrics]', '全屏歌词', FirstLoad);
    }
}
