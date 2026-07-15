// @vitest-environment jsdom
/**
 * Tests for src/composables/useAudioVisualProperties.ts — Stage 3-3
 *
 * Covers the high-traffic pinia fields (pw_circle_*, pw_line_*, audio_*)
 * + the runtime param/visualizer passthroughs. Canvas-dependent paths
 * (color / lineWidth / globalAlpha) are skipped when ctx is null.
 */
import { createPinia, setActivePinia } from 'pinia';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

import { useConfigStore } from '@/stores/config';
import { debugLogger } from '@/utils/logger';

const { mockRuntime, mockAudioVisualizer } = vi.hoisted(() => {
    const mockAudioVisualizer = {
        set: vi.fn(),
    };
    const mockWallpaper = {
        getAudioVisualizer: vi.fn(() => mockAudioVisualizer),
    };
    const mockRuntime = {
        param: null as Record<string, unknown> | null,
        PWLineParam: null as Record<string, unknown> | null,
        wallpaper: mockWallpaper,
    };
    return { mockRuntime, mockAudioVisualizer };
});

vi.mock('@/utils/elementManager', () => ({ elements: { body: document.body } }));

vi.mock('@/utils/config', () => ({
    config: { runtime: mockRuntime },
}));

import { useAudioVisualProperties } from '@/modules/audio-visualizer/useAudioVisualProperties';

beforeEach(() => {
    setActivePinia(createPinia());
    debugLogger.clearLogs();
    mockAudioVisualizer.set.mockClear();
    mockRuntime.wallpaper.getAudioVisualizer.mockClear();
    mockRuntime.param = { showCircle: false, PolygonAngle: 0, Polygon: 0, rotationcopy: 0 };
    mockRuntime.PWLineParam = { showLine: false };
});

afterEach(() => {
    vi.restoreAllMocks();
});

