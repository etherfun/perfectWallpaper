/**
 * Tests for src/version/imageSource.ts
 *
 * Verifies the GitHub raw URL derivation used by the update-log image
 * "prefer GitHub original, fall back to local" strategy.
 */

import { describe, expect, test } from 'vitest';

import { buildGithubImageUrl } from '@/modules/version/imageSource';

describe('buildGithubImageUrl', () => {
    const base = 'https://raw.githubusercontent.com/etherfun/perfectWallpaper/main';

    test('joins base url and local path with a single slash', () => {
        expect(buildGithubImageUrl('update/1787240827165.png', base)).toBe(
            'https://raw.githubusercontent.com/etherfun/perfectWallpaper/main/update/1787240827165.png'
        );
    });

    test('strips trailing slashes from base url', () => {
        expect(buildGithubImageUrl('update/abc.jpg', base + '/')).toBe(
            'https://raw.githubusercontent.com/etherfun/perfectWallpaper/main/update/abc.jpg'
        );
    });

    test('strips leading slashes from local path', () => {
        expect(buildGithubImageUrl('/update/abc.jpg', base)).toBe(
            'https://raw.githubusercontent.com/etherfun/perfectWallpaper/main/update/abc.jpg'
        );
    });

    test('handles both sides having extra slashes', () => {
        expect(buildGithubImageUrl('/update/abc.jpg', base + '//')).toBe(
            'https://raw.githubusercontent.com/etherfun/perfectWallpaper/main/update/abc.jpg'
        );
    });
});
