/**
 * Domain store: rgb
 * RGB lighting settings (Phase 3)
 */
import { defineStore } from 'pinia';
import { ref } from 'vue';

export const useRgbStore = defineStore('rgb', () => {
    const rgb_show = ref(false);
    const background_rgb = ref(false);
    const sakura_rgb = ref(false);
    const particles_rgb = ref(false);
    const audiobar_rgb = ref(false);
    const rgb_refresh = ref(0);
    const opacity_sa_rgb = ref(1);
    const aurgbhigh = ref(1);
    const aurgbcolor = ref('255,255,255');
    const audiobar_rainbow_color = ref(false);
    const rainbow_move = ref(false);
    const rainbow_move_speed = ref(1);

    return {
        rgb_show, background_rgb, sakura_rgb, particles_rgb, audiobar_rgb,
        rgb_refresh, opacity_sa_rgb, aurgbhigh, aurgbcolor,
        audiobar_rainbow_color, rainbow_move, rainbow_move_speed,
    };
});
