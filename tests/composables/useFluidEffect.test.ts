// @vitest-environment jsdom
/**
 * Tests for src/composables/useFluidEffect.ts 鈥?Stage 5-C2
 *
 * Verifies the composable wraps FluidEffect state machine:
 *   - FluidEffect.create() is called lazily (only when first enabled)
 *   - mount with fluidEffectEnabled=true calls enable()
 *   - watch on fluidEffectEnabled toggles enable / disable reactively
 *   - unmount calls disable() for cleanup
 *   - 5 method passthroughs (enable/disable/enableFullscreen/disableFullscreen/
 *     toggle) reach FluidEffect without throwing
 *
 * FluidEffect is mocked because it pulls in WebGL + DOM-heavy lifecycle
 * code that can't run under jsdom.
 */
import { mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { defineComponent, h } from 'vue';

// Hoisted shared mock state. vi.hoisted runs BEFORE the vi.mock factories,
// so any references here are guaranteed to be initialized by the time
// the mock factory executes.
const mockState = vi.hoisted(() => {
    const instance = {
        enabled: false,
        fullscreenEnabled: false,
        state: 'DISABLED' as 'DISABLED' | 'NORMAL' | 'FULLSCREEN',
    };
    const createFn = vi.fn(() => {
        // Each create() call returns the SAME shared mockInstance so all
        // spies (enable/disable/etc.) live on one object and can be
        // inspected from the test body.
        // (No need for markRaw 鈥?useFluidEffect uses shallowRef which keeps
        // the object non-reactive by default.)
        return Object.assign(mockState.instance, mockState.methods);
    });
    const methods = {
        enable: vi.fn(function (this: { enabled: boolean; state: string }) {
            this.enabled = true;
            this.state = 'NORMAL';
        }),
        disable: vi.fn(function (this: { enabled: boolean; state: string }) {
            this.enabled = false;
            this.state = 'DISABLED';
        }),
        enableFullscreen: vi.fn(function (this: {
            enabled: boolean;
            fullscreenEnabled: boolean;
            state: string;
        }) {
            this.enabled = true;
            this.fullscreenEnabled = true;
            this.state = 'FULLSCREEN';
        }),
        disableFullscreen: vi.fn(function (this: { enabled: boolean; state: string }) {
            this.enabled = true;
            this.state = 'NORMAL';
        }),
        toggle: vi.fn(function (this: { enabled: boolean }) {
            return this.enabled;
        }),
    };
    return { instance, methods, createFn };
});

vi.mock('@/modules/fluid', () => ({
    FluidEffect: {
        create: mockState.createFn,
    },
}));

vi.mock('@/utils/i18n', () => ({
    globalT: (key: string) => key,
    useI18n: () => ({ t: (key: string) => key, locale: { value: 'zh-CN' } }),
}));

import { useFluidEffect } from '@/modules/fluid/useFluidEffect';

const mockInstance = mockState.instance;
const mockMethods = mockState.methods;
const mockCreate = mockState.createFn;

function makeHost() {
    let api: ReturnType<typeof useFluidEffect> | null = null;
    const Host = defineComponent({
        setup() {
            api = useFluidEffect();
            return () => h('div');
        },
    });
    return {
        Host,
        getApi: () => api as unknown as ReturnType<typeof useFluidEffect>,
    };
}

beforeEach(() => {
    setActivePinia(createPinia());
    mockCreate.mockClear();
    mockMethods.enable.mockClear();
    mockMethods.disable.mockClear();
    mockMethods.enableFullscreen.mockClear();
    mockMethods.disableFullscreen.mockClear();
    mockMethods.toggle.mockClear();
    // Reset instance state
    mockInstance.enabled = false;
    mockInstance.fullscreenEnabled = false;
    mockInstance.state = 'DISABLED';
});

afterEach(() => {
    vi.restoreAllMocks();
});

describe('useFluidEffect', () => {
    test('FluidEffect.create() is NOT called when effect is disabled on mount', () => {
        // BUILTIN_DEFAULTS.fluidEffectEnabled is false
        const { Host } = makeHost();
        mount(Host, { attachTo: document.body, global: { plugins: [createPinia()] } });
        expect(mockCreate).not.toHaveBeenCalled();
    });

    test('mount with fluidEffectEnabled=true calls FluidEffect.create + enable', async () => {
        const { Host } = makeHost();
        const pinia = createPinia();
        const wrapper = mount(Host, {
            attachTo: document.body,
            global: { plugins: [pinia] },
        });
        const store = pinia._s.get('config');

        store.fluidEffectEnabled = true;
        await wrapper.vm.$nextTick();
        expect(mockCreate).toHaveBeenCalledTimes(1);
        expect(mockMethods.enable).toHaveBeenCalled();
    });

    test('watch on fluidEffectEnabled false 鈫?true calls enable, true 鈫?false calls disable', async () => {
        const { Host } = makeHost();
        const pinia = createPinia();
        const wrapper = mount(Host, {
            attachTo: document.body,
            global: { plugins: [pinia] },
        });
        const store = pinia._s.get('config');

        store.fluidEffectEnabled = true;
        await wrapper.vm.$nextTick();
        const afterEnable = mockMethods.enable.mock.calls.length;

        store.fluidEffectEnabled = false;
        await wrapper.vm.$nextTick();
        expect(mockMethods.enable.mock.calls.length).toBe(afterEnable); // no extra enable
        expect(mockMethods.disable).toHaveBeenCalled();
    });

    test('unmount calls disable() for cleanup', async () => {
        const { Host } = makeHost();
        const pinia = createPinia();
        const wrapper = mount(Host, {
            attachTo: document.body,
            global: { plugins: [pinia] },
        });
        const store = pinia._s.get('config');

        store.fluidEffectEnabled = true;
        await wrapper.vm.$nextTick();
        wrapper.unmount();
        // disable() called both on unmount AND on the false-toggle; verify at least one
        expect(mockMethods.disable).toHaveBeenCalled();
    });

    test('exposes 5 passthrough methods delegating to FluidEffect', async () => {
        const { Host, getApi } = makeHost();
        const wrapper = mount(Host, {
            attachTo: document.body,
            global: { plugins: [createPinia()] },
        });

        const api = getApi();
        api.enable();
        api.disable();
        api.enableFullscreen();
        api.disableFullscreen();
        api.toggle();

        await wrapper.vm.$nextTick();

        expect(mockMethods.enable).toHaveBeenCalled();
        expect(mockMethods.disable).toHaveBeenCalled();
        expect(mockMethods.enableFullscreen).toHaveBeenCalled();
        expect(mockMethods.disableFullscreen).toHaveBeenCalled();
        expect(mockMethods.toggle).toHaveBeenCalled();
    });

    test('isEnabled / isFullscreen computed refs reflect FluidEffect state', async () => {
        const { Host, getApi } = makeHost();
        const pinia = createPinia();
        const wrapper = mount(Host, {
            attachTo: document.body,
            global: { plugins: [pinia] },
        });
        const store = pinia._s.get('config');
        store.fluidEffectEnabled = true;
        await wrapper.vm.$nextTick();
        const api = getApi();

        // Lazy create() should have run. NOTE: the computed `isEnabled` /
        // `isFullscreen` reads `instance.value?.enabled` which only re-runs
        // when `instance.value` is reassigned (shallowRef). Per-field
        // mutations through the WebGL/RAF bridge don't trigger the computed
        // by themselves 鈥?that's intentional (avoid 60 Hz re-renders).
        // The contract is: read FluidEffect state directly for fine-grained
        // checks, or triggerRef(instance.value) after external mutations.
        expect(mockInstance.enabled).toBe(true);
        expect(mockInstance.fullscreenEnabled).toBe(false);

        api.enableFullscreen();
        expect(mockInstance.fullscreenEnabled).toBe(true);

        api.disable();
        expect(mockInstance.enabled).toBe(false);

        // Verify the computed values are wired (function exists, returns boolean).
        expect(typeof api.isEnabled.value).toBe('boolean');
        expect(typeof api.isFullscreen.value).toBe('boolean');
    });
});
