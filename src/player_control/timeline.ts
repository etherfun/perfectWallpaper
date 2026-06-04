/**
 * 进度条本地推演。
 *
 * WE 只会在歌曲时间发生变化时发一次 MediaTimelineEvent，
 * 期间需要本地用定时器每 100ms 推进 0.1 秒，营造平滑动画。
 */
import { config } from '@/utils/config';

import { TIMELINE_STEP_SEC, TIMELINE_TICK_MS, TIMELINE_WAIT_MS } from './constants';
import { player_control_timeline } from './domRefs';
import { PLAYER_STATE } from './types';

let timelineTimer: ReturnType<typeof setTimeout> | null = null;
let currentPosition = 0;
let waitingForData = false;

/**
 * WE 进度条事件回调。每次收到时重置 position，启动新的推演循环。
 */
export function wallpaperMediaTimelineListener(event: MediaTimelineEvent): void {
    const { position: pos, duration: dur } = event;

    waitingForData = false;
    currentPosition = pos;

    if (timelineTimer) {
        clearTimeout(timelineTimer);
        timelineTimer = null;
    }

    function updateTimeline(): void {
        if (waitingForData) return;

        // 暂停或停止时只轮询，不推进
        if (
            config.runtime.playerInfo.playerState === PLAYER_STATE.STOPPED ||
            config.runtime.playerInfo.playerState === PLAYER_STATE.PAUSED
        ) {
            timelineTimer = setTimeout(updateTimeline, TIMELINE_WAIT_MS);
            return;
        }

        currentPosition += TIMELINE_STEP_SEC;
        if (currentPosition >= dur) {
            currentPosition = dur;
            waitingForData = true;
        }

        const progressPercent = (currentPosition / dur) * 100;
        player_control_timeline.style.width = progressPercent + '%';

        if (!waitingForData) {
            timelineTimer = setTimeout(updateTimeline, TIMELINE_TICK_MS);
        } else {
            timelineTimer = null;
        }
    }

    updateTimeline();
}
