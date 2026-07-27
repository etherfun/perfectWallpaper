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
const { mockPlayerInfo } = vi.hoisted(() => ({
    mockPlayerInfo: {
        singtitle: '' as string,
        playerState: null as number | null,
    },
}));

vi.mock('@/stores/runtime', () => ({
    useRuntimeStore: () => ({
        playerInfo: mockPlayerInfo,
    }),
}));
import { hasPlaybackContent } from '@/utils/playback';

const PLAYING = 1;
const PAUSED = 2;
const STOPPED = 0;

describe('hasPlaybackContent', () => {
    test('returns false when singtitle is empty', () => {
        mockPlayerInfo.singtitle = '';
        mockPlayerInfo.playerState = PLAYING;
        expect(hasPlaybackContent()).toBe(false);
    });

    test('returns false for placeholder title "loading..."', () => {
        mockPlayerInfo.singtitle = 'loading...';
        mockPlayerInfo.playerState = PLAYING;
        expect(hasPlaybackContent()).toBe(false);
    });

    test('returns false for Japanese placeholder title', () => {
        mockPlayerInfo.singtitle = '✧ପ(๑･ω･)੭';
        mockPlayerInfo.playerState = PLAYING;
        expect(hasPlaybackContent()).toBe(false);
    });

    test('returns false when playerState is null even with a real title', () => {
        mockPlayerInfo.singtitle = 'Real Song';
        mockPlayerInfo.playerState = null;
        expect(hasPlaybackContent()).toBe(false);
    });

    test('returns false when playerState is STOPPED', () => {
        mockPlayerInfo.singtitle = 'Real Song';
        mockPlayerInfo.playerState = STOPPED;
        expect(hasPlaybackContent()).toBe(false);
    });

    test('returns true for real title + PLAYING state', () => {
        mockPlayerInfo.singtitle = 'Bohemian Rhapsody';
        mockPlayerInfo.playerState = PLAYING;
        expect(hasPlaybackContent()).toBe(true);
    });

    test('returns true for real title + PAUSED state', () => {
        mockPlayerInfo.singtitle = 'Bohemian Rhapsody';
        mockPlayerInfo.playerState = PAUSED;
        expect(hasPlaybackContent()).toBe(true);
    });
});
