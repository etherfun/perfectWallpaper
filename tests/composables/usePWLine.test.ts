// @vitest-environment jsdom
/**
 * Tests for src/composables/usePWLine.ts — Stage 5-B
 *
 * Mirrors the usePWCircle test (Stage 5-A):
 *   - resize handler runs on mount (calls PWLineInit + setCTXLine)
 *   - window resize listener is added/removed cleanly
 *   - all 7 method passthroughs (init/setCtx/createPoint/style1/2/3/getXY)
 *     reach the underlying PWLine.ts without throwing
 *
 * Mocks src/PWLine.ts via vi.mock (hoisted spies).
 */

import { mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { defineComponent, h } from 'vue';

const { spies, listeners } = vi.hoisted(() => ({
    spies: {
        PWLineInit: vi.fn(),
        setCTXLine: vi.fn(),
        PWLineCreatePoint: vi.fn(),
        PWLineStyle1: vi.fn(),
        PWLineStyle2: vi.fn(),
        PWLineStyle3: vi.fn(),
        getLineXY: vi.fn(() => ({ x: 1, y: 2 })),
    },
    listeners: { add: vi.fn(), remove: vi.fn() },
}));

// Wrap jsdom window add/removeEventListener to spy on 'resize' registrations.
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

vi.mock('@/PWLine', () => ({
    PWLineInit: spies.PWLineInit,
    setCTXLine: spies.setCTXLine,
    PWLineCreatePoint: spies.PWLineCreatePoint,
    PWLineStyle1: spies.PWLineStyle1,
    PWLineStyle2: spies.PWLineStyle2,
    PWLineStyle3: spies.PWLineStyle3,
    getLineXY: spies.getLineXY,
}));

vi.mock('@/i18n', () => ({
    globalT: (key: string) => key,
    useI18n: () => ({ t: (key: string) => key, locale: { value: 'zh-CN' } }),
}));

import { usePWLine } from '@/composables/usePWLine';

function makeHost() {
    let api: ReturnType<typeof usePWLine> | null = null;
    const Host = defineComponent({
        setup() {
            api = usePWLine();
            return () => h('div');
        },
    });
    return {
        Host,
        getApi: () => api as unknown as ReturnType<typeof usePWLine>,
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

describe('usePWLine', () => {
    test('mount runs PWLineInit + setCTXLine (resize handler body)', () => {
        const { Host } = makeHost();
        mount(Host, { attachTo: document.body });
        // The resize handler calls PWLineInit() then setCTXLine()
        expect(spies.PWLineInit).toHaveBeenCalledTimes(1);
        expect(spies.setCTXLine).toHaveBeenCalledTimes(1);
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

    test('unmount completes without throwing (best-effort listener cleanup)', () => {
        const { Host } = makeHost();
        const wrapper = mount(Host, { attachTo: document.body });
        expect(() => wrapper.unmount()).not.toThrow();
    });

    test('exposes 7 passthrough methods that delegate to PWLine.ts', () => {
        const { Host, getApi } = makeHost();
        mount(Host, { attachTo: document.body });
        const api = getApi();

        api.setCtx();
        expect(spies.setCTXLine).toHaveBeenCalledTimes(2); // 1 from mount + 1 from api

        api.createPoint([1, 2, 3]);
        expect(spies.PWLineCreatePoint).toHaveBeenCalledWith([1, 2, 3]);

        api.style1();
        api.style2();
        api.style3();
        expect(spies.PWLineStyle1).toHaveBeenCalledTimes(1);
        expect(spies.PWLineStyle2).toHaveBeenCalledTimes(1);
        expect(spies.PWLineStyle3).toHaveBeenCalledTimes(1);

        const xy = api.getXY(0.5, 7);
        expect(spies.getLineXY).toHaveBeenCalledWith(0.5, 7);
        expect(xy).toEqual({ x: 1, y: 2 });
    });

    test('api.init() is a direct handle to the resize listener body', () => {
        const { Host, getApi } = makeHost();
        mount(Host, { attachTo: document.body });
        const api = getApi();
        const beforeInit = spies.PWLineInit.mock.calls.length;
        const beforeSetCtx = spies.setCTXLine.mock.calls.length;
        api.init();
        expect(spies.PWLineInit.mock.calls.length).toBe(beforeInit + 1);
        expect(spies.setCTXLine.mock.calls.length).toBe(beforeSetCtx + 1);
    });
});
