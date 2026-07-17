/**
 * Tests for src/utils/tool.ts
 *
 * Covers the pure helpers that do not depend on global state (window/localStorage):
 *   - add0
 *   - hexToRgb
 *   - isNightTime
 *
 * Functions that touch window/localStorage/fetch (getQWeatherIcon, weather_paymode,
 * fetch_with_retry) are intentionally left for integration tests, since they
 * would require heavy mocking and the existing project has no mocking harness.
 */

import { describe, expect, test } from 'vitest';

import { add0, hexToRgb, isNightTime } from '@/utils/tool';

describe('add0', () => {
    test('pads single digit to two digits by default', () => {
        expect(add0(5)).toBe('05');
        expect(add0(0)).toBe('00');
        expect(add0(9)).toBe('09');
    });

    test('does not pad when already at or above target length', () => {
        expect(add0(10)).toBe('10');
        expect(add0(99)).toBe('99');
    });

    test('handles three-digit numbers with default digits=2', () => {
        // Default digits=2, value already 3 chars: no padding
        expect(add0(100)).toBe('100');
    });

    test('respects custom digit count', () => {
        expect(add0(1, 4)).toBe('0001');
        expect(add0(123, 4)).toBe('0123');
        expect(add0(1234, 4)).toBe('1234');
    });

    test('handles zero with custom digit count', () => {
        expect(add0(0, 5)).toBe('00000');
    });

    test('treats negative numbers as already wider than target', () => {
        // '-5' has length 2, default digits=2, no padding
        expect(add0(-5)).toBe('-5');
    });
});

describe('hexToRgb', () => {
    test('parses standard #rrggbb form', () => {
        expect(hexToRgb('#FF0000')).toEqual([255, 0, 0]);
        expect(hexToRgb('#00FF00')).toEqual([0, 255, 0]);
        expect(hexToRgb('#0000FF')).toEqual([0, 0, 255]);
    });

    test('parses lowercase hex digits', () => {
        expect(hexToRgb('#abcdef')).toEqual([0xab, 0xcd, 0xef]);
    });

    test('parses mixed-case hex digits', () => {
        expect(hexToRgb('#AaBbCc')).toEqual([0xaa, 0xbb, 0xcc]);
    });

    test('returns correct tuple for black and white', () => {
        expect(hexToRgb('#000000')).toEqual([0, 0, 0]);
        expect(hexToRgb('#FFFFFF')).toEqual([255, 255, 255]);
    });

    test('throws on 3-character shorthand', () => {
        // Function rejects 3-char input (not 6 chars after stripping #)
        expect(() => hexToRgb('#FFF')).toThrow('Invalid hex color format');
    });

    test('throws on non-hex characters', () => {
        // Now validates hex digit characters in addition to length.
        // 'ZZZZZZ' is 6 chars but contains non-hex digits → throws.
        expect(() => hexToRgb('ZZ')).toThrow('Invalid hex color format');
        expect(() => hexToRgb('ZZZZZZ')).toThrow('Invalid hex color format');
        expect(() => hexToRgb('#GGGGGG')).toThrow('Invalid hex color format');
    });
});

describe('isNightTime', () => {
    test('returns true when time is before sunrise', () => {
        expect(isNightTime('05:30:00', '06:00:00', '18:00:00')).toBe(true);
    });

    test('returns false when time equals sunrise exactly', () => {
        // Boundary: `now < rise` is strict, so equal sunrise = day
        expect(isNightTime('06:00:00', '06:00:00', '18:00:00')).toBe(false);
    });

    test('returns false during daytime', () => {
        expect(isNightTime('12:00:00', '06:00:00', '18:00:00')).toBe(false);
        expect(isNightTime('15:30:45', '06:00:00', '18:00:00')).toBe(false);
    });

    test('returns false when time equals sunset exactly', () => {
        // Boundary: `now > set` is strict, so equal sunset = day
        expect(isNightTime('18:00:00', '06:00:00', '18:00:00')).toBe(false);
    });

    test('returns true when time is after sunset', () => {
        expect(isNightTime('20:00:00', '06:00:00', '18:00:00')).toBe(true);
        expect(isNightTime('23:59:59', '06:00:00', '18:00:00')).toBe(true);
    });

    test('handles seconds component (not just HH:MM)', () => {
        // sunrise/sunset at 06:00:00 and 18:00:00, check 12:34:56 in middle
        expect(isNightTime('12:34:56', '06:00:00', '18:00:00')).toBe(false);
    });

    test('handles midnight transition', () => {
        // 00:00:00 is before sunrise (06:00:00) → night
        expect(isNightTime('00:00:00', '06:00:00', '18:00:00')).toBe(true);
        // 23:59:59 is after sunset → night
        expect(isNightTime('23:59:59', '06:00:00', '18:00:00')).toBe(true);
    });

    test('handles extreme polar cases (sunrise after sunset)', () => {
        // Polar night: sunset before sunrise (e.g. 12:00 sunset, 14:00 next-day rise
        // expressed as 14:00). Any time between them is "night" by simple string compare.
        // The function doesn't handle wrap-around; documents the existing behavior:
        // 13:00 < 14:00 (rise) → "night" (incorrect for real polar conditions).
        expect(isNightTime('13:00:00', '14:00:00', '12:00:00')).toBe(true);
    });
});
