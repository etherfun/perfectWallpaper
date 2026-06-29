/**
 * 把 playerState（playing / paused / stopped）反映到 UI：
 *   - .play-pause 按钮的 `.playing` 类
 *   - #player_control 容器的 `.paused` 类
 *   - <body> 上的 `.paused` 类（供 CSS / 流体效果联动）
 */
import { useConfigStore } from '@/stores/config';
import { useRuntimeStore } from '@/stores/runtime';

const config = useConfigStore();
const runtimeStore = useRuntimeStore();

import { player_control } from './domRefs';
import { PLAYER_STATE } from './types';

/** 惰性获取 .play-pause 按钮引用（Vue mount + refreshDomRefs 后才有效） */
function getPlayPauseBtn(): HTMLElement | null {
    return player_control?.querySelector('.play-pause') as HTMLElement | null;
}

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

/** 同步 .play-pause 按钮 visual state */
function updatePlayPauseButton(): void {
    const btn = getPlayPauseBtn();
    if (!btn) return;

    const isPlaying = runtimeStore.playerInfo.playerState === PLAYER_STATE.PLAYING;
    if (isPlaying) {
        btn.classList.add('playing');
    } else {
        btn.classList.remove('playing');
    }
}

/** 暂停时显示半透明遮罩 */
function updatePauseOverlay(): void {
    const isPaused = runtimeStore.playerInfo.playerState === PLAYER_STATE.PAUSED;
    if (isPaused) {
        player_control?.classList.add('paused');
    } else {
        player_control?.classList.remove('paused');
    }
}

/**
 * 播放状态变化时同步更新 UI（外部调用入口）
 */
export function applyPlayerStateUI(): void {
    updatePlayPauseButton();
    updatePauseOverlay();
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
