/**
 * Tests for src/utils/playback.ts
 *
 * Covers hasPlaybackContent():
 *   - returns true only when singtitle is non-empty/non-placeholder AND
 *     playerState is PLAYING or PAUSED
 *   - returns false for any placeholder title
 *   - returns false when playerState is null or STOPPED
 */

import { describe, expect, test, vi } from 'vitest';

// Mock config so we can swap playerInfo per test.
vi.mock('@/utils/config', () => ({
    config: {
        runtime: {
            playerInfo: {
                singtitle: '',
                playerState: null as number | null,
            },
        },
    },
}));

import { config } from '@/utils/config';
import { hasPlaybackContent } from '@/utils/playback';

const PLAYING = 1;
const PAUSED = 2;
const STOPPED = 0;

describe('hasPlaybackContent', () => {
    test('returns false when singtitle is empty', () => {
        config.runtime.playerInfo.singtitle = '';
        config.runtime.playerInfo.playerState = PLAYING;
        expect(hasPlaybackContent()).toBe(false);
    });

    test('returns false for placeholder title "loading..."', () => {
        config.runtime.playerInfo.singtitle = 'loading...';
        config.runtime.playerInfo.playerState = PLAYING;
        expect(hasPlaybackContent()).toBe(false);
    });

    test('returns false for Japanese placeholder title', () => {
        config.runtime.playerInfo.singtitle = '✧ପ(๑･ω･)੭';
        config.runtime.playerInfo.playerState = PLAYING;
        expect(hasPlaybackContent()).toBe(false);
    });

    test('returns false when playerState is null even with a real title', () => {
        config.runtime.playerInfo.singtitle = 'Real Song';
        config.runtime.playerInfo.playerState = null;
        expect(hasPlaybackContent()).toBe(false);
    });

    test('returns false when playerState is STOPPED', () => {
        config.runtime.playerInfo.singtitle = 'Real Song';
        config.runtime.playerInfo.playerState = STOPPED;
        expect(hasPlaybackContent()).toBe(false);
    });

    test('returns true for real title + PLAYING state', () => {
        config.runtime.playerInfo.singtitle = 'Bohemian Rhapsody';
        config.runtime.playerInfo.playerState = PLAYING;
        expect(hasPlaybackContent()).toBe(true);
    });

    test('returns true for real title + PAUSED state', () => {
        config.runtime.playerInfo.singtitle = 'Bohemian Rhapsody';
        config.runtime.playerInfo.playerState = PAUSED;
        expect(hasPlaybackContent()).toBe(true);
    });
});
