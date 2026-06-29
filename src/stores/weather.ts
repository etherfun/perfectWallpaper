/**
 * Domain store: weather
 * Weather display settings (Phase 3)
 */
import { defineStore } from 'pinia';
import { ref } from 'vue';

export const useWeatherStore = defineStore('weather', () => {
    const weather_show = ref<boolean | undefined>(undefined);
    const weather_api_choose = ref<number | undefined>(undefined);
    const weather_updata = ref(3);
    const weather_city = ref<string | undefined>(undefined);
    const api_host = ref('');
    const city_key = ref('');
    const qweather_api_paymode = ref(false);
    const visual_crossing_key = ref('');
    const weather_app_id = ref('');
    const weather_app_secret = ref('');
    const weather_blurcolor = ref([255, 255, 255] as [number, number, number]);
    const weather_blurcolor_show = ref(false);
    const weather_bluryakeli = ref(10);
    const weather_city_text = ref('');
    const weather_color = ref([255, 255, 255] as [number, number, number]);
    const weather_daily_tip = ref(false);
    const weather_lang = ref('en');
    const weather_latitude = ref('');
    const weather_longitude = ref('');
    const weather_roundedcorners = ref(10);
    const weather_showwidth = ref(0);
    const weather_size = ref(100);
    const weather_timetransparency = ref(80);
    const weather_unit = ref('metric');
    const weather_x = ref(50);
    const weather_y = ref(50);
    const weather_yakeli = ref(0);
    const weather_yakeli_show = ref(false);
    const weather_yakelic_color = ref([255, 255, 255] as [number, number, number]);

    return {
        weather_show, weather_api_choose, weather_updata, weather_city,
        api_host, city_key, qweather_api_paymode, visual_crossing_key,
        weather_app_id, weather_app_secret,
        weather_blurcolor, weather_blurcolor_show, weather_bluryakeli,
        weather_city_text, weather_color, weather_daily_tip, weather_lang,
        weather_latitude, weather_longitude,
        weather_roundedcorners, weather_showwidth, weather_size,
        weather_timetransparency, weather_unit, weather_x, weather_y,
        weather_yakeli, weather_yakeli_show, weather_yakelic_color,
    };
});
