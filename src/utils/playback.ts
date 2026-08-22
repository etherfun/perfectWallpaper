/**
 * Playback utilities
 * Shared playback state detection functions
 */

import { useRuntimeStore } from '@/stores/runtime';
import { elements } from '@/utils/elementManager';

/** Placeholder song titles that indicate no actual playback content */
const INVALID_SONG_TITLES = new Set(['', 'loading...', '✧ପ(๑･ω･)੭', '٩(๑❛ᴗ❛๑)۶']);

/** Player states that indicate active playback */
const PLAYBACK_STATES = new Set([1, 2]); // 1=playing, 2=paused

/**
 * Check if there is currently playback content (song info exists and player state is playing or paused)
 *
 * 内置播放器兑底：runtime.playerInfo.playerState 只在外部媒体事件与手动
 * TogglePlayPause 时写入；内置播放器的自动播放（初始播放/切歌/单曲循环）
 * 不更新该字段。若只看 playerState，内置播放器场景会被误判为无内容，
 * 导致流体效果等依赖方永不初始化。此处用音频元素实际状态补充判定。
 */
export function hasPlaybackContent(): boolean {
    const runtimeStore = useRuntimeStore();
    const { singtitle, playerState } = runtimeStore.playerInfo;

    if (!singtitle || INVALID_SONG_TITLES.has(singtitle)) {
        return false;
    }

    if (playerState !== null && PLAYBACK_STATES.has(playerState)) {
        return true;
    }

    // 内置播放器兑底：歌单已加载且音频元素实际在播放
    const audio = elements.myAudio;
    return Boolean(audio?.src && !audio.paused);
}