describe('useAudioVisualProperties', () => {
    test('visual_audio_model 1 → param.showCircle = pw_circle_show_bool', () => {
        const store = useConfigStore();
        store.pw_circle_show_bool = true;
        useAudioVisualProperties({ visual_audio_model: { value: 1 } } as never, false);
        expect(store.visual_audio_model).toBe(1);
        expect(mockRuntime.param?.showCircle).toBe(true);
    });

    test('PWCircle_show_bool true → store.pw_circle_show_bool + param.showCircle when model=1', () => {
        const store = useConfigStore();
        store.visual_audio_model = 1;
        useAudioVisualProperties({ PWCircle_show_bool: { value: true } } as never, false);
        expect(store.pw_circle_show_bool).toBe(true);
        expect(mockRuntime.param?.showCircle).toBe(true);
    });

    test('style + radius + range → param + store', () => {
        const store = useConfigStore();
        useAudioVisualProperties(
            {
                style: { value: 3 },
                radius: { value: 60 },
                range: { value: 25 },
            } as never,
            false
        );
        expect(store.pw_circle_style).toBe(3);
        expect(store.pw_circle_radius).toBe(60);
        expect(store.pw_circle_range).toBe(25);
        expect(mockRuntime.param?.style).toBe(3);
    });

    test('rotation + showSemiCircle → rotationcopy bookkeeping', () => {
        const store = useConfigStore();
        mockRuntime.param = {
            showCircle: false,
            rotation: 0,
            rotationcopy: 0,
        };
        useAudioVisualProperties({ rotation: { value: 45 } } as never, false);
        expect(store.pw_circle_rotation).toBe(45);
        expect(mockRuntime.param?.rotation).toBe(45);
        expect(mockRuntime.param?.rotationcopy).toBe(45);
        useAudioVisualProperties({ showSemiCircle: { value: true } } as never, false);
        expect(mockRuntime.param?.rotation).toBe(0);
    });

    test('pw_line style/direction/spacing/density/range → PWLineParam + store', () => {
        const store = useConfigStore();
        useAudioVisualProperties(
            {
                PWLineStyle: { value: 2 },
                PWLineDirection: { value: 3 },
                PWLineSpacing: { value: 40 },
                PWLineDensity: { value: 50 },
                PWLineRange: { value: 30 },
            } as never,
            false
        );
        expect(store.pw_line_style).toBe(2);
        expect(store.pw_line_direction).toBe(3);
        expect(store.pw_line_spacing).toBe(40);
        expect(store.pw_line_density).toBe(50);
        expect(store.pw_line_range).toBe(30);
        expect(mockRuntime.PWLineParam?.style).toBe(2);
        expect(mockRuntime.PWLineParam?.sw).toBe(4);
    });

    test('audio_amplitude + audio_decline → wallpaper.getAudioVisualizer().set + store', () => {
        const store = useConfigStore();
        useAudioVisualProperties(
            {
                audio_amplitude: { value: 80 },
                audio_decline: { value: 40 },
            } as never,
            false
        );
        expect(store.audio_amplitude).toBe(80);
        expect(store.audio_decline).toBe(40);
        expect(mockAudioVisualizer.set).toHaveBeenCalledWith('amplitude', 80);
        expect(mockAudioVisualizer.set).toHaveBeenCalledWith('decline', 0.4);
    });

    test('audio isRing / isStaticRing / isInnerRing / isOuterRing → visualizer set', () => {
        const store = useConfigStore();
        useAudioVisualProperties(
            {
                audio_isRing: { value: true },
                audio_isStaticRing: { value: true },
                audio_isInnerRing: { value: true },
                audio_isOuterRing: { value: true },
            } as never,
            false
        );
        expect(store.audio_is_ring).toBe(true);
        expect(store.audio_is_static_ring).toBe(true);
        expect(store.audio_is_inner_ring).toBe(true);
        expect(store.audio_is_outer_ring).toBe(true);
        expect(mockAudioVisualizer.set).toHaveBeenCalledWith('isRing', true);
        expect(mockAudioVisualizer.set).toHaveBeenCalledWith('isStaticRing', true);
        expect(mockAudioVisualizer.set).toHaveBeenCalledWith('isInnerRing', true);
        expect(mockAudioVisualizer.set).toHaveBeenCalledWith('isOuterRing', true);
    });

    test('audio_radius / ringRotation / opacity / shadowBlur → visualizer set', () => {
        const store = useConfigStore();
        useAudioVisualProperties(
            {
                audio_radius: { value: 80 },
                audio_ringRotation: { value: 60 },
                audio_opacity: { value: 75 },
                audio_shadowBlur: { value: 100 },
            } as never,
            false
        );
        expect(store.audio_radius).toBe(80);
        expect(store.audio_ring_rotation).toBe(60);
        expect(store.audio_opacity).toBe(75);
        expect(store.audio_shadow_blur).toBe(100);
        expect(mockAudioVisualizer.set).toHaveBeenCalledWith('radius', 8);
        expect(mockAudioVisualizer.set).toHaveBeenCalledWith('ringRotation', 60);
        expect(mockAudioVisualizer.set).toHaveBeenCalledWith('opacity', 0.75);
        expect(mockAudioVisualizer.set).toHaveBeenCalledWith('shadowBlur', 100);
    });

    test('audio offsetX / offsetY / isClickOffset / isLineTo → visualizer set', () => {
        const store = useConfigStore();
        useAudioVisualProperties(
            {
                audio_offsetX: { value: 60 },
                audio_offsetY: { value: 40 },
                audio_isClickOffset: { value: true },
                audio_isLineTo: { value: true },
            } as never,
            false
        );
        expect(store.audio_offset_x).toBe(60);
        expect(store.audio_offset_y).toBe(40);
        expect(store.audio_is_click_offset).toBe(true);
        expect(store.audio_is_line_to).toBe(true);
        expect(mockAudioVisualizer.set).toHaveBeenCalledWith('offsetX', 0.6);
        expect(mockAudioVisualizer.set).toHaveBeenCalledWith('offsetY', 0.4);
        expect(mockAudioVisualizer.set).toHaveBeenCalledWith('isClickOffset', true);
        expect(mockAudioVisualizer.set).toHaveBeenCalledWith('isLineTo', true);
    });

    test('audio_pointNum / distance / lineWidth / isBall / ballSize → visualizer set', () => {
        const store = useConfigStore();
        useAudioVisualProperties(
            {
                audio_pointNum: { value: 60 },
                audio_distance: { value: 30 },
                audio_lineWidth: { value: 25 },
                audio_isBall: { value: true },
                audio_ballSize: { value: 70 },
            } as never,
            false
        );
        expect(store.audio_point_num).toBe(60);
        expect(store.audio_distance).toBe(30);
        expect(store.audio_line_width).toBe(25);
        expect(store.audio_is_ball).toBe(true);
        expect(store.audio_ball_size).toBe(70);
        expect(mockAudioVisualizer.set).toHaveBeenCalledWith('pointNum', 60);
        expect(mockAudioVisualizer.set).toHaveBeenCalledWith('distance', 30);
        expect(mockAudioVisualizer.set).toHaveBeenCalledWith('lineWidth', 25);
        expect(mockAudioVisualizer.set).toHaveBeenCalledWith('isBall', true);
        expect(mockAudioVisualizer.set).toHaveBeenCalledWith('ballSize', 70);
    });

    test('smoothing: audioSmoothEnabled / Factor / spatial window (odd enforced)', () => {
        const store = useConfigStore();
        useAudioVisualProperties(
            {
                audioSmoothEnabled: { value: false },
                audioSmoothFactor: { value: 30 },
                audioSpatialWindow: { value: 4 }, // even → +1
            } as never,
            false
        );
        expect(store.audio_smooth_enabled).toBe(false);
        expect(store.audio_smooth_factor).toBe(30);
        expect(store.audio_spatial_window).toBe(5);
        useAudioVisualProperties({ audioSpatialWindow: { value: 7 } } as never, false);
        expect(store.audio_spatial_window).toBe(7); // already odd
    });

    test('logs init complete on FirstLoad', () => {
        useAudioVisualProperties({} as never, true);
        const matched = debugLogger.logs.find(
            l => l.message === '[audioVisualizer] 可视化音频参数初始化完成'
        );
        expect(matched).toBeDefined();
    });
});
