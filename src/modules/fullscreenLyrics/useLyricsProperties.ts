import { useConfigStore } from '@/stores/config';

import { WallpaperProperties } from '../../types/types';
import { logInitComplete } from '../../utils/helpers';
import { fullscreenLyrics } from '../fullscreenLyrics';

/**
 * 澶勭悊鍏ㄥ睆姝岃瘝鐩稿叧灞炴€?
 * @param properties 灞炴€у璞?
 * @param FirstLoad 鏄惁棣栨鍔犺浇
 *
 * Stage 7-B: 鏀瑰啓 config.xxx = ... 涓?useConfigStore().$patch({...})锛?
 * 瑙ｉ櫎鏈?handler 瀵?src/utils/config 鍗曚緥鐨勪緷璧栵紙Stage 3.5 鍑嗗锛夈€?
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
