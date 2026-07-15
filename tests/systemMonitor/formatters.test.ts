/**
 * Tests for src/systemMonitor/formatters.ts
 *
 * Covers:
 *   - formatBytes: human-readable byte size (B/KB/MB/GB/TB)
 *   - getColorForValue: traffic-light color by percentage (green/yellow/red)
 */

import { describe, expect, test } from 'vitest';

import { formatBytes, formatTemperature, getColorForValue } from '@/modules/systemMonitor/formatters';

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

describe('formatTemperature', () => {
    test('returns null for null or undefined', () => {
        // Callers rely on `null` to decide whether to show the `(extra)`
        // slot at all, so missing sensor data must round-trip to `null`.
        expect(formatTemperature(null)).toBeNull();
        expect(formatTemperature(undefined)).toBeNull();
    });

    test('returns null for non-finite values (NaN, Infinity)', () => {
        // `sysinfo` returns NaN on Linux when a sensor read fails.
        expect(formatTemperature(NaN)).toBeNull();
        expect(formatTemperature(Infinity)).toBeNull();
        expect(formatTemperature(-Infinity)).toBeNull();
    });

    test('returns null for zero and negative readings', () => {
        // `sysinfo` often reports `0.0` when a sensor exists but is
        // unreadable; showing "0°C" in the taskbar would be misleading.
        expect(formatTemperature(0)).toBeNull();
        expect(formatTemperature(-5)).toBeNull();
    });

    test('rounds positive readings to the nearest integer with the °C suffix', () => {
        expect(formatTemperature(55)).toBe('55°C');
        expect(formatTemperature(55.4)).toBe('55°C');
        expect(formatTemperature(55.5)).toBe('56°C');
        expect(formatTemperature(99.6)).toBe('100°C');
    });

    test('sub-1 readings round down to 0°C (honest report, not suppressed)', () => {
        // We only suppress EXACTLY-zero / negative / non-finite inputs,
        // which the upstream sensor layer uses to signal "unreadable".
        // A sub-1 positive reading is a valid (cold) measurement and is
        // shown as "0°C" so the user sees the value is low rather than
        // missing.
        expect(formatTemperature(0.4)).toBe('0°C');
        expect(formatTemperature(0.9)).toBe('1°C');
    });
});
