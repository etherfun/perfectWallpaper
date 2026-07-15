// @vitest-environment jsdom
/**
 * Tests for src/composables/useRGBProperties.ts — Stage 3-3
 */
import { createPinia, setActivePinia } from 'pinia';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

import { useConfigStore } from '@/stores/config';
import { debugLogger } from '@/utils/logger';

vi.mock('@/utils/elementManager', () => ({ elements: { body: document.body } }));

import { useRGBProperties } from '@/modules/rgb-effect/useRGBProperties';

beforeEach(() => {
    setActivePinia(createPinia());
    debugLogger.clearLogs();
});

afterEach(() => {
    vi.restoreAllMocks();
});

describe('useRGBProperties', () => {
    test('rgb_fps mapping (24/30/45/60 → 41/33/22/16)', () => {
        const store = useConfigStore();
        useRGBProperties({ rgb_fps: { value: 60 } } as never, false);
        expect(store.rgb_refresh).toBe(16);
        useRGBProperties({ rgb_fps: { value: 30 } } as never, false);
        expect(store.rgb_refresh).toBe(33);
        useRGBProperties({ rgb_fps: { value: 24 } } as never, false);
        expect(store.rgb_refresh).toBe(41);
        useRGBProperties({ rgb_fps: { value: 45 } } as never, false);
        expect(store.rgb_refresh).toBe(22);
    });

    test('rgb_show / rgb_bg / rgb_sa / rgb_pa / rgb_au passthrough', () => {
        const store = useConfigStore();
        useRGBProperties(
            {
                rgb_show: { value: true },
                rgb_bg: { value: true },
                rgb_sa: { value: false },
                rgb_pa: { value: true },
                rgb_au: { value: false },
            } as never,
            false
        );
        expect(store.rgb_show).toBe(true);
        expect(store.background_rgb).toBe(true);
        expect(store.sakura_rgb).toBe(false);
        expect(store.particles_rgb).toBe(true);
        expect(store.audiobar_rgb).toBe(false);
    });

    test('rgb_sa_op /100 → store', () => {
        const store = useConfigStore();
        useRGBProperties({ rgb_sa_op: { value: 75 } } as never, false);
        expect(store.opacity_sa_rgb).toBeCloseTo(0.75);
    });

    test('rgb_au_high /2 → store', () => {
        const store = useConfigStore();
        useRGBProperties({ rgb_au_high: { value: 100 } } as never, false);
        expect(store.aurgbhigh).toBe(50);
    });

    test('rgb_au_color splits RGB string → joined', () => {
        const store = useConfigStore();
        useRGBProperties({ rgb_au_color: { value: '1 0.5 0.2' } } as never, false);
        expect(store.aurgbcolor).toBe('255,128,51');
    });

    test('rainbow passthrough', () => {
        const store = useConfigStore();
        useRGBProperties(
            {
                rgb_color_rainbow: { value: true },
                rgb_color_rainbow_move: { value: true },
                rgb_color_rainbow_movespeed: { value: 75 },
            } as never,
            false
        );
        expect(store.audiobar_rainbow_color).toBe(true);
        expect(store.rainbow_move).toBe(true);
        expect(store.rainbow_move_speed).toBe(75);
    });

    test('logs init complete on FirstLoad', () => {
        useRGBProperties({} as never, true);
        const matched = debugLogger.logs.find(l => l.message === '[RGB] RGB灯光参数初始化完成');
        expect(matched).toBeDefined();
    });
});
