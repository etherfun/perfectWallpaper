// @vitest-environment jsdom
/**
 * Tests for src/dockbar/iconCache.ts
 *
 * Covers the two pure/localStorage-only helpers:
 *   - getDefaultIcon: returns the embedded base64 PNG constant
 *   - cleanupIconCache: removes half of the `icon_`-prefixed keys
 *
 * Network-dependent functions (loadIcon, loadUrlIcon, loadPathIcon,
 * clearAllIconCache) are intentionally skipped to avoid fetch mocking.
 */

import { afterEach, beforeEach, describe, expect, test } from 'vitest';

import { DEFAULT_ICON } from '@/dockbar/constants';
import { cleanupIconCache, getDefaultIcon } from '@/dockbar/iconCache';

describe('dockbar/iconCache', () => {
    describe('getDefaultIcon', () => {
        test('returns the DEFAULT_ICON constant', () => {
            expect(getDefaultIcon()).toBe(DEFAULT_ICON);
        });

        test('return value is a base64-encoded data URL', () => {
            const icon = getDefaultIcon();
            expect(icon.startsWith('data:image/png;base64,')).toBe(true);
            // Base64 portion is non-empty
            const b64 = icon.replace('data:image/png;base64,', '');
            expect(b64.length).toBeGreaterThan(0);
        });
    });

    describe('cleanupIconCache', () => {
        beforeEach(() => {
            localStorage.clear();
        });

        afterEach(() => {
            localStorage.clear();
        });

        test('removes half of icon_-prefixed keys when 4 are present', () => {
            localStorage.setItem('icon_a', 'a');
            localStorage.setItem('icon_b', 'b');
            localStorage.setItem('icon_c', 'c');
            localStorage.setItem('icon_d', 'd');

            cleanupIconCache();

            const remaining = Object.keys(localStorage).filter(k => k.startsWith('icon_'));
            // Implementation: keys.slice(0, floor(4/2)) = 2 keys removed
            expect(remaining.length).toBe(2);
        });

        test('keeps non-icon_ keys intact', () => {
            localStorage.setItem('perfectwall_dockbar_items', '[]');
            localStorage.setItem('icon_a', 'a');
            localStorage.setItem('icon_b', 'b');

            cleanupIconCache();

            expect(localStorage.getItem('perfectwall_dockbar_items')).toBe('[]');
            const remaining = Object.keys(localStorage).filter(k => k.startsWith('icon_'));
            expect(remaining.length).toBe(1);
        });

        test('is a no-op when no icon_ keys are present', () => {
            localStorage.setItem('other_key', 'value');
            expect(() => cleanupIconCache()).not.toThrow();
            expect(Object.keys(localStorage)).toEqual(['other_key']);
        });

        test('removes 0 keys when only 1 icon_ key is present (floor(1/2) = 0)', () => {
            localStorage.setItem('icon_only', 'x');
            cleanupIconCache();
            const remaining = Object.keys(localStorage).filter(k => k.startsWith('icon_'));
            expect(remaining.length).toBe(1);
        });
    });
});
