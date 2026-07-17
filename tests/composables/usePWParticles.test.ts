// @vitest-environment jsdom
/**
 * Tests for src/composables/usePWParticles.ts 鈥?Stage 5-C1
 *
 * Verifies the composable wraps src/PWParticles.ts:
 *   - resize() runs once on mount (replaces top-level wResize side effect)
 *   - window resize listener is added on mount, removed on unmount
 *   - stop() is called on unmount to kill the RAF loop
 *   - all 6 method passthroughs (resize/start/stop/createPoint/draw/connect)
 *     reach the underlying PWParticles.ts without throwing
 */

import { mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { defineComponent, h } from 'vue';

const { spies, listeners } = vi.hoisted(() => ({
    spies: {
        wResize: vi.fn(),
        startAuto: vi.fn(),
        stopAuto: vi.fn(),
        PWParcreatePoint: vi.fn(),
        drawPoint: vi.fn(),
        connect: vi.fn(),
    },
    listeners: { add: vi.fn(), remove: vi.fn() },
}));

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

vi.mock('@/modules/audio-visualizer/PWParticles', () => ({
    wResize: spies.wResize,
    startAuto: spies.startAuto,
    stopAuto: spies.stopAuto,
    PWParcreatePoint: spies.PWParcreatePoint,
    drawPoint: spies.drawPoint,
    connect: spies.connect,
}));

vi.mock('@/utils/i18n', () => ({
    globalT: (key: string) => key,
    useI18n: () => ({ t: (key: string) => key, locale: { value: 'zh-CN' } }),
}));

import { usePWParticles } from '@/modules/audio-visualizer/usePWParticles';

function makeHost() {
    let api: ReturnType<typeof usePWParticles> | null = null;
    const Host = defineComponent({
        setup() {
            api = usePWParticles();
            return () => h('div');
        },
    });
    return {
        Host,
        getApi: () => api as unknown as ReturnType<typeof usePWParticles>,
    };
}

beforeEach(() => {
    setActivePinia(createPinia());
    for (const spy of Object.values(spies)) {
        spy.mockClear();
    }
    listeners.add.mockClear();
    listeners.remove.mockClear();
});

afterEach(() => {
    vi.restoreAllMocks();
});

describe('usePWParticles', () => {
    test('resize() runs once on mount (replaces top-level wResize)', () => {
        const { Host } = makeHost();
        mount(Host, { attachTo: document.body });
        expect(spies.wResize).toHaveBeenCalledTimes(1);
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

    test('unmount calls stopAuto() to kill RAF loop', () => {
        const { Host } = makeHost();
        const wrapper = mount(Host, { attachTo: document.body });
        expect(spies.stopAuto).not.toHaveBeenCalled();
        wrapper.unmount();
        expect(spies.stopAuto).toHaveBeenCalledTimes(1);
    });

    test('exposes 6 passthrough methods delegating to PWParticles.ts', () => {
        const { Host, getApi } = makeHost();
        mount(Host, { attachTo: document.body });
        const api = getApi();

        api.start();
        expect(spies.startAuto).toHaveBeenCalledTimes(1);

        api.stop();
        expect(spies.stopAuto).toHaveBeenCalledTimes(1);

        api.createPoint();
        expect(spies.PWParcreatePoint).toHaveBeenCalledTimes(1);

        api.draw();
        expect(spies.drawPoint).toHaveBeenCalledTimes(1);

        api.connect();
        expect(spies.connect).toHaveBeenCalledTimes(1);
    });

    test('api.resize() is a direct handle to the resize listener body', () => {
        const { Host, getApi } = makeHost();
        mount(Host, { attachTo: document.body });
        const api = getApi();
        const before = spies.wResize.mock.calls.length;
        api.resize();
        expect(spies.wResize.mock.calls.length).toBe(before + 1);
    });
});
