// @vitest-environment jsdom
/**
 * Tests for src/composables/useLyricsProperties.ts — Stage 3-1
 *
 * Verifies fullscreenLyrics config + show/hide lifecycle.
 */
import { createPinia, setActivePinia } from 'pinia';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

import { useConfigStore } from '@/stores/config';
import { debugLogger } from '@/utils/logger';

const { mockFullscreenLyrics } = vi.hoisted(() => ({
    mockFullscreenLyrics: {
        show: vi.fn(),
        hide: vi.fn(),
        setConfig: vi.fn(),
    },
}));

vi.mock('@/fullscreenLyrics', () => ({
    fullscreenLyrics: mockFullscreenLyrics,
}));

import { useLyricsProperties } from '@/composables/useLyricsProperties';

beforeEach(() => {
    setActivePinia(createPinia());
    debugLogger.clearLogs();
    mockFullscreenLyrics.show.mockClear();
    mockFullscreenLyrics.hide.mockClear();
    mockFullscreenLyrics.setConfig.mockClear();
});

afterEach(() => {
    vi.restoreAllMocks();
});

describe('useLyricsProperties', () => {
    test('enabled true → fullscreenLyrics.show() called + store enabled=true', () => {
        const store = useConfigStore();
        useLyricsProperties({ fullscreen_lyrics_enabled: { value: true } } as never, false);
        expect(store.fullscreen_lyrics_enabled).toBe(true);
        expect(mockFullscreenLyrics.show).toHaveBeenCalledTimes(1);
    });

    test('enabled false → fullscreenLyrics.hide() called', () => {
        useLyricsProperties({ fullscreen_lyrics_enabled: { value: false } } as never, false);
        expect(mockFullscreenLyrics.hide).toHaveBeenCalledTimes(1);
    });

    test('all config flags patch store', () => {
        const store = useConfigStore();
        useLyricsProperties(
            {
                fullscreen_lyrics_show_translation: { value: true },
                fullscreen_lyrics_show_roman: { value: true },
                fullscreen_lyrics_delay: { value: 500 },
                fullscreen_lyrics_enable_blur: { value: true },
                fullscreen_lyrics_hide_other: { value: true },
                fullscreen_lyrics_show_clock: { value: true },
            } as never,
            false
        );
        expect(store.fullscreen_lyrics_show_translation).toBe(true);
        expect(store.fullscreen_lyrics_show_roman).toBe(true);
        expect(store.fullscreen_lyrics_delay).toBe(500);
        expect(store.fullscreen_lyrics_enable_blur).toBe(true);
        expect(store.fullscreen_lyrics_hide_other).toBe(true);
        expect(store.fullscreen_lyrics_show_clock).toBe(true);
    });

    test('setConfig always called with full snapshot from store', () => {
        const store = useConfigStore();
        store.$patch({
            fullscreen_lyrics_show_translation: true,
            fullscreen_lyrics_show_roman: false,
            fullscreen_lyrics_delay: 1000,
            fullscreen_lyrics_enable_blur: true,
            fullscreen_lyrics_hide_other: false,
            fullscreen_lyrics_show_clock: true,
        });
        useLyricsProperties({} as never, false);
        expect(mockFullscreenLyrics.setConfig).toHaveBeenCalledWith({
            showTranslation: true,
            showRoman: false,
            delay: 1000,
            enableBlur: true,
            hideOtherElements: false,
            showClock: true,
        });
    });

    test('FirstLoad + enabled → show() called once at start', () => {
        useLyricsProperties({ fullscreen_lyrics_enabled: { value: true } } as never, true);
        expect(mockFullscreenLyrics.show).toHaveBeenCalledTimes(1);
        const matched = debugLogger.logs.find(
            l => l.message === '[FullscreenLyrics] 全屏歌词参数初始化完成'
        );
        expect(matched).toBeDefined();
    });

    test('FirstLoad + disabled → no show, but logInitComplete called', () => {
        useLyricsProperties({ fullscreen_lyrics_enabled: { value: false } } as never, true);
        expect(mockFullscreenLyrics.show).not.toHaveBeenCalled();
        const matched = debugLogger.logs.find(
            l => l.message === '[FullscreenLyrics] 全屏歌词参数初始化完成'
        );
        expect(matched).toBeDefined();
    });
});
