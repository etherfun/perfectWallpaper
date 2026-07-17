/**
 * Tests for src/utils/color.ts
 *
 * Covers:
 *   - parseColorString: parses "0.5 0.3 1.0" normalized RGB form to 0-255 ints
 *   - colorToRGBA: builds CSS rgba() string from [r, g, b, a?] array
 *   - colorToRGB: builds CSS rgb() string from [r, g, b] array
 *   - rgba: builds CSS rgba() from individual components
 */

import { describe, expect, test } from 'vitest';

import { colorToRGB, colorToRGBA, parseColorString, rgba } from '@/utils/color';

describe('parseColorString', () => {
    test('parses 3-component normalized form to 0-255 ints', () => {
        expect(parseColorString('1 0 0')).toEqual([255, 0, 0]);
        expect(parseColorString('0 1 0')).toEqual([0, 255, 0]);
        expect(parseColorString('0 0 1')).toEqual([0, 0, 255]);
    });

    test('parses 4-component form including alpha', () => {
        expect(parseColorString('0.5 0.5 0.5 1')).toEqual([128, 128, 128, 255]);
    });

    test('rounds 0.5 with Math.ceil (per implementation)', () => {
        // Math.ceil(0.5 * 255) = Math.ceil(127.5) = 128
        expect(parseColorString('0.5 0 0')).toEqual([128, 0, 0]);
        // Math.ceil(0.0 * 255) = 0
        expect(parseColorString('0 0 0')).toEqual([0, 0, 0]);
        // Math.ceil(1.0 * 255) = 255
        expect(parseColorString('1 1 1')).toEqual([255, 255, 255]);
    });

    test('handles single-component string', () => {
        expect(parseColorString('1')).toEqual([255]);
    });

    test('handles multiple consecutive spaces via /\\s+/ split', () => {
        // '1   0 0'.split(/\\s+/) = ['1', '0', '0'] — no empty elements
        const result = parseColorString('1   0 0');
        expect(result).toEqual([255, 0, 0]);
    });

    test('coerces non-numeric to NaN → Math.ceil(NaN) = NaN', () => {
        const result = parseColorString('abc def ghi');
        // Documents actual behavior: parseFloat('abc')=NaN, Math.ceil(NaN)=NaN
        expect(result[0]).toBeNaN();
    });
});

describe('colorToRGBA', () => {
    test('builds rgba() with default alpha 255 (1.0)', () => {
        expect(colorToRGBA([100, 150, 200])).toBe('rgba(100,150,200,1)');
    });

    test('respects explicit alpha in 4th element', () => {
        expect(colorToRGBA([100, 150, 200, 128])).toBe('rgba(100,150,200,0.5019607843137255)');
    });

    test('alpha 0 produces "0" fraction', () => {
        expect(colorToRGBA([0, 0, 0, 0])).toBe('rgba(0,0,0,0)');
    });

    test('returns fallback for arrays shorter than 3 elements', () => {
        expect(colorToRGBA([100])).toBe('rgba(0,0,0,0.8)');
        expect(colorToRGBA([])).toBe('rgba(0,0,0,0.8)');
    });
});

describe('colorToRGB', () => {
    test('builds rgb() from 3 components', () => {
        expect(colorToRGB([100, 150, 200])).toBe('rgb(100,150,200)');
    });

    test('ignores extra components (4th element)', () => {
        // Implementation only reads indices 0/1/2
        expect(colorToRGB([100, 150, 200, 128])).toBe('rgb(100,150,200)');
    });

    test('returns fallback for short arrays', () => {
        expect(colorToRGB([100])).toBe('rgb(0,0,0)');
        expect(colorToRGB([])).toBe('rgb(0,0,0)');
    });
});

describe('rgba', () => {
    test('builds rgba() from individual components', () => {
        expect(rgba(255, 128, 0, 0.5)).toBe('rgba(255,128,0,0.5)');
    });

    test('default alpha is 1', () => {
        expect(rgba(0, 0, 0)).toBe('rgba(0,0,0,1)');
    });

    test('handles all-zero components', () => {
        expect(rgba(0, 0, 0, 0)).toBe('rgba(0,0,0,0)');
    });
});
