// @vitest-environment jsdom
/**
 * Tests for src/composables/useFluidEffectProperties.ts — Stage 3-3
 */
import { createPinia, setActivePinia } from 'pinia';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

import { useConfigStore } from '@/stores/config';
import { debugLogger } from '@/utils/logger';

const { mockFluidEffectInstance, mockFluid, mockConfig } = vi.hoisted(() => {
    const mockFluidEffectInstance = {
        set: vi.fn(),
        enable: vi.fn(),
        disable: vi.fn(),
    };
    const mockFluid = {
        FluidEffect: {
            create: vi.fn(() => mockFluidEffectInstance),
        },
    };
    const mockConfig = { runtime: { FluidEffect: mockFluidEffectInstance } };
    return { mockFluidEffectInstance, mockFluid, mockConfig };
});

vi.mock('@/fluid', () => mockFluid);

vi.mock('@/utils/elementManager', () => ({
    elements: { body: document.body },
}));

vi.mock('@/utils/config', () => ({
    config: mockConfig,
}));

import { useFluidEffectProperties } from '@/composables/useFluidEffectProperties';

beforeEach(() => {
    setActivePinia(createPinia());
    debugLogger.clearLogs();
    Object.values(mockFluidEffectInstance).forEach(fn => fn.mockClear());
    mockFluid.FluidEffect.create.mockClear();
});

afterEach(() => {
    vi.restoreAllMocks();
});

describe('useFluidEffectProperties', () => {
    test('fluidEffectEnabled true → cfg.set(enabled) + store', () => {
        const store = useConfigStore();
        useFluidEffectProperties({ fluidEffectEnabled: { value: true } } as never, false);
        expect(mockFluidEffectInstance.set).toHaveBeenCalledWith('enabled', true);
        expect(store.fluidEffectEnabled).toBe(true);
    });

    test('fluidEffectEnabledFullscreen → cfg.set(fullscreenEnabled) + store', () => {
        const store = useConfigStore();
        useFluidEffectProperties(
            { fluidEffectEnabledFullscreen: { value: true } } as never,
            false
        );
        expect(mockFluidEffectInstance.set).toHaveBeenCalledWith('fullscreenEnabled', true);
        expect(store.fluid_effect_enabled_fullscreen).toBe(true);
    });

    test('resolution / blurAmount / displacementScale / octaves → cfg.set + store', () => {
        const store = useConfigStore();
        useFluidEffectProperties(
            {
                fluidEffectResolution: { value: 512 },
                fluidEffectBlurAmount: { value: 30 },
                fluidEffectDisplacementScale: { value: 50 },
                fluidEffectTurbulenceOctaves: { value: 12 },
            } as never,
            false
        );
        expect(mockFluidEffectInstance.set).toHaveBeenCalledWith('resolution', 512);
        expect(mockFluidEffectInstance.set).toHaveBeenCalledWith('blurAmount', 30);
        expect(mockFluidEffectInstance.set).toHaveBeenCalledWith('displacementScale', 50);
        expect(mockFluidEffectInstance.set).toHaveBeenCalledWith('turbulenceOctaves', 12);
        expect(store.fluid_effect_resolution).toBe(512);
        expect(store.fluid_effect_blur_amount).toBe(30);
        expect(store.fluid_effect_displacement_scale).toBe(50);
        expect(store.fluid_effect_turbulence_octaves).toBe(12);
    });

    test('canvasDisplacement / dark overlay / backdrop filter → cfg.set + CSS', () => {
        const store = useConfigStore();
        useFluidEffectProperties(
            {
                fluidEffectCanvasDisplacement: { value: 75 },
                fluidEffect_DarkOverlayStrength: { value: 40 },
                fluidEffect_backdropFilterStrength: { value: 12 },
            } as never,
            false
        );
        expect(mockFluidEffectInstance.set).toHaveBeenCalledWith(
            'canvasDisplacementAmplitude',
            75
        );
        expect(store.fluid_effect_canvas_displacement).toBe(75);
        expect(store.fluid_effect_dark_overlay_strength).toBe(40);
        expect(document.body.style.getPropertyValue('--fluidEffect-dark-overlay-strength')).toBe(
            '0.4'
        );
        expect(
            document.body.style.getPropertyValue('--fluidEffect-backdrop-filter-strength')
        ).toBe('12px');
    });

    test('FirstLoad → fluid_effect_init_complete set + log', () => {
        const store = useConfigStore();
        useFluidEffectProperties({} as never, true);
        expect(mockFluid.FluidEffect.create).toHaveBeenCalledTimes(1);
        expect(store.fluid_effect_init_complete).toBe(true);
        const matched = debugLogger.logs.find(
            l => l.message === '[FluidEffect] 流体参数初始化完成'
        );
        expect(matched).toBeDefined();
    });
});
