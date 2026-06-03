/**
 * Fullscreen Lyrics module constants
 */

/** WebSocket endpoint for live lyrics streaming */
export const LYRICS_API_URL = 'ws://localhost:42954/get';

/** HTTP fallback endpoint for lyrics polling */
export const LYRICS_HTTP_URL = 'http://localhost:42954/get/lyrics';

/** Selectors of page elements hidden while lyrics are visible */
export const HIDDEN_SELECTORS: readonly string[] = [
    '#picture_info',
    '#player_info',
    '#system-monitor',
];

/** How many lines above/below the current line to keep in DOM */
export const VISIBLE_RANGE = 5;

/** Word highlight update tick (ms) */
export const WORD_HIGHLIGHT_INTERVAL_MS = 50;

/** HTTP polling interval (ms) */
export const HTTP_POLL_INTERVAL_MS = 1000;

/** Pixels between adjacent lyric lines */
export const LINE_HEIGHT = 60;

/** Default height of the scroll viewport in pixels */
export const SCROLL_CONTAINER_HEIGHT = 280;

/** Default FullscreenLyricsConfig */
export const DEFAULT_CONFIG = {
    enabled: false,
    showTranslation: true,
    showRoman: false,
    delay: 0,
    enableBlur: true,
    hideOtherElements: true,
    showClock: false,
} as const;
