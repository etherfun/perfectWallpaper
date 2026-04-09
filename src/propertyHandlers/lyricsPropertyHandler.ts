import { debugLogger } from '@/utils/logger';

import { fullscreenLyrics } from '../fullscreenLyrics';
import { config } from '../utils/config';
import { WallpaperProperties } from './types';

/**
 * 处理全屏歌词相关属性
 * @param properties 属性对象
 * @param FirstLoad 是否首次加载
 */
export function handleLyricsProperties(properties: WallpaperProperties, FirstLoad: boolean): void {
    if (properties.fullscreen_lyrics_enabled) {
        config.fullscreen_lyrics_enabled = properties.fullscreen_lyrics_enabled.value;

        if (config.fullscreen_lyrics_enabled) {
            fullscreenLyrics.show();
        } else {
            fullscreenLyrics.hide();
        }
    }

    if (properties.fullscreen_lyrics_show_translation) {
        config.fullscreen_lyrics_show_translation =
            properties.fullscreen_lyrics_show_translation.value;
        fullscreenLyrics.setConfig({ showTranslation: config.fullscreen_lyrics_show_translation });
    }

    if (properties.fullscreen_lyrics_show_roman) {
        config.fullscreen_lyrics_show_roman = properties.fullscreen_lyrics_show_roman.value;
        fullscreenLyrics.setConfig({ showRoman: config.fullscreen_lyrics_show_roman });
    }

    if (properties.fullscreen_lyrics_delay) {
        config.fullscreen_lyrics_delay = properties.fullscreen_lyrics_delay.value;
        fullscreenLyrics.setConfig({ delay: config.fullscreen_lyrics_delay });
    }

    if (properties.fullscreen_lyrics_enable_blur) {
        config.fullscreen_lyrics_enable_blur = properties.fullscreen_lyrics_enable_blur.value;
        fullscreenLyrics.setConfig({ enableBlur: config.fullscreen_lyrics_enable_blur });
    }

    if (properties.fullscreen_lyrics_hide_other) {
        config.fullscreen_lyrics_hide_other = properties.fullscreen_lyrics_hide_other.value;
        fullscreenLyrics.setConfig({ hideOtherElements: config.fullscreen_lyrics_hide_other });
    }

    if (properties.fullscreen_lyrics_show_clock) {
        config.fullscreen_lyrics_show_clock = properties.fullscreen_lyrics_show_clock.value;
        fullscreenLyrics.setConfig({ showClock: config.fullscreen_lyrics_show_clock });
    }

    if (FirstLoad) {
        if (config.fullscreen_lyrics_enabled) fullscreenLyrics.show();

        debugLogger.info('[FullscreenLyrics] 全屏歌词参数初始化完成');
    }
}
