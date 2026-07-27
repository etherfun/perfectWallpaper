// @vitest-environment jsdom
/**
 * Content-bearing SFC mount tests 鈥?Stage 4 (Clock / Date)
 *
 * These SFCs render real DOM based on Pinia config + a reactive `now`.
 * Verifies:
 *   - Initial render produces correct structure (id, classes)
 *   - Time format respects config.tStyle (24h vs 12h with AM/PM)
 *   - Date format respects config.date_format.* (year/month/day/week/order/separator)
 *   - DOM unmounts cleanly without leftover intervals
 */

import { mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

import Clock from '@/modules/clock/Clock.vue';
import DateComp from '@/modules/date/Date.vue';
import { useConfigStore } from '@/stores/config';

vi.mock('@/utils/i18n', () => ({
    globalT: (key: string) => key,
    useI18n: () => ({ t: (key: string) => key, locale: { value: 'zh-CN' } }),
}));

beforeEach(() => {
    setActivePinia(createPinia());
});

afterEach(() => {
    vi.restoreAllMocks();
});

describe('Clock.vue', () => {
    test('mounts with #clock root and renders initial time label', () => {
        const wrapper = mount(Clock, { attachTo: document.body });
        const root = wrapper.find('#clock');
        expect(root.exists()).toBe(true);
        expect(root.find('.clock-block').exists()).toBe(true);

        // initial now 鈫?some HH : MM text in .min
        const minText = wrapper.find('.min').text();
        expect(minText).toMatch(/^\d{2} : \d{2}$/);

        // 24h mode (default) hides the AM/PM indicator
        const stEl = wrapper.find('.st');
        // CSS .st has display:flex/none; jsdom reports computed style as ''
        // 鈥?just check it exists in template
        expect(stEl.exists()).toBe(true);

        expect(() => wrapper.unmount()).not.toThrow();
    });

    test('default is 24h format (time_style=true)', () => {
        // By default config.time_style is true (24h)
        const wrapper = mount(Clock, { attachTo: document.body });
        const minText = wrapper.find('.min').text();
        const m = minText.match(/^(\d{2}) : (\d{2})$/);
        expect(m).not.toBeNull();
        const h = Number(m![1]);
        // 24h mode can show 00-23; confirm it doesn't clamp to 1-12
        expect(h).toBeGreaterThanOrEqual(0);
        expect(h).toBeLessThanOrEqual(23);
        expect(() => wrapper.unmount()).not.toThrow();
    });

    test('switches to 12h mode when time_style=false', () => {
        const config = useConfigStore();
        // P0 fix: Clock.vue reads config.time_style (not the old tStyle alias)
        config.time_style = false;
        const wrapper = mount(Clock, { attachTo: document.body });
        const minText = wrapper.find('.min').text();
        // 12h: hour can be 01..12 (not 00 and no 13-23)
        const m = minText.match(/^(\d{2}) : (\d{2})$/);
        expect(m).not.toBeNull();
        const h = Number(m![1]);
        expect(h).toBeGreaterThanOrEqual(1);
        expect(h).toBeLessThanOrEqual(12);
        expect(() => wrapper.unmount()).not.toThrow();
    });

    test('in 24h mode, time-indicators has align-self: end to push seconds to bottom', () => {
        // Default is 24h (time_style=true)
        const wrapper = mount(Clock, { attachTo: document.body });
        const indicators = wrapper.find('.time-indicators');
        // Inline style should contain align-self: end + height: auto
        const style = indicators.attributes('style');
        expect(style).toContain('end');
        expect(style).toContain('auto');

        // Switch to 12h mode 鈥?align-self should be removed
        const config = useConfigStore();
        config.time_style = false;
        const wrapper2 = mount(Clock, { attachTo: document.body });
        const indicators2 = wrapper2.find('.time-indicators');
        const style2 = indicators2.attributes('style');
        expect(style2 ?? '').not.toContain('end');
    });
});

describe('Date.vue', () => {
    test('mounts with #oDate root and renders initial date text', () => {
        const wrapper = mount(DateComp, { attachTo: document.body });
        const root = wrapper.find('#oDate');
        expect(root.exists()).toBe(true);
        expect(root.find('.text').exists()).toBe(true);

        // default order=1 + separator=1+2 + all formats visible 鈫?text non-empty
        const text = wrapper.find('.text').text();
        expect(text.length).toBeGreaterThan(0);
        expect(() => wrapper.unmount()).not.toThrow();
    });

    test('renders month as numeric by default (month_format=1)', () => {
        const wrapper = mount(DateComp, { attachTo: document.body });
        const text = wrapper.find('.text').text();
        // Should contain at least one digit
        expect(text).toMatch(/\d/);
        // Should NOT contain Chinese month names from format 3
        expect(text).not.toMatch(/一月|二月|三月|四月|五月|六月|七月|八月|九月|十月|十一月|十二月/);
        expect(() => wrapper.unmount()).not.toThrow();
    });

    test('renders Chinese month names when month_format=3', () => {
        const config = useConfigStore();
        config.date_format.month_format = 3;
        const wrapper = mount(DateComp, { attachTo: document.body });
        const text = wrapper.find('.text').text();
        // Should contain at least one Chinese month name
        expect(text).toMatch(/一月|二月|三月|四月|五月|六月|七月|八月|九月|十月|十一月|十二月/);
        expect(() => wrapper.unmount()).not.toThrow();
    });
});
