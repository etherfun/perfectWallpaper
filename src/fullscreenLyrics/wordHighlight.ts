/**
 * Per-word karaoke highlight: marks the word inside the active line whose
 * time-range covers the current playback timestamp.
 */

import { WORD_HIGHLIGHT_INTERVAL_MS } from './constants';
import type { LyricLine } from './types';

/**
 * Apply the .active class to every word inside `el` whose [time, time+duration]
 * range covers `currentTime`. Other words have the class removed.
 */
export function updateWordHighlight(
    el: HTMLElement,
    line: LyricLine,
    currentTime: number,
    hasDynamic: boolean
): void {
    if (!hasDynamic || !line || !line.dynamicLyric) return;

    const words = el.querySelectorAll('.word');
    for (let i = 0; i < line.dynamicLyric.length; i++) {
        const wordData = line.dynamicLyric[i];
        if (!wordData) continue;
        const wordTime = line.time + wordData.time;
        const wordEndTime = wordTime + wordData.duration;

        const wordEl = words[i];
        if (!wordEl) continue;

        if (currentTime >= wordTime && currentTime < wordEndTime) {
            wordEl.classList.add('active');
        } else {
            wordEl.classList.remove('active');
        }
    }
}

/** State holder for the recurring highlight tick (rAF + setTimeout chain) */
export interface WordHighlightHandle {
    /** Start the tick; the `update` callback runs every interval */
    start: (update: () => void) => void;
    /** Stop the tick and release the pending timer */
    stop: () => void;
}

/** Factory for a self-contained word highlight ticker */
export function createWordHighlighter(): WordHighlightHandle {
    let interval: number | null = null;

    return {
        start(update) {
            if (interval !== null) return;

            const tick = (): void => {
                update();
                interval = window.setTimeout(
                    () => requestAnimationFrame(tick),
                    WORD_HIGHLIGHT_INTERVAL_MS
                );
            };
            tick();
        },
        stop() {
            if (interval !== null) {
                clearTimeout(interval);
                interval = null;
            }
        },
    };
}
