/**
 * Playback utilities
 * Shared playback state detection functions
 */

import { useRuntimeStore } from '@/stores/runtime';

const runtimeStore = useRuntimeStore();

/** Placeholder song titles that indicate no actual playback content */
const INVALID_SONG_TITLES = new Set(['', 'loading...', '✧ପ(๑･ω･)੭', '٩(๑❛ᴗ❛๑)۶']);

/** Player states that indicate active playback */
const PLAYBACK_STATES = new Set([1, 2]); // 1=playing, 2=paused

/**
 * Check if there is currently playback content (song info exists and player state is playing or paused)
 */
export function hasPlaybackContent(): boolean {
    const { singtitle, playerState } = runtimeStore.playerInfo;

    if (!singtitle || INVALID_SONG_TITLES.has(singtitle)) {
        return false;
    }

    return playerState !== null && PLAYBACK_STATES.has(playerState);
}
