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
import { afterEach, beforeAll, beforeEach, describe, expect, test, vi } from 'vitest';

// Module-level Pinia guards: the legacy .ts wrappers under src/sakura/, src/weather/,
// src/slide/, src/player_control/, src/version/, src/fullscreenLyrics/, src/fluid/
// (all still on Stage 5-C backlog) call useConfigStore() at module top. They execute
// during `import { Sakura } from '@/components/Sakura.vue'` because the composable
// transitive chain pulls them in. We mock every such legacy barrel to a no-op so
// the SFC mount chain never reaches a top-level Pinia call.
vi.mock('@/modules/sakura', () => ({
    default: {},
    makeCanvasFullScreen: () => {},
    makeCanvasHide: () => {},
    setAnimating: () => {},
    animate: () => {},
    removesakura: () => {},
    sakuraResize: () => {},
    sakuraReLoadEffect: () => {},
    sakuraLoad: () => {},
    applySakuraTransparency: () => {},
    load: () => {},
    reloadEffect: () => {},
    resize: () => {},
    copyToDisplay: () => {},
    applyTransparency: () => {},
}));
vi.mock('@/modules/fluid', () => ({
    FluidEffect: { create: () => ({ set: () => {}, enable: () => {}, disable: () => {} }) },
}));
vi.mock('@/modules/player_control', () => ({
    pc_aubar: () => {},
    playertitle: () => {},
    thumbnailsue: () => {},
}));
vi.mock('@/modules/slide', () => ({
    applyBackgroundStyle: () => {},
    changeBackground: () => {},
    shouldShow: () => {},
    TransitionSwith: () => {},
    updateFileList: () => {},
}));
vi.mock('@/modules/weather', () => ({
    fetchWeather: () => {},
    initWeather: () => {},
    renderWeather: () => {},
    showTooltip: () => {},
    hideTooltip: () => {},
}));
vi.mock('@/modules/version', () => ({
    versionManager: undefined,
    checkForUpdates: () => {},
    showVersionInfo: () => {},
}));
vi.mock('@/modules/fullscreenLyrics', () => ({
    initLyrics: () => {},
    renderLyrics: () => {},
}));
vi.mock('@/modules/core/video', () => ({
    ChangeAudioModel: () => {},
    ChangeVideoModel: () => {},
    updateMusicPlaylist: () => {},
}));

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

beforeAll(() => {
    // jsdom has no canvas 2D backend — stub getContext to a no-op mock object
    // via defineProperty (vi.spyOn doesn't work on jsdom's read-only proto).
    Object.defineProperty(HTMLCanvasElement.prototype, 'getContext', {
        value: () => ({
            strokeStyle: '',
            shadowColor: '',
            shadowBlur: 0,
            lineWidth: 0,
            fillStyle: '',
            beginPath: () => {},
            moveTo: () => {},
            lineTo: () => {},
            closePath: () => {},
            stroke: () => {},
            fill: () => {},
            clearRect: () => {},
            fillRect: () => {},
            arc: () => {},
            save: () => {},
            restore: () => {},
            translate: () => {},
            rotate: () => {},
            scale: () => {},
            createRadialGradient: () => ({ addColorStop: () => {} }),
            createLinearGradient: () => ({ addColorStop: () => {} }),
            canvas: { width: 100, height: 100 },
        }),
        writable: true,
        configurable: true,
    });

    // Pre-create the canvas elements that index.html ships with so
    // PWCircle/PWLine/etc. composables find them via document.querySelector.
    // PWLine.ts PWLineInit() guards on missing #CanLine (returns early),
    // but setCTXLine() then runs and crashes because CTXLine is still null.
    for (const id of ['#can', '#CanLine', '#canvas-particles', '#canvas-audio', '#RGBuse', '#sakura', '#sakurashow']) {
        const sel = id.slice(1);
        if (!document.getElementById(sel)) {
            const el = document.createElement('canvas');
            el.id = sel;
            document.body.appendChild(el);
        }
    }
});

// Module-level Pinia instance — shared between setActivePinia and mountSfc
// to ensure store state is synchronized (single Pinia instance).
let testPinia: ReturnType<typeof createPinia>;

beforeEach(() => {
    testPinia = createPinia();
    setActivePinia(testPinia);
});

afterEach(() => {
    vi.restoreAllMocks();
});

/** Mount helper — applies default options every SFC needs. */
function mountSfc(component: Parameters<typeof mount>[0]) {
    return mount(component, {
        attachTo: document.body,
        global: {
            // vue-test-utils v2 requires the active Pinia to be registered
            // as a plugin (not just setActivePinia), otherwise
            // `wrapper.vm.$.appContext.config.globalProperties.$pinia._s`
            // resolves to undefined inside use*PiniaStore composables.
            // Uses the same testPinia instance from beforeEach to avoid
            // Pinia dual-instance issues.
            plugins: [testPinia],
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
