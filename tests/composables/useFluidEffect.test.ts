// @vitest-environment jsdom
/**
 * Tests for src/composables/useFluidEffect.ts — Stage 5-C2
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

interface MockFluidInstance {
    enabled: boolean;
    fullscreenEnabled: boolean;
    state: string;
    enable: ReturnType<typeof vi.fn>;
    disable: ReturnType<typeof vi.fn>;
    enableFullscreen: ReturnType<typeof vi.fn>;
    disableFullscreen: ReturnType<typeof vi.fn>;
    toggle: ReturnType<typeof vi.fn>;
}

const { mockInstance, mockFluidEffect } = vi.hoisted(() => {
    const mockInstance: MockFluidInstance = {
        enabled: false,
        fullscreenEnabled: false,
        state: 'DISABLED',
        enable: vi.fn(function (this: MockFluidInstance) {
            this.enabled = true;
            this.state = 'NORMAL';
            return this;
        }),
        disable: vi.fn(function (this: MockFluidInstance) {
            this.enabled = false;
            this.fullscreenEnabled = false;
            this.state = 'DISABLED';
            return this;
        }),
        enableFullscreen: vi.fn(function (this: MockFluidInstance) {
            this.enabled = true;
            this.fullscreenEnabled = true;
            this.state = 'FULLSCREEN';
            return this;
        }),
        disableFullscreen: vi.fn(function (this: MockFluidInstance) {
            this.enabled = true;
            this.fullscreenEnabled = false;
            this.state = 'NORMAL';
            return this;
        }),
        toggle: vi.fn(function (this: MockFluidInstance) {
            return this.enabled;
        }),
    };
    const mockFluidEffect = {
        FluidEffect: {
            create: vi.fn(() => mockInstance),
        },
    };
    return { mockInstance, mockFluidEffect };
});

import type { FluidEffect as FluidEffectClass } from '@/fluid';

vi.mock('@/fluid', () => ({
    FluidEffect: {
        // Cast to FluidEffect — tests only need the public API surface
        // (enable/disable/enableFullscreen/disableFullscreen/toggle).
        create: (): FluidEffectClass => mockInstance as unknown as FluidEffectClass,
    },
}));

vi.mock('@/i18n', () => ({
    globalT: (key: string) => key,
    useI18n: () => ({ t: (key: string) => key, locale: { value: 'zh-CN' } }),
}));

import { useFluidEffect } from '@/composables/useFluidEffect';

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
    mockFluidEffect.FluidEffect.create.mockClear();
    mockInstance.enable.mockClear();
    mockInstance.disable.mockClear();
    mockInstance.enableFullscreen.mockClear();
    mockInstance.disableFullscreen.mockClear();
    mockInstance.toggle.mockClear();
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
        mount(Host, { attachTo: document.body });
        expect(mockFluidEffect.FluidEffect.create).not.toHaveBeenCalled();
    });

    test('mount with fluidEffectEnabled=true calls FluidEffect.create + enable', () => {
        const { Host } = makeHost();
        const wrapper = mount(Host, { attachTo: document.body });
        const pinia = wrapper.vm.$.appContext.config.globalProperties.$pinia;
        const store = pinia._s.get('config');

        store.fluidEffectEnabled = true;
        expect(mockFluidEffect.FluidEffect.create).toHaveBeenCalledTimes(1);
        expect(mockInstance.enable).toHaveBeenCalled();
    });

    test('watch on fluidEffectEnabled false → true calls enable, true → false calls disable', async () => {
        const { Host } = makeHost();
        const wrapper = mount(Host, { attachTo: document.body });
        const pinia = wrapper.vm.$.appContext.config.globalProperties.$pinia;
        const store = pinia._s.get('config');

        store.fluidEffectEnabled = true;
        await wrapper.vm.$nextTick();
        const afterEnable = mockInstance.enable.mock.calls.length;

        store.fluidEffectEnabled = false;
        await wrapper.vm.$nextTick();
        expect(mockInstance.enable.mock.calls.length).toBe(afterEnable); // no extra enable
        expect(mockInstance.disable).toHaveBeenCalled();
    });

    test('unmount calls disable() for cleanup', () => {
        const { Host } = makeHost();
        const wrapper = mount(Host, { attachTo: document.body });
        const pinia = wrapper.vm.$.appContext.config.globalProperties.$pinia;
        const store = pinia._s.get('config');

        store.fluidEffectEnabled = true;
        wrapper.unmount();
        // disable() called both on unmount AND on the false-toggle; verify at least one
        expect(mockInstance.disable).toHaveBeenCalled();
    });

    test('exposes 5 passthrough methods delegating to FluidEffect', async () => {
        const { Host, getApi } = makeHost();
        const wrapper = mount(Host, { attachTo: document.body });
        // Force-create the instance
        const pinia = wrapper.vm.$.appContext.config.globalProperties.$pinia;
        const store = pinia._s.get('config');
        store.fluidEffectEnabled = true;
        await wrapper.vm.$nextTick();
        const api = getApi();

        api.enable();
        api.disable();
        api.enableFullscreen();
        api.disableFullscreen();
        api.toggle();

        expect(mockInstance.enable).toHaveBeenCalled();
        expect(mockInstance.disable).toHaveBeenCalled();
        expect(mockInstance.enableFullscreen).toHaveBeenCalled();
        expect(mockInstance.disableFullscreen).toHaveBeenCalled();
        expect(mockInstance.toggle).toHaveBeenCalled();
    });

    test('isEnabled / isFullscreen computed refs reflect FluidEffect state', async () => {
        const { Host, getApi } = makeHost();
        const wrapper = mount(Host, { attachTo: document.body });
        const pinia = wrapper.vm.$.appContext.config.globalProperties.$pinia;
        const store = pinia._s.get('config');

        // Initially no instance → both false
        expect(getApi().isEnabled.value).toBe(false);
        expect(getApi().isFullscreen.value).toBe(false);

        store.fluidEffectEnabled = true;
        await wrapper.vm.$nextTick();
        // Mock state shows enabled=true after enable()
        expect(getApi().isEnabled.value).toBe(true);

        // Trigger fullscreen
        getApi().enableFullscreen();
        await wrapper.vm.$nextTick();
        expect(getApi().isFullscreen.value).toBe(true);
    });

    test('unmount completes without throwing', () => {
        const { Host } = makeHost();
        const wrapper = mount(Host, { attachTo: document.body });
        expect(() => wrapper.unmount()).not.toThrow();
    });
});
