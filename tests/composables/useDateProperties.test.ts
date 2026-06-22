// @vitest-environment jsdom
/**
 * Tests for src/composables/useDateProperties.ts — Stage 3-1
 *
 * Verifies date property handler — patches Pinia store + body CSS vars.
 */
import { createPinia, setActivePinia } from 'pinia';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

import { useDateProperties } from '@/composables/useDateProperties';
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
    vi.spyOn(document.body.style, 'setProperty');
});

afterEach(() => {
    vi.restoreAllMocks();
});

describe('useDateProperties', () => {
    test('show_date true → display flex', () => {
        const store = useConfigStore();
        useDateProperties({ showDate: { value: true } } as never, false);
        expect(store.show_date).toBe(true);
        expect(document.body.style.setProperty).toHaveBeenCalledWith('--date-display', 'flex');
    });

    test('show_date false → display none + disable color rhythm', () => {
        const store = useConfigStore();
        useDateProperties({ showDate: { value: false } } as never, false);
        expect(store.show_date).toBe(false);
        expect(store.date_color_rhythm).toBe(false);
        expect(document.body.style.setProperty).toHaveBeenCalledWith('--date-display', 'none');
    });

    test('odate_color → RGB array', () => {
        const store = useConfigStore();
        useDateProperties({ odate_color: { value: '1 0 0' } } as never, false);
        expect(store.odate_color).toEqual([255, 0, 0]);
        expect(document.body.style.setProperty).toHaveBeenCalledWith('--date-color', '255, 0, 0');
    });

    test('odate_yakeli /100 + yakeli_color array', () => {
        const store = useConfigStore();
        useDateProperties(
            {
                odate_yakeli: { value: 50 },
                odate_yakelicolor: { value: '0.5 0.5 0.5' },
            } as never,
            false
        );
        expect(store.odate_yakeli).toBeCloseTo(0.5);
        expect(store.odate_yakelic_color).toEqual([128, 128, 128]);
    });

    test('position patches set CSS variables with %', () => {
        const store = useConfigStore();
        useDateProperties({ DateX: { value: 30 }, DateY: { value: 60 } } as never, false);
        expect(store.date_x).toBe(30);
        expect(store.date_y).toBe(60);
        expect(document.body.style.setProperty).toHaveBeenCalledWith('--date-left', '30%');
        expect(document.body.style.setProperty).toHaveBeenCalledWith('--date-top', '60%');
    });

    test('date_format.* mutates whole object via store read-modify-write', () => {
        const store = useConfigStore();
        useDateProperties(
            {
                date_separator: { value: 2 },
                date_order: { value: 3 },
                date_yearFormat: { value: 1 },
            } as never,
            false
        );
        expect(store.date_format).toEqual({
            separator: 2,
            order: 3,
            year_format: 1,
        });
    });

    test('datetransparency → store + CSS', () => {
        const store = useConfigStore();
        useDateProperties({ datetransparency: { value: 75 } } as never, false);
        expect(store.date_transparency).toBeCloseTo(0.75);
        expect(document.body.style.setProperty).toHaveBeenCalledWith('--date-opacity', '0.75');
    });

    test('logs init complete + sets date_init_complete on FirstLoad', () => {
        const store = useConfigStore();
        useDateProperties({} as never, true);
        expect(store.date_init_complete).toBe(true);
        const matched = debugLogger.logs.find(l => l.message === '[Date] 日期参数初始化完成');
        expect(matched).toBeDefined();
    });
});
