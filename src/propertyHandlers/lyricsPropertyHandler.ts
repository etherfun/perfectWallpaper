import { WallpaperProperties } from './types';
import { config } from '../utils/config';
import { fullscreenLyrics } from '../fullscreenLyrics';
import { debugLogger } from '@/utils/logger';

/**
 * 处理全屏歌词相关属性
 * @param properties 属性对象
 * @param FirstLoad 是否首次加载
 */
export function handleLyricsProperties(
    properties: WallpaperProperties,
    FirstLoad: boolean
): void {

    if (properties.fullscreen_lyrics_enabled) {
        config.fullscreenLyricsEnabled = properties.fullscreen_lyrics_enabled.value;

        if (config.fullscreenLyricsEnabled) {
            fullscreenLyrics.show();
        } else {
            fullscreenLyrics.hide();
        }
    }

    if (properties.fullscreen_lyrics_show_translation) {
        config.fullscreenLyricsShowTranslation = properties.fullscreen_lyrics_show_translation.value;
        fullscreenLyrics.setConfig({ showTranslation: config.fullscreenLyricsShowTranslation });
    }

    if (properties.fullscreen_lyrics_show_roman) {
        config.fullscreenLyricsShowRoman = properties.fullscreen_lyrics_show_roman.value;
        fullscreenLyrics.setConfig({ showRoman: config.fullscreenLyricsShowRoman });
    }

    if (properties.fullscreen_lyrics_delay) {
        config.fullscreenLyricsDelay = properties.fullscreen_lyrics_delay.value;
        fullscreenLyrics.setConfig({ delay: config.fullscreenLyricsDelay });
    }

    if (properties.fullscreen_lyrics_enable_blur) {
        config.fullscreenLyricsEnableBlur = properties.fullscreen_lyrics_enable_blur.value;
        fullscreenLyrics.setConfig({ enableBlur: config.fullscreenLyricsEnableBlur });
    }

    if (properties.fullscreen_lyrics_hide_other) {
        config.fullscreenLyricsHideOther = properties.fullscreen_lyrics_hide_other.value;
        fullscreenLyrics.setConfig({ hideOtherElements: config.fullscreenLyricsHideOther });
    }

    if (properties.fullscreen_lyrics_show_clock) {
        config.fullscreenLyricsShowClock = properties.fullscreen_lyrics_show_clock.value;
        fullscreenLyrics.setConfig({ showClock: config.fullscreenLyricsShowClock });
    }

    if (FirstLoad) {
        if (config.fullscreenLyricsEnabled) fullscreenLyrics.show();

        debugLogger.info('[FullscreenLyrics] 全屏歌词参数初始化完成');
    }
}
