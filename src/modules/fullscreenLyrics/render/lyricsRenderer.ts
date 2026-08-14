/**
 * Lyrics rendering: builds line state, computes positions, runs the
 * floating fade-out animation when the active line moves on.
 *
 * 真 Vue 化：原实现创建 .lyric-line DOM 并直接写 style；现在改为写入
 * `lyricsUiState`（lines / scrollTransform），FullscreenLyrics.vue 模板
 * 用 v-for + :style 渲染，行为（可见行范围、位置、透明度、模糊、上浮动画）
 * 与拆分前一致。
 */

import { LINE_HEIGHT, SCROLL_CONTAINER_HEIGHT, VISIBLE_RANGE } from '../constants';
import type { LyricsUiState, RenderedLyricLine } from '../state';
import type { FullscreenLyricsConfig, LyricLine, LyricsData } from '../types';

/**
 * Build the per-line state for the given lyric. The original text is split
 * into per-word tokens when dynamic lyrics are present so the word
 * highlight loop can mark the active word.
 */
export function createRenderedLine(
    line: LyricLine,
    index: number,
    currentData: LyricsData,
    config: FullscreenLyricsConfig
): RenderedLyricLine {
    const splitWords = Boolean(currentData.hasDynamic && line.dynamicLyric);
    return {
        index,
        line,
        words: splitWords ? splitLyricsToWords(line.originalLyric) : [line.originalLyric],
        splitWords,
        active: false,
        opacity: 0.5,
        transform: 'translateY(0px) scale(0.9)',
        blur: config.enableBlur ? 'blur(10px)' : 'none',
        floating: false,
    };
}

/**
 * Split CJK / Latin runs into word-level tokens for the karaoke highlight.
 * Punctuation/whitespace between matches is preserved as its own token.
 */
export function splitLyricsToWords(text: string): string[] {
    const words: string[] = [];
    const regex = /[一-鿿぀-ゟ゠-ヿ가-힯]+|[a-zA-Z]+/g;
    let lastIndex = 0;
    let match: RegExpExecArray | null;

    while ((match = regex.exec(text)) !== null) {
        if (match.index > lastIndex) {
            words.push(text.slice(lastIndex, match.index));
        }
        words.push(match[0]);
        lastIndex = regex.lastIndex;
    }

    if (lastIndex < text.length) {
        words.push(text.slice(lastIndex));
    }

    return words;
}

/**
 * 计算每行的位移/透明度/模糊样式并写入 state（原 updateLinePositions 的
 * style 写入）。scrollContainer 高度固定为 SCROLL_CONTAINER_HEIGHT（原
 * dom.ts 注入的固定高度，行为等价），当前行居中于可视区。
 */
export function updateLinePositions(
    state: LyricsUiState,
    currentIndex: number,
    lineHeight: number,
    enableBlur: boolean
): void {
    const containerHeight = SCROLL_CONTAINER_HEIGHT;
    const centerOffset = containerHeight / 2 - lineHeight / 2;

    state.lines.forEach(line => {
        const relativeIndex = line.index - currentIndex;
        const basePosition = centerOffset - relativeIndex * lineHeight;

        if (line.index === currentIndex) {
            line.transform = `translateY(${basePosition}px) scale(1.2)`;
            line.opacity = 1;
            line.active = true;
        } else if (Math.abs(relativeIndex) === 1) {
            line.transform = `translateY(${basePosition}px) scale(1.0)`;
            line.opacity = 0.8;
            line.active = false;
        } else {
            line.transform = `translateY(${basePosition}px) scale(0.9)`;
            line.opacity = 0.5;
            line.active = false;
        }

        applyLineStyle(line, relativeIndex, enableBlur);
    });

    // Scroll to center（原 lyricsContainer transform 写入）
    const targetScroll = currentIndex * lineHeight - centerOffset;
    state.scrollTransform = `translateY(${-targetScroll}px)`;
}

/** Per-line blur style; only applied when enableBlur is true */
function applyLineStyle(line: RenderedLyricLine, relativeIndex: number, enableBlur: boolean): void {
    if (enableBlur) {
        line.blur = `blur(${Math.abs(relativeIndex) * 2}px)`;
    } else {
        line.blur = 'none';
    }
}

/**
 * Make sure all lines within VISIBLE_RANGE of the active line exist in
 * `state.lines` (creating their state on demand) and drop anything that's
 * now too far away. Then update positions.
 *
 * Returns the previous active index so the caller can kick off the
 * floating fade-out for the line we just left.
 */
export function animateToNewLine(
    state: LyricsUiState,
    currentData: LyricsData,
    toIndex: number,
    config: FullscreenLyricsConfig
): number {
    const totalLines = currentData.lyricsArray.length;
    const visibleRange = VISIBLE_RANGE;

    // Create line state around the new active line
    for (
        let i = Math.max(0, toIndex - visibleRange);
        i <= Math.min(totalLines - 1, toIndex + visibleRange);
        i++
    ) {
        if (!state.lines.some(line => line.index === i)) {
            const line = currentData.lyricsArray[i];
            if (!line) continue;
            state.lines.push(createRenderedLine(line, i, currentData, config));
        }
    }

    // Garbage-collect lines that are now out of range
    state.lines = state.lines.filter(line => Math.abs(line.index - toIndex) <= visibleRange * 2);

    updateLinePositions(state, toIndex, LINE_HEIGHT, config.enableBlur);

    return toIndex;
}

/**
 * Start the floating fade-out animation for the line the user just left.
 * The line keeps its current transform/position and glides upward while
 * fading; the optional `onComplete` is invoked once the line is fully gone.
 */
export function startFloatingAnimation(
    state: LyricsUiState,
    fromIndex: number,
    onComplete?: () => void
): void {
    const line = state.lines.find(item => item.index === fromIndex);
    if (!line) return;
    line.floating = true;
    line.opacity = 0;
    line.transform += ' translateY(-20px)';

    setTimeout(() => {
        fadeOutAndFloatAway(state, line, fromIndex, onComplete);
    }, 500);
}

/** Continuation of `startFloatingAnimation` after the initial 500ms transition */
function fadeOutAndFloatAway(
    state: LyricsUiState,
    line: RenderedLyricLine,
    index: number,
    onComplete?: () => void
): void {
    const startTime = Date.now();
    const duration = 2000;
    const startY = parseFloat(line.transform.replace(/[^-\d.]/g, '')) || 0;
    const startOpacity = line.opacity || 0;

    const animate = (): void => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const easeProgress = 1 - Math.pow(1 - progress, 3);

        line.opacity = startOpacity * (1 - easeProgress);
        line.transform = `translateY(${startY - 30 * easeProgress}px) scale(${
            1 - 0.1 * easeProgress
        })`;

        if (progress < 1) {
            requestAnimationFrame(animate);
        } else {
            state.lines = state.lines.filter(item => item.index !== index);
            onComplete?.();
        }
    };

    requestAnimationFrame(animate);
}
