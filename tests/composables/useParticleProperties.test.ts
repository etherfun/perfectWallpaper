// @vitest-environment jsdom
/**
 * Tests for src/composables/useParticleProperties.ts — Stage 3-3
 */
import { createPinia, setActivePinia } from 'pinia';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

import { useConfigStore } from '@/stores/config';
import { debugLogger } from '@/utils/logger';

const { mockWallpaper } = vi.hoisted(() => {
    const mockWallpaper = {
        particles: vi.fn(),
    };
    return { mockWallpaper };
});

vi.mock('@/utils/elementManager', () => ({ elements: { body: document.body } }));

vi.mock('@/stores/runtime', () => ({
    useRuntimeStore: () => ({
        wallpaper: mockWallpaper,
        playerInfo: { singtitle: '', playerState: null },
        param: {},
        PWLineParam: {},
    }),
}));

import { useParticleProperties } from '@/modules/audio-visualizer/useParticleProperties';

beforeEach(() => {
    setActivePinia(createPinia());
    debugLogger.clearLogs();
    mockWallpaper.particles.mockClear();
});

afterEach(() => {
    vi.restoreAllMocks();
});

describe('useParticleProperties', () => {
    test('particles_isParticles true → startParticles + store', () => {
        const store = useConfigStore();
        useParticleProperties({ particles_isParticles: { value: true } } as never, false);
        expect(mockWallpaper.particles).toHaveBeenCalledWith('startParticles');
        expect(store.particles_is_particles).toBe(true);
    });

    test('particles_isParticles false → clearCanvas + stopParticles', () => {
        const store = useConfigStore();
        useParticleProperties({ particles_isParticles: { value: false } } as never, false);
        expect(mockWallpaper.particles).toHaveBeenCalledWith('clearCanvas');
        expect(mockWallpaper.particles).toHaveBeenCalledWith('stopParticles');
        expect(store.particles_is_particles).toBe(false);
    });

    test('particles_number + addParticles', () => {
        const store = useConfigStore();
        useParticleProperties({ particles_number: { value: 200 } } as never, false);
        expect(mockWallpaper.particles).toHaveBeenCalledWith('addParticles', 200);
        expect(store.particles_number).toBe(200);
    });

    test('particles_opacity /100 → set + store', () => {
        const store = useConfigStore();
        useParticleProperties({ particles_opacity: { value: 75 } } as never, false);
        expect(mockWallpaper.particles).toHaveBeenCalledWith('set', 'opacity', 0.75);
        expect(store.particles_opacity).toBe(75);
    });

    test('particles_color splits "1 0 0" → [255,0,0] array + set', () => {
        const store = useConfigStore();
        useParticleProperties({ particles_color: { value: '1 0 0' } } as never, false);
        expect(store.particles_color).toEqual([255, 0, 0]);
        expect(mockWallpaper.particles).toHaveBeenCalledWith('set', 'color', [255, 0, 0]);
    });

    test('particles_picdef → map_route derived from value', () => {
        const store = useConfigStore();
        useParticleProperties({ particles_picdef: { value: 'snowflake' } } as never, false);
        expect(store.map_route).toBe('map/snowflake.png');
        expect(mockWallpaper.particles).toHaveBeenCalledWith(
            'particlesImage',
            'map/snowflake.png',
            'true'
        );
    });

    test('particles_shapeType 5 (image) + cusmapRoute → particlesImage', () => {
        const store = useConfigStore();
        useParticleProperties(
            {
                particles_image: { value: 'custom/leaf.png' },
                particles_shapeType: { value: 5 },
            } as never,
            false
        );
        expect(mockWallpaper.particles).toHaveBeenCalledWith(
            'particlesImage',
            'custom/leaf.png',
            'false'
        );
        expect(store.particles_shape_type).toBe(5);
    });

    test('particles_shapeType 5 (image) fallback → uses map_route from store', () => {
        const store = useConfigStore();
        store.map_route = 'map/default.png';
        useParticleProperties({ particles_shapeType: { value: 5 } } as never, false);
        expect(mockWallpaper.particles).toHaveBeenCalledWith(
            'particlesImage',
            'map/default.png',
            'true'
        );
    });

    test('particles_direction 1/2/3/4/5/6/7/8/9 → none/top/.../top-left', () => {
        useParticleProperties({ particles_direction: { value: 1 } } as never, false);
        expect(mockWallpaper.particles).toHaveBeenLastCalledWith('set', 'direction', 'none');
        useParticleProperties({ particles_direction: { value: 2 } } as never, false);
        expect(mockWallpaper.particles).toHaveBeenLastCalledWith('set', 'direction', 'top');
        useParticleProperties({ particles_direction: { value: 9 } } as never, false);
        expect(mockWallpaper.particles).toHaveBeenLastCalledWith('set', 'direction', 'top-left');
    });

    test('FirstLoad → particles_init_complete set + log', () => {
        const store = useConfigStore();
        useParticleProperties({} as never, true);
        expect(store.particles_init_complete).toBe(true);
        const matched = debugLogger.logs.find(
            l => l.message === '[Particles] 粒子效果参数初始化完成'
        );
        expect(matched).toBeDefined();
    });
});
