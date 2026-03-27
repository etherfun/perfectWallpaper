/**
 * 全屏歌词模块
 * 从底部上升的歌词动画，带模糊散开效果
 */

import { appConfig, config } from './utils/config';
import { debugLogger } from './utils/logger';

// Lyrics API 配置
const LYRICS_API_URL = 'ws://localhost:42954/get';
const LYRICS_HTTP_URL = 'http://localhost:42954/get/lyrics';

// 歌词数据类型
interface LyricLine {
    time: number; // 该行歌词开始播放的时间（毫秒）
    duration: number; // 该行歌词的持续时间（毫秒）
    originalLyric: string; // 原始歌词（非动态歌词时完整显示，动态歌词时可能为空）
    translatedLyric?: string;
    romanLyric?: string;
    dynamicLyricTime?: number; // 动态歌词开始时间（毫秒），通常与 time 相同
    dynamicLyric?: DynamicWord[]; // 动态歌词数据
}

interface DynamicWord {
    time: number; // 该字开始显示的时间（毫秒，相对于当前歌词行的 time，偏移量）
    duration: number; // 该字持续显示的时间（毫秒）
    flag: number; // 标志位（0=普通，1=开头，2=结尾等）
    word: string; // 显示的字符/词
}

interface LyricsData {
    song: string;
    artist: string;
    songId: number;
    album: string;
    lineIndex: number;
    currentTime: number;
    lyricsArray: LyricLine[];
    totalLines: number;
    hasTranslation: boolean;
    hasRoman: boolean;
    hasDynamic: boolean;
    playing: boolean;
    timestamp: number;
    currentLine?: LyricLine; // 当前行歌词数据（包含 dynamicLyric）
}

// 配置接口
interface FullscreenLyricsConfig {
    enabled: boolean;
    showTranslation: boolean;
    showRoman: boolean;
    delay: number;
    enableBlur: boolean;
    hideOtherElements: boolean;
    showClock: boolean;
}

