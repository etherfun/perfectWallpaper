/**
 * Domain store: lyrics
 * Fullscreen lyrics settings (Phase 3)
 */
import { defineStore } from 'pinia';
import { ref } from 'vue';

export const useLyricsStore = defineStore('lyrics', () => {
    const fullscreen_lyrics_enabled = ref(false);
    const fullscreen_lyrics_show_translation = ref(true);
    const fullscreen_lyrics_show_roman = ref(false);
    const fullscreen_lyrics_delay = ref(0);
    const fullscreen_lyrics_enable_blur = ref(true);
    const fullscreen_lyrics_hide_other = ref(true);
    const fullscreen_lyrics_show_clock = ref(false);

    return {
        fullscreen_lyrics_enabled, fullscreen_lyrics_show_translation,
        fullscreen_lyrics_show_roman, fullscreen_lyrics_delay,
        fullscreen_lyrics_enable_blur, fullscreen_lyrics_hide_other,
        fullscreen_lyrics_show_clock,
    };
});
