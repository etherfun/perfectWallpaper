<!--
  FullscreenLyrics.vue — 全屏歌词组件（真 Vue 化）
  替换原 FullscreenLyrics.ts 动态创建的歌词 DOM。

  架构：
    - state.ts 提供 lyricsUiState 响应式状态（visible / lines / clockText /
      activeWordIndex 等），模板直接绑定
    - FullscreenLyrics 类只写状态（show/hide/数据更新/动画），不再创建 DOM
    - lyricsRenderer 渲染函数 → 写 lines（原 createLineElement 逐行 DOM）
    - wordHighlight → 写 activeWordIndex（原 .word.active class 写入）
    - visibility.ts 的 hideOtherElements/restoreOtherElements 保留（操作
      其他页面元素，非本组件 DOM）
    - canvas/动画/事件监听引擎保留：滚动位移、上浮淡出动画、WS 数据源

  保留的 DOM 写入：
    - 位置/透明度/模糊样式 → 由模板 :style 绑定 lines 状态渲染（行为一致）
    - 关闭按钮/时钟显隐 → v-show 绑定
-->
<template>
    <!-- visible: 原 #fullscreen-lyrics style.display block/none 写入，改 v-show 绑定 -->
    <div
        id="fullscreen-lyrics"
        v-show="lyricsUiState.visible"
        style="
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            z-index: 9999;
            background: transparent;
            pointer-events: none;
        "
    >
        <div
            class="lyrics-scroll-container"
            style="
                position: absolute;
                bottom: 60px;
                left: 0;
                right: 0;
                height: 280px;
                overflow: hidden;
            "
        >
            <!-- scrollTransform: 原 lyricsContainer style.transform 写入（滚动居中） -->
            <div
                id="lyrics-container"
                style="
                    position: absolute;
                    bottom: 0;
                    left: 0;
                    right: 0;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    transition: transform 0.5s ease-out;
                "
                :style="{ transform: lyricsUiState.scrollTransform }"
            >
                <!-- 歌词行：原 animateToNewLine 动态创建 .lyric-line，改 v-for 渲染 -->
                <div
                    v-for="line in lyricsUiState.lines"
                    :key="line.index"
                    class="lyric-line"
                    :class="{ active: line.active }"
                    :style="lineStyle(line)"
                >
                    <div v-if="line.line.originalLyric" class="original">
                        <!-- 字级高亮：原 splitLyricsToWords 生成 .word span，
                             高亮由原 updateWordHighlight 写 .active class -->
                        <template v-if="line.splitWords">
                            <span
                                v-for="(word, wi) in line.words"
                                :key="wi"
                                class="word"
                                :class="{ active: line.active && wi === lyricsUiState.activeWordIndex }"
                                >{{ word }}</span
                            >
                        </template>
                        <template v-else>{{ line.line.originalLyric }}</template>
                    </div>
                    <div v-if="line.line.translatedLyric" class="translation">
                        {{ line.line.translatedLyric }}
                    </div>
                    <div v-if="line.line.romanLyric" class="roman">
                        {{ line.line.romanLyric }}
                    </div>
                </div>
            </div>
        </div>

        <!-- closeVisible: 原 closeButton style.display 写入；onClose 由类实例注册 -->
        <button
            id="lyrics-close"
            v-show="lyricsUiState.closeVisible"
            style="
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
                z-index: 10000;
                pointer-events: auto;
            "
            @click="onClose"
        >
            ✕
        </button>

        <!-- clockVisible/clockText: 原 clockElement display/textContent 写入 -->
        <div
            id="lyrics-clock"
            v-show="lyricsUiState.clockVisible"
            style="
                position: fixed;
                top: 20px;
                left: 20px;
                font-size: 24px;
                color: white;
                text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.5);
                z-index: 10000;
            "
        >
            {{ lyricsUiState.clockText }}
        </div>
    </div>
</template>

<script setup lang="ts">
/**
 * 本组件职责：
 *   1. 渲染 <div id="fullscreen-lyrics"> 完整容器结构（对齐原 dom.ts 结构）
 *   2. 模板绑定 lyricsUiState（显隐 / 歌词行 / 时钟 / 字级高亮）
 *   3. 关闭按钮 → lyricsUiState.onClose（由 FullscreenLyrics 实例注册，
 *      避免组件反向 import 类模块触发顶层 Pinia 副作用）
 *
 * FullscreenLyrics 类仍由 propertyHandler / mediaPlaybackListener 驱动
 * （show/hide/checkPlayerState），本组件只负责渲染。
 */
import { useConfigStore } from '@/stores/config';

import type { RenderedLyricLine } from './store';
import { useLyricsStore } from './store';

const lyricsUiState = useLyricsStore();

const config = useConfigStore();
const _ = (): boolean => Boolean(config.fullscreen_lyrics_enabled);

/** 关闭按钮：调用类实例注册的 hide 回调 */
function onClose(): void {
    lyricsUiState.onClose?.();
}

/** 行样式：原 updateLinePositions / startFloatingAnimation 的 style 写入 */
function lineStyle(line: RenderedLyricLine): Record<string, string> {
    const style: Record<string, string> = {
        transform: line.transform,
        opacity: String(line.opacity),
        filter: line.blur,
    };
    // 上浮淡出：原 startFloatingAnimation 设置的 inline transition
    // （覆盖 CSS 的 .lyric-line transition: all 0.3s ease，与原行为一致）
    if (line.floating) {
        style.transition = 'opacity 0.5s ease, transform 0.5s ease';
    }
    return style;
}
</script>

<style>
/*
  Lyrics overlay 样式（原 ui/dom.ts 内联注入的 LYRICS_CSS，原样保留）
*/
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
    text-shadow: 2px 2px 8px rgba(0, 0, 0, 0.8);
    margin-bottom: 4px;
}
#fullscreen-lyrics .lyric-line .translation {
    font-size: 16px;
    color: rgba(255, 255, 255, 0.8);
    text-shadow: 1px 1px 4px rgba(0, 0, 0, 0.6);
}
#fullscreen-lyrics .lyric-line .roman {
    font-size: 14px;
    color: rgba(255, 255, 255, 0.6);
    text-shadow: 1px 1px 4px rgba(0, 0, 0, 0.4);
}
#fullscreen-lyrics .word {
    display: inline-block;
    transition: all 0.15s ease;
}
#fullscreen-lyrics .word.active {
    color: #4ecdc4;
    transform: scale(1.2);
}
</style>

