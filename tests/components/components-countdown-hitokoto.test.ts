// @vitest-environment jsdom
/**
 * Content-bearing SFC mount tests 鈥?Stage 4 (Countdown / Hitokoto)
 *
 * Countdown: pure computed off (config.countdown_year/month/day, now).
 * Hitokoto:   fetches v1.hitokoto.cn on mount (network) 鈥?we stub global
 *             fetch with a small delay so we can also verify the default
 *             "鏈幏鍙? render before the fetch resolves.
 */

import { mount, flushPromises } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

import Countdown from '@/components/Countdown.vue';
import Hitokoto from '@/components/Hitokoto.vue';
import { useConfigStore } from '@/stores/config';
import { useRuntimeStore } from '@/stores/runtime';

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

describe('Countdown.vue', () => {
    test('mounts with #countdown root and renders default countdown text', () => {
        // Set future target so format is unambiguous: positive days
        const config = useConfigStore();
        const future = new Date();
        future.setFullYear(future.getFullYear() + 1);
        config.countdown_year = String(future.getFullYear());
        config.countdown_month = String(future.getMonth() + 1);
        config.countdown_day = String(future.getDate());
        config.countdown_txt = '';
        config.countdown_txt1 = '';
        const wrapper = mount(Countdown, { attachTo: document.body });
        const root = wrapper.find('#countdown');
        expect(root.exists()).toBe(true);
        const text = wrapper.find('.text').text();
        // Format: <prefix>D:H:M:S<suffix> 鈥?colon-separated, day is positive int
        expect(text).toMatch(/^\d+:\d{2}:\d{2}:\d{2}$/);
        expect(() => wrapper.unmount()).not.toThrow();
    });

    test('respects countdown_txt prefix and suffix', () => {
        const config = useConfigStore();
        config.countdown_txt = 'PRE-';
        config.countdown_txt1 = '-POST';
        const wrapper = mount(Countdown, { attachTo: document.body });
        const text = wrapper.find('.text').text();
        expect(text.startsWith('PRE-')).toBe(true);
        expect(text.endsWith('-POST')).toBe(true);
        expect(() => wrapper.unmount()).not.toThrow();
    });

    test('computes positive distance when target is in the future', () => {
        const config = useConfigStore();
        const future = new Date();
        future.setFullYear(future.getFullYear() + 1);
        config.countdown_year = String(future.getFullYear());
        config.countdown_month = String(future.getMonth() + 1);
        config.countdown_day = String(future.getDate());
        const wrapper = mount(Countdown, { attachTo: document.body });
        const text = wrapper.find('.text').text();
        // First field = days-1; for a year out should be a positive 2-3 digit number
        const m = text.match(/^(\S*?)(\d+):/);
        expect(m).not.toBeNull();
        expect(Number(m![2])).toBeGreaterThan(300);
        expect(() => wrapper.unmount()).not.toThrow();
    });
});

describe('Hitokoto.vue', () => {
    test('mounts with #hitokoto root and shows default 鏈幏鍙?text initially', () => {
        // Stub fetch so no network call happens
        vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('network blocked in test')));

        const wrapper = mount(Hitokoto, { attachTo: document.body });
        const root = wrapper.find('#hitokoto');
        expect(root.exists()).toBe(true);
        // Default rendered: template 1 = "<div class='text1'>{涓€瑷€}</div><div class='text2'>鈥斺€攞浣滆€厎{鍑哄}</div>"
        // 涓€瑷€ default = '鏈幏鍙? 鈫?text should contain 鏈幏鍙?
        const text = wrapper.find('.text').text();
        expect(text).toContain('鏈幏鍙?);
        expect(() => wrapper.unmount()).not.toThrow();
    });

    test('updates rendered text after setHitokoto() is called on runtime store', async () => {
        vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
            json: async () => ({
                hitokoto: '鎰夸綘閬嶅巻灞辨渤锛屼粛瑙変汉闂村€煎緱銆?,
                from: '鏈煡',
                from_who: '浣氬悕',
            }),
        }));

        const wrapper = mount(Hitokoto, { attachTo: document.body });
        const runtime = useRuntimeStore();
        runtime.setHitokoto('鎰夸綘閬嶅巻灞辨渤锛屼粛瑙変汉闂村€煎緱銆?, '鏈煡', '浣氬悕');
        await flushPromises();
        const text = wrapper.find('.text').text();
        expect(text).toContain('鎰夸綘閬嶅巻灞辨渤');
        expect(() => wrapper.unmount()).not.toThrow();
    });
});
