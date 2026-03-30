/**
 * Fullscreen Lyrics module
 * Lyrics animation rising from bottom with blur effect
 */

export * from './types';

import { config } from '../utils/config';
import { debugLogger } from '../utils/logger';
import { escapeHtml } from '../utils/string';
import type { LyricLine, LyricsData, FullscreenLyricsConfig } from './types';

// Lyrics API configuration
const LYRICS_API_URL = 'ws://localhost:42954/get';
const LYRICS_HTTP_URL = 'http://localhost:42954/get/lyrics';

// Fullscreen lyrics class
export class FullscreenLyrics {
    private container: HTMLElement | null = null;
    private lyricsContainer: HTMLElement | null = null;
    private closeButton: HTMLElement | null = null;
    private clockElement: HTMLElement | null = null;
    private ws: WebSocket | null = null;
    private httpPollInterval: number | null = null;
    private config: FullscreenLyricsConfig;
    private currentData: LyricsData | null = null;
    private currentLineIndex: number = -1;
    private isVisible: boolean = false;
    private lineElements: Map<number, HTMLElement> = new Map();
    private animationFrameId: number | null = null;
    private scrollContainer: HTMLElement | null = null;
    private highlightInterval: number | null = null;
    private clockInterval: number | null = null;

    constructor() {
        this.config = {
            enabled: false,
            showTranslation: true,
            showRoman: false,
            delay: 0,
            enableBlur: true,
            hideOtherElements: true,
            showClock: false
        };
    }

    // Initialize DOM structure
    private initDOM(): void {
        this.container = document.createElement('div');
        this.container.id = 'fullscreen-lyrics';
        this.container.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            z-index: 9999;
            display: none;
            background: transparent;
            pointer-events: none;
        `;

        // Scroll container
        this.scrollContainer = document.createElement('div');
        this.scrollContainer.style.cssText = `
            position: absolute;
            bottom: 60px;
            left: 0;
            right: 0;
            height: 280px;
            overflow: hidden;
        `;
        this.container.appendChild(this.scrollContainer);

        // Lyrics container
        this.lyricsContainer = document.createElement('div');
        this.lyricsContainer.id = 'lyrics-container';
        this.lyricsContainer.style.cssText = `
            position: absolute;
            bottom: 0;
            left: 0;
            right: 0;
            display: flex;
            flex-direction: column;
            align-items: center;
            transition: transform 0.5s ease-out;
        `;
        this.scrollContainer.appendChild(this.lyricsContainer);

        // Close button
        this.closeButton = document.createElement('button');
        this.closeButton.id = 'lyrics-close';
        this.closeButton.innerHTML = '✕';
        this.closeButton.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            width: 40px;
            height: 40px;
            border-radius: 50%;
            background: rgba(0, 0, 0, 0.5);
            border: 1px solid rgba(255, 255, 255, 0.3);
            color: white;
            font-size: 20px;
            cursor: pointer;
            display: none;
            z-index: 10000;
            pointer-events: auto;
        `;
        this.closeButton.onclick = () => this.hide();
        this.container.appendChild(this.closeButton);

        // Clock element
        this.clockElement = document.createElement('div');
        this.clockElement.id = 'lyrics-clock';
        this.clockElement.style.cssText = `
            position: fixed;
            top: 20px;
            left: 20px;
            font-size: 24px;
            color: white;
            text-shadow: 2px 2px 4px rgba(0,0,0,0.5);
            display: none;
            z-index: 10000;
        `;
        this.container.appendChild(this.clockElement);

        document.body.appendChild(this.container);

        // Add CSS
        const style = document.createElement('style');
        style.textContent = `
            #fullscreen-lyrics .lyric-line {
                text-align: center;
                padding: 8px 0;
                transition: all 0.3s ease;
                cursor: default;
            }
            #fullscreen-lyrics .lyric-line.active {
                transform: scale(1.1);
            }
            #fullscreen-lyrics .lyric-line .original {
                font-size: 28px;
                font-weight: bold;
                color: white;
                text-shadow: 2px 2px 8px rgba(0,0,0,0.8);
                margin-bottom: 4px;
            }
            #fullscreen-lyrics .lyric-line .translation {
                font-size: 16px;
                color: rgba(255,255,255,0.8);
                text-shadow: 1px 1px 4px rgba(0,0,0,0.6);
            }
            #fullscreen-lyrics .lyric-line .roman {
                font-size: 14px;
                color: rgba(255,255,255,0.6);
                text-shadow: 1px 1px 4px rgba(0,0,0,0.4);
            }
            #fullscreen-lyrics .word {
                display: inline-block;
                transition: all 0.15s ease;
            }
            #fullscreen-lyrics .word.active {
                color: #4ecdc4;
                transform: scale(1.2);
            }
        `;
        this.container.appendChild(style);
    }

