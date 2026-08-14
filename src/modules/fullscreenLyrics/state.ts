/**
 * 全屏歌词响应式状态（真 Vue 化）
 *
 * FullscreenLyrics.vue 模板直接绑定本状态：
 *   - visible      → v-show 显隐（原 #fullscreen-lyrics style.display 写入）
 *   - closeVisible → v-show 关闭按钮（原 closeButton display 写入）
 *   - clockVisible / clockText → 时钟（原 clockElement 写入）
 *   - lines        → v-for 渲染歌词行（原 lyricsRenderer 动态创建 DOM）
 *   - activeWordIndex → 字级高亮（原 updateWordHighlight 的 .active class 写入）
 *   - scrollTransform → 歌词容器滚动偏移（原 updateLinePositions 的 translateY 写入）
 *   - onClose      → 关闭按钮回调（FullscreenLyrics 类注册，避免组件反向
 *                     import 类模块造成 Pinia 顶层副作用）
 */
import { reactive } from 'vue';

import type { LyricLine } from './types';

/** 模板渲染用的一行歌词（含位置/透明度/模糊等计算样式） */
export interface RenderedLyricLine {
    /** 在 lyricsArray 中的下标（v-for :key） */
    index: number;
    /** 原始歌词数据 */
    line: LyricLine;
    /** 字级拆分结果（动态歌词时逐字 span，否则为整句单元素） */
    words: string[];
    /** 是否按字级拆分渲染（原 createLineElement 的 hasDynamic 分支） */
    splitWords: boolean;
    /** 是否当前句（原 .lyric-line.active class） */
    active: boolean;
    /** 透明度（原 style.opacity 写入） */
    opacity: number;
    /** 位移/缩放（原 style.transform 写入） */
    transform: string;
    /** 模糊滤镜（原 style.filter 写入，enableBlur 时生效） */
    blur: string;
    /** 是否正在上浮淡出（原 startFloatingAnimation 动画中的行） */
    floating: boolean;
}

/** 全屏歌词 UI 响应式状态 */
export const lyricsUiState = reactive({
    /** 是否显示（原 #fullscreen-lyrics style.display 写入） */
    visible: false,
    /** 关闭按钮是否显示（config.enabled 决定） */
    closeVisible: false,
    /** 时钟是否显示（config.showClock 决定） */
    clockVisible: false,
    /** 时钟文本（原 clockElement.textContent 写入） */
    clockText: '',
    /** 是否显示翻译行（config.showTranslation，原 createLineElement 分支） */
    showTranslation: true,
    /** 是否显示罗马音行（config.showRoman，原 createLineElement 分支） */
    showRoman: false,
    /** 当前歌词行下标（-1 = 无） */
    currentIndex: -1,
    /** 可见范围内的歌词行（v-for 渲染） */
    lines: [] as RenderedLyricLine[],
    /** 当前高亮字下标（原 .word.active class；-1 = 无高亮） */
    activeWordIndex: -1,
    /** 歌词容器滚动偏移 transform（原 lyricsContainer translateY 写入） */
    scrollTransform: 'translateY(0px)',
    /** 关闭按钮回调（FullscreenLyrics 实例注册） */
    onClose: null as (() => void) | null,
});

/** 设置容器可见性（原 style.display block/none 写入） */
export function setLyricsVisible(visible: boolean): void {
    lyricsUiState.visible = visible;
}

/** 设置关闭按钮可见性 */
export function setLyricsCloseVisible(visible: boolean): void {
    lyricsUiState.closeVisible = visible;
}

/** 设置时钟可见性 */
export function setLyricsClockVisible(visible: boolean): void {
    lyricsUiState.clockVisible = visible;
}

/** 设置时钟文本 */
export function setLyricsClockText(text: string): void {
    lyricsUiState.clockText = text;
}

/** lyricsUiState 的类型（供渲染/高亮模块引用） */
export type LyricsUiState = typeof lyricsUiState;
