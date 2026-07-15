/**
 * Tests for src/systemMonitor/gpuSelector.ts
 *
 * The fix: `data.gpu[0]` was always rendered, which on
 * hybrid laptops (iGPU + dGPU) picked the iGPU first
 * because LHM reports it that way. The iGPU's
 * temperature sensor is often missing (returns 0), so
 * the row showed "0°C / 0%" while the dGPU — the card
 * the user actually cares about — was being ignored.
 *
 * `pickPrimaryGpu` falls through four passes:
 *   1. discrete (non-iGPU) candidates
 *   2. any GPU with temperature > 0
 *   3. any GPU with utilization > 0
 *   4. gpu[0] (legacy behavior)
 */

import { describe, expect, test } from 'vitest';

import { isDiscreteGpu, isIntegratedGpu, pickPrimaryGpu } from '@/modules/systemMonitor/gpuSelector';
import type { GpuInfo } from '@/modules/systemMonitor/types';

function makeGpu(overrides: Partial<GpuInfo> & { model: string; vendor: string }): GpuInfo {
    return {
        id: 0,
        model: overrides.model,
        vendor: overrides.vendor,
        subvendor: null,
        driver_version: null,
        vram: 0,
        vram_total: 0,
        vram_used: 0,
        vram_free: null,
        vram_used_percent: null,
        vram_shared_used: null,
        vram_type: null,
        core_clock: null,
        core_clock_max: null,
        memory_clock: null,
        sm_clock: null,
        video_clock: null,
        temperature: 0,
        temperature_min: null,
        temperature_max: null,
        temperature_critical: null,
        temperature_hot_spot: null,
        temperature_memory_junction: null,
        temperature_available: false,
        temperature_components: [],
        utilization: 0,
        utilization_3d: null,
        utilization_copy: null,
        utilization_video_decode: null,
        utilization_video_encode: null,
        utilization_compute: null,
        utilization_memory_controller: null,
        utilization_video_engine: null,
        utilization_bus: null,
        utilization_vr: null,
        utilization_security: null,
        utilization_jpeg_decode: null,
        utilization_optical_flow: null,
        fan_speed_percent: null,
        fan_speed_rpm: null,
        fan_speed_available: false,
        power: null,
        power_percent: null,
        voltage_core: null,
        voltage_memory: null,
        pcie_rx_bps: null,
        pcie_tx_bps: null,
        ...overrides,
    };
}

describe('pickPrimaryGpu', () => {
    test('returns undefined for an empty array', () => {
        expect(pickPrimaryGpu([])).toBeUndefined();
    });

    test('returns the only entry when array has length 1', () => {
        const g = makeGpu({ id: 7, model: 'RTX 5060', vendor: 'NVIDIA' });
        expect(pickPrimaryGpu([g])?.id).toBe(7);
    });

    test('skips iGPU and picks the dGPU on a hybrid laptop (the reported bug)', () => {
        // Exactly the shape the live server returned: AMD
        // APU iGPU first with no temp sensor, then the
        // NVIDIA dGPU. Pre-fix this would have picked
        // id=0; after-fix it must pick id=1.
        const igpu = makeGpu({ id: 0, model: 'AMD Radeon(TM) 610M', vendor: 'AMD' });
        const dgpu = makeGpu({
            id: 1,
            model: 'NVIDIA GeForce RTX 5060 Laptop GPU',
            vendor: 'NVIDIA',
            utilization: 15,
            temperature: 56.3,
        });
        expect(pickPrimaryGpu([igpu, dgpu])?.id).toBe(1);
    });

    test('picks dGPU regardless of array order (LHM can reorder)', () => {
        const dgpu = makeGpu({
            id: 0,
            model: 'NVIDIA GeForce RTX 4090',
            vendor: 'NVIDIA',
            temperature: 65,
        });
        const igpu = makeGpu({ id: 1, model: 'Intel Iris Xe Graphics', vendor: 'Intel' });
        expect(pickPrimaryGpu([dgpu, igpu])?.id).toBe(0);
    });

    test('falls through to "any GPU with temperature > 0" when no discrete card is detected', () => {
        // Two unknown / ambiguous adapters, only one has a sensor.
        const cold = makeGpu({ id: 0, model: 'GPU A', vendor: 'Unknown', temperature: 0 });
        const hot = makeGpu({ id: 1, model: 'GPU B', vendor: 'Unknown', temperature: 42 });
        expect(pickPrimaryGpu([cold, hot])?.id).toBe(1);
    });

    test('falls through to "any GPU with utilization > 0" when temps are all zero', () => {
        const idle = makeGpu({ id: 0, model: 'GPU A', vendor: 'X', utilization: 0 });
        const busy = makeGpu({ id: 1, model: 'GPU B', vendor: 'X', utilization: 25 });
        expect(pickPrimaryGpu([idle, busy])?.id).toBe(1);
    });

    test('keeps legacy gpu[0] fallback when nothing better qualifies', () => {
        // Two iGPUs / two sensors-dead adapters.
        const a = makeGpu({ id: 0, model: 'Intel UHD Graphics 770', vendor: 'Intel' });
        const b = makeGpu({ id: 1, model: 'AMD Radeon(TM) Graphics', vendor: 'AMD' });
        expect(pickPrimaryGpu([a, b])?.id).toBe(0);
    });

    test('does NOT treat unknown / WDDM-fallback adapters as discrete (Pass 1 must be conservative)', () => {
        // The first GPU is a WDDM fallback with a
        // generic name. Pass 1 must NOT pick it just
        // because it's "not an iGPU" — we need a
        // positive discrete signal.
        const fallback = makeGpu({
            id: 0,
            model: 'Microsoft Basic Render Driver',
            vendor: 'Microsoft',
        });
        const hot = makeGpu({ id: 1, model: 'GPU B', vendor: 'Unknown', temperature: 42 });
        // Pass 1: nothing matches `isDiscreteGpu`.
        // Pass 2: only the second has temp > 0.
        expect(pickPrimaryGpu([fallback, hot])?.id).toBe(1);
    });
});

