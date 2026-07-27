/**
 * Fullscreen Lyrics module
 *
 * Lyrics animation rising from bottom with blur effect.
 *
 * This class is the public-facing orchestrator. It owns config + state,
 * delegates leaf concerns to sibling modules:
 *   - dom.ts              → overlay DOM construction
 *   - lyricsSource.ts     → WebSocket + HTTP polling fallback
 *   - lyricsRenderer.ts   → line element creation, position, animation
 *   - wordHighlight.ts    → per-word karaoke highlight tick
 *   - clock.ts            → optional top-left clock
 *   - visibility.ts       → hide/restore overlapping page chrome
 */

import { useRuntimeStore } from '@/stores/runtime';

const runtimeStore = useRuntimeStore();

import { DEFAULT_CONFIG } from './constants';
import { animateToNewLine, startFloatingAnimation } from './render/lyricsRenderer';
import { createWordHighlighter, updateWordHighlight } from './render/wordHighlight';
import { connectLyricsSource, type LyricsSourceHandle } from './source/lyricsSource';
import type { FullscreenLyricsConfig, LyricsData } from './types';
import { startClockUpdate } from './ui/clock';
import {
    createFullscreenLyricsDom,
    destroyFullscreenLyricsDom,
    type FullscreenLyricsDom,
} from './ui/dom';
import { hideOtherElements, restoreOtherElements } from './ui/visibility';

export class FullscreenLyrics {
    private dom: FullscreenLyricsDom | null = null;
    private config: FullscreenLyricsConfig = { ...DEFAULT_CONFIG };
    private currentData: LyricsData | null = null;
    private currentLineIndex = -1;
    private isVisible = false;
    private lineElements: Map<number, HTMLElement> = new Map();
    private sourceHandle: LyricsSourceHandle | null = null;
    private stopClock: (() => void) | null = null;
    private wordHighlighter = createWordHighlighter();

    public setConfig(newConfig: Partial<FullscreenLyricsConfig>): void {
        this.config = { ...this.config, ...newConfig };
        this.applyConfig();
    }

    public show(): void {
        if (!this.dom) {
            this.dom = createFullscreenLyricsDom(() => this.hide());
        }
        this.isVisible = true;
        this.dom.container.style.display = 'block';
        this.dom.closeButton.style.display = 'block';
        if (this.config.hideOtherElements) {
            hideOtherElements();
        }
        this.connectSource();
    }

    /**
     * 根据当前播放状态自动 show/hide：
     *   - playing (playerState === 1) 且未显示且已启用 → show
     *   - 停止/未播放 (null/0) 且已显示 → hide
     *   - 其他状态保持不变
     * 由 mediaPlaybackListener 在状态真变化时调用。
     */
    public checkPlayerState(): void {
        if (!this.config.enabled) {
            this.hide();
            return;
        }

        // Check if music is playing (playerState: 1 = playing)
        const playerState = runtimeStore.playerInfo.playerState;
        if (playerState === 1 && !this.isVisible && this.config.enabled) {
            this.show();
        } else if ((playerState === null || playerState === 0) && this.isVisible) {
            this.hide();
        }
    }

    public hide(): void {
        this.isVisible = false;
        if (this.dom) {
            this.dom.container.style.display = 'none';
        }
        if (this.config.hideOtherElements) {
            restoreOtherElements();
        }
        this.disconnect();
    }

    public toggle(): void {
        if (this.isVisible) {
            this.hide();
        } else {
            this.show();
        }
    }

    public destroy(): void {
        this.disconnect();
        if (this.dom) {
            destroyFullscreenLyricsDom(this.dom);
            this.dom = null;
        }
    }

    /** Toggle close/clock visibility to match current config */
    private applyConfig(): void {
        if (!this.dom) return;
        this.dom.container.style.display = this.isVisible ? 'block' : 'none';
        this.dom.closeButton.style.display = this.config.enabled ? 'block' : 'none';
        this.dom.clockElement.style.display = this.config.showClock ? 'block' : 'none';
    }

    /** Open WS + start clock; existing handles are released first */
    private connectSource(): void {
        this.disconnect();
        this.sourceHandle = connectLyricsSource(data => this.handleLyricsUpdate(data));
        if (this.dom) {
            this.stopClock = startClockUpdate(this.dom.clockElement, () => this.isVisible);
        }
    }

    /** Tear down WS, clock, word-highlight ticker, and any active rAF */
    private disconnect(): void {
        if (this.sourceHandle) {
            this.sourceHandle.disconnect();
            this.sourceHandle = null;
        }
        if (this.stopClock) {
            this.stopClock();
            this.stopClock = null;
        }
        this.wordHighlighter.stop();
    }

    /** Incoming lyrics payload from the source */
    private handleLyricsUpdate(data: LyricsData): void {
        this.currentData = data;
        this.updateCurrentLyric(data);
        this.startWordHighlight();
    }

    /** Find the line that should be active for `data.currentTime` */
    private updateCurrentLyric(data: LyricsData): void {
        if (!this.dom || !data) return;

        const currentTime = data.currentTime ?? 0;
        let newLineIndex = -1;

        for (let i = 0; i < data.lyricsArray.length; i++) {
            const line = data.lyricsArray[i];
            const nextLine = data.lyricsArray[i + 1];
            if (line && currentTime >= line.time && (!nextLine || currentTime < nextLine.time)) {
                newLineIndex = i;
                break;
            }
        }

        if (newLineIndex !== this.currentLineIndex) {
            const fromIndex = this.currentLineIndex;
            this.currentLineIndex = newLineIndex;
            this.animateToNewLine(fromIndex, newLineIndex);
        }
    }

    /** Build/teardown line elements and start the active-line's float-up */
    private animateToNewLine(fromIndex: number, toIndex: number): void {
        if (!this.dom || !this.currentData) return;

        animateToNewLine(
            this.dom.lyricsContainer,
            this.dom.scrollContainer,
            this.lineElements,
            this.currentData,
            toIndex,
            this.config
        );

        if (fromIndex >= 0 && fromIndex !== toIndex) {
            const fromEl = this.lineElements.get(fromIndex);
            if (fromEl) {
                startFloatingAnimation(fromEl, () => this.lineElements.delete(fromIndex));
            }
        }
    }

    /** Start (or restart) the word-highlight tick for the current line */
    private startWordHighlight(): void {
        this.wordHighlighter.start(() => {
            if (!this.isVisible || !this.currentData) return;
            const currentLineEl = this.lineElements.get(this.currentLineIndex);
            if (currentLineEl && this.currentData.currentLine) {
                updateWordHighlight(
                    currentLineEl,
                    this.currentData.currentLine,
                    this.currentData.currentTime ?? 0,
                    this.currentData.hasDynamic
                );
            }
        });
    }
}

/** Shared singleton — the property handler imports this one instance */
export const fullscreenLyrics = new FullscreenLyrics();