// 全屏歌词类
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
    private highlightInterval: number | null = null; // 逐字高亮更新定时器

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

    // 初始化 DOM 结构
    private initDOM(): void {
        // 创建主容器
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
            flex-direction: column;
            justify-content: center;
            align-items: center;
            pointer-events: none;
            overflow: hidden;
        `;

        // 创建歌词容器
        this.lyricsContainer = document.createElement('div');
        this.lyricsContainer.id = 'lyrics-container';
        this.lyricsContainer.style.cssText = `
            position: relative;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            width: 100%;
            height: 100%;
            padding: 20px;
            box-sizing: border-box;
            overflow: hidden;
        `;

        // 创建关闭按钮
        this.closeButton = document.createElement('div');
        this.closeButton.id = 'lyrics-close-btn';
        this.closeButton.innerHTML = '✕';
        this.closeButton.style.cssText = `
            position: absolute;
            top: 20px;
            right: 30px;
            width: 40px;
            height: 40px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 24px;
            color: rgba(255, 255, 255, 0.7);
            cursor: pointer;
            pointer-events: auto;
            border-radius: 50%;
            background: rgba(0, 0, 0, 0.3);
            transition: all 0.3s ease;
        `;
        this.closeButton.addEventListener('click', () => this.hide());
        this.closeButton.addEventListener('mouseenter', () => {
            if (this.closeButton) {
                this.closeButton.style.background = 'rgba(0, 0, 0, 0.5)';
                this.closeButton.style.color = '#fff';
            }
        });
        this.closeButton.addEventListener('mouseleave', () => {
            if (this.closeButton) {
                this.closeButton.style.background = 'rgba(0, 0, 0, 0.3)';
                this.closeButton.style.color = 'rgba(255, 255, 255, 0.7)';
            }
        });

        // 创建时钟元素
        this.clockElement = document.createElement('div');
        this.clockElement.id = 'lyrics-clock';
        this.clockElement.style.cssText = `
            position: absolute;
            top: 20px;
            left: 30px;
            font-size: 18px;
            color: rgba(255, 255, 255, 0.5);
            pointer-events: none;
            display: none;
        `;

        this.container.appendChild(this.lyricsContainer);
        this.container.appendChild(this.closeButton);
        this.container.appendChild(this.clockElement);
        document.body.appendChild(this.container);

        // 启动时钟更新
        this.startClockUpdate();
    }

    // 更新时钟显示
    private startClockUpdate(): void {
        const updateClock = (): void => {
            if (this.clockElement && this.isVisible) {
                const now = new Date();
                this.clockElement.textContent = now.toLocaleTimeString('zh-CN', {
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit'
                });
            }
        };
        setInterval(updateClock, 1000);
        updateClock();
    }

    // 设置配置
    public setConfig(newConfig: Partial<FullscreenLyricsConfig>): void {
        this.config = { ...this.config, ...newConfig };
        this.applyConfig();
    }

    // 应用配置
    private applyConfig(): void {
        if (!this.container) return;

        if (this.clockElement) {
            this.clockElement.style.display = this.config.showClock && this.isVisible ? 'block' : 'none';
        }

        if (this.closeButton) {
            this.closeButton.style.display = this.isVisible ? 'flex' : 'none';
        }
    }

    // 显示全屏歌词
    public show(): void {
        if (!this.container) {
            this.initDOM();
        }

        if (this.container) {
            this.isVisible = true;
            this.container.style.display = 'flex';
            this.applyConfig();

            if (this.config.hideOtherElements) {
                this.hideOtherElements();
            }

            // 开始获取歌词数据
            this.connectToLyricsServer();

            // 开始逐字高亮更新
            this.startWordHighlightUpdate();
        }
    }

    // 隐藏全屏歌词
    public hide(): void {
        if (this.container) {
            this.isVisible = false;
            this.container.style.display = 'none';
            this.restoreOtherElements();
            this.disconnect();
            this.clearLyrics();
            this.stopWordHighlightUpdate();
        }
    }

    // 切换显示状态
    public toggle(): void {
        if (this.isVisible) {
            this.hide();
        } else {
            this.show();
        }
    }

    // 隐藏其他元素
    private hideOtherElements(): void {
        const elementsToHide = [
            '#player_control',
            '#clock',
            '#date',
            '#weather',
            '#hitokoto',
            '#countdown',
            '#picturesinfo'
        ];

        elementsToHide.forEach(selector => {
            const el = document.querySelector(selector);
            if (el) {
                (el as HTMLElement).dataset.lyricsOriginalDisplay = (el as HTMLElement).style.display || '';
                (el as HTMLElement).style.display = 'none';
            }
        });
    }

    // 恢复其他元素
    private restoreOtherElements(): void {
        const elementsToRestore = [
            '#player_control',
            '#clock',
            '#date',
            '#weather',
            '#hitokoto',
            '#countdown',
            '#picturesinfo'
        ];

        elementsToRestore.forEach(selector => {
            const el = document.querySelector(selector);
            if (el && (el as HTMLElement).dataset.lyricsOriginalDisplay !== undefined) {
                (el as HTMLElement).style.display = (el as HTMLElement).dataset.lyricsOriginalDisplay || '';
            }
        });
    }

    // 连接到歌词服务器
    private connectToLyricsServer(): void {
        // 优先使用 WebSocket
        try {
            this.ws = new WebSocket(LYRICS_API_URL);

            this.ws.onopen = () => {
                debugLogger.info('[FullscreenLyrics] WebSocket connected');
            };

            this.ws.onmessage = (event) => {
                try {
                    const message = JSON.parse(event.data);
                    if (message.type === 'fulllyrics' || message.type === 'lyrics-update') {
                        // 完整歌词推送
                        this.handleLyricsUpdate(message.data || message);
                    } else if (message.type === 'currentlyric') {
                        // 当前歌词行推送
                        this.handleCurrentLineUpdate(message.data);
                    }
                } catch (e) {
                    debugLogger.error('[FullscreenLyrics] Failed to parse message');
                }
            };

            this.ws.onclose = () => {
                debugLogger.info('[FullscreenLyrics] WebSocket disconnected, falling back to HTTP');
                this.startHTTPPolling();
            };

            this.ws.onerror = () => {
                debugLogger.error('[FullscreenLyrics] WebSocket error, falling back to HTTP');
                this.startHTTPPolling();
            };
        } catch (e) {
            debugLogger.error('[FullscreenLyrics] Failed to connect via WebSocket');
            this.startHTTPPolling();
        }
    }

    // 开始 HTTP 轮询
    private startHTTPPolling(): void {
        if (this.httpPollInterval) {
            clearInterval(this.httpPollInterval);
        }

        this.fetchLyrics();

        this.httpPollInterval = window.setInterval(() => {
            this.fetchLyrics();
        }, 1000);
    }

    // 获取歌词数据
    private async fetchLyrics(): Promise<void> {
        try {
            const response = await fetch(LYRICS_HTTP_URL);
            if (response.ok) {
                const data = await response.json();
                if (!data.expired) {
                    this.handleLyricsUpdate(data);
                }
            }
        } catch (e) {
            // 静默失败，不打印错误
        }
    }

    // 断开连接
    private disconnect(): void {
        if (this.ws) {
            this.ws.close();
            this.ws = null;
        }
        if (this.httpPollInterval) {
            clearInterval(this.httpPollInterval);
            this.httpPollInterval = null;
        }
    }

    // 处理歌词更新
    private handleLyricsUpdate(data: LyricsData): void {
        const previousLineIndex = this.currentLineIndex;
        this.currentData = data;
        this.currentLineIndex = data.lineIndex;

        // 确保计时器在运行
        this.startWordHighlightUpdate();

        // 调试日志
        console.log('[FullscreenLyrics] fullyrics received:', {
            lineIndex: data.lineIndex,
            currentTime: data.currentTime,
            hasDynamic: data.hasDynamic,
            currentLineTime: data.currentLine?.time,
            currentLineDuration: data.currentLine?.duration,
            dynamicLyric: data.currentLine?.dynamicLyric?.slice(0, 3)
        });

        // 如果行索引变化，触发动画
        if (previousLineIndex !== this.currentLineIndex) {
            this.animateToNewLine(previousLineIndex, this.currentLineIndex);
        }

        // 实时更新当前行歌词
        this.updateCurrentLyric(data);
    }

    // 处理当前歌词行更新（用于 currentlyric 事件）
    private handleCurrentLineUpdate(data: any): void {
        if (!this.currentData) return;

        // 确保计时器在运行
        this.startWordHighlightUpdate();

        // 更新当前时间和行信息
        this.currentData.currentTime = data.currentTime;
        this.currentData.lineIndex = data.lineIndex;
        this.currentData.currentLine = data.currentLine;
        this.currentData.playing = data.playing;

        // 调试日志
        console.log('[FullscreenLyrics] currentlyric received:', {
            lineIndex: data.lineIndex,
            currentTime: data.currentTime,
            currentLineTime: data.currentLine?.time,
            dynamicLyric: data.currentLine?.dynamicLyric?.slice(0, 3)
        });

        const previousLineIndex = this.currentLineIndex;
        this.currentLineIndex = data.lineIndex;

        // 如果行索引变化，触发动画
        if (previousLineIndex !== this.currentLineIndex) {
            this.animateToNewLine(previousLineIndex, this.currentLineIndex);
        }

        // 实时更新当前行歌词
        this.updateCurrentLyric(this.currentData);
    }

    // 更新当前歌词
    private updateCurrentLyric(data: LyricsData): void {
        if (!this.lyricsContainer) return;

        const currentLine = data.currentLine;
        if (!currentLine) return;

        // 调试日志
        console.log('[FullscreenLyrics] updateCurrentLyric:', {
            lineIndex: data.lineIndex,
            currentTime: data.currentTime,
            hasDynamic: data.hasDynamic,
            currentLineTime: currentLine.time,
            currentLineDuration: currentLine.duration,
            dynamicLyricCount: currentLine.dynamicLyric?.length
        });

        // 更新当前行元素的歌词内容
        const currentEl = this.lineElements.get(data.lineIndex);
        if (currentEl) {
            const translationEl = currentEl.querySelector('.lyric-translation') as HTMLElement;
            const romanEl = currentEl.querySelector('.lyric-roman') as HTMLElement;

            if (translationEl && this.config.showTranslation && currentLine.translatedLyric) {
                translationEl.textContent = currentLine.translatedLyric;
                translationEl.style.display = '';
            } else if (translationEl) {
                translationEl.style.display = 'none';
            }

            if (romanEl && this.config.showRoman && currentLine.romanLyric) {
                romanEl.textContent = currentLine.romanLyric;
                romanEl.style.display = '';
            } else if (romanEl) {
                romanEl.style.display = 'none';
            }

            // 更新逐字高亮（使用 currentLine 的 dynamicLyric）
            this.updateWordHighlight(currentEl, currentLine, data.currentTime, data.hasDynamic);
        }
    }

    // 更新逐字高亮
    private updateWordHighlight(el: HTMLElement, line: any, currentTime: number, hasDynamic: boolean): void {
        const words = el.querySelectorAll('.lyric-word');

        // 如果有动态歌词数据
        if (hasDynamic && line && line.dynamicLyric && line.dynamicLyric.length > 0) {
            // dynamicLyric 中的 time 是绝对时间戳

            // 找到当前正在唱的字的索引（-1表示还没有开始）
            let currentWordIndex = -1;

            for (let i = 0; i < line.dynamicLyric.length; i++) {
                const dynWord = line.dynamicLyric[i];
                const wordStartTime = dynWord.time;
                const wordEndTime = wordStartTime + dynWord.duration;

                // 如果当前时间在这个字的时间段内
                if (currentTime >= wordStartTime && currentTime < wordEndTime) {
                    currentWordIndex = i;
                    break;
                }
                // 如果当前时间已经超过这个字
                if (currentTime >= wordEndTime) {
                    currentWordIndex = i; // 记录最后一个唱完的字
                }
            }

            // 调试日志
            console.log('[FullscreenLyrics] Word highlight:', {
                currentTime,
                currentWordIndex,
                wordCount: words.length,
                dynamicWordCount: line.dynamicLyric.length
            });

            // 更新每个字的高亮状态
            words.forEach((wordEl, i) => {
                const word = wordEl as HTMLElement;
                if (currentWordIndex < 0) {
                    // 还没开始，所有字半透明
                    word.style.color = 'rgba(255, 255, 255, 0.5)';
                    word.style.fontWeight = '400';
                    word.style.textShadow = 'none';
                } else if (i < currentWordIndex) {
                    // 已唱过的字：完全高亮
                    word.style.color = '#fff';
                    word.style.fontWeight = '600';
                    word.style.textShadow = '0 2px 20px rgba(0,0,0,0.5)';
                } else if (i === currentWordIndex) {
                    // 当前正在唱的的字：特殊样式
                    word.style.color = '#fff';
                    word.style.fontWeight = '600';
                    word.style.textShadow = '0 2px 20px rgba(0,0,0,0.5)';
                } else {
                    // 未唱的字：半透明
                    word.style.color = 'rgba(255, 255, 255, 0.5)';
                    word.style.fontWeight = '400';
                    word.style.textShadow = 'none';
                }
            });
        } else {
            // 非逐字歌词，重置样式
            words.forEach((wordEl) => {
                const word = wordEl as HTMLElement;
                word.style.color = '';
                word.style.fontWeight = '';
                word.style.textShadow = '';
            });
        }
    }

    // 开始逐字高亮更新
    private startWordHighlightUpdate(): void {
        this.stopWordHighlightUpdate();
        this.highlightInterval = window.setInterval(() => {
            if (this.currentData && this.isVisible) {
                this.updateWordHighlightFromTime();
            }
        }, 100); // 每100ms更新一次 (10fps足够)
    }

    // 停止逐字高亮更新
    private stopWordHighlightUpdate(): void {
        if (this.highlightInterval) {
            clearInterval(this.highlightInterval);
            this.highlightInterval = null;
        }
    }

    // 根据当前时间更新逐字高亮
    private updateWordHighlightFromTime(): void {
        if (!this.currentData || !this.currentData.currentLine) return;

        const currentEl = this.lineElements.get(this.currentLineIndex);
        if (currentEl) {
            this.updateWordHighlight(currentEl, this.currentData.currentLine, this.currentData.currentTime, this.currentData.hasDynamic);
        }
    }

    // 清除歌词
    private clearLyrics(): void {
        if (this.lyricsContainer) {
            this.lyricsContainer.innerHTML = '';
        }
        this.lineElements.clear();
        this.currentLineIndex = -1;
    }

    // 动画过渡到新行 - 每个歌词行独立定位到屏幕中央
    private animateToNewLine(fromIndex: number, toIndex: number): void {
        if (!this.lyricsContainer) return;

        const lyricsArray = this.currentData?.lyricsArray || [];
        const lineHeight = 110; // 每行高度（增加间隔）

        // 首次加载：预渲染所有歌词
        if (fromIndex < 0) {
            this.lyricsContainer.innerHTML = '';
            this.lineElements.clear();

            // 创建滚动容器（不需要transition）
            const scrollContainer = document.createElement('div');
            scrollContainer.className = 'lyrics-scroll-container';
            scrollContainer.style.cssText = `
                position: absolute;
                left: 0;
                top: 0;
                width: 100%;
                height: 100%;
            `;

            // 渲染所有歌词行，每行独立定位到屏幕中央
            lyricsArray.forEach((line, i) => {
                const el = this.createLineElement(line, i, toIndex);

                // 计算该行应该显示的位置（屏幕中央 + 相对偏移）
                const screenHeight = window.innerHeight || 600;
                const relativeIndex = i - toIndex; // 相对于当前行的位置
                const top = screenHeight / 2 + relativeIndex * lineHeight - lineHeight / 2;

                el.style.cssText += `
                    position: absolute;
                    width: 100%;
                    left: 0;
                    top: ${top}px;
                    height: ${lineHeight}px;
                    display: flex;
                    flex-direction: column;
                    justify-content: center;
                    transition: top 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94),
                                opacity 0.4s ease-out,
                                filter 0.4s ease-out;
                `;
                el.dataset.indexLine = String(i);
                el.dataset.index = String(relativeIndex);
                this.lineElements.set(i, el);
                scrollContainer.appendChild(el);
            });

            this.lyricsContainer.appendChild(scrollContainer);
            this.scrollContainer = scrollContainer;

            this.startFloatingAnimation(toIndex);
            return;
        }

        // 更新所有行的位置（每个独立动画到新位置）
        this.updateLinePositions(toIndex, lineHeight);

        this.startFloatingAnimation(toIndex);
    }

    // 更新所有歌词行的位置和样式（每个独立滑动到新位置）
    private updateLinePositions(currentIndex: number, lineHeight: number): void {
        const screenHeight = window.innerHeight || 600;

        this.lineElements.forEach((el, index) => {
            const relativeIndex = index - currentIndex;
            const top = screenHeight / 2 + relativeIndex * lineHeight - lineHeight / 2;

            // 更新 data-index
            el.dataset.index = String(relativeIndex);

            // 动画移动到新位置
            el.style.top = `${top}px`;

            // 更新样式（字体大小、透明度等）
            this.updateLineStyle(el, relativeIndex);
        });
    }

    // 更新单行歌词的样式
    private updateLineStyle(el: HTMLElement, relativeIndex: number): void {
        const absDistance = Math.abs(relativeIndex);
        const isCurrent = relativeIndex === 0;

        // 透明度
        let opacity = 1;
        if (absDistance > 0) {
            opacity = Math.max(0.35, 1 - absDistance * 0.2);
        }

        // 模糊
        let blur = '0px';
        if (this.config.enableBlur && absDistance > 0) {
            blur = `${Math.min(absDistance * 3, 20)}px`;
        }

        // 字体大小
        let fontSize = 28;
        if (isCurrent) {
            fontSize = 42;
        } else if (absDistance <= 2) {
            fontSize = 32 - absDistance * 2;
        } else {
            fontSize = 24 - Math.min(absDistance, 4);
        }

        // 更新歌词容器样式
        el.style.fontSize = `${fontSize}px`;
        el.style.color = isCurrent ? '#fff' : `rgba(255, 255, 255, ${opacity})`;
        el.style.filter = blur;
        el.style.opacity = String(opacity);

        // 更新单词样式
        const words = el.querySelectorAll('.lyric-word');
        words.forEach((wordEl) => {
            const word = wordEl as HTMLElement;
            word.style.fontWeight = isCurrent ? '600' : '400';
            word.style.textShadow = isCurrent ? '0 2px 20px rgba(0,0,0,0.5)' : 'none';
        });

        // 更新翻译样式
        const translations = el.querySelectorAll('.lyric-translation');
        translations.forEach((transEl) => {
            const trans = transEl as HTMLElement;
            trans.style.color = `rgba(255, 255, 255, ${opacity * 0.7})`;
            trans.style.fontSize = `${Math.max(16, fontSize * 0.45)}px`;
        });
    }

    // 创建歌词行元素
    private createLineElement(line: LyricLine, index: number, currentIndex: number): HTMLElement {
        const el = document.createElement('div');
        el.className = 'lyric-line';
        // indexLine: 全部歌词的第几行
        el.dataset.indexLine = String(index);
        // index: 相对于当前行的位置 (0=当前行, 1=下一句, -1=上一句)
        el.dataset.index = String(index - currentIndex);

        const distance = index - currentIndex;
        const isCurrent = distance === 0;
        const absDistance = Math.abs(distance);

        // 基础透明度：根据距离计算（减小衰减，让下一句更明显）
        let opacity = 1;
        if (absDistance > 0) {
            opacity = Math.max(0.35, 1 - absDistance * 0.2);
        }

        // 模糊效果（增大范围）
        let blur = '0px';
        if (this.config.enableBlur && absDistance > 0) {
            blur = `${Math.min(absDistance * 3, 20)}px`;
        }

        // 字体大小：当前行更大
        let fontSize = 28;
        if (isCurrent) {
            fontSize = 42;
        } else if (absDistance <= 2) {
            fontSize = 32 - absDistance * 2;
        } else {
            fontSize = 24 - Math.min(absDistance, 4);
        }

        // 颜色
        const textColor = isCurrent ? '#fff' : `rgba(255, 255, 255, ${opacity})`;

        el.style.cssText = `
            display: flex;
            flex-direction: column;
            align-items: center;
            text-align: center;
            margin: ${isCurrent ? '20px' : '12px'} 0;
            font-size: ${fontSize}px;
            color: ${textColor};
            filter: blur(${blur});
            opacity: ${opacity};
            transition: all 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94);
            transform-origin: center;
            pointer-events: none;
            line-height: 1.4;
        `;

        // 将歌词分割成单词/字符
        const words = this.splitLyricsToWords(line.originalLyric || '');
        const wordContainer = document.createElement('div');
        wordContainer.className = 'lyric-words';
        wordContainer.style.cssText = `
            display: flex;
            flex-wrap: wrap;
            justify-content: center;
            gap: 0.15em;
            margin-bottom: 0.1em;
        `;

        words.forEach((word, wordIndex) => {
            const wordSpan = document.createElement('span');
            wordSpan.className = 'lyric-word';
            wordSpan.textContent = word;
            wordSpan.dataset.wordIndex = String(wordIndex);
            wordSpan.style.cssText = `
                display: inline-block;
                font-weight: ${isCurrent ? '600' : '400'};
                text-shadow: ${isCurrent ? '0 2px 20px rgba(0,0,0,0.5)' : 'none'};
                transition: transform 0.3s ease-out, opacity 0.3s ease-out;
            `;
            wordContainer.appendChild(wordSpan);
        });

        el.appendChild(wordContainer);

        // 创建翻译文本（也分割成单词）
        if (line.translatedLyric && this.config.showTranslation) {
            const transWords = this.splitLyricsToWords(line.translatedLyric);
            const translationContainer = document.createElement('div');
            translationContainer.className = 'lyric-translation';
            translationContainer.style.cssText = `
                display: flex;
                flex-wrap: wrap;
                justify-content: center;
                font-size: ${Math.max(16, fontSize * 0.45)}px;
                color: rgba(255, 255, 255, ${opacity * 0.7});
                margin-top: 4px;
                gap: 0.1em;
            `;

            transWords.forEach((word) => {
                const wordSpan = document.createElement('span');
                wordSpan.textContent = word;
                wordSpan.style.cssText = `
                    display: inline-block;
                    opacity: ${opacity};
                `;
                translationContainer.appendChild(wordSpan);
            });

            el.appendChild(translationContainer);
        }

        // 创建罗马音文本（也分割成单词）
        if (line.romanLyric && this.config.showRoman) {
            const romanWords = this.splitLyricsToWords(line.romanLyric);
            const romanContainer = document.createElement('div');
            romanContainer.className = 'lyric-roman';
            romanContainer.style.cssText = `
                display: flex;
                flex-wrap: wrap;
                justify-content: center;
                font-size: ${Math.max(14, fontSize * 0.4)}px;
                color: rgba(255, 255, 255, ${opacity * 0.5});
                margin-top: 4px;
                font-style: italic;
                gap: 0.1em;
            `;

            romanWords.forEach((word) => {
                const wordSpan = document.createElement('span');
                wordSpan.textContent = word;
                wordSpan.style.cssText = `
                    display: inline-block;
                `;
                romanContainer.appendChild(wordSpan);
            });

            el.appendChild(romanContainer);
        }

        return el;
    }

    // 将歌词分割成单词/字符
    private splitLyricsToWords(text: string): string[] {
        if (!text) return [];

        // 按照空格分割，保留空格
        // 中文字符每个字单独显示，日文按字符分割，英文按单词分割
        const chars: string[] = [];
        let currentWord = '';

        for (let i = 0; i < text.length; i++) {
            const char = text[i];
            const code = char.charCodeAt(0);

            // 检查是否是中文字符、日文汉字、平假名、片假名
            const isCJK = (code >= 0x4E00 && code <= 0x9FFF) ||    // CJK统一汉字
                          (code >= 0x3400 && code <= 0x4DBF) ||    // CJK统一汉字扩展A
                          (code >= 0x3040 && code <= 0x309F) ||    // 日文平假名
                          (code >= 0x30A0 && code <= 0x30FF) ||    // 日文片假名
                          (code >= 0xAC00 && code <= 0xD7AF);       // 韩文

            if (isCJK) {
                // 如果有累积的英文单词，先保存
                if (currentWord) {
                    chars.push(currentWord);
                    currentWord = '';
                }
                chars.push(char);
            } else if (char === ' ' || char === '\t' || char === '\n') {
                // 空白字符
                if (currentWord) {
                    chars.push(currentWord);
                    currentWord = '';
                }
                // 不添加空白字符，由CSS gap处理
            } else {
                // 英文字母和符号，累积成单词
                currentWord += char;
            }
        }

        // 处理最后累积的单词
        if (currentWord) {
            chars.push(currentWord);
        }

        return chars;
    }

    // 开始浮动动画（每个字独立浮动）
    private startFloatingAnimation(currentIndex: number): void {
        // 先清除之前的动画
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
        }

        // 清除所有字的浮动效果
        this.lineElements.forEach((el) => {
            const words = el.querySelectorAll('.lyric-word');
            words.forEach((wordEl) => {
                (wordEl as HTMLElement).style.transform = 'translate(0px, 0px)';
            });
            const translations = el.querySelectorAll('.lyric-translation span');
            translations.forEach((transEl) => {
                (transEl as HTMLElement).style.transform = 'translate(0px, 0px)';
            });
            const romans = el.querySelectorAll('.lyric-roman span');
            romans.forEach((romanEl) => {
                (romanEl as HTMLElement).style.transform = 'translate(0px, 0px)';
            });
        });

        const duration = 2000; // 2秒完成一次浮动
        const verticalAmplitude = 3; // 垂直浮动幅度
        const horizontalAmplitude = 2; // 水平浮动幅度
        let startTime: number | null = null;

        const animate = (timestamp: number): void => {
            if (!startTime) startTime = timestamp;

            const elapsed = timestamp - startTime;

            this.lineElements.forEach((el, index) => {
                if (index === currentIndex) {
                    // 获取所有单词元素
                    const words = el.querySelectorAll('.lyric-word');
                    words.forEach((wordEl, wordIndex) => {
                        // 每个字有独立的相位偏移，实现独立浮动
                        const phaseOffset = (wordIndex * 0.15) % 1;
                        const wordProgress = ((elapsed / duration) + phaseOffset) % 1;

                        // 垂直浮动（上下）
                        const verticalOffset = Math.sin(wordProgress * Math.PI * 2) * verticalAmplitude;
                        // 水平浮动（左右）
                        const horizontalOffset = Math.cos(wordProgress * Math.PI * 2) * horizontalAmplitude;

                        (wordEl as HTMLElement).style.transform = `translate(${horizontalOffset}px, ${verticalOffset}px)`;
                    });

                    // 翻译也独立浮动（相位更大）
                    const translations = el.querySelectorAll('.lyric-translation span');
                    translations.forEach((transEl, i) => {
                        const phaseOffset = ((i + words.length) * 0.12) % 1;
                        const wordProgress = ((elapsed / duration) + phaseOffset) % 1;
                        const verticalOffset = Math.sin(wordProgress * Math.PI * 2) * (verticalAmplitude * 0.7);
                        const horizontalOffset = Math.cos(wordProgress * Math.PI * 2) * (horizontalAmplitude * 0.7);
                        (transEl as HTMLElement).style.transform = `translate(${horizontalOffset}px, ${verticalOffset}px)`;
                    });

                    // 罗马音也独立浮动
                    const romans = el.querySelectorAll('.lyric-roman span');
                    romans.forEach((romanEl, i) => {
                        const phaseOffset = ((i + words.length + translations.length) * 0.1) % 1;
                        const wordProgress = ((elapsed / duration) + phaseOffset) % 1;
                        const verticalOffset = Math.sin(wordProgress * Math.PI * 2) * (verticalAmplitude * 0.5);
                        const horizontalOffset = Math.cos(wordProgress * Math.PI * 2) * (horizontalAmplitude * 0.5);
                        (romanEl as HTMLElement).style.transform = `translate(${horizontalOffset}px, ${verticalOffset}px)`;
                    });
                }
            });

            if (this.isVisible) {
                this.animationFrameId = requestAnimationFrame(animate);
            }
        };

        this.animationFrameId = requestAnimationFrame(animate);
    }

    // 向上飘散消失（每个字独立飘散）
    private fadeOutAndFloatAway(element: HTMLElement): void {
        const duration = 1200;
        const floatDistanceY = 60; // 向上飘散距离
        const floatDistanceX = 25; // 水平飘散距离
        let startTime: number | null = null;

        // 为每个字预计算随机方向
        const words = element.querySelectorAll('.lyric-word');
        const randomDirections: { x: number; y: number }[] = [];
        words.forEach(() => {
            randomDirections.push({
                x: (Math.random() - 0.5) * 2 * floatDistanceX,
                y: -floatDistanceY * (0.6 + Math.random() * 0.4) // 向上但有变化
            });
        });

        // 获取初始模糊值（如果有）
        const initialBlur = this.config.enableBlur ? 4 : 0;

        const animate = (timestamp: number): void => {
            if (!startTime) startTime = timestamp;

            const elapsed = timestamp - startTime;
            const progress = Math.min(elapsed / duration, 1);

            // 缓动函数
            const easeOut = 1 - Math.pow(1 - progress, 3);

            // 整体行模糊（累积）
            if (this.config.enableBlur) {
                const blur = initialBlur + easeOut * 12;
                element.style.filter = `blur(${blur}px)`;
            }

            // 整体向上飘散（保留居中 transform）
            const baseTranslateY = -50; // translateY(-50%) 居中
            const floatY = -floatDistanceY * easeOut;
            const floatX = floatDistanceX * 0.3 * easeOut * (Math.random() > 0.5 ? 1 : -1);
            const scale = 1 - easeOut * 0.15;
            element.style.transform = `translateX(-50%) translateY(calc(${baseTranslateY}% + ${floatY}px)) translateX(${floatX}px) scale(${scale})`;
            element.style.opacity = String(1 - easeOut * 0.8);

            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                element.remove();
            }
        };

        requestAnimationFrame(animate);
    }

    // 检查 playerState 并在停止时隐藏
    public checkPlayerState(): void {
        const playerState = appConfig.runtime.playerInfo.playerState;

        // 如果 playerState 为 null 或 0 且当前显示中，则隐藏
        if ((playerState === null || playerState === 0) && this.isVisible) {
            debugLogger.info('[FullscreenLyrics] Player stopped, hiding lyrics');
            this.hide();
        }
    }

    // 销毁
    public destroy(): void {
        this.hide();
        if (this.container) {
            this.container.remove();
            this.container = null;
        }
        this.lineElements.clear();
    }
}

// 单例实例
export const fullscreenLyrics = new FullscreenLyrics();

// 播放器状态监听回调
function onPlayerStateChange(key: string, value: unknown): void {
    if (key === 'playerState') {
        fullscreenLyrics.checkPlayerState();
    }
}

// 注册播放器状态监听器
appConfig.addListener(onPlayerStateChange);
