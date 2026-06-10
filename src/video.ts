// 视频和音频控制模块

import {
    fetchAudioMetadata as fetchAudioMetadataApi,
    getAudioStreamUrl as getAudioStreamUrlApi,
    listFiles as listFilesApi,
    postMediaAction,
} from '@/systemMonitor';
import { elements } from '@/utils/elementManager';

import { applyPlayerStateUI, refreshPlayerDisplay, updatePlayerThumbnail } from './player_control';
import { config } from './utils/config';
import { debugLogger } from './utils/logger';
import { debounce } from './utils/tool';

const myvideo = elements.myvideo;
const myAudio = elements.myAudio;

// 是否已绑定音频结束事件
let audioEndedListenerBound = false;
// 单曲循环时防止重入标志
let isSingleTrackLoop = false;

// 服务器端口 (fallback when no SystemMonitor instance has
// published a serverUrl yet — e.g. cold start before the
// user toggled the plugin on).
const SERVER_PORT = 27420;
const SERVER_BASE_URL = `http://localhost:${SERVER_PORT}`;

/**
 * 控制外部播放器 (发送媒体按键)
 * 播放器无关，适用于任何支持系统媒体键的播放器
 */
async function controlExternalPlayer(
    action: 'play-pause' | 'next' | 'prev' | 'stop'
): Promise<void> {
    const ok = await postMediaAction(SERVER_BASE_URL, action);
    if (!ok) {
        // postMediaAction already logged the underlying
        // network / envelope failure through debugLogger.
        // Only the success/fail boolean comes back, so we
        // surface a top-level warning here for symmetry
        // with the pre-refactor behavior.
        console.warn('[External Player] Control failed:', action);
    }
}

