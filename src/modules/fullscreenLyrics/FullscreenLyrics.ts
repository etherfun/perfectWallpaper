/**
 * Fullscreen Lyrics module
 *
 * Lyrics animation rising from bottom with blur effect.
 *
 * This class is the public-facing orchestrator. It owns config + state,
 * delegates leaf concerns to sibling modules:
 *   - lyricsRenderer.ts  → line state creation, position, animation
 *   - wordHighlight.ts   → per-word karaoke highlight tick
 *   - clock.ts           → optional top-left clock
 *   - visibility.ts      → hide/restore overlapping page chrome
 *   - state.ts           → reactive UI state (FullscreenLyrics.vue 模板绑定)
 *
 * 真 Vue 化：原 createFullscreenLyricsDom 动态创建 DOM + style.display /
 * textContent 写入已全部改为写入 `lyricsUiState`；歌词行由
 * FullscreenLyrics.vue 模板 v-for 渲染。对外 API（show/hide/toggle/
 * destroy/setConfig/checkPlayerState）与拆分前一致。
 */

import { useRuntimeStore } from '@/stores/runtime';

const runtimeStore = useRuntimeStore();

import { DEFAULT_CONFIG } from './constants';
import { animateToNewLine, startFloatingAnimation } from './render/lyricsRenderer';
import { createWordHighlighter, updateWordHighlight } from './render/wordHighlight';
import { connectLyricsSource, type LyricsSourceHandle } from './source/lyricsSource';
import { setLyricsClockVisible, setLyricsCloseVisible, setLyricsVisible, useLyricsStore } from './store';

const lyricsUiState = useLyricsStore();
import type { FullscreenLyricsConfig, LyricsData } from './types';
import { startClockUpdate } from './ui/clock';
import { hideOtherElements, restoreOtherElements } from './ui/visibility';

export class FullscreenLyrics {
    private config: FullscreenLyricsConfig = { ...DEFAULT_CONFIG };
    private currentData: LyricsData | null = null;
    private currentLineIndex = -1;
    private isVisible = false;
    private sourceHandle: LyricsSourceHandle | null = null;
    private stopClock: (() => void) | null = null;
    private wordHighlighter = createWordHighlighter();

    constructor() {
        // 模板关闭按钮回调：组件不反向 import 本类（避免顶层 Pinia 副作用）
        lyricsUiState.onClose = () => this.hide();
    }

    public setConfig(newConfig: Partial<FullscreenLyricsConfig>): void {
        this.config = { ...this.config, ...newConfig };
        this.applyConfig();
    }

    public show(): void {
        this.isVisible = true;
        setLyricsVisible(true);
        setLyricsCloseVisible(this.config.enabled);
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
        setLyricsVisible(false);
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
        this.isVisible = false;
        setLyricsVisible(false);
        // 清空渲染状态（模板 v-for 随之为空）
        lyricsUiState.lines = [];
        lyricsUiState.currentIndex = -1;
        lyricsUiState.activeWordIndex = -1;
    }

    /** Toggle close/clock visibility to match current config */
    private applyConfig(): void {
        setLyricsCloseVisible(this.config.enabled);
        setLyricsClockVisible(this.config.showClock);
        lyricsUiState.showTranslation = this.config.showTranslation;
        lyricsUiState.showRoman = this.config.showRoman;
    }

    /** Open WS + start clock; existing handles are released first */
    private connectSource(): void {
        this.disconnect();
        this.sourceHandle = connectLyricsSource(data => this.handleLyricsUpdate(data));
        this.stopClock = startClockUpdate(() => this.isVisible);
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
        if (!data) return;

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

    /** Rebuild line state and start the active-line's float-up */
    private animateToNewLine(fromIndex: number, toIndex: number): void {
        if (!this.currentData) return;

        animateToNewLine(lyricsUiState, this.currentData, toIndex, this.config);

        if (fromIndex >= 0 && fromIndex !== toIndex) {
            startFloatingAnimation(lyricsUiState, fromIndex);
        }
    }

    /** Start (or restart) the word-highlight tick for the current line */
    private startWordHighlight(): void {
        this.wordHighlighter.start(() => {
            if (!this.isVisible || !this.currentData) return;
            const currentLineEl = lyricsUiState.lines.find(
                line => line.index === this.currentLineIndex
            );
            if (currentLineEl && this.currentData.currentLine) {
                updateWordHighlight(
                    lyricsUiState,
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
