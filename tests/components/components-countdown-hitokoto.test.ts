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

import Countdown from '@/modules/countdown/Countdown.vue';
import Hitokoto from '@/modules/hitokoto/Hitokoto.vue';
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
        // Default rendered: template 1 = "<div class='text1'>{一言}</div><div class='text2'>——{作者}{出处}</div>"
        // 一言 default = '未获取' → text should contain 未获取
        const text = wrapper.find('.text').text();
        expect(text).toContain('未获取');
        expect(() => wrapper.unmount()).not.toThrow();
    });

    test('updates rendered text after setHitokoto() is called on runtime store', async () => {
        vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
            json: async () => ({
                hitokoto: '愿你遍历山河，仍觉人间值得。',
                from: '未知',
                from_who: '佚名',
            }),
        }));

        const wrapper = mount(Hitokoto, { attachTo: document.body });
        const runtime = useRuntimeStore();
        runtime.setHitokoto('愿你遍历山河，仍觉人间值得。', '未知', '佚名');
        await flushPromises();
        const text = wrapper.find('.text').text();
        expect(text).toContain('愿你遍历山河');
        expect(() => wrapper.unmount()).not.toThrow();
    });
});
