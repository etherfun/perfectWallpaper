// @vitest-environment jsdom
/**
 * Tests for src/slide/transition.ts
 *
 * Covers updateFileList:
 *   - appends new files to config.runtime.myList
 *   - de-duplicates against existing entries
 *   - skips empty/falsy entries
 *   - preserves insertion order of existing entries
 *
 * transitionBackground is intentionally skipped (DOM-heavy + timers).
 * jsdom is used because importing `@/utils/config` pulls in elementManager
 * whose module body calls `document.querySelector` at import time.
 */

import { beforeEach, describe, expect, test, vi } from 'vitest';

// Mock the config module so we can isolate updateFileList from the live config.
const { mockMyList } = vi.hoisted(() => ({ mockMyList: [] as string[] }));

vi.mock('@/stores/runtime', () => ({
    useRuntimeStore: () => ({
        myList: mockMyList,
    }),
}));

// slide/transition.ts transitive imports @/modules/slide/styles which calls
// useConfigStore() at module top. Stub a fake store so the import chain succeeds.
vi.mock('@/stores/config', () => ({
    useConfigStore: () => ({
        speed: 1,
        switch_interval_input: 5,
    }),
}));

import { updateFileList } from '@/modules/slide/transition';

describe('updateFileList', () => {
    beforeEach(() => {
        // Reset shared state between tests
        mockMyList.length = 0;
    });

    test('appends a single new file to an empty myList', () => {
        updateFileList(['photo1.jpg']);
        expect(mockMyList).toEqual(['photo1.jpg']);
    });

    test('appends multiple new files preserving input order', () => {
        updateFileList(['a.jpg', 'b.jpg', 'c.jpg']);
        expect(mockMyList).toEqual(['a.jpg', 'b.jpg', 'c.jpg']);
    });

    test('does not duplicate files that already exist in myList', () => {
        mockMyList.push('a.jpg', 'b.jpg');
        updateFileList(['b.jpg', 'c.jpg', 'd.jpg']);
        // b.jpg must not appear twice; c.jpg and d.jpg are appended
        expect(mockMyList).toEqual(['a.jpg', 'b.jpg', 'c.jpg', 'd.jpg']);
    });

    test('skips empty string entries (falsy guard)', () => {
        updateFileList(['', 'a.jpg', '', 'b.jpg']);
        expect(mockMyList).toEqual(['a.jpg', 'b.jpg']);
    });

    test('handles empty input array as a no-op', () => {
        mockMyList.push('existing.jpg');
        updateFileList([]);
        expect(mockMyList).toEqual(['existing.jpg']);
    });

    test('is a no-op when all input files are already in myList', () => {
        mockMyList.push('a.jpg', 'b.jpg');
        updateFileList(['a.jpg', 'b.jpg']);
        expect(mockMyList).toEqual(['a.jpg', 'b.jpg']);
    });
});
