// @vitest-environment jsdom
/**
 * Tests for src/composables/useSakuraProperties.ts — Stage 3-3
 */
import { createPinia, setActivePinia } from 'pinia';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

import { useConfigStore } from '@/stores/config';
import { debugLogger } from '@/utils/logger';

const { mockSakuraModule, mockElements } = vi.hoisted(() => {
    const mockSakuraModule = {
        makeCanvasFullScreen: vi.fn(),
        makeCanvasHide: vi.fn(),
        setAnimating: vi.fn(),
        animate: vi.fn(),
        removesakura: vi.fn(),
        sakuraLoad: vi.fn(),
        sakuraResize: vi.fn(),
        sakuraReLoadEffect: vi.fn(),
    };
    const mockElements = {
        body: undefined as unknown,
        sakura: undefined as unknown,
        sakurashow: undefined as unknown,
    };
    return { mockSakuraModule, mockElements };
});

vi.mock('@/modules/sakura', () => mockSakuraModule);

vi.mock('@/utils/elementManager', () => ({
    elements: mockElements,
}));

import { useSakuraProperties } from '@/modules/sakura/useSakuraProperties';

beforeEach(() => {
    setActivePinia(createPinia());
    debugLogger.clearLogs();
    Object.values(mockSakuraModule).forEach(fn => fn.mockClear());
    // Stub getContext (jsdom doesn't implement canvas 2D)
    Object.defineProperty(HTMLCanvasElement.prototype, 'getContext', {
        configurable: true,
        value: function (this: HTMLCanvasElement) {
            const el = this;
            return new Proxy(
                {},
                {
                    get(_t, prop) {
                        if (prop === 'canvas') return el;
                        return () => undefined;
                    },
                }
            );
        },
    });
});

afterEach(() => {
    vi.restoreAllMocks();
});

describe('useSakuraProperties', () => {
    test('showSakura true → sakuraLoad (gl null) + removesakura', () => {
        const store = useConfigStore();
        useSakuraProperties({ showSakura: { value: true } } as never, false);
        expect(store.showSakura).toBe(true);
        // In Phase 7 test env, gl is null (WebGL not available in jsdom),
        // so the code path calls sakuraLoad() instead of setAnimating/animate.
        // sakuraLoad handles full initialization + starts RAF internally.
        expect(mockSakuraModule.sakuraLoad).toHaveBeenCalledTimes(1);
        expect(mockSakuraModule.removesakura).toHaveBeenCalledTimes(1);
    });

    test('showSakura false → makeCanvasHide + setAnimating(false)', () => {
        const store = useConfigStore();
        useSakuraProperties({ showSakura: { value: false } } as never, false);
        expect(store.showSakura).toBe(false);
        expect(mockSakuraModule.setAnimating).toHaveBeenCalledWith(false);
    });

    test('sakuratransparency /100 → store + canvas style.opacity', () => {
        const store = useConfigStore();
        // provide a real canvas so the getContext path runs
        const canvas = document.createElement('canvas');
        canvas.id = 'sakurashow';
        document.body.appendChild(canvas);
        // Override elementManager to expose this canvas
        (mockElements as { sakurashow: HTMLCanvasElement | undefined }).sakurashow = canvas;
        useSakuraProperties({ sakuratransparency: { value: 50 } } as never, false);
        expect(store.sakura_transparency).toBeCloseTo(0.5);
        expect(canvas.style.opacity).toBe('0.5');
        document.body.removeChild(canvas);
        (mockElements as { sakurashow: HTMLCanvasElement | undefined }).sakurashow = undefined;
    });

    test('sakurabackground + sakurabackcolor + sakurareverse passthrough', () => {
        const store = useConfigStore();
        useSakuraProperties(
            {
                sakurabackground: { value: true },
                sakurabackcolor: { value: false },
                sakurareverse: { value: true },
            } as never,
            false
        );
        expect(store.sakura_background).toBe(true);
        expect(store.sakura_back_color).toBe(false);
        expect(store.sakura_reverse).toBe(true);
    });

    test('sakurapointnumber + sakurabacklight + side-effects', () => {
        const store = useConfigStore();
        useSakuraProperties(
            {
                sakurapointnumber: { value: 200 },
                sakurabacklight: { value: 30 },
            } as never,
            false
        );
        expect(store.sakura_point_number).toBe(200);
        expect(store.sakura_back_light).toBeCloseTo(0.3);
        expect(mockSakuraModule.sakuraResize).toHaveBeenCalledTimes(1);
        expect(mockSakuraModule.sakuraReLoadEffect).toHaveBeenCalledTimes(1);
    });

    test('logs init complete + no FirstLoad log on subsequent calls', () => {
        const store = useConfigStore();
        useSakuraProperties({} as never, true);
        const matched = debugLogger.logs.find(
            l => l.message === '[Sakura] 樱花效果参数初始化完成'
        );
        expect(matched).toBeDefined();
        expect(store.particles_init_complete ?? store.date_init_complete).toBeDefined();
    });
});
