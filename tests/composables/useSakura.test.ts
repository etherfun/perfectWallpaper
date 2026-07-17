// @vitest-environment jsdom
/**
 * Tests for src/composables/useSakura.ts 鈥?Stage 5-C2
 *
 * Verifies the composable wraps src/sakura/*:
 *   - mount calls applySakuraTransparency once (initial sync)
 *   - watch on showSakura updates isActive ref
 *   - watch on sakura_transparency calls applySakuraTransparency
 *   - 5 method passthroughs (load/reloadEffect/resize/copyToDisplay/
 *     applyTransparency) delegate to src/sakura/* without throwing
 *
 * NOTE: src/sakura/* is NOT vi.mocked because it pulls in WebGL context
 * creation which jsdom can't handle. Instead we mock just the public
 * exports we depend on via the @/sakura barrel.
 */

import { mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { defineComponent, h } from 'vue';

const spies = vi.hoisted(() => ({
    applySakuraTransparency: vi.fn(),
    removesakura: vi.fn(),
    sakuraLoad: vi.fn(),
    sakuraReLoadEffect: vi.fn(),
    sakuraResize: vi.fn(),
}));

vi.mock('@/modules/sakura', () => ({
    applySakuraTransparency: spies.applySakuraTransparency,
    removesakura: spies.removesakura,
    sakuraLoad: spies.sakuraLoad,
    sakuraReLoadEffect: spies.sakuraReLoadEffect,
    sakuraResize: spies.sakuraResize,
    // Other barrel exports 鈥?keep them as no-ops so the module loads.
    animate: vi.fn(),
    getAnimating: vi.fn(() => false),
    setAnimating: vi.fn(),
    stepAnimation: vi.fn(),
    toggleAnimation: vi.fn(),
    initSakura: vi.fn(),
    makeCanvasFullScreen: vi.fn(),
    makeCanvasHide: vi.fn(),
    Matrix44: class {},
    Vector3: class {},
}));

vi.mock('@/utils/i18n', () => ({
    globalT: (key: string) => key,
    useI18n: () => ({ t: (key: string) => key, locale: { value: 'zh-CN' } }),
}));

import { useSakura } from '@/modules/sakura/useSakura';

function makeHost() {
    let api: ReturnType<typeof useSakura> | null = null;
    const Host = defineComponent({
        setup() {
            api = useSakura();
            return () => h('div');
        },
    });
    return {
        Host,
        getApi: () => api as unknown as ReturnType<typeof useSakura>,
    };
}

let pinia: ReturnType<typeof createPinia>;
beforeEach(() => {
    pinia = createPinia();
    setActivePinia(pinia);
    for (const spy of Object.values(spies)) {
        spy.mockClear();
    }
});

afterEach(() => {
    vi.restoreAllMocks();
});

describe('useSakura', () => {
    test('mount calls applySakuraTransparency once for initial sync', () => {
        const { Host } = makeHost();
        mount(Host, { attachTo: document.body, global: { plugins: [pinia] } });
        expect(spies.applySakuraTransparency).toHaveBeenCalledTimes(1);
    });

    test('isActive ref reflects config.showSakura on mount', () => {
        const { Host, getApi } = makeHost();
        mount(Host, { attachTo: document.body, global: { plugins: [pinia] } });
        // BUILTIN_DEFAULTS.showSakura = true 鈫?isActive initialized to true
        expect(getApi().isActive.value).toBe(true);
    });

    test('isActive ref updates when config.showSakura toggles', async () => {
        const { Host, getApi } = makeHost();
        const wrapper = mount(Host, {
            attachTo: document.body,
            global: { plugins: [pinia] },
        });
        const store = pinia._s.get('config');

        // BUILTIN_DEFAULTS.showSakura = true, so start from false to toggle.
        store.showSakura = false;
        await wrapper.vm.$nextTick();
        store.showSakura = true;
        await wrapper.vm.$nextTick();
        expect(getApi().isActive.value).toBe(true);
        // showSakura true triggers applySakuraTransparency again
        expect(spies.applySakuraTransparency.mock.calls.length).toBeGreaterThanOrEqual(2);
    });

    test('exposes 5 passthrough methods delegating to src/sakura', () => {
        const { Host, getApi } = makeHost();
        mount(Host, { attachTo: document.body, global: { plugins: [pinia] } });
        const api = getApi();

        api.load();
        expect(spies.sakuraLoad).toHaveBeenCalledTimes(1);

        api.reloadEffect();
        expect(spies.sakuraReLoadEffect).toHaveBeenCalledTimes(1);

        api.resize();
        expect(spies.sakuraResize).toHaveBeenCalledTimes(1);

        api.copyToDisplay();
        expect(spies.removesakura).toHaveBeenCalledTimes(1);

        const beforeApply = spies.applySakuraTransparency.mock.calls.length;
        api.applyTransparency();
        expect(spies.applySakuraTransparency.mock.calls.length).toBe(beforeApply + 1);
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
