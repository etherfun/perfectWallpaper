/**
 * Pinia store: config
 *
 * 包覆原 `src/utils/config/index.ts` 的 `AppConfig` 单例，
 * 暴露 `config.xxx` 与 `config.runtime.xxx` 的字段。
 *
 * 三层回退（Phase 6 完整接入）：
 *   1. window.wallpaperPropertyListener.applyUserProperties  ← Wallpaper Engine
 *   2. localStorage.perfectwall_user_properties                ← 上次运行时持久化
 *   3. fetch('./project.json').general.properties[*].value    ← 项目内嵌默认值
 *   4. 本 store 初始 state                                       ← 兜底中的兜底
 *
 * Phase 1 仅启用第 4 层（内置 defaults），后续 Phase 接入其余层。
 */

import { defineStore } from 'pinia';

import { type ConfigStoreState } from './types';

/**
 * 内置默认值（兜底中的兜底）。
 * 当三层回退都拿不到值时（例如 project.json 加载失败且 WE 未注入），
 * 落到这些常量上。完整默认值清单见原 `src/utils/config/defaults/*.ts`，
 * 此处仅声明 Phase 1 涉及的字段。
 */
const BUILTIN_DEFAULTS: ConfigStoreState = {
    language: 'zh-CN',
    language_code: 'zh',
    font_setting: '',
    first_load: true,
    paused: false,
    date_init_complete: false,
    bg_init_complete: false,
    weather_init_complete: false,
    fluid_effect_init_complete: false,
    update_init_complete: false,

    time_transparency: 0.8,
    time_x: 50,
    time_y: 50,
    date_format: {
        year_format: 1,
        month_format: 1,
        day_format: 1,
        week_format: 1,
        separator: 1,
        order: 1,
    },
    date_format_test: 1,
    t_show_sencends: true,
    time_color_rhythm: false,
    time_color: 'rgb(255, 255, 255)',
    time_blur_color: '0 0 20px rgb(255, 255, 255)',
    show_time: true,
    time_style: true,
    t_size: 100,
    odate_roundedcorners: 0,
    oclock_roundedcorners: 0,
    date_color_rhythm: false,
    date_color: [255, 255, 255],
    date_transparency: 0.8,
    show_date: true,
    date_x: 50,
    date_y: 45,
    date_size: 100,
    date_showwidth: 0,
    odate_color: [255, 255, 255],
    odate_blurcolor_show: false,
    odate_blurcolor: [255, 255, 255],
    odate_yakeli_show: false,
    odate_yakelic_color: [255, 255, 255],
    odate_yakeli: 0,
    odate_bluryakeli: 10,
    oclock_color: [255, 255, 255],
    oclock_blurcolor_show: false,
    oclock_blurcolor: [255, 255, 255],
    oclock_yakeli_show: false,
    oclock_yakelic_color: [255, 255, 255],
    oclock_yakeli: 0,
    oclock_bluryakeli: 10,

    hitokoto_update: 6,
    hitokoto_init: false,
    hitokoto_format_test: 1,
    hitokoto_size_x_show: null,
    hitokoto_show: false,
    hitokoto_timetransparency: 100,
    hitokoto_roundedcorners: 0,
    hitokoto_size: 50,
    hitokoto_showwidth: 0,
    hitokoto_x: 50,
    hitokoto_y: 50,
    hit_a: '',
    hit_b: '',
    hit_c: '',
    hit_d: '',
    hit_e: '',
    hit_f: '',
    hit_g: '',
    hit_h: '',
    hit_i: '',
    hit_j: '',
    hit_k: '',
    hit_l: '',
    hitokoto_color: [255, 255, 255],
    hitokoto_blurcolor_show: false,
    hitokoto_blurcolor: [255, 255, 255],
    hitokoto_yakeli_show: false,
    hitokoto_yakelic_color: [255, 255, 255],
    hitokoto_yakeli: 0,
    hitokoto_bluryakeli: 10,

    countdown_year: new Date().getFullYear(),
    countdown_month: new Date().getMonth() + 1,
    countdown_day: new Date().getDate(),
    countdown_color: [255, 255, 255],
    countdown_blurcolor_show: false,
    countdown_blurcolor: [255, 255, 255],
    countdown_yakeli_show: false,
    countdown_yakelic_color: [255, 255, 255],
    countdown_yakeli: 0,
    countdown_bluryakeli: 10,
    countdown_txt: '',
    countdown_txt1: '',
    first_load_countdown: true,
    countdown_y: 80,
    countdown_x: 50,
    countdown_size: 50,
    countdown_show: false,
    countdown_timetransparency: 80,
    countdown_roundedcorners: 0,
};

export const useConfigStore = defineStore('config', {
    state: (): ConfigStoreState => ({
        ...BUILTIN_DEFAULTS,
    }),
    actions: {
        /**
         * 把 project.json 的 general.properties[*].value 合并进 state。
         * Phase 6 由 useProjectJsonDefaults composable 调用。
         */
        applyProjectJsonDefaults(values: Record<string, { value: unknown }>): void {
            let applied = 0;
            for (const [k, v] of Object.entries(values)) {
                if (k in this.$state && v && 'value' in v) {
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    (this as any).$patch({ [k]: (v as { value: unknown }).value });
                    applied += 1;
                }
            }
            console.log(`[Config] project.json defaults merged: ${applied} keys`);
        },
        /**
         * 把 WE 推送的 properties 合并进 state（高优先级）。
         * Phase 6 由 useWallpaperProperties composable 调用。
         */
        applyUserProperties(values: Record<string, { value: unknown }>): void {
            for (const [k, v] of Object.entries(values)) {
                if (k in this.$state && v && 'value' in v) {
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    (this as any).$patch({ [k]: (v as { value: unknown }).value });
                }
            }
        },
        /**
         * 把 localStorage 持久化的 properties 合并进 state（中优先级）。
         */
        applyStoredProperties(values: Record<string, { value: unknown }>): void {
            for (const [k, v] of Object.entries(values)) {
                if (k in this.$state && v && 'value' in v) {
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    (this as any).$patch({ [k]: (v as { value: unknown }).value });
                }
            }
        },
    },
});
