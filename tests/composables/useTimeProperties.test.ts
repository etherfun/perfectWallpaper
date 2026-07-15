// @vitest-environment jsdom
/**
 * Tests for src/composables/useTimeProperties.ts — Stage 3-1
 *
 * Verifies that the composable correctly:
 *   - Patches Pinia store with all time/clock fields
 *   - Applies CSS variables to document.body (via getPropertyValue)
 *   - Handles FirstLoad logging via logInitComplete
 *
 * Strategy: stub elementManager with minimal elements so the composable
 * can load under jsdom. CSS variable output is read back via
 * `document.body.style.getPropertyValue(...)` instead of vi.spyOn (which
 * is fragile across jsdom re-initializations).
 */
import { createPinia, setActivePinia } from 'pinia';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

import { useTimeProperties } from '@/modules/clock/useTimeProperties';
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

describe('useTimeProperties', () => {
    test('patches show_time + sets clock display CSS', () => {
        const store = useConfigStore();
        useTimeProperties({ showTime: { value: true } } as never, false);
        expect(store.show_time).toBe(true);
        expect(document.body.style.getPropertyValue('--clock-display')).toBe('flex');
        expect(document.body.style.getPropertyValue('--clock-visibility')).toBe('visible');
    });

    test('hides clock + disables color rhythm when showTime is false', () => {
        const store = useConfigStore();
        useTimeProperties({ showTime: { value: false } } as never, false);
        expect(store.show_time).toBe(false);
        expect(store.time_color_rhythm).toBe(false);
        expect(document.body.style.getPropertyValue('--clock-display')).toBe('none');
    });

    test('time_color_rhythm patch passes through', () => {
        const store = useConfigStore();
        useTimeProperties({ time_color_rhythm: { value: true } } as never, false);
        expect(store.time_color_rhythm).toBe(true);
    });

    test('position patches set body CSS variables with %', () => {
        const store = useConfigStore();
        useTimeProperties({ tX: { value: 25 }, tY: { value: 75 } } as never, false);
        expect(store.time_x).toBe(25);
        expect(store.time_y).toBe(75);
        expect(document.body.style.getPropertyValue('--clock-left')).toBe('25%');
        expect(document.body.style.getPropertyValue('--clock-top')).toBe('75%');
    });

    test('TimeColor splits RGB string → numeric array → rgb() string', () => {
        const store = useConfigStore();
        useTimeProperties({ TimeColor: { value: '1 0.5 0.2' } } as never, false);
        expect(store.time_color).toBe('rgb(255,128,51)');
        expect(document.body.style.getPropertyValue('--clock-color')).toBe('255, 128, 51');
    });

    test('TimeBlurColor generates 0 0 20px rgb(...) blur string', () => {
        const store = useConfigStore();
        useTimeProperties({ TimeBlurColor: { value: '0.5 0.5 0.5' } } as never, false);
        expect(store.time_blur_color).toBe('0 0 20px rgb(128,128,128)');
        expect(document.body.style.getPropertyValue('--clock-blur-color')).toBe('128, 128, 128');
        expect(document.body.style.getPropertyValue('--clock-blur-enabled')).toBe('1');
    });

    test('timetransparency scales /100 into store + CSS', () => {
        const store = useConfigStore();
        useTimeProperties({ timetransparency: { value: 80 } } as never, false);
        expect(store.time_transparency).toBeCloseTo(0.8);
        expect(document.body.style.getPropertyValue('--clock-opacity')).toBe('0.8');
    });

    test('clock roundedcorners → CSS var set', () => {
        const store = useConfigStore();
        useTimeProperties({ oclock_roundedcorners: { value: 12 } } as never, false);
        expect(store.oclock_roundedcorners).toBe(12);
        expect(document.body.style.getPropertyValue('--clock-roundedcorners')).toBe('12');
    });

    test('yakeli scaling: value/100 + color array', () => {
        const store = useConfigStore();
        useTimeProperties(
            {
                oclock_yakeli: { value: 50 },
                oclock_yakelicolor: { value: '0.5 0.5 0.5' },
            } as never,
            false
        );
        expect(store.oclock_yakeli).toBeCloseTo(0.5);
        expect(store.oclock_yakelic_color).toEqual([128, 128, 128]);
        expect(document.body.style.getPropertyValue('--clock-yakeli')).toBe('0.5');
    });

    test('logs init complete when FirstLoad=true', () => {
        useTimeProperties({} as never, true);
        const matched = debugLogger.logs.find(
            l => l.message === '[Date] 日期参数初始化完成'
        );
        expect(matched).toBeDefined();
    });

    test('no log when FirstLoad=false', () => {
        useTimeProperties({} as never, false);
        const initLogs = debugLogger.logs.filter(l => l.message.includes('参数初始化完成'));
        expect(initLogs).toHaveLength(0);
    });
});
