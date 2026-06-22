// @vitest-environment jsdom
/**
 * Tests for src/composables/useCountdownProperties.ts — Stage 3-1
 */
import { createPinia, setActivePinia } from 'pinia';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

import { useCountdownProperties } from '@/composables/useCountdownProperties';
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

describe('useCountdownProperties', () => {
    test('show true → display flex', () => {
        const store = useConfigStore();
        useCountdownProperties({ countdown_show: { value: true } } as never, false);
        expect(store.countdown_show).toBe(true);
        expect(document.body.style.getPropertyValue('--countdown-display')).toBe('flex');
    });

    test('show false → display none', () => {
        const store = useConfigStore();
        useCountdownProperties({ countdown_show: { value: false } } as never, false);
        expect(store.countdown_show).toBe(false);
        expect(document.body.style.getPropertyValue('--countdown-display')).toBe('none');
    });

    test('position patches + CSS vars with %', () => {
        const store = useConfigStore();
        useCountdownProperties(
            { countdownX: { value: 40 }, countdownY: { value: 80 } } as never,
            false
        );
        expect(store.countdown_x).toBe(40);
        expect(store.countdown_y).toBe(80);
        expect(document.body.style.getPropertyValue('--countdown-left')).toBe('40%');
        expect(document.body.style.getPropertyValue('--countdown-top')).toBe('80%');
    });

    test('countdown_color → RGB array', () => {
        const store = useConfigStore();
        useCountdownProperties({ countdown_color: { value: '0 1 0' } } as never, false);
        expect(store.countdown_color).toEqual([0, 255, 0]);
    });

    test('countdown_yakeli scaling /100', () => {
        const store = useConfigStore();
        useCountdownProperties({ countdown_yakeli: { value: 50 } } as never, false);
        expect(store.countdown_yakeli).toBeCloseTo(0.5);
    });

    test('countdown_timetransparency scales to opacity', () => {
        const store = useConfigStore();
        useCountdownProperties(
            { countdown_timetransparency: { value: 80 } } as never,
            false
        );
        expect(store.countdown_timetransparency).toBe(80);
        expect(document.body.style.getPropertyValue('--countdown-opacity')).toBe('0.8');
    });

    test('countdown_bluryakeli sets first_load_countdown = false', () => {
        const store = useConfigStore();
        useCountdownProperties({ countdown_bluryakeli: { value: 10 } } as never, false);
        expect(store.first_load_countdown).toBe(false);
    });

    test('logs init complete on FirstLoad', () => {
        useCountdownProperties({} as never, true);
        const matched = debugLogger.logs.find(
            l => l.message === '[Countdown] 倒计时参数初始化完成'
        );
        expect(matched).toBeDefined();
    });
});
