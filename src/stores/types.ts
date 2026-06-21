/**
 * Pinia store 类型定义
 *
 * 这是一个面向 Vue 3 重构期间使用的"超集"类型，覆盖了原 `AppConfig`
 * 暴露在 `config.xxx` 与 `config.runtime.xxx` 上的全部字段。
 * 重构期间保留旧字段名以减少 propertyHandlers 改写范围，
 * 长期目标是把每个字段搬到独立的 store（config/runtime/player）。
 */

export interface ConfigStoreState {
    // core
    language: string;
    language_code: string;
    font_setting: string;
    first_load: boolean;
    paused: boolean;
    date_init_complete: boolean;
    bg_init_complete: boolean;
    weather_init_complete: boolean;
    fluid_effect_init_complete: boolean;
    update_init_complete: boolean;

    // time/date
    time_transparency: number;
    time_x: number;
    time_y: number;
    date_format: {
        year_format: number;
        month_format: number;
        day_format: number;
        week_format: number;
        separator: number;
        order: number;
    };
    date_format_test: number;
    t_show_sencends: boolean;
    time_color_rhythm: boolean;
    time_color: string;
    time_blur_color: string;
    show_time: boolean;
    time_style: boolean;
    t_size: number;
    odate_roundedcorners: number;
    oclock_roundedcorners: number;
    date_color_rhythm: boolean;
    date_color: [number, number, number];
    date_transparency: number;
    show_date: boolean;
    date_x: number;
    date_y: number;
    date_size: number;
    date_showwidth: number;
    odate_color: [number, number, number];
    odate_blurcolor_show: boolean;
    odate_blurcolor: [number, number, number];
    odate_yakeli_show: boolean;
    odate_yakelic_color: [number, number, number];
    odate_yakeli: number;
    odate_bluryakeli: number;
    oclock_color: [number, number, number];
    oclock_blurcolor_show: boolean;
    oclock_blurcolor: [number, number, number];
    oclock_yakeli_show: boolean;
    oclock_yakelic_color: [number, number, number];
    oclock_yakeli: number;
    oclock_bluryakeli: number;

    // hitokoto
    hitokoto_update: number;
    hitokoto_init: boolean;
    hitokoto_format_test: number;
    hitokoto_size_x_show: number | null;
    hitokoto_show: boolean;
    hitokoto_timetransparency: number;
    hitokoto_roundedcorners: number;
    hitokoto_size: number;
    hitokoto_showwidth: number;
    hitokoto_x: number;
    hitokoto_y: number;
    hit_a: string;
    hit_b: string;
    hit_c: string;
    hit_d: string;
    hit_e: string;
    hit_f: string;
    hit_g: string;
    hit_h: string;
    hit_i: string;
    hit_j: string;
    hit_k: string;
    hit_l: string;
    hitokoto_color: [number, number, number];
    hitokoto_blurcolor_show: boolean;
    hitokoto_blurcolor: [number, number, number];
    hitokoto_yakeli_show: boolean;
    hitokoto_yakelic_color: [number, number, number];
    hitokoto_yakeli: number;
    hitokoto_bluryakeli: number;

    // countdown
    countdown_year: number;
    countdown_month: number;
    countdown_day: number;
    countdown_color: [number, number, number];
    countdown_blurcolor_show: boolean;
    countdown_blurcolor: [number, number, number];
    countdown_yakeli_show: boolean;
    countdown_yakelic_color: [number, number, number];
    countdown_yakeli: number;
    countdown_bluryakeli: number;
    countdown_txt: string;
    countdown_txt1: string;
    first_load_countdown: boolean;
    countdown_y: number;
    countdown_x: number;
    countdown_size: number;
    countdown_show: boolean;
    countdown_timetransparency: number;
    countdown_roundedcorners: number;

    // propertyHandlers 通过 WE 推送的字段（phase 6 之后会迁移到独立 store）
    // 为兼容旧模块，仅声明本次涉及到的字段
    tStyle?: boolean;
    timetransparency?: number;
    datetransparency?: number;
    TimeColor?: string;
    showTime?: boolean;
    showDate?: boolean;
    tSize?: number;
    DateSize?: number;
    DateX?: number;
    DateY?: number;
    tX?: number;
    tY?: number;
    time_color_rhythm_alias?: boolean;
    odateColorhythm?: boolean;
}

export interface HitokotoRuntime {
    hitokoto_text: string;
    from_text: string;
    from_who_text: string;
}

export interface RuntimeStoreState {
    hitokoto: HitokotoRuntime;
    // 其他 runtime 字段（playerInfo / param / PWLineParam / photo / files 等）
    // 在 Phase 2+ 实际用到时再补，保持本阶段 store 体积最小。
}
