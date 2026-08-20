/**
 * 播放器 UI — Pinia store
 *
 * 取代原 player_control/state/uiState.ts 的模块级 reactive 单例 playerUiState，
 * 成为播放器文本层的唯一响应式状态源。模板（PlayerControl.vue）通过
 * usePlayerStore() 绑定；命令式模块（media/* / ui/* / state/playbackState）
 * 通过下方导出的委托式访问或传入 store 实例写入。
 *
 * 注：pendingThumbnail 相关函数为非响应式模块级缓存（封面加载事件暂存），
 * 不属于响应式状态，保留为普通模块函数。
 */

import { defineStore } from 'pinia';
import { reactive } from 'vue';

export const usePlayerStore = defineStore('player', () => {
    const state = reactive({
        /** #player_control 是否显示（原 style.display flex/none 写入） */
        visible: false,
        /** 歌曲标题（原 .title .left/.right 的 innerHTML 写入） */
        title: '',
        /** 艺术家（原 .artist .left/.right 的 innerHTML 写入） */
        artist: '',
        /** 专辑标题（原 .albumTitle .left/.right 的 innerHTML 写入） */
        albumTitle: '',
        /** 专辑行是否显示（原 .albumTitle style.display 写入） */
        albumVisible: true,
        /** 封面 URL（原 .thumbnail src 写入） */
        thumbnailUrl: '',
        /** 进度条宽度百分比 0~100（原 .progress-bar style.width 写入） */
        progressPercent: 0,
        /** 是否播放中（原 .play-pause.playing class） */
        playing: false,
        /** 是否暂停（原 #player_control.paused class） */
        paused: false,
        /** 控制按钮是否可见（原 .aubar-controls.visible class） */
        controlsVisible: false,
        /** 控制按钮是否启用（原 --aubar-display CSS 变量，server_mode 探针） */
        controlsEnabled: true,
        /** 文本是否渲染在右侧 span（thumbnailrorl 决定，原 .right/.left 写入分支） */
        textOnRight: false,
    });
    return state;
});

/** 待提取颜色的封面事件（img @load 时消费，供 colorExtraction 使用） */
let pendingThumbnail: MediaThumbnailEvent | null = null;

export function setPendingThumbnailEvent(event: MediaThumbnailEvent | null): void {
    pendingThumbnail = event;
}

export function pendingThumbnailEvent(): MediaThumbnailEvent | null {
    return pendingThumbnail;
}

export function clearPendingThumbnailEvent(): void {
    pendingThumbnail = null;
}
