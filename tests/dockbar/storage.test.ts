/**
 * Tests for src/dockbar/storage.ts
 *
 * Covers localStorage persistence of dock items:
 *   - loadItems: empty / valid JSON / malformed JSON / missing items key
 *   - saveItems: writes { items, version: 1 } envelope
 *   - error paths are silently swallowed (debugLogger.error path)
 */

import { afterEach, beforeEach, describe, expect, test } from 'vitest';

import { STORAGE_KEY } from '@/dockbar/constants';
import { loadItems, saveItems } from '@/dockbar/storage';
import type { DockItem } from '@/dockbar/types';

describe('dockbar/storage', () => {
    beforeEach(() => {
        localStorage.clear();
    });

    afterEach(() => {
        localStorage.clear();
    });

    describe('loadItems', () => {
        test('returns empty array when storage key is absent', () => {
            expect(loadItems()).toEqual([]);
        });

        test('returns parsed items array when storage has valid JSON', () => {
            const items: DockItem[] = [
                { id: '1', name: 'Notepad', icon: 'data:foo', type: 'app' },
                { id: '2', name: 'Docs', icon: 'data:bar', type: 'file', path: 'C:/x' },
            ];
            localStorage.setItem(STORAGE_KEY, JSON.stringify({ items, version: 1 }));
            expect(loadItems()).toEqual(items);
        });

        test('returns empty array when items key is missing from stored object', () => {
            localStorage.setItem(STORAGE_KEY, JSON.stringify({ version: 1 }));
            expect(loadItems()).toEqual([]);
        });

        test('returns empty array when stored JSON is malformed', () => {
            localStorage.setItem(STORAGE_KEY, '{not valid json');
            // Implementation: catches JSON.parse exception, returns []
            expect(loadItems()).toEqual([]);
        });

        test('returns empty array when stored value is not an object', () => {
            localStorage.setItem(STORAGE_KEY, JSON.stringify('just a string'));
            expect(loadItems()).toEqual([]);
        });
    });

    describe('saveItems', () => {
        test('writes a versioned envelope to localStorage', () => {
            const items: DockItem[] = [{ id: '1', name: 'App', icon: 'data:foo', type: 'app' }];
            saveItems(items);
            const raw = localStorage.getItem(STORAGE_KEY);
            expect(raw).not.toBeNull();
            const parsed = JSON.parse(raw!);
            expect(parsed.items).toEqual(items);
            expect(parsed.version).toBe(1);
        });

        test('writes empty array correctly', () => {
            saveItems([]);
            const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY)!);
            expect(parsed.items).toEqual([]);
            expect(parsed.version).toBe(1);
        });

        test('save then load round-trip preserves item structure', () => {
            const items: DockItem[] = [
                { id: 'a', name: 'A', icon: 'data:1', type: 'url', url: 'https://a.com' },
                { id: 'b', name: 'B', icon: 'data:2', type: 'file', path: '/tmp/b' },
                { id: 'c', name: 'C', icon: 'https://c.com/icon.png', type: 'app' },
            ];
            saveItems(items);
            const loaded = loadItems();
            expect(loaded).toEqual(items);
            expect(loaded).toHaveLength(3);
        });
    });
});
