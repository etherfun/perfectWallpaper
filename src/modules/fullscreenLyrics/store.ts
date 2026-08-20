/**
 * 全屏歌词 — Pinia store
 *
 * 取代原 fullscreenLyrics/state.ts 的模块级 reactive 单例 lyricsUiState，
 * 成为全屏歌词的唯一响应式状态源。模板（FullscreenLyrics.vue）通过
 * useLyricsStore() 绑定；命令式代码（FullscreenLyrics.ts / render/* /
 * ui/clock.ts）通过下方导出的委托式 setter 或传入 store 实例写入。
 */

import { defineStore } from 'pinia';
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

export const useLyricsStore = defineStore('fullscreenLyrics', () => {
    const state = reactive({
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
    return state;
});

/** lyricsUiState 的类型（供渲染/高亮模块引用） */
export type LyricsUiState = ReturnType<typeof useLyricsStore>;

/** 设置容器可见性（原 style.display block/none 写入） */
export function setLyricsVisible(visible: boolean): void {
    useLyricsStore().visible = visible;
}

/** 设置关闭按钮可见性 */
export function setLyricsCloseVisible(visible: boolean): void {
    useLyricsStore().closeVisible = visible;
}

/** 设置时钟可见性 */
export function setLyricsClockVisible(visible: boolean): void {
    useLyricsStore().clockVisible = visible;
}

/** 设置时钟文本 */
export function setLyricsClockText(text: string): void {
    useLyricsStore().clockText = text;
}