// 音频元数据类型（与 systemMonitor/api.ts 中 AudioMetadata
// 字段同义，保留本地别名以避免大规模重命名）。可空字段
// 用 `T | null` 而非 `T?`，与 server `AudioMetadata` 的
// 序列化形态保持一致。
type AudioMetadata = {
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

/**
 * 获取音频文件的服务器流地址
 */
function getAudioStreamUrl(filePath: string): string {
    return getAudioStreamUrlApi(SERVER_BASE_URL, filePath);
}

/**
 * 从服务器获取音频文件元数据（走 typed 包装）。
 */
async function fetchAudioMetadata(filePath: string): Promise<AudioMetadata | null> {
    return fetchAudioMetadataApi(SERVER_BASE_URL, filePath);
}

/**
 * 更新播放器信息
 */
async function updatePlayerInfo(filePath: string): Promise<void> {
    // 如果外部媒体已激活，不更新播放器信息（由外部媒体数据决定）
    if (config.runtime.playerInfo.externalMediaActive) {
        return;
    }

    const metadata = await fetchAudioMetadata(filePath);
    if (metadata) {
        config.runtime.playerInfo.singtitle = metadata.title;
        config.runtime.playerInfo.singartist = metadata.artist;
        config.runtime.playerInfo.singalbumTitle = metadata.album;

        // 更新封面图片
        if (metadata.picture) {
            const dataUrl = `data:${metadata.picture.format};base64,${metadata.picture.data}`;
            updatePlayerThumbnail(dataUrl);
        } else {
            updatePlayerThumbnail(null);
        }
    } else {
        // Fallback: 从文件名提取信息
        const fileName = filePath.split(/[/\\]/).pop() || '';
        const title = fileName.replace(/\.[^.]+$/, '');
        config.runtime.playerInfo.singtitle = title;
        config.runtime.playerInfo.singartist = 'Unknown Artist';
        config.runtime.playerInfo.singalbumTitle = 'Unknown Album';
        updatePlayerThumbnail(null);
    }

    // 刷新播放器显示
    refreshPlayerDisplay();
}

// 防抖版本的更新播放器信息
const debouncedUpdatePlayerInfo = debounce(updatePlayerInfo, 500, true);

/**
 * 从服务器获取目录中的音频文件列表
 */
async function fetchAudioFilesFromServer(directory: string): Promise<string[]> {
    try {
        const filter = 'mp3,ogg,wav,flac,m4a,aac';
        const result = await listFilesApi(SERVER_BASE_URL, directory, filter);
        if (!result) {
            return [];
        }
        return result.files.map(f => f.path);
    } catch (error) {
        debugLogger.log(`[Video] Failed to fetch audio files: ${error}`);
        return [];
    }
}

// 防抖版本的获取音频文件列表
const debouncedFetchAudioFiles = debounce(fetchAudioFilesFromServer, 1000, true);

// 防止并发请求的标志
let isPlaylistUpdating = false;

/**
 * 获取当前音乐播放列表
 */
function getMusicPlaylist(): string[] {
    return config.runtime.files['musicdirectory'] || [];
}

/**
 * 播放列表播放下一首
 */
function playNextTrack(): void {
    const playlist = getMusicPlaylist();

    if (!shouldBuiltInPlayerPlay()) {
        controlExternalPlayer('next');
        return;
    }

    if (!playlist || playlist.length === 0) return;

    const repeat = config.music_playlist_repeat;
    const random = config.music_playlist_random;
    let index = config.music_playlist_index;

    if (random) {
        index = Math.floor(Math.random() * playlist.length);
    } else {
        index = (index + 1) % playlist.length;
        if (index === 0 && repeat === 0) {
            // 非循环模式播放完毕，停止
            myAudio.src = '';
            return;
        }
    }

    config.music_playlist_index = index;
    config.cusaudio_route = getAudioStreamUrl(playlist[index]!);
    myAudio.src = config.cusaudio_route;
    myAudio.play();
    debouncedUpdatePlayerInfo(playlist[index]!);
    controlExternalPlayer('next');
}

/**
 * 播放列表播放上一首
 */
function playPrevTrack(): void {
    const playlist = getMusicPlaylist();

    if (!shouldBuiltInPlayerPlay()) {
        controlExternalPlayer('prev');
        return;
    }

    if (!playlist || playlist.length === 0) return;

    const repeat = config.music_playlist_repeat;
    const random = config.music_playlist_random;
    let index = config.music_playlist_index;

    if (random) {
        index = Math.floor(Math.random() * playlist.length);
    } else {
        index = index - 1;
        if (index < 0) {
            if (repeat === 0) {
                index = 0;
            } else {
                index = playlist.length - 1;
            }
        }
    }

    config.music_playlist_index = index;
    config.cusaudio_route = getAudioStreamUrl(playlist[index]!);
    myAudio.src = config.cusaudio_route;
    myAudio.play();
    debouncedUpdatePlayerInfo(playlist[index]!);
    controlExternalPlayer('prev');
}

/**
 * 处理音频播放结束，自动切换到下一首
 */
function handleAudioEnded(): void {
    const playlist = getMusicPlaylist();
    if (!playlist || playlist.length === 0) return;

    const repeat = config.music_playlist_repeat;
    const index = config.music_playlist_index;

    // 单曲循环
    if (repeat === 2) {
        if (isSingleTrackLoop) return; // 防止重入
        isSingleTrackLoop = true;
        myAudio.currentTime = 0;
        myAudio
            .play()
            .then(() => {
                isSingleTrackLoop = false;
            })
            .catch(() => {
                isSingleTrackLoop = false;
            });
        return;
    }

    // 非循环模式且是最后一首
    if (repeat === 0 && index >= playlist.length - 1) {
        myAudio.src = '';
        return;
    }

    playNextTrack();
}

/**
 * 绑定音频结束事件监听
 */
function bindAudioEndedListener(): void {
    if (audioEndedListenerBound) return;
    myAudio.addEventListener('ended', handleAudioEnded);
    audioEndedListenerBound = true;
}

/**
 * 切换视频模式
 */
export function ChangeVideoModel(): void {
    if (config.cusvideo_route != '') {
        myvideo.src = config.cusvideo_route;
        myvideo.play();
    } else {
        myvideo.src = '';
    }
}

/**
 * 切换音频模式
 */
export function ChangeAudioModel(): void {
    bindAudioEndedListener();

    if (config.cusaudio_route != '') {
        myAudio.src = config.cusaudio_route;
        myAudio.play();
    } else {
        myAudio.src = '';
    }
}

/**
 * 更新音乐播放列表（当目录文件变化时调用）
 */
export async function updateMusicPlaylist(): Promise<void> {
    const directory = config.musicdirectory;

    if (!directory || isPlaylistUpdating) {
        return;
    }

    isPlaylistUpdating = true;

    try {
        // 通过服务器获取目录中的音频文件（使用防抖版本）
        const files = await debouncedFetchAudioFiles(directory);
        if (files && files.length > 0) {
            // 保存到 runtime.files 以便后续使用
            config.runtime.files['musicdirectory'] = files;

            // 计算初始播放索引（随机模式）
            let initialIndex = 0;
            if (config.music_playlist_random) {
                initialIndex = Math.floor(Math.random() * files.length);
            }
            config.music_playlist_index = initialIndex;
            config.cusaudio_route = getAudioStreamUrl(files[initialIndex]!);

            // 设置标志表示内置播放器正在初始化
            // 延迟清除，确保 PropertiesListener 有时间在初始化期间被调用
            config.runtime.playerInfo.builtInPlayerInitializing = true;
            setTimeout(() => {
                config.runtime.playerInfo.builtInPlayerInitializing = false;
            }, 500);

            // 如果外部媒体已激活，不启动内置播放器
            if (config.runtime.playerInfo.externalMediaActive) {
                updatePlayerInfo(files[initialIndex]!);
                return;
            }

            ChangeAudioModel();
            updatePlayerInfo(files[initialIndex]!);
        }
    } finally {
        isPlaylistUpdating = false;
    }
}

/**
 * 播放上一首（供外部调用）
 */
export function PlayPrevTrack(): void {
    playPrevTrack();
}

/**
 * 播放下一首（供外部调用）
 */
export function PlayNextTrack(): void {
    playNextTrack();
}

/**
 * 切换播放/暂停（供外部调用）
 */
export function TogglePlayPause(): void {
    if (myAudio.paused) {
        myAudio.play();
        config.runtime.playerInfo.playerState = 1;
    } else {
        myAudio.pause();
        config.runtime.playerInfo.playerState = 2;
    }
    controlExternalPlayer('play-pause');
    applyPlayerStateUI();
}

/**
 * 暂停内置播放器（当外部媒体源激活时调用）
 */
export function pauseBuiltInPlayer(): void {
    if (!myAudio.paused) {
        myAudio.pause();
        console.log('[Built-in Player] Paused due to external media source');
    }
}

/**
 * 恢复内置播放器（当外部媒体源停止时调用）
 */
export function resumeBuiltInPlayer(): void {
    if (myAudio.paused && myAudio.src) {
        myAudio.play().catch(() => {
            // Ignore autoplay errors
        });
        console.log('[Built-in Player] Resumed after external media stopped');
    }
}

/**
 * 检查内置播放器是否正在播放
 */
export function isBuiltInPlayerPlaying(): boolean {
    return !myAudio.paused && !!myAudio.src;
}

/**
 * 检查是否应该允许内置播放器播放
 * 如果外部媒体源正在播放，则不允许
 */
export function shouldBuiltInPlayerPlay(): boolean {
    return !config.runtime.playerInfo.externalMediaActive;
}

/**
 * 设置外部媒体活跃状态
 */
export function setExternalMediaActive(active: boolean): void {
    if (config.runtime.playerInfo.externalMediaActive !== active) {
        config.runtime.playerInfo.externalMediaActive = active;
        console.log(`[Video] externalMediaActive changed to: ${active}`);
    }
}

// // 监听音频播放状态变化，同步到 config
// // 注意：当外部媒体激活时，不更新 playerState（由外部播放器状态决定）
// myAudio.addEventListener('play', () => {
//     if (!config.runtime.playerInfo.externalMediaActive) {
//         config.runtime.playerInfo.playerState = 1;
//     }
// });

// myAudio.addEventListener('pause', () => {
//     if (!config.runtime.playerInfo.externalMediaActive) {
//         config.runtime.playerInfo.playerState = 2;
//     }
// });
