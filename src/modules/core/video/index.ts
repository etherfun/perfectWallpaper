// 视频和音频控制模块
//
// 拆分说明：共享状态 → ./state，服务器交互 → ./server，
// 播放列表逻辑与对外 API 保留在本文件。对外 API 与拆分前完全一致。

import { applyPlayerStateUI } from '../../player_control';
import {
    controlExternalPlayer,
    debouncedFetchAudioFiles,
    debouncedUpdatePlayerInfo,
    getAudioStreamUrl,
    updatePlayerInfo,
} from './server';
import { config, flags, myAudio, myvideo, runtimeStore } from './state';

/**
 * 获取当前音乐播放列表
 */
function getMusicPlaylist(): string[] {
    return runtimeStore.files['musicdirectory'] || [];
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
    let index = config.music_playlist_index!;

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

    if (index < 0 || index >= playlist.length) return;

    config.music_playlist_index! = index;
    config.cusaudio_route = getAudioStreamUrl(playlist[index]!);
    myAudio.src = config.cusaudio_route;
    myAudio.play();
    // 自动播放路径同步 playerState（此前只有手动 TogglePlayPause 才写入，
    // 导致流体效果/歌词等依赖方误判为无播放内容）
    runtimeStore.updatePlayerInfo({ playerState: 1 });
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
    let index = config.music_playlist_index!;

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

    if (index < 0 || index >= playlist.length) return;

    config.music_playlist_index! = index;
    config.cusaudio_route = getAudioStreamUrl(playlist[index]!);
    myAudio.src = config.cusaudio_route;
    myAudio.play();
    // 同步 playerState（同 playNextTrack）
    runtimeStore.updatePlayerInfo({ playerState: 1 });
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
    const index = config.music_playlist_index!;

    // 单曲循环
    if (repeat === 2) {
        if (flags.isSingleTrackLoop) return; // 防止重入
        flags.isSingleTrackLoop = true;
        myAudio.currentTime = 0;
        myAudio
            .play()
            .then(() => {
                flags.isSingleTrackLoop = false;
            })
            .catch(() => {
                flags.isSingleTrackLoop = false;
            });
        runtimeStore.updatePlayerInfo({ playerState: 1 });
        return;
    }

    // 非循环模式且是最后一首
    if (repeat === 0 && index >= playlist.length - 1) {
        myAudio.src = '';
        runtimeStore.updatePlayerInfo({ playerState: 0 });
        return;
    }

    playNextTrack();
}

/**
 * 绑定音频结束事件监听
 */
function bindAudioEndedListener(): void {
    if (flags.audioEndedListenerBound) return;
    myAudio.addEventListener('ended', handleAudioEnded);
    flags.audioEndedListenerBound = true;
}

/**
 * 切换视频模式
 */
export function ChangeVideoModel(): void {
    if (config.cusvideo_route) {
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

    if (config.cusaudio_route) {
        myAudio.src = config.cusaudio_route;
        myAudio.play();
        // 初始播放入口同样同步 playerState（自动播放不经过 TogglePlayPause）
        runtimeStore.updatePlayerInfo({ playerState: 1 });
    } else {
        myAudio.src = '';
    }
}

/**
 * 更新音乐播放列表（当目录文件变化时调用）
 */
export async function updateMusicPlaylist(): Promise<void> {
    const directory = config.musicdirectory;

    if (!directory || flags.isPlaylistUpdating) {
        return;
    }

    flags.isPlaylistUpdating = true;

    try {
        // 通过服务器获取目录中的音频文件（使用防抖版本）
        const files = await debouncedFetchAudioFiles(directory);
        if (files && files.length > 0) {
            // 保存到 runtime.files 以便后续使用
            runtimeStore.files['musicdirectory'] = files;

            // 计算初始播放索引（随机模式）
            let initialIndex = 0;
            if (config.music_playlist_random) {
                initialIndex = Math.floor(Math.random() * files.length);
            }
            config.music_playlist_index! = initialIndex;
            config.cusaudio_route = getAudioStreamUrl(files[initialIndex]!);

            // 设置标志表示内置播放器正在初始化
            // 延迟清除，确保 PropertiesListener 有时间在初始化期间被调用
            runtimeStore.updatePlayerInfo({ builtInPlayerInitializing: true });
            setTimeout(() => {
                runtimeStore.updatePlayerInfo({ builtInPlayerInitializing: false });
            }, 500);

            // 如果外部媒体已激活，不启动内置播放器
            if (runtimeStore.playerInfo.externalMediaActive) {
                updatePlayerInfo(files[initialIndex]!);
                return;
            }

            ChangeAudioModel();
            updatePlayerInfo(files[initialIndex]!);
        }
    } finally {
        flags.isPlaylistUpdating = false;
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
        runtimeStore.updatePlayerInfo({ playerState: 1 });
    } else {
        myAudio.pause();
        runtimeStore.updatePlayerInfo({ playerState: 2 });
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
        runtimeStore.updatePlayerInfo({ playerState: 1 });
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
    return !runtimeStore.playerInfo.externalMediaActive;
}

/**
 * 设置外部媒体活跃状态
 */
export function setExternalMediaActive(active: boolean): void {
    if (runtimeStore.playerInfo.externalMediaActive !== active) {
        runtimeStore.updatePlayerInfo({ externalMediaActive: active });
        console.log(`[Video] externalMediaActive changed to: ${active}`);
    }
}
