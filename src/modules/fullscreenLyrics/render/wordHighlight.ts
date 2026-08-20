/**
 * Per-word karaoke highlight: marks the word inside the active line whose
 * time-range covers the current playback timestamp.
 *
 * 真 Vue 化：原实现直接给 .word span 加/删 .active class；现在改为写入
 * `lyricsUiState.activeWordIndex`，FullscreenLyrics.vue 模板用
 * :class 绑定高亮。
 */

import { WORD_HIGHLIGHT_INTERVAL_MS } from '../constants';
import type { LyricsUiState } from '../store';
import type { LyricLine } from '../types';

/**
 * 计算 [time, time+duration] 覆盖 currentTime 的字下标并写入 state。
 * 其他字/无动态歌词时写入 -1（对应原实现移除 .active class）。
 */
export function updateWordHighlight(
    state: LyricsUiState,
    line: LyricLine,
    currentTime: number,
    hasDynamic: boolean
): void {
    if (!hasDynamic || !line || !line.dynamicLyric) {
        state.activeWordIndex = -1;
        return;
    }

    let foundIndex = -1;
    for (let i = 0; i < line.dynamicLyric.length; i++) {
        const wordData = line.dynamicLyric[i];
        if (!wordData) continue;
        const wordTime = line.time + wordData.time;
        const wordEndTime = wordTime + wordData.duration;

        if (currentTime >= wordTime && currentTime < wordEndTime) {
            foundIndex = i;
            break;
        }
    }
    state.activeWordIndex = foundIndex;
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
