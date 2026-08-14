/**
 * 视频和音频控制模块 — 服务器交互
 *
 * 从 `src/modules/core/video.ts` 拆出的服务器/元数据相关函数：
 * controlExternalPlayer / getAudioStreamUrl / fetchAudioMetadata /
 * fetchAudioFilesFromServer / updatePlayerInfo（及各自防抖版本）。
 */

import {
    fetchAudioMetadata as fetchAudioMetadataApi,
    getAudioStreamUrl as getAudioStreamUrlApi,
    listFiles as listFilesApi,
    postMediaAction,
} from '@/modules/systemMonitor';

import { debugLogger } from '../../../utils/logger';
import { debounce } from '../../../utils/tool';
import { refreshPlayerDisplay, updatePlayerThumbnail } from '../../player_control';
import type { AudioMetadata } from './state';
import { runtimeStore, SERVER_BASE_URL } from './state';

/**
 * 控制外部播放器 (发送媒体按键)
 * 播放器无关，适用于任何支持系统媒体键的播放器
 */
export async function controlExternalPlayer(
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

/**
 * 获取音频文件的服务器流地址
 */
export function getAudioStreamUrl(filePath: string): string {
    return getAudioStreamUrlApi(SERVER_BASE_URL, filePath);
}

/**
 * 从服务器获取音频文件元数据（走 typed 包装）。
 */
export async function fetchAudioMetadata(filePath: string): Promise<AudioMetadata | null> {
    return fetchAudioMetadataApi(SERVER_BASE_URL, filePath);
}

/**
 * 更新播放器信息
 */
export async function updatePlayerInfo(filePath: string): Promise<void> {
    // 如果外部媒体已激活，不更新播放器信息（由外部媒体数据决定）
    if (runtimeStore.playerInfo.externalMediaActive) {
        return;
    }

    const metadata = await fetchAudioMetadata(filePath);
    if (metadata) {
        runtimeStore.updatePlayerInfo({
            singtitle: metadata.title,
            singartist: metadata.artist,
            singalbumTitle: metadata.album,
        });

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
        runtimeStore.updatePlayerInfo({
            singtitle: title,
            singartist: 'Unknown Artist',
            singalbumTitle: 'Unknown Album',
        });
        updatePlayerThumbnail(null);
    }

    // 刷新播放器显示
    refreshPlayerDisplay();
}

// 防抖版本的更新播放器信息
export const debouncedUpdatePlayerInfo = debounce(updatePlayerInfo, 500, true);

/**
 * 从服务器获取目录中的音频文件列表
 */
export async function fetchAudioFilesFromServer(directory: string): Promise<string[]> {
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
export const debouncedFetchAudioFiles = debounce(fetchAudioFilesFromServer, 1000, true);
