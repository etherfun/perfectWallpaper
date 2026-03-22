/**
 * 全屏歌词模块
 * 从底部上升的歌词动画，带模糊散开效果
 */

import { appConfig, config } from '../utils/config';
import { debugLogger } from '../utils/logger';

// Lyrics API 配置
const LYRICS_API_URL = 'ws://localhost:42954/get';
const LYRICS_HTTP_URL = 'http://localhost:42954/get/lyrics';

// 歌词数据类型
interface LyricLine {
    time: number;
    originalLyric: string;
    translatedLyric?: string;
    romanLyric?: string;
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
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            width: 100%;
            height: 100%;
            padding: 20px;
            box-sizing: border-box;
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
                    if (message.type === 'lyrics-update' || message.type === 'lyrics') {
                        this.handleLyricsUpdate(message.data || message);
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

        // 如果行索引变化，触发动画
        if (previousLineIndex !== this.currentLineIndex) {
            this.animateToNewLine(previousLineIndex, this.currentLineIndex);
        }

        // 实时更新当前行歌词
        this.updateCurrentLyric(data);
    }

    // 更新当前歌词
    private updateCurrentLyric(data: LyricsData): void {
        if (!this.lyricsContainer) return;

        const currentLine = data.lyricsArray[data.lineIndex];
        if (!currentLine) return;

        // 更新当前行元素的歌词内容
        const currentEl = this.lineElements.get(data.lineIndex);
        if (currentEl) {
            const lyricText = currentEl.querySelector('.lyric-text') as HTMLElement;
            const translationEl = currentEl.querySelector('.lyric-translation') as HTMLElement;
            const romanEl = currentEl.querySelector('.lyric-roman') as HTMLElement;

            if (lyricText) {
                lyricText.textContent = currentLine.originalLyric;
            }

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

    // 动画过渡到新行
    private animateToNewLine(fromIndex: number, toIndex: number): void {
        if (!this.lyricsContainer) return;

        // 移除旧动画
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
        }

        const lyricsArray = this.currentData?.lyricsArray || [];
        const visibleRange = 5; // 上下各显示5行

        // 创建/更新所有可见行的元素
        this.lyricsContainer.innerHTML = '';
        this.lineElements.clear();

        for (let i = Math.max(0, toIndex - visibleRange); i <= Math.min(lyricsArray.length - 1, toIndex + visibleRange); i++) {
            const line = lyricsArray[i];
            const el = this.createLineElement(line, i, toIndex);
            this.lineElements.set(i, el);
            this.lyricsContainer.appendChild(el);
        }

        // 执行浮动上升动画
        this.startFloatingAnimation(toIndex);

        // 旧行向上飘散消失
        if (fromIndex >= 0 && fromIndex !== toIndex) {
            const oldEl = this.lineElements.get(fromIndex);
            if (oldEl) {
                this.fadeOutAndFloatAway(oldEl);
            }
        }
    }

    // 创建歌词行元素
    private createLineElement(line: LyricLine, index: number, currentIndex: number): HTMLElement {
        const el = document.createElement('div');
        el.className = 'lyric-line';
        el.dataset.index = String(index);

        const distance = index - currentIndex;
        const isCurrent = distance === 0;
        const absDistance = Math.abs(distance);

        // 基础透明度：根据距离计算
        let opacity = 1;
        if (absDistance > 0) {
            opacity = Math.max(0.1, 1 - absDistance * 0.15);
        }

        // 模糊效果
        let blur = '0px';
        if (this.config.enableBlur && absDistance > 0) {
            blur = `${Math.min(absDistance * 1.5, 8)}px`;
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

        // 创建歌词文本
        const lyricText = document.createElement('div');
        lyricText.className = 'lyric-text';
        lyricText.textContent = line.originalLyric || '';
        lyricText.style.cssText = `
            font-weight: ${isCurrent ? '600' : '400'};
            text-shadow: ${isCurrent ? '0 2px 20px rgba(0,0,0,0.5)' : 'none'};
        `;

        el.appendChild(lyricText);

        // 创建翻译文本
        if (line.translatedLyric && this.config.showTranslation) {
            const translationEl = document.createElement('div');
            translationEl.className = 'lyric-translation';
            translationEl.textContent = line.translatedLyric;
            translationEl.style.cssText = `
                font-size: ${Math.max(16, fontSize * 0.45)}px;
                color: rgba(255, 255, 255, ${opacity * 0.7});
                margin-top: 8px;
                opacity: ${opacity};
            `;
            el.appendChild(translationEl);
        }

        // 创建罗马音文本
        if (line.romanLyric && this.config.showRoman) {
            const romanEl = document.createElement('div');
            romanEl.className = 'lyric-roman';
            romanEl.textContent = line.romanLyric;
            romanEl.style.cssText = `
                font-size: ${Math.max(14, fontSize * 0.4)}px;
                color: rgba(255, 255, 255, ${opacity * 0.5});
                margin-top: 4px;
                font-style: italic;
            `;
            el.appendChild(romanEl);
        }

        return el;
    }

    // 开始浮动动画
    private startFloatingAnimation(currentIndex: number): void {
        const duration = 2000; // 2秒完成一次浮动
        const amplitude = 8; // 浮动幅度
        let startTime: number | null = null;

        const animate = (timestamp: number): void => {
            if (!startTime) startTime = timestamp;

            const elapsed = timestamp - startTime;
            const progress = (elapsed % duration) / duration;

            // 使用正弦波实现平滑浮动
            const offset = Math.sin(progress * Math.PI * 2) * amplitude;

            this.lineElements.forEach((el, index) => {
                if (index === currentIndex) {
                    el.style.transform = `translateY(${offset}px)`;
                }
            });

            if (this.isVisible) {
                this.animationFrameId = requestAnimationFrame(animate);
            }
        };

        this.animationFrameId = requestAnimationFrame(animate);
    }

    // 向上飘散消失
    private fadeOutAndFloatAway(element: HTMLElement): void {
        const duration = 1500;
        const floatDistance = 100;
        let startTime: number | null = null;

        const animate = (timestamp: number): void => {
            if (!startTime) startTime = timestamp;

            const elapsed = timestamp - startTime;
            const progress = Math.min(elapsed / duration, 1);

            // 缓动函数
            const easeOut = 1 - Math.pow(1 - progress, 3);

            // 向上移动
            element.style.transform = `translateY(${-floatDistance * easeOut}px)`;

            // 逐渐透明
            element.style.opacity = String(1 - easeOut);

            // 逐渐模糊
            if (this.config.enableBlur) {
                const blur = 8 + easeOut * 12;
                element.style.filter = `blur(${blur}px)`;
            }

            // 水平散开
            const scale = 1 - easeOut * 0.3;
            element.style.transform += ` scale(${scale})`;

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

// 备用检查：每隔 3 秒检查一次（防止遗漏）
setInterval(() => {
    fullscreenLyrics.checkPlayerState();
}, 3000);
