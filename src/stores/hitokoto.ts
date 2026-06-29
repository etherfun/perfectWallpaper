/**
 * Domain store: hitokoto
 * Hitokoto (one-liner quote) settings (Phase 3)
 */
import { defineStore } from 'pinia';
import { ref } from 'vue';

export const useHitokotoStore = defineStore('hitokoto', () => {
    const hitokoto_update = ref(6);
    const hitokoto_init = ref(false);
    const hitokoto_format_test = ref(1);
    const hitokoto_size_x_show = ref<number | null>(null);
    const hitokoto_show = ref(false);
    const hitokoto_timetransparency = ref(100);
    const hitokoto_roundedcorners = ref(0);
    const hitokoto_size = ref(50);
    const hitokoto_showwidth = ref(0);
    const hitokoto_x = ref(50);
    const hitokoto_y = ref(50);
    const hit_a = ref(''); const hit_b = ref(''); const hit_c = ref('');
    const hit_d = ref(''); const hit_e = ref(''); const hit_f = ref('');
    const hit_g = ref(''); const hit_h = ref(''); const hit_i = ref('');
    const hit_j = ref(''); const hit_k = ref(''); const hit_l = ref('');
    const hitokoto_color = ref([255, 255, 255] as [number, number, number]);
    const hitokoto_blurcolor_show = ref(false);
    const hitokoto_blurcolor = ref([255, 255, 255] as [number, number, number]);
    const hitokoto_yakeli_show = ref(false);
    const hitokoto_yakelic_color = ref([255, 255, 255] as [number, number, number]);
    const hitokoto_yakeli = ref(0);
    const hitokoto_bluryakeli = ref(10);

    return {
        hitokoto_update, hitokoto_init, hitokoto_format_test,
        hitokoto_size_x_show, hitokoto_show,
        hitokoto_timetransparency, hitokoto_roundedcorners,
        hitokoto_size, hitokoto_showwidth, hitokoto_x, hitokoto_y,
        hit_a, hit_b, hit_c, hit_d, hit_e, hit_f, hit_g, hit_h, hit_i,
        hit_j, hit_k, hit_l,
        hitokoto_color, hitokoto_blurcolor_show, hitokoto_blurcolor,
        hitokoto_yakeli_show, hitokoto_yakelic_color, hitokoto_yakeli,
        hitokoto_bluryakeli,
    };
});
