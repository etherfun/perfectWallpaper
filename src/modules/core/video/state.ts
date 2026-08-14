/**
 * 视频和音频控制模块 — 共享状态
 *
 * 从 `src/modules/core/video.ts` 拆出的模块级常量/标志与类型。
 * 可写标志封装在 `flags` 对象中（TS 不允许对 import 绑定赋值）。
 */

import { useConfigStore } from '@/stores/config';
import { useRuntimeStore } from '@/stores/runtime';
import { elements } from '@/utils/elementManager';

export const config = useConfigStore();
export const runtimeStore = useRuntimeStore();

export const myvideo = elements.myvideo;
export const myAudio = elements.myAudio;

// 模块级可写标志（原文件顶层 let）
export const flags: {
    audioEndedListenerBound: boolean;
    isSingleTrackLoop: boolean;
    isPlaylistUpdating: boolean;
} = {
    // 是否已绑定音频结束事件
    audioEndedListenerBound: false,
    // 单曲循环时防止重入标志
    isSingleTrackLoop: false,
    // 防止并发请求的标志
    isPlaylistUpdating: false,
};

// 服务器端口 (fallback when no SystemMonitor instance has
// published a serverUrl yet — e.g. cold start before the
// user toggled the plugin on).
export const SERVER_PORT = 27420;
export const SERVER_BASE_URL = `http://localhost:${SERVER_PORT}`;

// 音频元数据类型（与 systemMonitor/api.ts 中 AudioMetadata
// 字段同义，保留本地别名以避免大规模重命名）。可空字段
// 用 `T | null` 而非 `T?`，与 server `AudioMetadata` 的
// 序列化形态保持一致。
export type AudioMetadata = {
    title: string;
    artist: string;
    album: string;
    year: number | null;
    duration: number | null;
    genre: string[] | null;
    track: number | null;
    picture: {
        format: string;
        data: string;
    } | null;
};
