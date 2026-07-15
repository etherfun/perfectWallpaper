/**
 * Lyrics rendering: builds line elements, computes positions, runs the
 * floating fade-out animation when the active line moves on.
 *
 * These are pure functions over the rendered DOM tree. The caller owns
 * the `lineElements` Map (kept in sync with the live DOM) and the
 * `currentData` snapshot.
 */

import { escapeHtml } from '@/utils/string';

import { LINE_HEIGHT, VISIBLE_RANGE } from './constants';
import type { FullscreenLyricsConfig, LyricLine, LyricsData } from './types';

/**
 * Build a single `.lyric-line` element for the given lyric. The original
 * text is split into per-word spans when dynamic lyrics are present so the
 * word highlight loop can mark the active word.
 */
export function createLineElement(
    line: LyricLine,
    index: number,
    currentData: LyricsData,
    config: FullscreenLyricsConfig
): HTMLElement {
    const el = document.createElement('div');
    el.className = 'lyric-line';
    el.dataset.index = String(index);

    if (line.originalLyric) {
        const originalEl = document.createElement('div');
        originalEl.className = 'original';

        if (currentData.hasDynamic && line.dynamicLyric) {
            // Split into words for dynamic highlight - escape HTML to prevent XSS
            originalEl.innerHTML = splitLyricsToWords(line.originalLyric)
                .map(word => `<span class="word">${escapeHtml(word)}</span>`)
                .join('');
        } else {
            originalEl.textContent = line.originalLyric;
        }
        el.appendChild(originalEl);
    }

    if (config.showTranslation && line.translatedLyric) {
        const transEl = document.createElement('div');
        transEl.className = 'translation';
        transEl.textContent = line.translatedLyric;
        el.appendChild(transEl);
    }

    if (config.showRoman && line.romanLyric) {
        const romanEl = document.createElement('div');
        romanEl.className = 'roman';
        romanEl.textContent = line.romanLyric;
        el.appendChild(romanEl);
    }

    return el;
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
 * Slide the lyrics container so the active line sits at the center of the
 * scroll viewport, and re-style every visible line according to its
 * distance from the active index.
 */
export function updateLinePositions(
    lineElements: Map<number, HTMLElement>,
    scrollContainer: HTMLElement | null,
    lyricsContainer: HTMLElement,
    currentIndex: number,
    lineHeight: number,
    enableBlur: boolean
): void {
    const containerHeight = scrollContainer?.clientHeight ?? 0;
    const centerOffset = containerHeight / 2 - lineHeight / 2;

    lineElements.forEach((el, index) => {
        const relativeIndex = index - currentIndex;
        const basePosition = centerOffset - relativeIndex * lineHeight;

        if (index === currentIndex) {
            el.style.transform = `translateY(${basePosition}px) scale(1.2)`;
            el.style.opacity = '1';
            el.classList.add('active');
        } else if (Math.abs(relativeIndex) === 1) {
            el.style.transform = `translateY(${basePosition}px) scale(1.0)`;
            el.style.opacity = '0.8';
            el.classList.remove('active');
        } else {
            el.style.transform = `translateY(${basePosition}px) scale(0.9)`;
            el.style.opacity = '0.5';
            el.classList.remove('active');
        }

        applyLineStyle(el, relativeIndex, enableBlur);
    });

    // Scroll to center
    if (scrollContainer) {
        const targetScroll = currentIndex * lineHeight - centerOffset;
        lyricsContainer.style.transform = `translateY(${-targetScroll}px)`;
    }
}

/** Per-line blur style; only applied when enableBlur is true */
function applyLineStyle(el: HTMLElement, relativeIndex: number, enableBlur: boolean): void {
    if (enableBlur) {
        el.style.filter = `blur(${Math.abs(relativeIndex) * 2}px)`;
    } else {
        el.style.filter = 'none';
    }
}

/**
 * Make sure all lines within VISIBLE_RANGE of the active line exist in
 * `lineElements` (creating them on demand) and drop anything that's now
 * too far away. Then update positions.
 *
 * Returns the previous active index so the caller can kick off the
 * floating fade-out for the line we just left.
 */
export function animateToNewLine(
    lyricsContainer: HTMLElement,
    scrollContainer: HTMLElement | null,
    lineElements: Map<number, HTMLElement>,
    currentData: LyricsData,
    toIndex: number,
    config: FullscreenLyricsConfig
): number {
    const totalLines = currentData.lyricsArray.length;
    const visibleRange = VISIBLE_RANGE;

    // Create line elements around the new active line
    for (
        let i = Math.max(0, toIndex - visibleRange);
        i <= Math.min(totalLines - 1, toIndex + visibleRange);
        i++
    ) {
        if (!lineElements.has(i)) {
            const line = currentData.lyricsArray[i];
            if (!line) continue;
            const el = createLineElement(line, i, currentData, config);
            lineElements.set(i, el);
            lyricsContainer.appendChild(el);
        }
    }

    // Garbage-collect lines that are now out of range
    lineElements.forEach((el, index) => {
        if (Math.abs(index - toIndex) > visibleRange * 2) {
            el.remove();
            lineElements.delete(index);
        }
    });

    updateLinePositions(
        lineElements,
        scrollContainer,
        lyricsContainer,
        toIndex,
        LINE_HEIGHT,
        config.enableBlur
    );

    return toIndex;
}

/**
 * Start the floating fade-out animation for the line the user just left.
 * The element keeps its current transform/position and glides upward while
 * fading; the optional `onComplete` is invoked once the line is fully gone.
 */
export function startFloatingAnimation(el: HTMLElement, onComplete?: () => void): void {
    el.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
    el.style.opacity = '0';
    el.style.transform += ' translateY(-20px)';

    setTimeout(() => {
        fadeOutAndFloatAway(el, onComplete);
    }, 500);
}

/** Continuation of `startFloatingAnimation` after the initial 500ms transition */
function fadeOutAndFloatAway(element: HTMLElement, onComplete?: () => void): void {
    const startTime = Date.now();
    const duration = 2000;
    const startY = parseFloat(element.style.transform.replace(/[^-\d.]/g, '')) || 0;
    const startOpacity = parseFloat(element.style.opacity) || 0;

    const animate = (): void => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const easeProgress = 1 - Math.pow(1 - progress, 3);

        element.style.opacity = String(startOpacity * (1 - easeProgress));
        element.style.transform = `translateY(${startY - 30 * easeProgress}px) scale(${
            1 - 0.1 * easeProgress
        })`;

        if (progress < 1) {
            requestAnimationFrame(animate);
        } else {
            element.remove();
            onComplete?.();
        }
    };

    requestAnimationFrame(animate);
}
