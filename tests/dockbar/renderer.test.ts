// @vitest-environment jsdom
/**
 * Tests for src/dockbar/renderer.ts
 *
 * Covers:
 *   - createItemElement: builds div.dock-item with img.dock-item-icon
 *   - createItemElement: data:/http: prefix → img.src set directly
 *   - createItemElement: other icon prefix → loadIcon callback invoked
 *   - render: 真 Vue 化后写入响应式 dockbarState.items（DockBar.vue v-for 渲染）
 *   - queryDomElements: returns null when #dockbar is missing
 */

import { beforeEach, describe, expect, test, vi } from 'vitest';

import { createItemElement, queryDomElements, render } from '@/modules/dockbar/renderer';
import { dockbarState } from '@/modules/dockbar/state';
import type { DockItem } from '@/modules/dockbar/types';

describe('dockbar/renderer', () => {
    describe('createItemElement', () => {
        test('builds a div with class dock-item and dataset.id', () => {
            const item: DockItem = { id: 'abc', name: 'Notepad', icon: 'data:foo', type: 'app' };
            const el = createItemElement(item, vi.fn());
            expect(el.tagName).toBe('DIV');
            expect(el.className).toBe('dock-item');
            expect(el.dataset.id).toBe('abc');
        });

        test('appends an img with class dock-item-icon and alt/title from name', () => {
            const item: DockItem = { id: '1', name: 'My App', icon: 'data:foo', type: 'app' };
            const el = createItemElement(item, vi.fn());
            const img = el.querySelector('img');
            expect(img).not.toBeNull();
            expect(img?.className).toBe('dock-item-icon');
            expect(img?.alt).toBe('My App');
            expect((img as HTMLImageElement).title).toBe('My App');
        });

        test('data: icon prefix sets img.src directly (no loadIcon call)', () => {
            const item: DockItem = {
                id: '1',
                name: 'Data',
                icon: 'data:image/png;base64,AAAA',
                type: 'app',
            };
            const loadIcon = vi.fn();
            const el = createItemElement(item, loadIcon);
            const img = el.querySelector('img') as HTMLImageElement;
            expect(img.src).toContain('data:image/png;base64,AAAA');
            expect(loadIcon).not.toHaveBeenCalled();
        });

        test('http(s): icon prefix sets img.src directly (no loadIcon call)', () => {
            const item: DockItem = {
                id: '1',
                name: 'Http',
                icon: 'https://example.com/icon.png',
                type: 'url',
                url: 'https://example.com',
            };
            const loadIcon = vi.fn();
            const el = createItemElement(item, loadIcon);
            const img = el.querySelector('img') as HTMLImageElement;
            expect(img.src).toBe('https://example.com/icon.png');
            expect(loadIcon).not.toHaveBeenCalled();
        });

        test('non-data/http icon prefix invokes loadIcon callback', () => {
            const item: DockItem = {
                id: '1',
                name: 'Path',
                icon: 'C:/some/path/icon.png',
                type: 'file',
                path: 'C:/some/path',
            };
            const loadIcon = vi.fn();
            const el = createItemElement(item, loadIcon);
            const img = el.querySelector('img') as HTMLImageElement;
            expect(loadIcon).toHaveBeenCalledTimes(1);
            expect(loadIcon).toHaveBeenCalledWith(item, img);
        });
    });

    describe('render', () => {
        beforeEach(() => {
            dockbarState.items = [];
        });

        test('replaces existing items in the reactive state', () => {
            dockbarState.items = [
                { id: 'old', name: 'Old', icon: 'data:old', type: 'app' },
            ];
            const items: DockItem[] = [
                { id: '1', name: 'New', icon: 'data:foo', type: 'app' },
            ];
            render(items);
            expect(dockbarState.items).toHaveLength(1);
            expect(dockbarState.items[0]?.id).toBe('1');
            expect(dockbarState.items[0]?.name).toBe('New');
        });

        test('renders all items in order', () => {
            const items: DockItem[] = [
                { id: '1', name: 'A', icon: 'data:a', type: 'app' },
                { id: '2', name: 'B', icon: 'data:b', type: 'app' },
                { id: '3', name: 'C', icon: 'data:c', type: 'app' },
            ];
            render(items);
            expect(dockbarState.items).toHaveLength(3);
            expect(dockbarState.items.map(i => i.id)).toEqual(['1', '2', '3']);
        });

        test('renders nothing for empty items array', () => {
            dockbarState.items = [
                { id: 'old', name: 'Old', icon: 'data:old', type: 'app' },
            ];
            render([]);
            expect(dockbarState.items).toHaveLength(0);
        });

        test('copies the array (mutating later does not affect rendered state)', () => {
            const items: DockItem[] = [
                { id: '1', name: 'A', icon: 'data:a', type: 'app' },
            ];
            render(items);
            items.push({ id: '2', name: 'B', icon: 'data:b', type: 'app' });
            expect(dockbarState.items).toHaveLength(1);
        });
    });

    describe('queryDomElements', () => {
        beforeEach(() => {
            document.body.innerHTML = '';
        });

        test('returns null when #dockbar is missing', () => {
            expect(queryDomElements()).toBeNull();
        });

        test('returns null when .dockbar-background is missing', () => {
            document.body.innerHTML = `
                <div id="dockbar"></div>
                <div id="dockbar-items"></div>
            `;
            expect(queryDomElements()).toBeNull();
        });

        test('returns null when #dockbar-items is missing', () => {
            document.body.innerHTML = `
                <div id="dockbar">
                    <div class="dockbar-background"></div>
                </div>
            `;
            expect(queryDomElements()).toBeNull();
        });

        test('returns all four refs when DOM is complete (addButton may be null)', () => {
            document.body.innerHTML = `
                <div id="dockbar">
                    <div class="dockbar-background"></div>
                </div>
                <div id="dockbar-items"></div>
            `;
            const refs = queryDomElements();
            expect(refs).not.toBeNull();
            expect(refs?.container).toBeInstanceOf(HTMLElement);
            expect(refs?.background).toBeInstanceOf(HTMLElement);
            expect(refs?.itemsContainer).toBeInstanceOf(HTMLElement);
            expect(refs?.addButton).toBeNull(); // #dockbar-add-btn not present
        });
    });
});