describe('isIntegratedGpu', () => {
    test('flags AMD APU iGPUs by the "(TM) Graphics" suffix', () => {
        expect(isIntegratedGpu({ model: 'AMD Radeon(TM) 610M', vendor: 'AMD' })).toBe(true);
        expect(isIntegratedGpu({ model: 'AMD Radeon(TM) Graphics', vendor: 'AMD' })).toBe(true);
    });

    test('flags Intel iGPUs (Iris / UHD / HD / plain Intel Graphics)', () => {
        expect(isIntegratedGpu({ model: 'Intel Iris Xe Graphics', vendor: 'Intel' })).toBe(true);
        expect(isIntegratedGpu({ model: 'Intel UHD Graphics 770', vendor: 'Intel' })).toBe(true);
        expect(isIntegratedGpu({ model: 'Intel HD Graphics 4000', vendor: 'Intel' })).toBe(true);
        expect(isIntegratedGpu({ model: 'Intel Graphics', vendor: 'Intel' })).toBe(true);
    });

    test('flags AMD mobile APUs (Radeon ...M pattern)', () => {
        expect(isIntegratedGpu({ model: 'Radeon 780M', vendor: 'AMD' })).toBe(true);
        expect(isIntegratedGpu({ model: 'Radeon 890M', vendor: 'AMD' })).toBe(true);
        expect(isIntegratedGpu({ model: 'Radeon RX Vega 10 M', vendor: 'AMD' })).toBe(true);
    });

    test('flags Microsoft Basic Render Driver (WDDM fallback)', () => {
        expect(
            isIntegratedGpu({ model: 'Microsoft Basic Render Driver', vendor: 'Microsoft' })
        ).toBe(true);
    });

    test('does NOT flag a real dGPU (Radeon RX 7900 XTX)', () => {
        expect(isIntegratedGpu({ model: 'AMD Radeon RX 7900 XTX', vendor: 'AMD' })).toBe(false);
    });

    test('does NOT flag an NVIDIA card (dGPUs have no shared naming pattern with iGPUs)', () => {
        expect(
            isIntegratedGpu({
                model: 'NVIDIA GeForce RTX 5060 Laptop GPU',
                vendor: 'NVIDIA',
            })
        ).toBe(false);
    });

    test('does NOT flag an Intel Arc discrete card', () => {
        expect(isIntegratedGpu({ model: 'Intel Arc A770', vendor: 'Intel' })).toBe(false);
    });

    test('matching is case-insensitive', () => {
        expect(isIntegratedGpu({ model: 'intel iris xe graphics', vendor: 'INTEL' })).toBe(true);
    });
});

describe('isDiscreteGpu', () => {
    test('flags NVIDIA dGPUs by vendor or model', () => {
        expect(
            isDiscreteGpu({ model: 'NVIDIA GeForce RTX 5060 Laptop GPU', vendor: 'NVIDIA' })
        ).toBe(true);
        // Rebranded cards: vendor string contains NVIDIA even when
        // model omits it.
        expect(isDiscreteGpu({ model: 'GeForce RTX 4090', vendor: 'NVIDIA Corporation' })).toBe(
            true
        );
        expect(isDiscreteGpu({ model: 'Quadro RTX 6000', vendor: 'NVIDIA' })).toBe(true);
        expect(isDiscreteGpu({ model: 'Tesla V100', vendor: 'NVIDIA' })).toBe(true);
        expect(isDiscreteGpu({ model: 'TITAN Xp', vendor: 'NVIDIA' })).toBe(true);
    });

    test('flags AMD dGPUs (Radeon RX / Pro / VII)', () => {
        expect(isDiscreteGpu({ model: 'Radeon RX 7900 XTX', vendor: 'AMD' })).toBe(true);
        expect(isDiscreteGpu({ model: 'Radeon Pro W6800', vendor: 'AMD' })).toBe(true);
        expect(isDiscreteGpu({ model: 'Radeon VII', vendor: 'AMD' })).toBe(true);
    });

    test('does NOT flag AMD iGPUs (those are caught by isIntegratedGpu)', () => {
        expect(isDiscreteGpu({ model: 'Radeon 780M', vendor: 'AMD' })).toBe(false);
        expect(isDiscreteGpu({ model: 'AMD Radeon(TM) 610M', vendor: 'AMD' })).toBe(false);
    });

    test('flags Intel Arc dGPUs', () => {
        expect(isDiscreteGpu({ model: 'Intel Arc A770', vendor: 'Intel' })).toBe(true);
        expect(isDiscreteGpu({ model: 'Arc B580', vendor: 'Intel' })).toBe(true);
    });

    test('does NOT flag Intel iGPUs (Iris / UHD / HD)', () => {
        expect(isDiscreteGpu({ model: 'Intel Iris Xe Graphics', vendor: 'Intel' })).toBe(false);
        expect(isDiscreteGpu({ model: 'Intel UHD Graphics 770', vendor: 'Intel' })).toBe(false);
    });

    test('does NOT flag unknown / WDDM-fallback adapters (conservative)', () => {
        expect(isDiscreteGpu({ model: 'Microsoft Basic Render Driver', vendor: 'Microsoft' })).toBe(
            false
        );
        expect(isDiscreteGpu({ model: 'GPU A', vendor: 'Unknown' })).toBe(false);
    });
});