    private startClockUpdate(): void {
        const updateClock = () => {
            if (this.clockElement && this.isVisible) {
                const now = new Date();
                this.clockElement.textContent = now.toLocaleTimeString();
            }
        };
        updateClock();
        this.clockInterval = setInterval(updateClock, 1000) as unknown as number;
    }

    public setConfig(newConfig: Partial<FullscreenLyricsConfig>): void {
        this.config = { ...this.config, ...newConfig };
        this.applyConfig();
    }

    private applyConfig(): void {
        if (this.container) {
            this.container.style.display = this.isVisible ? 'block' : 'none';
        }
        if (this.closeButton) {
            this.closeButton.style.display = this.config.enabled ? 'block' : 'none';
        }
        if (this.clockElement) {
            this.clockElement.style.display = this.config.showClock ? 'block' : 'none';
        }
    }

    public show(): void {
        if (!this.container) {
            this.initDOM();
        }
        this.isVisible = true;
        this.container!.style.display = 'block';
        this.closeButton!.style.display = 'block';
        if (this.config.hideOtherElements) {
            this.hideOtherElements();
        }
        this.connectToLyricsServer();
    }

    public hide(): void {
        this.isVisible = false;
        if (this.container) {
            this.container.style.display = 'none';
        }
        if (this.config.hideOtherElements) {
            this.restoreOtherElements();
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

    private hideOtherElements(): void {
        // Hide elements that might obstruct lyrics
        const elementsToHide = ['#picture_info', '#player_info', '#system-monitor'];
        elementsToHide.forEach(selector => {
            const el = document.querySelector(selector);
            if (el) {
                (el as HTMLElement).style.visibility = 'hidden';
            }
        });
    }

    private restoreOtherElements(): void {
        const elementsToRestore = ['#picture_info', '#player_info', '#system-monitor'];
        elementsToRestore.forEach(selector => {
            const el = document.querySelector(selector);
            if (el) {
                (el as HTMLElement).style.visibility = 'visible';
            }
        });
    }

    private connectToLyricsServer(): void {
        try {
            this.ws = new WebSocket(LYRICS_API_URL);

            this.ws.onopen = () => {
                debugLogger.info('[FullscreenLyrics] WebSocket connected');
            };

            this.ws.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    this.handleLyricsUpdate(data);
                } catch (e) {
                    debugLogger.error('[FullscreenLyrics] Failed to parse lyrics data', e);
                }
            };

            this.ws.onclose = () => {
                debugLogger.info('[FullscreenLyrics] WebSocket disconnected, falling back to HTTP');
                this.startHTTPPolling();
            };

            this.ws.onerror = (error) => {
                debugLogger.error('[FullscreenLyrics] WebSocket error', error);
                this.startHTTPPolling();
            };
        } catch (e) {
            debugLogger.error('[FullscreenLyrics] Failed to connect to lyrics server', e);
            this.startHTTPPolling();
        }
    }

    private startHTTPPolling(): void {
        this.httpPollInterval = window.setInterval(() => {
            this.fetchLyrics();
        }, 1000);
    }

    private async fetchLyrics(): Promise<void> {
        try {
            const response = await fetch(LYRICS_HTTP_URL);
            if (response.ok) {
                const data = await response.json();
                this.handleLyricsUpdate(data);
            }
        } catch (e) {
            // Silently fail for HTTP polling
        }
    }

