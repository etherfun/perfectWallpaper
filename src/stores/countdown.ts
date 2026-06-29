/**
 * Domain store: countdown
 * Countdown settings (Phase 3)
 */
import { defineStore } from 'pinia';
import { ref } from 'vue';

export const useCountdownStore = defineStore('countdown', () => {
    const countdown_year = ref(new Date().getFullYear());
    const countdown_month = ref(new Date().getMonth() + 1);
    const countdown_day = ref(new Date().getDate());
    const countdown_color = ref([255, 255, 255] as [number, number, number]);
    const countdown_blurcolor_show = ref(false);
    const countdown_blurcolor = ref([255, 255, 255] as [number, number, number]);
    const countdown_yakeli_show = ref(false);
    const countdown_yakelic_color = ref([255, 255, 255] as [number, number, number]);
    const countdown_yakeli = ref(0); const countdown_bluryakeli = ref(10);
    const countdown_txt = ref(''); const countdown_txt1 = ref('');
    const first_load_countdown = ref(true);
    const countdown_y = ref(80); const countdown_x = ref(50); const countdown_size = ref(50);
    const countdown_show = ref(false); const countdown_timetransparency = ref(80);
    const countdown_roundedcorners = ref(0);

    return {
        countdown_year, countdown_month, countdown_day,
        countdown_color, countdown_blurcolor_show, countdown_blurcolor,
        countdown_yakeli_show, countdown_yakelic_color, countdown_yakeli, countdown_bluryakeli,
        countdown_txt, countdown_txt1, first_load_countdown,
        countdown_y, countdown_x, countdown_size, countdown_show,
        countdown_timetransparency, countdown_roundedcorners,
    };
});
