// 视频和音频控制模块

import { elements } from '@/utils/elementManager';
import { config } from './utils/config';
import { pc_aubar, refreshPlayerDisplay, updatePlayerThumbnail } from './player_control';

const myvideo = elements.myvideo;
const myAudio = elements.myAudio;

// 是否已绑定音频结束事件
let audioEndedListenerBound = false;

// 服务器端口
const SERVER_PORT = 3842;

// 音频元数据结构
interface AudioMetadata {
    title: string;
    artist: string;
    album: string;
    year?: number;
    duration?: number;
    genre?: string[];
    track?: number;
    picture: {
        format: string;
        data: string;
    } | null;
}

/**
 * 获取音频文件的服务器流地址
 */
function getAudioStreamUrl(filePath: string): string {
    return `http://localhost:${SERVER_PORT}/api/files/audio?path=${encodeURIComponent(filePath)}`;
}

/**
 * 从服务器获取音频文件元数据
 */
async function fetchAudioMetadata(filePath: string): Promise<AudioMetadata | null> {
    try {
        const url = `http://localhost:${SERVER_PORT}/api/files/metadata?path=${encodeURIComponent(filePath)}`;
        const response = await fetch(url);
        if (!response.ok) {
            console.error('[DEBUG] Metadata fetch failed:', response.status);
            return null;
        }
        const result = await response.json();
        if (result.success && result.data) {
            return result.data as AudioMetadata;
        }
        return null;
    } catch (error) {
        console.error('[DEBUG] Error fetching metadata:', error);
        return null;
    }
}

/**
 * 更新播放器信息
 */
async function updatePlayerInfo(filePath: string): Promise<void> {
    const metadata = await fetchAudioMetadata(filePath);
    if (metadata) {
        config.runtime.playerInfo.singtitle = metadata.title;
        config.runtime.playerInfo.singartist = metadata.artist;
        config.runtime.playerInfo.singalbumTitle = metadata.album;
        console.log('[DEBUG] Updated player info:', metadata.title, '-', metadata.artist);

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

/**
 * 从服务器获取目录中的音频文件列表
 */
async function fetchAudioFilesFromServer(directory: string): Promise<string[]> {
    try {
        const filter = 'mp3,ogg,wav,flac,m4a,aac';
        const url = `http://localhost:${SERVER_PORT}/api/files?directory=${encodeURIComponent(directory)}&filter=${filter}`;
        console.log('[DEBUG] Fetching audio files from:', url);

        const response = await fetch(url);
        if (!response.ok) {
            console.error('[DEBUG] Server returned:', response.status, response.statusText);
            return [];
        }

        const result = await response.json();
        if (result.success && result.data && result.data.files) {
            console.log('[DEBUG] Got files from server:', result.data.files.length);
            return result.data.files.map((f: { path: string }) => f.path);
        }
        return [];
    } catch (error) {
        console.error('[DEBUG] Error fetching audio files:', error);
        return [];
    }
}

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
            myAudio.src = "";
            return;
        }
    }

    config.music_playlist_index = index;
    config.cusaudio_route = getAudioStreamUrl(playlist[index]);
    myAudio.src = config.cusaudio_route;
    myAudio.play();
    updatePlayerInfo(playlist[index]);
}

/**
 * 播放列表播放上一首
 */
function playPrevTrack(): void {
    const playlist = getMusicPlaylist();
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
    config.cusaudio_route = getAudioStreamUrl(playlist[index]);
    myAudio.src = config.cusaudio_route;
    myAudio.play();
    updatePlayerInfo(playlist[index]);
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
        myAudio.currentTime = 0;
        myAudio.play();
        return;
    }

    // 非循环模式且是最后一首
    if (repeat === 0 && index >= playlist.length - 1) {
        myAudio.src = "";
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
    if (config.cusvideo_route != "") {
        myvideo.src = config.cusvideo_route;
        myvideo.play();
    } else {
        myvideo.src = "";
    }
}

/**
 * 切换音频模式
 */
export function ChangeAudioModel(): void {
    bindAudioEndedListener();

    if (config.cusaudio_route != "") {
        myAudio.src = config.cusaudio_route;
        myAudio.play();
    } else {
        myAudio.src = "";
    }
}

/**
 * 更新音乐播放列表（当目录文件变化时调用）
 */
export async function updateMusicPlaylist(): Promise<void> {
    const directory = config.musicdirectory;
    console.log('[DEBUG] updateMusicPlaylist called, directory:', directory);

    if (!directory) {
        console.log('[DEBUG] No music directory set');
        return;
    }

    // 通过服务器获取目录中的音频文件
    const files = await fetchAudioFilesFromServer(directory);
    if (files && files.length > 0) {
        // 保存到 runtime.files 以便后续使用
        config.runtime.files['musicdirectory'] = files;

        // 计算初始播放索引（随机模式）
        let initialIndex = 0;
        if (config.music_playlist_random) {
            initialIndex = Math.floor(Math.random() * files.length);
        }
        config.music_playlist_index = initialIndex;
        config.cusaudio_route = getAudioStreamUrl(files[initialIndex]);
        console.log('[DEBUG] Playing index:', initialIndex, files[initialIndex]);
        ChangeAudioModel();
        updatePlayerInfo(files[initialIndex]);
    } else {
        console.log('[DEBUG] No audio files found in directory');
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
}

// 监听音频播放状态变化，同步到 config
myAudio.addEventListener('play', () => {
    config.playback_state = 1;
});

myAudio.addEventListener('pause', () => {
    config.playback_state = 2;
});
