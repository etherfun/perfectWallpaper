// @vitest-environment jsdom
/**
 * Tests for src/dockbar/configApply.ts
 *
 * Covers applyConfig and its 4 internal helpers:
 *   - applyPosition: 4 position variants (top/bottom/left/right) + transform
 *   - applyCssVariables: 7 CSS custom properties
 *   - applyBackgroundStyle: rgba color, backdrop-filter, border-radius calc
 *   - applyAddButtonVisibility: show/hide based on config flag
 */

import { beforeEach, describe, expect, test } from 'vitest';

import { applyConfig } from '@/modules/dockbar/configApply';
import { DEFAULT_CONFIG } from '@/modules/dockbar/constants';
import type { DockBarConfig } from '@/modules/dockbar/types';

function makeContainer(): HTMLElement {
    return document.createElement('div');
}

function makeBackground(): HTMLElement {
    return document.createElement('div');
}

function makeAddButton(): HTMLElement {
    return document.createElement('button');
}

describe('dockbar/configApply', () => {
    let container: HTMLElement;
    let background: HTMLElement;
    let addButton: HTMLElement;

    beforeEach(() => {
        container = makeContainer();
        background = makeBackground();
        addButton = makeAddButton();
        document.body.innerHTML = '';
    });

    describe('applyPosition', () => {
        test('top: sets style.top with positionY, transform translateX(-50%)', () => {
            const cfg: DockBarConfig = { ...DEFAULT_CONFIG, position: 'top', positionY: 25 };
            applyConfig(container, background, addButton, cfg);
            expect(container.style.top).toBe('25%');
            expect(container.style.bottom).toBe('auto');
            expect(container.style.transform).toBe('translateX(-50%)');
        });

        test('bottom: sets style.bottom with 100 - positionY', () => {
            const cfg: DockBarConfig = { ...DEFAULT_CONFIG, position: 'bottom', positionY: 80 };
            applyConfig(container, background, addButton, cfg);
            expect(container.style.top).toBe('auto');
            expect(container.style.bottom).toBe('20%'); // 100 - 80
            expect(container.style.transform).toBe('translateX(-50%)');
        });

        test('left: sets style.top with positionY, transform translateY(-50%)', () => {
            const cfg: DockBarConfig = { ...DEFAULT_CONFIG, position: 'left', positionY: 40 };
            applyConfig(container, background, addButton, cfg);
            expect(container.style.top).toBe('40%');
            expect(container.style.transform).toBe('translateY(-50%)');
        });

        test('right: sets style.top with positionY, transform translateY(-50%)', () => {
            const cfg: DockBarConfig = { ...DEFAULT_CONFIG, position: 'right', positionY: 60 };
            applyConfig(container, background, addButton, cfg);
            expect(container.style.top).toBe('60%');
            expect(container.style.transform).toBe('translateY(-50%)');
        });

        test('always sets style.left from positionX%', () => {
            const cfg: DockBarConfig = { ...DEFAULT_CONFIG, position: 'top', positionX: 33 };
            applyConfig(container, background, addButton, cfg);
            expect(container.style.left).toBe('33%');
            expect(container.style.right).toBe('auto');
        });
    });

    describe('applyCssVariables', () => {
        test('sets --dockbar-yakeli-enabled to "1" when enabled', () => {
            const cfg: DockBarConfig = { ...DEFAULT_CONFIG, yakeliEnabled: true };
            applyConfig(container, background, addButton, cfg);
            expect(document.body.style.getPropertyValue('--dockbar-yakeli-enabled')).toBe('1');
        });

        test('sets --dockbar-yakeli-enabled to "0" when disabled', () => {
            const cfg: DockBarConfig = { ...DEFAULT_CONFIG, yakeliEnabled: false };
            applyConfig(container, background, addButton, cfg);
            expect(document.body.style.getPropertyValue('--dockbar-yakeli-enabled')).toBe('0');
        });

        test('sets --dockbar-blur-yakeli with px unit', () => {
            const cfg: DockBarConfig = { ...DEFAULT_CONFIG, blurIntensity: 15 };
            applyConfig(container, background, addButton, cfg);
            expect(document.body.style.getPropertyValue('--dockbar-blur-yakeli')).toBe('15px');
        });

        test('sets --dockbar-yakeli-color as comma-separated rgb', () => {
            const cfg: DockBarConfig = {
                ...DEFAULT_CONFIG,
                yakeliColorR: 10,
                yakeliColorG: 20,
                yakeliColorB: 30,
            };
            applyConfig(container, background, addButton, cfg);
            expect(document.body.style.getPropertyValue('--dockbar-yakeli-color')).toBe(
                '10, 20, 30'
            );
        });

        test('sets --dockbar-icon-size with px unit', () => {
            const cfg: DockBarConfig = { ...DEFAULT_CONFIG, iconSize: 64 };
            applyConfig(container, background, addButton, cfg);
            expect(document.body.style.getPropertyValue('--dockbar-icon-size')).toBe('64px');
        });
    });

    describe('applyBackgroundStyle', () => {
        test('sets backgroundColor as rgba when yakeliEnabled', () => {
            const cfg: DockBarConfig = {
                ...DEFAULT_CONFIG,
                yakeliEnabled: true,
                yakeliIntensity: 0.6,
                yakeliColorR: 100,
                yakeliColorG: 100,
                yakeliColorB: 100,
            };
            applyConfig(container, background, addButton, cfg);
            expect(background.style.backgroundColor).toBe('rgba(100, 100, 100, 0.6)');
        });

        test('sets backgroundColor to alpha 0 when yakeli disabled', () => {
            const cfg: DockBarConfig = {
                ...DEFAULT_CONFIG,
                yakeliEnabled: false,
                yakeliIntensity: 0.5,
            };
            applyConfig(container, background, addButton, cfg);
            expect(background.style.backgroundColor).toBe('rgba(255, 255, 255, 0)');
        });

        test('sets backdrop-filter as blur when enabled, none when disabled', () => {
            const enabled: DockBarConfig = {
                ...DEFAULT_CONFIG,
                yakeliEnabled: true,
                blurIntensity: 8,
            };
            applyConfig(container, background, addButton, enabled);
            expect(background.style.backdropFilter).toBe('blur(8px)');

            const disabled: DockBarConfig = { ...DEFAULT_CONFIG, yakeliEnabled: false };
            applyConfig(container, background, addButton, disabled);
            expect(background.style.backdropFilter).toBe('none');
        });

        test('calculates border-radius as (iconSize/2) * (roundedCorners/100)', () => {
            const cfg: DockBarConfig = {
                ...DEFAULT_CONFIG,
                iconSize: 48,
                roundedCorners: 50,
            };
            applyConfig(container, background, addButton, cfg);
            // (48/2) * (50/100) = 24 * 0.5 = 12
            expect(background.style.borderRadius).toBe('12px');
        });
    });

    describe('applyAddButtonVisibility', () => {
        test('keeps add button visible (display: "") when showAddButton is true', () => {
            const cfg: DockBarConfig = { ...DEFAULT_CONFIG, showAddButton: true };
            applyConfig(container, background, addButton, cfg);
            expect(addButton.style.display).toBe('');
        });

        test('hides add button (display: "none") when showAddButton is false', () => {
            const cfg: DockBarConfig = { ...DEFAULT_CONFIG, showAddButton: false };
            applyConfig(container, background, addButton, cfg);
            expect(addButton.style.display).toBe('none');
        });

        test('skips add button manipulation when button is null', () => {
            const cfg: DockBarConfig = { ...DEFAULT_CONFIG, showAddButton: false };
            // Should not throw
            expect(() => applyConfig(container, background, null, cfg)).not.toThrow();
        });
    });
});