    private disconnect(): void {
        if (this.ws) {
            this.ws.close();
            this.ws = null;
        }
        if (this.httpPollInterval) {
            clearInterval(this.httpPollInterval);
            this.httpPollInterval = null;
        }
        if (this.clockInterval) {
            clearInterval(this.clockInterval);
            this.clockInterval = null;
        }
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
        }
        this.stopWordHighlightUpdate();
    }

    private handleLyricsUpdate(data: LyricsData): void {
        this.currentData = data;
        this.updateCurrentLyric(data);
        this.startWordHighlightUpdate();
    }

    private handleCurrentLineUpdate(data: any): void {
        if (data && data.lineIndex !== undefined && data.lineIndex !== this.currentLineIndex) {
            const fromIndex = this.currentLineIndex;
            this.currentLineIndex = data.lineIndex;
            this.animateToNewLine(fromIndex, this.currentLineIndex);
        }
    }

    private updateCurrentLyric(data: LyricsData): void {
        if (!this.lyricsContainer || !data) return;

        // Find current line based on time
        const currentTime = data.currentTime || 0;
        let newLineIndex = -1;

        for (let i = 0; i < data.lyricsArray.length; i++) {
            const line = data.lyricsArray[i];
            const nextLine = data.lyricsArray[i + 1];
            if (currentTime >= line.time && (!nextLine || currentTime < nextLine.time)) {
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

    private updateWordHighlight(el: HTMLElement, line: any, currentTime: number, hasDynamic: boolean): void {
        if (!hasDynamic || !line || !line.dynamicLyric) return;

        const words = el.querySelectorAll('.word');
        for (let i = 0; i < line.dynamicLyric.length; i++) {
            const wordData = line.dynamicLyric[i];
            const wordTime = line.time + wordData.time;
            const wordEndTime = wordTime + wordData.duration;

            if (words[i]) {
                if (currentTime >= wordTime && currentTime < wordEndTime) {
                    words[i].classList.add('active');
                } else {
                    words[i].classList.remove('active');
                }
            }
        }
    }

    private startWordHighlightUpdate(): void {
        this.stopWordHighlightUpdate();
        const update = () => {
            if (!this.isVisible || !this.currentData) return;

            const currentTime = this.currentData.currentTime || 0;
            const currentLineEl = this.lineElements.get(this.currentLineIndex);
            if (currentLineEl && this.currentData.currentLine) {
                this.updateWordHighlight(currentLineEl, this.currentData.currentLine, currentTime, this.currentData.hasDynamic);
            }
            this.highlightInterval = window.setTimeout(() => requestAnimationFrame(update), 50);
        };
        update();
    }

    private stopWordHighlightUpdate(): void {
        if (this.highlightInterval) {
            clearTimeout(this.highlightInterval);
            this.highlightInterval = null;
        }
    }

    private updateWordHighlightFromTime(): void {
        // Update word highlight based on current playback time
    }

    private clearLyrics(): void {
        if (this.lyricsContainer) {
            this.lyricsContainer.innerHTML = '';
        }
        this.lineElements.clear();
        this.currentLineIndex = -1;
    }

    private animateToNewLine(fromIndex: number, toIndex: number): void {
        if (!this.lyricsContainer || !this.currentData) return;

        // Create/update line elements
        const totalLines = this.currentData.lyricsArray.length;
        const visibleRange = 5; // Show 5 lines above and below

        for (let i = Math.max(0, toIndex - visibleRange); i <= Math.min(totalLines - 1, toIndex + visibleRange); i++) {
            if (!this.lineElements.has(i)) {
                const line = this.currentData.lyricsArray[i];
                const el = this.createLineElement(line, i, toIndex);
                this.lineElements.set(i, el);
                this.lyricsContainer.appendChild(el);
            }
        }

        // Remove elements too far away
        this.lineElements.forEach((el, index) => {
            if (Math.abs(index - toIndex) > visibleRange * 2) {
                el.remove();
                this.lineElements.delete(index);
            }
        });

        // Update positions
        this.updateLinePositions(toIndex, 60);

        // Start floating animation for old lines
        if (fromIndex >= 0 && fromIndex !== toIndex) {
            const fromEl = this.lineElements.get(fromIndex);
            if (fromEl) {
                this.startFloatingAnimation(fromIndex);
            }
        }
    }

    private updateLinePositions(currentIndex: number, lineHeight: number): void {
        const containerHeight = this.scrollContainer?.clientHeight || 280;
        const centerOffset = containerHeight / 2 - lineHeight / 2;

        this.lineElements.forEach((el, index) => {
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

            this.updateLineStyle(el, relativeIndex);
        });

        // Scroll to center
        if (this.lyricsContainer && this.scrollContainer) {
            const targetScroll = (currentIndex * lineHeight) - centerOffset;
            this.lyricsContainer.style.transform = `translateY(${-targetScroll}px)`;
        }
    }

    private updateLineStyle(el: HTMLElement, relativeIndex: number): void {
        if (this.config.enableBlur) {
            el.style.filter = `blur(${Math.abs(relativeIndex) * 2}px)`;
        } else {
            el.style.filter = 'none';
        }
    }

    private createLineElement(line: LyricLine, index: number, currentIndex: number): HTMLElement {
        const el = document.createElement('div');
        el.className = 'lyric-line';
        el.dataset.index = String(index);

        if (line.originalLyric) {
            const originalEl = document.createElement('div');
            originalEl.className = 'original';

            if (this.currentData?.hasDynamic && line.dynamicLyric) {
                // Split into words for dynamic highlight - escape HTML to prevent XSS
                originalEl.innerHTML = this.splitLyricsToWords(line.originalLyric)
                    .map((word, i) => `<span class="word">${escapeHtml(word)}</span>`)
                    .join('');
            } else {
                originalEl.textContent = line.originalLyric;
            }
            el.appendChild(originalEl);
        }

        if (this.config.showTranslation && line.translatedLyric) {
            const transEl = document.createElement('div');
            transEl.className = 'translation';
            transEl.textContent = line.translatedLyric;
            el.appendChild(transEl);
        }

        if (this.config.showRoman && line.romanLyric) {
            const romanEl = document.createElement('div');
            romanEl.className = 'roman';
            romanEl.textContent = line.romanLyric;
            el.appendChild(romanEl);
        }

        return el;
    }

    private splitLyricsToWords(text: string): string[] {
        // Split Chinese characters, Japanese, Korean, and English words separately
        const words: string[] = [];
        const regex = /[\u4e00-\u9fff\u3040-\u309f\u30a0-\u30ff\uac00-\ud7af]+|[a-zA-Z]+/g;
        let lastIndex = 0;
        let match;

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

    private startFloatingAnimation(currentIndex: number): void {
        const el = this.lineElements.get(currentIndex);
        if (!el) return;

        el.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
        el.style.opacity = '0';
        el.style.transform += ' translateY(-20px)';

        setTimeout(() => {
            this.fadeOutAndFloatAway(el);
        }, 500);
    }

    private fadeOutAndFloatAway(element: HTMLElement): void {
        // Continue floating animation
        let startTime = Date.now();
        const duration = 2000;
        const startY = parseFloat(element.style.transform.replace(/[^-\d.]/g, '')) || 0;
        const startOpacity = parseFloat(element.style.opacity) || 0;

        const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const easeProgress = 1 - Math.pow(1 - progress, 3);

            element.style.opacity = String(startOpacity * (1 - easeProgress));
            element.style.transform = `translateY(${startY - 30 * easeProgress}px) scale(${1 - 0.1 * easeProgress})`;

            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                element.remove();
                this.lineElements.delete(this.currentLineIndex);
            }
        };

        requestAnimationFrame(animate);
    }

    public checkPlayerState(): void {
        if (!config.lyricsEnabled) {
            this.hide();
            return;
        }

        // Check if music is playing (playerState: 1 = playing)
        const playerState = config.runtime.playerInfo.playerState;
        if ((playerState === 1) && !this.isVisible && config.fullscreen_lyrics_enabled) {
            this.show();
        } else if ((playerState === null || playerState === 0) && this.isVisible) {
            this.hide();
        }
    }

    public destroy(): void {
        this.disconnect();
        if (this.container) {
            this.container.remove();
        }
        if (this.clockElement) {
            this.clockElement.remove();
        }
    }
}

// Player state change handler
function onPlayerStateChange(key: string, value: unknown): void {
    if (key === 'playerState') {
        fullscreenLyrics.checkPlayerState();
    }
}

// Singleton instance
export const fullscreenLyrics = new FullscreenLyrics();

// Register player state listener
config.addListener(onPlayerStateChange);
