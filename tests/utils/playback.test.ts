/**
 * Tests for src/utils/playback.ts
 *
 * Covers hasPlaybackContent():
 *   - returns true only when singtitle is non-empty/non-placeholder AND
 *     playerState is PLAYING or PAUSED
 *   - returns false for any placeholder title
 *   - returns false when playerState is null or STOPPED
 *   - built-in player fallback: audio element actually playing counts
 *     even when playerState was never written (auto-play paths)
 */

import { describe, expect, test, vi } from 'vitest';

// Mock config so we can swap playerInfo per test.
const { mockPlayerInfo, mockAudioElement } = vi.hoisted(() => ({
    mockPlayerInfo: {
        singtitle: '' as string,
        playerState: null as number | null,
    },
    // 模拟 <audio id="myAudio"> 的相关状态
    mockAudioElement: {
        src: '',
        paused: true,
    },
}));

vi.mock('@/stores/runtime', () => ({
    useRuntimeStore: () => ({
        playerInfo: mockPlayerInfo,
    }),
}));

vi.mock('@/utils/elementManager', () => ({
    elements: { myAudio: mockAudioElement },
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

    describe('built-in player fallback (playerState never written)', () => {
        test('returns true when audio element is actually playing', () => {
            mockPlayerInfo.singtitle = 'Local Song';
            mockPlayerInfo.playerState = null; // 自动播放路径不写 playerState
            mockAudioElement.src = 'http://localhost/stream.mp3';
            mockAudioElement.paused = false;
            expect(hasPlaybackContent()).toBe(true);
        });

        test('returns false when audio element exists but is paused (autoplay blocked)', () => {
            mockPlayerInfo.singtitle = 'Local Song';
            mockPlayerInfo.playerState = null;
            mockAudioElement.src = 'http://localhost/stream.mp3';
            mockAudioElement.paused = true;
            expect(hasPlaybackContent()).toBe(false);
        });

        test('returns false when audio src is empty', () => {
            mockPlayerInfo.singtitle = 'Local Song';
            mockPlayerInfo.playerState = null;
            mockAudioElement.src = '';
            mockAudioElement.paused = false;
            expect(hasPlaybackContent()).toBe(false);
        });

        test('placeholder title still wins over fallback', () => {
            mockPlayerInfo.singtitle = 'loading...';
            mockPlayerInfo.playerState = null;
            mockAudioElement.src = 'http://localhost/stream.mp3';
            mockAudioElement.paused = false;
            expect(hasPlaybackContent()).toBe(false);
        });
    });
});
