/**
 * Tests for src/systemMonitor/formatters.ts
 *
 * Covers:
 *   - formatBytes: human-readable byte size (B/KB/MB/GB/TB)
 *   - getColorForValue: traffic-light color by percentage (green/yellow/red)
 */

import { describe, expect, test } from 'vitest';

import { formatBytes, getColorForValue } from '@/systemMonitor/formatters';

describe('formatBytes', () => {
    test('returns "0 B" for zero', () => {
        expect(formatBytes(0)).toBe('0 B');
    });

    test('formats byte-range values', () => {
        expect(formatBytes(1)).toBe('1.0 B');
        expect(formatBytes(512)).toBe('512.0 B');
        expect(formatBytes(1023)).toBe('1023.0 B');
    });

    test('formats KB-range values', () => {
        expect(formatBytes(1024)).toBe('1.0 KB');
        expect(formatBytes(1536)).toBe('1.5 KB'); // 1.5 * 1024
        expect(formatBytes(1024 * 1024 - 1)).toBe('1024.0 KB');
    });

    test('formats MB-range values', () => {
        expect(formatBytes(1024 * 1024)).toBe('1.0 MB');
        expect(formatBytes(1024 * 1024 * 2.5)).toBe('2.5 MB');
    });

    test('formats GB-range values', () => {
        expect(formatBytes(1024 * 1024 * 1024)).toBe('1.0 GB');
        expect(formatBytes(1024 * 1024 * 1024 * 4)).toBe('4.0 GB');
    });

    test('formats TB-range values', () => {
        expect(formatBytes(1024 * 1024 * 1024 * 1024)).toBe('1.0 TB');
        expect(formatBytes(1024 * 1024 * 1024 * 1024 * 2)).toBe('2.0 TB');
    });

    test('uses 1 decimal place', () => {
        // toFixed(1) always produces 1 decimal
        expect(formatBytes(1500)).toBe('1.5 KB');
    });
});

describe('getColorForValue', () => {
    test('returns green for values below 50', () => {
        expect(getColorForValue(0)).toBe('rgba(76, 175, 80, 1)');
        expect(getColorForValue(25)).toBe('rgba(76, 175, 80, 1)');
        expect(getColorForValue(49)).toBe('rgba(76, 175, 80, 1)');
    });

    test('returns yellow for values 50-79', () => {
        expect(getColorForValue(50)).toBe('rgba(255, 193, 7, 1)');
        expect(getColorForValue(65)).toBe('rgba(255, 193, 7, 1)');
        expect(getColorForValue(79)).toBe('rgba(255, 193, 7, 1)');
    });

    test('returns red for values 80 and above', () => {
        expect(getColorForValue(80)).toBe('rgba(244, 67, 54, 1)');
        expect(getColorForValue(95)).toBe('rgba(244, 67, 54, 1)');
        expect(getColorForValue(100)).toBe('rgba(244, 67, 54, 1)');
    });

    test('respects custom alpha', () => {
        expect(getColorForValue(25, 0.5)).toBe('rgba(76, 175, 80, 0.5)');
        expect(getColorForValue(65, 0.3)).toBe('rgba(255, 193, 7, 0.3)');
        expect(getColorForValue(90, 0)).toBe('rgba(244, 67, 54, 0)');
    });

    test('handles negative values as "low" (green)', () => {
        // Implementation: if (value < 50) green — includes negatives
        expect(getColorForValue(-1)).toBe('rgba(76, 175, 80, 1)');
    });
});
