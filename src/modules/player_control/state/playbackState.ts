/**
 * 把 playerState（playing / paused / stopped）反映到 UI：
 *   - .play-pause 按钮的 `.playing` 类
 *   - #player_control 容器的 `.paused` 类
 *   - <body> 上的 `.paused` 类（供 CSS / 流体效果联动）
 *
 * 真 Vue 化：playing / paused 写入 playerUiState，
 * 由 PlayerControl.vue 模板 :class 绑定；body class 联动保留。
 */
import { useRuntimeStore } from '@/stores/runtime';

const runtimeStore = useRuntimeStore();

import { PLAYER_STATE } from '../types';
import { usePlayerStore } from './store';

const playerUiState = usePlayerStore();

/**
 * 同步上次记录到的播放状态（用于检测真正的状态变化）。
 * 初始为 -1 表示尚未收到任何 playback 事件。
 */
let lastPlaybackState = -1;

export function getLastPlaybackState(): number {
    return lastPlaybackState;
}

export function setLastPlaybackState(state: number): void {
    lastPlaybackState = state;
}

/**
 * 播放状态变化时同步更新 UI（外部调用入口）
 */
export function applyPlayerStateUI(): void {
    const playerState = runtimeStore.playerInfo.playerState;
    playerUiState.playing = playerState === PLAYER_STATE.PLAYING;
    playerUiState.paused = playerState === PLAYER_STATE.PAUSED;
}

/**
 * 通过 body.paused 控制流体效果暂停。
 * 真正的暂停效果由 CSS / FluidEffect 内部根据 body class 联动。
 */
export function controlFluidEffectPlayback(playbackState: number): void {
    if (!window.wallpaperMediaIntegration) return;

    if (playbackState === window.wallpaperMediaIntegration.PLAYBACK_PLAYING) {
        document.body.classList.remove('paused');
    } else if (
        playbackState === window.wallpaperMediaIntegration.PLAYBACK_PAUSED ||
        playbackState === window.wallpaperMediaIntegration.PLAYBACK_STOPPED
    ) {
        document.body.classList.add('paused');
    }
}
