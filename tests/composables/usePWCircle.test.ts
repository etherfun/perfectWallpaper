// @vitest-environment jsdom
/**
 * Tests for src/composables/usePWCircle.ts — Stage 5-A
 *
 * Verifies that the composable wraps src/PWCircle.ts correctly:
 *   - resize() runs once on mount
 *   - window resize listener is added on mount, removed on unmount
 *   - all 6 method passthroughs (resize/setCan/createPoint/style1/2/3/getXY)
 *     reach the underlying PWCircle.ts without throwing
 *
 * The composable delegates to src/PWCircle.ts — we stub it to spy on calls
 * without exercising canvas drawing logic.
 */

import { mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

import { defineComponent, h } from 'vue';

// Mock the legacy PWCircle module — vi.mock factories are hoisted, so
// any external state captured here is fragile. Use a fresh spies object
// per test via vi.hoisted to share state safely.
// Track addEventListener / removeEventListener to verify lifecycle.
const { spies, listeners } = vi.hoisted(() => ({
    spies: {
        resize: vi.fn(),
        setCan: vi.fn(),
        createPoint: vi.fn(),
        style1: vi.fn(),
        style2: vi.fn(),
        style3: vi.fn(),
        getXY: vi.fn(() => ({ x: 1, y: 2 })),
    },
    listeners: { add: vi.fn(), remove: vi.fn() },
}));

// jsdom's window already has addEventListener; we wrap to spy.
const origAdd = window.addEventListener.bind(window);
const origRemove = window.removeEventListener.bind(window);
window.addEventListener = ((type: string, ...rest: unknown[]) => {
    if (type === 'resize') listeners.add();
    return (origAdd as (...a: unknown[]) => void)(type, ...rest);
}) as typeof window.addEventListener;
window.removeEventListener = ((type: string, ...rest: unknown[]) => {
    if (type === 'resize') listeners.remove();
    return (origRemove as (...a: unknown[]) => void)(type, ...rest);
}) as typeof window.removeEventListener;

vi.mock('@/modules/audio-visualizer/PWCircle', () => ({
    resize: spies.resize,
    setCan: spies.setCan,
    createPoint: spies.createPoint,
    style1: spies.style1,
    style2: spies.style2,
    style3: spies.style3,
    getXY: spies.getXY,
}));

vi.mock('@/i18n', () => ({
    globalT: (key: string) => key,
    useI18n: () => ({ t: (key: string) => key, locale: { value: 'zh-CN' } }),
}));

// Import AFTER mocks so the module picks them up.
import { usePWCircle } from '@/modules/audio-visualizer/usePWCircle';

/** Tiny host component that calls the composable and exposes its API. */
function makeHost() {
    let api: ReturnType<typeof usePWCircle> | null = null;
    const Host = defineComponent({
        setup() {
            api = usePWCircle();
            return () => h('div');
        },
    });
    return {
        Host,
        getApi: () => api as unknown as ReturnType<typeof usePWCircle>,
    };
}

beforeEach(() => {
    setActivePinia(createPinia());
    for (const spy of Object.values(spies)) {
        spy.mockClear();
    }
});

afterEach(() => {
    vi.restoreAllMocks();
});

describe('usePWCircle', () => {
    test('resize() runs once on mount (composable init)', () => {
        const { Host } = makeHost();
        mount(Host, { attachTo: document.body });
        // resize is called once by the onMounted hook
        expect(spies.resize).toHaveBeenCalledTimes(1);
    });

    test('addEventListener("resize") is called exactly once on mount', () => {
        const before = listeners.add.mock.calls.length;
        const { Host } = makeHost();
        const wrapper = mount(Host, { attachTo: document.body });
        expect(listeners.add.mock.calls.length).toBe(before + 1);
        wrapper.unmount();
    });

    test('removeEventListener("resize") is called exactly once on unmount', () => {
        const before = listeners.remove.mock.calls.length;
        const { Host } = makeHost();
        const wrapper = mount(Host, { attachTo: document.body });
        wrapper.unmount();
        expect(listeners.remove.mock.calls.length).toBe(before + 1);
    });

    test('unmount runs without throwing (listener cleanup is best-effort)', () => {
        // Note: jsdom keeps window event listeners across test runs, and
        // Pinia reset between tests can re-register the listener. We just
        // verify the composable's onBeforeUnmount completes cleanly.
        const { Host } = makeHost();
        const wrapper = mount(Host, { attachTo: document.body });
        expect(() => wrapper.unmount()).not.toThrow();
    });

    test('exposes 7 passthrough methods that delegate to PWCircle.ts', () => {
        const { Host, getApi } = makeHost();
        mount(Host, { attachTo: document.body });
        const api = getApi();

        api.setCan();
        expect(spies.setCan).toHaveBeenCalledTimes(1);

        api.createPoint([1, 2, 3]);
        expect(spies.createPoint).toHaveBeenCalledWith([1, 2, 3]);

        api.style1();
        api.style2();
        api.style3();
        expect(spies.style1).toHaveBeenCalledTimes(1);
        expect(spies.style2).toHaveBeenCalledTimes(1);
        expect(spies.style3).toHaveBeenCalledTimes(1);

        const xy = api.getXY(0.5, Math.PI / 2);
        expect(spies.getXY).toHaveBeenCalledWith(0.5, Math.PI / 2);
        expect(xy).toEqual({ x: 1, y: 2 });
    });

    test('api.resize() is a direct handle to the resize listener body', () => {
        const { Host, getApi } = makeHost();
        mount(Host, { attachTo: document.body });
        const api = getApi();
        const before = spies.resize.mock.calls.length;
        api.resize();
        expect(spies.resize.mock.calls.length).toBe(before + 1);
    });
});
