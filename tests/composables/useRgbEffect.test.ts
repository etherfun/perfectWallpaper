// @vitest-environment jsdom
/**
 * Tests for src/composables/useRgbEffect.ts — Stage 5-C1
 *
 * Mirrors the usePWCircle / usePWLine tests:
 *   - render() delegates to RGB.ts background2canvas without throwing.
 *   - visibilitychange listener is added on mount, removed on unmount.
 *   - watch on config.rgb_show fires render when toggled from off → on.
 *
 * Mocks src/RGB.ts via vi.hoisted spies + listeners.
 */

import { mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { defineComponent, h } from 'vue';

const { spies, listeners } = vi.hoisted(() => ({
    spies: {
        background2canvas: vi.fn(),
    },
    listeners: { add: vi.fn(), remove: vi.fn() },
}));

// Wrap document add/removeEventListener to spy on 'visibilitychange'.
const origAdd = document.addEventListener.bind(document);
const origRemove = document.removeEventListener.bind(document);
document.addEventListener = ((type: string, ...rest: unknown[]) => {
    if (type === 'visibilitychange') listeners.add();
    return (origAdd as (...a: unknown[]) => void)(type, ...rest);
}) as typeof document.addEventListener;
document.removeEventListener = ((type: string, ...rest: unknown[]) => {
    if (type === 'visibilitychange') listeners.remove();
    return (origRemove as (...a: unknown[]) => void)(type, ...rest);
}) as typeof document.removeEventListener;

vi.mock('@/modules/rgb-effect/RGB', () => ({
    background2canvas: spies.background2canvas,
}));

vi.mock('@/i18n', () => ({
    globalT: (key: string) => key,
    useI18n: () => ({ t: (key: string) => key, locale: { value: 'zh-CN' } }),
}));

import { useRgbEffect } from '@/modules/rgb-effect/useRgbEffect';

function makeHost() {
    let api: ReturnType<typeof useRgbEffect> | null = null;
    const Host = defineComponent({
        setup() {
            api = useRgbEffect();
            return () => h('div');
        },
    });
    return {
        Host,
        getApi: () => api as unknown as ReturnType<typeof useRgbEffect>,
    };
}

let pinia: ReturnType<typeof createPinia>;
beforeEach(() => {
    pinia = createPinia();
    setActivePinia(pinia);
    spies.background2canvas.mockClear();
    listeners.add.mockClear();
    listeners.remove.mockClear();
});

afterEach(() => {
    vi.restoreAllMocks();
});

describe('useRgbEffect', () => {
    test('mount registers a visibilitychange listener', () => {
        const before = listeners.add.mock.calls.length;
        const { Host } = makeHost();
        mount(Host, { attachTo: document.body, global: { plugins: [pinia] } });
        expect(listeners.add.mock.calls.length).toBe(before + 1);
    });

    test('unmount removes the visibilitychange listener', () => {
        const before = listeners.remove.mock.calls.length;
        const { Host } = makeHost();
        const wrapper = mount(Host, { attachTo: document.body, global: { plugins: [pinia] } });
        wrapper.unmount();
        expect(listeners.remove.mock.calls.length).toBe(before + 1);
    });

    test('api.render() delegates to RGB.background2canvas', () => {
        const { Host, getApi } = makeHost();
        mount(Host, { attachTo: document.body, global: { plugins: [pinia] } });
        const api = getApi();

        api.render('img.png', true);
        expect(spies.background2canvas).toHaveBeenCalledWith('img.png', true);

        api.render(null, false);
        expect(spies.background2canvas).toHaveBeenCalledWith(null, false);

        api.render();
        expect(spies.background2canvas).toHaveBeenCalledWith(undefined, undefined);
    });

    test('watch on rgb_show triggers render when toggled off → on', async () => {
        const { Host } = makeHost();
        const wrapper = mount(Host, {
            attachTo: document.body,
            global: { plugins: [pinia] },
        });
        // BUILTIN_DEFAULTS.rgb_show is false initially → no kick yet
        const beforeToggle = spies.background2canvas.mock.calls.length;

        // Trigger reactive change via Pinia store
        const store = pinia._s.get('config');
        store.rgb_show = true;
        // wait for watch flush
        await wrapper.vm.$nextTick();
        expect(spies.background2canvas.mock.calls.length).toBe(beforeToggle + 1);
    });

    test('watch on rgb_show does NOT trigger render when toggled on → off', async () => {
        const { Host } = makeHost();
        const wrapper = mount(Host, {
            attachTo: document.body,
            global: { plugins: [pinia] },
        });
        const store = pinia._s.get('config');
        store.rgb_show = true;
        await wrapper.vm.$nextTick();
        const afterEnable = spies.background2canvas.mock.calls.length;

        store.rgb_show = false;
        await wrapper.vm.$nextTick();
        expect(spies.background2canvas.mock.calls.length).toBe(afterEnable);
    });

    test('unmount completes without throwing', () => {
        const { Host } = makeHost();
        const wrapper = mount(Host, {
            attachTo: document.body,
            global: { plugins: [pinia] },
        });
        expect(() => wrapper.unmount()).not.toThrow();
    });
});
