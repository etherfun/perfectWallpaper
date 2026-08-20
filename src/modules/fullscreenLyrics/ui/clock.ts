/**
 * Optional clock widget rendered in the top-left of the lyrics overlay.
 *
 * 真 Vue 化：原实现直接写 clockElement.textContent；现在改为写入
 * `lyricsUiState.clockText`，FullscreenLyrics.vue 模板绑定显示。
 */

import { setLyricsClockText } from '../store';

const CLOCK_INTERVAL_MS = 1000;

/**
 * Start a 1Hz tick that updates the clock text to the current local time.
 * The tick is gated on `isVisible()` so the state write only happens while
 * the overlay is shown.
 *
 * Returns a `stop` function that clears the interval.
 */
export function startClockUpdate(isVisible: () => boolean): () => void {
    const updateClock = (): void => {
        if (isVisible()) {
            setLyricsClockText(new Date().toLocaleTimeString());
        }
    };
    updateClock();
    const id = setInterval(updateClock, CLOCK_INTERVAL_MS) as unknown as number;
    return () => clearInterval(id);
}
