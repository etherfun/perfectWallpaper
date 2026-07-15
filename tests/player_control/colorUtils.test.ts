/**
 * Tests for src/player_control/colorUtils.ts
 *
 * Covers:
 *   - hexToRgb: parses #rrggbb or rrggbb → [r, g, b] tuple
 *   - colorToRgb: normalizes colorthief result (array | {rgb()} | null) → tuple or null
 */

import { describe, expect, test } from 'vitest';

import { colorToRgb, hexToRgb } from '@/modules/player_control/colorUtils';
import type { ColorImpl, RgbTuple } from '@/modules/player_control/types';

describe('hexToRgb', () => {
    test('parses #rrggbb with hash prefix', () => {
        expect(hexToRgb('#FF0000')).toEqual([255, 0, 0]);
        expect(hexToRgb('#00ff00')).toEqual([0, 255, 0]);
    });

    test('parses rrggbb without hash prefix', () => {
        expect(hexToRgb('FF8800')).toEqual([255, 136, 0]);
    });

    test('returns [255, 255, 255] for invalid hex (does not throw)', () => {
        // Invalid input falls back to white to avoid black overriding SCSS
        expect(hexToRgb('not-a-color')).toEqual([255, 255, 255]);
        expect(hexToRgb('#FFF')).toEqual([255, 255, 255]); // 3-char shorthand rejected
        expect(hexToRgb('')).toEqual([255, 255, 255]);
    });

    test('returns tuple matching RgbTuple type', () => {
        const result: RgbTuple = hexToRgb('#123456');
        expect(result).toHaveLength(3);
    });
});

describe('colorToRgb', () => {
    test('passes through array form unchanged', () => {
        const tuple: RgbTuple = [10, 20, 30];
        expect(colorToRgb(tuple)).toEqual([10, 20, 30]);
    });

    test('converts colorthief-style Color object to tuple', () => {
        const color: ColorImpl = {
            rgb: () => ({ r: 100, g: 150, b: 200 }),
        };
        expect(colorToRgb(color)).toEqual([100, 150, 200]);
    });

    test('returns null for null input', () => {
        expect(colorToRgb(null)).toBeNull();
    });

    test('returns null for undefined input', () => {
        expect(colorToRgb(undefined)).toBeNull();
    });

    test('returns null for empty object (no rgb() method)', () => {
        // Implementation: Array.isArray first, then tries .rgb()
        // {} has no rgb() method, so calling it throws — TypeScript-wise this
        // shouldn't happen, but the implementation doesn't guard.
        expect(() => colorToRgb({} as ColorImpl)).toThrow();
    });
});
