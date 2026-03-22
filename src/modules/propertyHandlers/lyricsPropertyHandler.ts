/**
 * Fullscreen Lyrics Property Handler
 * 处理全屏歌词相关的属性监听
 */

import { WallpaperProperties } from './types';
import { config } from '../../utils/config';
import { fullscreenLyrics } from '../fullscreenLyrics';

/**
 * 处理全屏歌词相关属性
 * @param properties 属性对象
 * @param FirstLoad 是否首次加载
 */
export function handleLyricsProperties(
    properties: WallpaperProperties,
    FirstLoad: boolean
): void {

    // 全屏歌词开关
    if (properties.fullscreen_lyrics_enabled) {
        config.fullscreenLyricsEnabled = properties.fullscreen_lyrics_enabled.value;

        if (config.fullscreenLyricsEnabled) {
            fullscreenLyrics.show();
        } else {
            fullscreenLyrics.hide();
        }
    }

    // 显示翻译
    if (properties.fullscreen_lyrics_show_translation) {
        config.fullscreenLyricsShowTranslation = properties.fullscreen_lyrics_show_translation.value;
        fullscreenLyrics.setConfig({ showTranslation: config.fullscreenLyricsShowTranslation });
    }

    // 显示罗马音
    if (properties.fullscreen_lyrics_show_roman) {
        config.fullscreenLyricsShowRoman = properties.fullscreen_lyrics_show_roman.value;
        fullscreenLyrics.setConfig({ showRoman: config.fullscreenLyricsShowRoman });
    }

    // 延迟设置
    if (properties.fullscreen_lyrics_delay) {
        config.fullscreenLyricsDelay = properties.fullscreen_lyrics_delay.value;
        fullscreenLyrics.setConfig({ delay: config.fullscreenLyricsDelay });
    }

    // 启用模糊效果
    if (properties.fullscreen_lyrics_enable_blur) {
        config.fullscreenLyricsEnableBlur = properties.fullscreen_lyrics_enable_blur.value;
        fullscreenLyrics.setConfig({ enableBlur: config.fullscreenLyricsEnableBlur });
    }

    // 隐藏其他元素
    if (properties.fullscreen_lyrics_hide_other) {
        config.fullscreenLyricsHideOther = properties.fullscreen_lyrics_hide_other.value;
        fullscreenLyrics.setConfig({ hideOtherElements: config.fullscreenLyricsHideOther });
    }

    // 显示时钟
    if (properties.fullscreen_lyrics_show_clock) {
        config.fullscreenLyricsShowClock = properties.fullscreen_lyrics_show_clock.value;
        fullscreenLyrics.setConfig({ showClock: config.fullscreenLyricsShowClock });
    }

    // 初始化时根据设置显示/隐藏
    if (FirstLoad && config.fullscreenLyricsEnabled) {
        fullscreenLyrics.show();
    }
}
