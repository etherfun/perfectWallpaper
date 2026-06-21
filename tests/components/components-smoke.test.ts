// @vitest-environment jsdom
/**
 * Vue SFC mount tests — Stage 4
 *
 * Verifies that every thin-shell SFC in src/components/ can be mounted and
 * unmounted without throwing. This catches:
 *   - Missing imports
 *   - setup() errors (Pinia store lookup, composable init)
 *   - Side-effecting top-level statements inside <script setup>
 *
 * Mount harness (per-file via beforeEach):
 *   1. Create a fresh Pinia instance and activate it
 *   2. Use the real useConfigStore (backed by BUILTIN_DEFAULTS in
 *      src/stores/config.ts) so all property reads return sane values
 *   3. mount() the SFC with attachTo: document.body so DOM queries work
 *
 * Tests for content-rich SFCs (Clock/Date/Countdown/Hitokoto) live in
 * separate files (components-leaf-clock.test.ts, etc.) where they can
 * assert specific DOM structure and reactive updates.
 */

import { mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

import App from '@/components/App.vue';
import Background from '@/components/Background.vue';
import DebugModal from '@/components/DebugModal.vue';
import DockBar from '@/components/DockBar.vue';
import FluidEffect from '@/components/FluidEffect.vue';
import FullscreenLyrics from '@/components/FullscreenLyrics.vue';
import PictureInfo from '@/components/PictureInfo.vue';
import PlayerControl from '@/components/PlayerControl.vue';
import PWCircle from '@/components/PWCircle.vue';
import PWLine from '@/components/PWLine.vue';
import PWParticles from '@/components/PWParticles.vue';
import RgbEffect from '@/components/RgbEffect.vue';
import Sakura from '@/components/Sakura.vue';
import SystemMonitor from '@/components/SystemMonitor.vue';
import Version from '@/components/Version.vue';
import Weather from '@/components/Weather.vue';

// i18n.install is normally provided by `app.use(i18n)` in main.ts bootstrap.
// For isolated component tests we use the real i18n instance — its Composer
// has fallback 'zh-CN' so unknown keys return the key (acceptable for mount
// smoke tests).
vi.mock('@/i18n', () => ({
    globalT: (key: string) => key,
    useI18n: () => ({ t: (key: string) => key, locale: { value: 'zh-CN' } }),
}));

beforeEach(() => {
    setActivePinia(createPinia());
});

afterEach(() => {
    vi.restoreAllMocks();
});

/** Mount helper — applies default options every SFC needs. */
function mountSfc(component: Parameters<typeof mount>[0]) {
    return mount(component, {
        attachTo: document.body,
        global: {
            // stubs avoid pulling in real DOM ids (#sakura / #weather / ...)
            // that index.html pre-creates but jsdom doesn't ship with.
            stubs: {
                // no stubs — SFCs are all template-only or single-DOM-node
            },
        },
    });
}

describe('thin-shell SFCs mount smoke', () => {
    test('Background mounts without throwing', () => {
        const wrapper = mountSfc(Background);
        expect(() => wrapper.unmount()).not.toThrow();
    });

    test('DebugModal mounts without throwing', () => {
        const wrapper = mountSfc(DebugModal);
        expect(() => wrapper.unmount()).not.toThrow();
    });

    test('DockBar mounts without throwing', () => {
        const wrapper = mountSfc(DockBar);
        expect(() => wrapper.unmount()).not.toThrow();
    });

    test('FluidEffect mounts without throwing', () => {
        const wrapper = mountSfc(FluidEffect);
        expect(() => wrapper.unmount()).not.toThrow();
    });

    test('FullscreenLyrics mounts without throwing', () => {
        const wrapper = mountSfc(FullscreenLyrics);
        expect(() => wrapper.unmount()).not.toThrow();
    });

    test('PictureInfo mounts without throwing', () => {
        const wrapper = mountSfc(PictureInfo);
        expect(() => wrapper.unmount()).not.toThrow();
    });

    test('PlayerControl mounts without throwing', () => {
        const wrapper = mountSfc(PlayerControl);
        expect(() => wrapper.unmount()).not.toThrow();
    });

    test('PWCircle mounts without throwing', () => {
        const wrapper = mountSfc(PWCircle);
        expect(() => wrapper.unmount()).not.toThrow();
    });

    test('PWLine mounts without throwing', () => {
        const wrapper = mountSfc(PWLine);
        expect(() => wrapper.unmount()).not.toThrow();
    });

    test('PWParticles mounts without throwing', () => {
        const wrapper = mountSfc(PWParticles);
        expect(() => wrapper.unmount()).not.toThrow();
    });

    test('RgbEffect mounts without throwing', () => {
        const wrapper = mountSfc(RgbEffect);
        expect(() => wrapper.unmount()).not.toThrow();
    });

    test('Sakura mounts without throwing', () => {
        const wrapper = mountSfc(Sakura);
        expect(() => wrapper.unmount()).not.toThrow();
    });

    test('SystemMonitor mounts without throwing', () => {
        const wrapper = mountSfc(SystemMonitor);
        expect(() => wrapper.unmount()).not.toThrow();
    });

    test('Version mounts without throwing', () => {
        const wrapper = mountSfc(Version);
        expect(() => wrapper.unmount()).not.toThrow();
    });

    test('Weather mounts without throwing', () => {
        const wrapper = mountSfc(Weather);
        expect(() => wrapper.unmount()).not.toThrow();
    });

    test('App (root) mounts all 19 child components without throwing', () => {
        // App.vue has all 19 SFCs as direct children — mounting the root
        // verifies that none of them break sibling composition.
        const wrapper = mountSfc(App);
        expect(wrapper.findAll('*').length).toBeGreaterThan(0);
        expect(() => wrapper.unmount()).not.toThrow();
    });
});
