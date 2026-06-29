/**
 * WE MediaPlaybackEvent 回调：处理 PLAYING / PAUSED / STOPPED 状态。
 *   - 同步 appConfig.runtime.playerInfo.playerState
 *   - 状态真正变化时刷新 UI（applyPlayerStateUI）
 *   - WE 停止时恢复内置播放器
 *   - 控制封面旋转动画
 *   - 通过 body class 联动流体效果暂停
 */
import { fullscreenLyrics } from '@/fullscreenLyrics';
import { useConfigStore } from '@/stores/config';
import { useRuntimeStore } from '@/stores/runtime';

const appConfig = useConfigStore();
const runtimeStore = useRuntimeStore();
import { debugLogger } from '@/utils/logger';
import { resumeBuiltInPlayer, setExternalMediaActive } from '@/video';

import { player_control, player_control_thumbnail, player_control_thumbnailWrap } from './domRefs';
import {
    applyPlayerStateUI,
    controlFluidEffectPlayback,
    getLastPlaybackState,
    setLastPlaybackState,
} from './playbackState';
import { PLAYER_STATE } from './types';

export function wallpaperMediaPlaybackListener(event: MediaPlaybackEvent): void {
    if (event) {
        const newState = decodePlaybackState(event.state);

        if (newState !== getLastPlaybackState() && newState !== -1) {
            setLastPlaybackState(newState);
            handleStateChange(newState);
            applyPlayerStateUI();
        }
    }

    // 读 appConfig（旧 config 单例）而非 Pinia，确保与 usePlayerControlProperties
    // 同步写入的源一致（Pinia $patch 在 handler 末尾才生效）。
    const playerControlShow = appConfig.player_control_show;
    const playerControlAutohide = (appConfig as unknown as { player_control_autohide?: boolean }).player_control_autohide === true;
    const playerControlThumbnailRotation = appConfig.player_control_thumbnail_rotation;
    const playerControlThumbnailRotationSpeed = appConfig.player_control_thumbnail_rotation_speed ?? 10;

    if (playerControlShow) {
        applyVisibility(event.state, playerControlAutohide);
    } else {
        return;
    }

    controlFluidEffectPlayback(event.state);

    if (!playerControlThumbnailRotation) return;

    applyThumbnailRotation(event.state, playerControlThumbnailRotationSpeed);
}

/** WE 的 state 常量 → 内部 0/1/2 编码；不支持的状态返回 -1 */
function decodePlaybackState(state: number): number {
    const wmi = window.wallpaperMediaIntegration;
    if (!wmi) return -1;
    if (state === wmi.PLAYBACK_PLAYING) return PLAYER_STATE.PLAYING;
    if (state === wmi.PLAYBACK_PAUSED) return PLAYER_STATE.PAUSED;
    if (state === wmi.PLAYBACK_STOPPED) return PLAYER_STATE.STOPPED;
    return -1;
}

function handleStateChange(newState: number): void {
    runtimeStore.updatePlayerInfo({ playerState: newState });

    // 状态真变化时让全屏歌词按 playing/non-playing 决定 show/hide
    fullscreenLyrics.checkPlayerState();

    if (newState === PLAYER_STATE.PLAYING) {
        debugLogger.info('[Player] 播放');
    } else if (newState === PLAYER_STATE.PAUSED) {
        debugLogger.info('[Player] 暂停');
    } else if (newState === PLAYER_STATE.STOPPED) {
        debugLogger.info('[Player] 停止');

        // WE 停止时恢复内置播放器（优先级逻辑）
        if (runtimeStore.playerInfo.externalMediaActive) {
            setExternalMediaActive(false);
            resumeBuiltInPlayer();
        }
    }
}

function applyVisibility(weState: number, autohide: boolean): void {
    const wmi = window.wallpaperMediaIntegration;
    if (!wmi) return;
    if (weState === wmi.PLAYBACK_PLAYING || weState === wmi.PLAYBACK_PAUSED) {
        player_control.style.display = 'flex';
    } else if (weState === wmi.PLAYBACK_STOPPED) {
        player_control.style.display = autohide ? 'none' : 'flex';
    }
}

function applyThumbnailRotation(weState: number, rotationSpeed: number): void {
    const wmi = window.wallpaperMediaIntegration;
    if (!wmi) return;

    if (weState === wmi.PLAYBACK_STOPPED || weState === wmi.PLAYBACK_PAUSED) {
        player_control_thumbnail.style.animationPlayState = 'paused';
    } else {
        player_control_thumbnailWrap.classList.add('circular');
        if (!player_control_thumbnail.style.animation.includes('spin')) {
            player_control_thumbnail.style.animation = `spin ${rotationSpeed}s linear infinite`;
        }
        player_control_thumbnail.style.animationPlayState = 'running';
    }
}
