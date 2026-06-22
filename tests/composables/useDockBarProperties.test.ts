// @vitest-environment jsdom
/**
 * Tests for src/composables/useDockBarProperties.ts — Stage 3-2
 *
 * Verifies dockbar property handler dispatches to dockbar.updateConfig()
 * and writes yakeli CSS variables to body.
 */
import { createPinia, setActivePinia } from 'pinia';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

import { debugLogger } from '@/utils/logger';

const { mockDockBar, mockInit } = vi.hoisted(() => {
    const mockUpdateConfig = vi.fn();
    const mockSetEnabled = vi.fn();
    const mockDockBar = { updateConfig: mockUpdateConfig, setEnabled: mockSetEnabled };
    return { mockDockBar, mockInit: vi.fn() };
});

vi.mock('@/dockbar', () => ({
    getDockBar: () => mockDockBar,
    initDockBar: () => mockInit(),
}));

vi.mock('@/utils/elementManager', () => ({
    elements: { body: document.body },
}));

import { useDockBarProperties } from '@/composables/useDockBarProperties';

beforeEach(() => {
    setActivePinia(createPinia());
    debugLogger.clearLogs();
    document.body.removeAttribute('style');
    mockDockBar.updateConfig.mockClear();
    mockDockBar.setEnabled.mockClear();
    mockInit.mockClear();
});

afterEach(() => {
    vi.restoreAllMocks();
});

describe('useDockBarProperties', () => {
    test('FirstLoad → initDockBar called', () => {
        useDockBarProperties({} as never, true);
        expect(mockInit).toHaveBeenCalledTimes(1);
    });

    test('enabled true → setEnabled(true)', () => {
        useDockBarProperties({ dockbar_enabled: { value: true } } as never, false);
        expect(mockDockBar.setEnabled).toHaveBeenCalledWith(true);
    });

    test('position 0..3 → bottom/top/left/right', () => {
        useDockBarProperties({ dockbar_position: { value: 1 } } as never, false);
        expect(mockDockBar.updateConfig).toHaveBeenCalledWith({ position: 'top' });
    });

    test('icon_size/spacing/roundedCorners → updateConfig patches', () => {
        useDockBarProperties(
            {
                dockbar_icon_size: { value: 48 },
                dockbar_spacing: { value: 12 },
                dockbar_roundedcorners: { value: 16 },
            } as never,
            false
        );
        expect(mockDockBar.updateConfig).toHaveBeenCalledWith({ iconSize: 48 });
        expect(mockDockBar.updateConfig).toHaveBeenCalledWith({ spacing: 12 });
        expect(mockDockBar.updateConfig).toHaveBeenCalledWith({ roundedCorners: 16 });
    });

    test('yakeli_show true → CSS var set', () => {
        useDockBarProperties({ dockbar_yakeli_show: { value: true } } as never, false);
        expect(document.body.style.getPropertyValue('--dockbar-yakeli-enabled')).toBe('1');
        expect(mockDockBar.updateConfig).toHaveBeenCalledWith({ yakeliEnabled: true });
    });

    test('yakeli /100 → CSS + updateConfig', () => {
        useDockBarProperties({ dockbar_yakeli: { value: 50 } } as never, false);
        expect(document.body.style.getPropertyValue('--dockbar-yakeli')).toBe('0.5');
        expect(mockDockBar.updateConfig).toHaveBeenCalledWith({ yakeliIntensity: 0.5 });
    });

    test('yakelicolor → R/G/B integer fields + CSS', () => {
        // Note: dockbar uses `c[0] || 255` pattern which substitutes 255
        // for any 0 channel, so we test with non-zero values.
        useDockBarProperties({ dockbar_yakelicolor: { value: '1 0.5 0.2' } } as never, false);
        expect(mockDockBar.updateConfig).toHaveBeenCalledWith({
            yakeliColorR: 255,
            yakeliColorG: 128,
            yakeliColorB: 51,
        });
        expect(document.body.style.getPropertyValue('--dockbar-yakeli-color')).toBe('255, 128, 51');
    });

    test('positionX/positionY → updateConfig', () => {
        useDockBarProperties(
            { dockbar_x: { value: 50 }, dockbar_y: { value: 80 } } as never,
            false
        );
        expect(mockDockBar.updateConfig).toHaveBeenCalledWith({ positionX: 50 });
        expect(mockDockBar.updateConfig).toHaveBeenCalledWith({ positionY: 80 });
    });

    test('show_add_btn → updateConfig', () => {
        useDockBarProperties(
            { dockbar_show_add_btn: { value: false } } as never,
            false
        );
        expect(mockDockBar.updateConfig).toHaveBeenCalledWith({ showAddButton: false });
    });

    test('logs init complete on FirstLoad', () => {
        useDockBarProperties({} as never, true);
        const matched = debugLogger.logs.find(
            l => l.message === '[DockBar] Dock栏参数初始化完成'
        );
        expect(matched).toBeDefined();
    });
});
