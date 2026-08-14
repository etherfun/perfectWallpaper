/**
 * 播放器 UI 响应式状态（真 Vue 化）
 *
 * 取代 titleDisplay / timeline / controlsUI / playbackState 中的命令式
 * DOM 写入：这些模块只写本状态，PlayerControl.vue 模板直接绑定渲染。
 *
 * 保留的 DOM 写入：
 *   - canvas 音频可视化（pc_aubar）— canvas 引擎，不属于文本层
 *   - 颜色提取 / 图标染色（colorExtraction / thumbnailColor）— 仍读 img DOM
 *   - 位置/尺寸/透明度等属性样式（usePlayerControlProperties）— 样式层
 */
import { reactive } from 'vue';

/** 播放器 UI 响应式状态（模板直接绑定） */
export const playerUiState = reactive({
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
