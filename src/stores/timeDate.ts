/**
 * Domain store: timeDate
 * Time/date display settings (Phase 3)
 */
import { defineStore } from 'pinia';
import { ref } from 'vue';

export const useTimeDateStore = defineStore('timeDate', () => {
    const time_transparency = ref(0.8);
    const time_x = ref(50); const time_y = ref(50);
    const date_format = ref({ year_format: 1, month_format: 1, day_format: 1, week_format: 1, separator: 1, order: 1 });
    const date_format_test = ref(1);
    const t_show_sencends = ref(true); const time_color_rhythm = ref(false);
    const time_color = ref('rgb(255, 255, 255)'); const time_blur_color = ref('0 0 20px rgb(255, 255, 255)');
    const show_time = ref(true); const time_style = ref(true); const t_size = ref(100);
    const odate_roundedcorners = ref(0); const oclock_roundedcorners = ref(0);
    const date_color_rhythm = ref(false); const date_color = ref([255, 255, 255] as [number, number, number]);
    const date_transparency = ref(0.8); const show_date = ref(true);
    const date_x = ref(50); const date_y = ref(45); const date_size = ref(100); const date_showwidth = ref(0);
    const odate_color = ref([255, 255, 255] as [number, number, number]);
    const odate_blurcolor_show = ref(false); const odate_blurcolor = ref([255, 255, 255] as [number, number, number]);
    const odate_yakeli_show = ref(false); const odate_yakelic_color = ref([255, 255, 255] as [number, number, number]);
    const odate_yakeli = ref(0); const odate_bluryakeli = ref(10);
    const oclock_color = ref([255, 255, 255] as [number, number, number]);
    const oclock_blurcolor_show = ref(false); const oclock_blurcolor = ref([255, 255, 255] as [number, number, number]);
    const oclock_yakeli_show = ref(false); const oclock_yakelic_color = ref([255, 255, 255] as [number, number, number]);
    const oclock_yakeli = ref(0); const oclock_bluryakeli = ref(10);

    return {
        time_transparency, time_x, time_y, date_format, date_format_test,
        t_show_sencends, time_color_rhythm, time_color, time_blur_color,
        show_time, time_style, t_size, odate_roundedcorners, oclock_roundedcorners,
        date_color_rhythm, date_color, date_transparency, show_date,
        date_x, date_y, date_size, date_showwidth,
        odate_color, odate_blurcolor_show, odate_blurcolor,
        odate_yakeli_show, odate_yakelic_color, odate_yakeli, odate_bluryakeli,
        oclock_color, oclock_blurcolor_show, oclock_blurcolor,
        oclock_yakeli_show, oclock_yakelic_color, oclock_yakeli, oclock_bluryakeli,
    };
});
