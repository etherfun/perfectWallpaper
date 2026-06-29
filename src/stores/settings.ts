/**
 * Domain store: settings
 * Core application settings (language, flags, misc) (Phase 3)
 */
import { defineStore } from 'pinia';
import { ref } from 'vue';

export const useSettingsStore = defineStore('settings', () => {
    const language = ref('zh-CN');
    const language_code = ref('zh');
    const font_setting = ref('');
    const first_load = ref(true);
    const paused = ref(false);
    const date_init_complete = ref(false);
    const bg_init_complete = ref(false);
    const weather_init_complete = ref(false);
    const fluid_effect_init_complete = ref(false);
    const particles_init_complete = ref(false);
    const update_init_complete = ref(false);
    const debugger_copy = ref(false);
    const wallpaper_updata_open_on_update = ref(false);

    return {
        language, language_code, font_setting,
        first_load, paused,
        date_init_complete, bg_init_complete, weather_init_complete,
        fluid_effect_init_complete, particles_init_complete, update_init_complete,
        debugger_copy, wallpaper_updata_open_on_update,
    };
});
