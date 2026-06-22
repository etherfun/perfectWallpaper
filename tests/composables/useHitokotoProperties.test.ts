// @vitest-environment jsdom
/**
 * Tests for src/composables/useHitokotoProperties.ts — Stage 3-1
 */
import { createPinia, setActivePinia } from 'pinia';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

import { useHitokotoProperties } from '@/composables/useHitokotoProperties';
import { useConfigStore } from '@/stores/config';
import { debugLogger } from '@/utils/logger';

vi.mock('@/utils/elementManager', () => ({
    elements: {
        body: document.body,
        clock: { container: document.createElement('div') },
        date: { container: document.createElement('div') },
        countdown: { container: document.createElement('div') },
        hitokoto: { container: document.createElement('div') },
        playerControl: { container: document.createElement('div') },
        sakura: document.createElement('canvas'),
        myvideo: document.createElement('video'),
        myAudio: document.createElement('audio'),
    },
}));

beforeEach(() => {
    setActivePinia(createPinia());
    debugLogger.clearLogs();
    document.body.removeAttribute('style');
    if (typeof globalThis.ResizeObserver === 'undefined') {
        globalThis.ResizeObserver = class {
            observe() {}
            unobserve() {}
            disconnect() {}
        } as unknown as typeof ResizeObserver;
    }
});

afterEach(() => {
    vi.restoreAllMocks();
});

describe('useHitokotoProperties', () => {
    test('hitokoto_auth true → format_test = 1', () => {
        const store = useConfigStore();
        useHitokotoProperties({ hitokoto_auth: { value: true } } as never, false);
        expect(store.hitokoto_format_test).toBe(1);
    });

    test('hitokoto_auth false → format_test = 2', () => {
        const store = useConfigStore();
        useHitokotoProperties({ hitokoto_auth: { value: false } } as never, false);
        expect(store.hitokoto_format_test).toBe(2);
    });

    test('hit_a..hit_l toggles → c=a& strings', () => {
        const store = useConfigStore();
        useHitokotoProperties(
            {
                hitokoto_a: { value: true },
                hitokoto_b: { value: true },
                hitokoto_c: { value: false },
            } as never,
            false
        );
        expect(store.hit_a).toBe('c=a&');
        expect(store.hit_b).toBe('c=b&');
        expect(store.hit_c).toBe('');
    });

    test('show true → display flex', () => {
        const store = useConfigStore();
        useHitokotoProperties({ hitokoto_show: { value: true } } as never, false);
        expect(store.hitokoto_show).toBe(true);
        expect(document.body.style.getPropertyValue('--hitokoto-display')).toBe('flex');
    });

    test('hitokoto_color → RGB array', () => {
        const store = useConfigStore();
        useHitokotoProperties({ hitokoto_color: { value: '1 0 0' } } as never, false);
        expect(store.hitokoto_color).toEqual([255, 0, 0]);
    });

    test('yakeli scaling /100 + color array', () => {
        const store = useConfigStore();
        useHitokotoProperties(
            {
                hitokoto_yakeli: { value: 50 },
                hitokoto_yakelicolor: { value: '0.5 0.5 0.5' },
            } as never,
            false
        );
        expect(store.hitokoto_yakeli).toBeCloseTo(0.5);
        expect(store.hitokoto_yakelic_color).toEqual([128, 128, 128]);
    });

    test('timetransparency /100 → opacity', () => {
        useHitokotoProperties({ hitokoto_timetransparency: { value: 80 } } as never, false);
        expect(document.body.style.getPropertyValue('--hitokoto-opacity')).toBe('0.8');
    });

    test('size sets font-size in px units', () => {
        const store = useConfigStore();
        useHitokotoProperties({ hitokoto_size: { value: 50 } } as never, false);
        expect(store.hitokoto_size).toBe(50);
        expect(document.body.style.getPropertyValue('--hitokoto-font-size')).toMatch(/px$/);
    });

    test('position patches + CSS vars with %', () => {
        const store = useConfigStore();
        useHitokotoProperties(
            { hitokotoX: { value: 50 }, hitokotoY: { value: 25 } } as never,
            false
        );
        expect(store.hitokoto_x).toBe(50);
        expect(store.hitokoto_y).toBe(25);
        expect(document.body.style.getPropertyValue('--hitokoto-left')).toBe('50%');
    });

    test('logs init complete on FirstLoad', () => {
        useHitokotoProperties({} as never, true);
        const matched = debugLogger.logs.find(
            l => l.message === '[Hitokoto] 一言参数初始化完成'
        );
        expect(matched).toBeDefined();
    });
});
