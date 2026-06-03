export const coreDefaults = {
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
};

export type CoreDefaults = typeof coreDefaults;
