/**
 * Domain store: sakura
 * Sakura (cherry blossom) effect settings (Phase 3)
 */
import { defineStore } from 'pinia';
import { ref } from 'vue';

export const useSakuraStore = defineStore('sakura', () => {
    const showSakura = ref(true);
    const sakura_transparency = ref(0.15);
    const sakura_background = ref(true);
    const sakura_back_color = ref(true);
    const sakura_reverse = ref(false);
    const sakura_point_number = ref(300);
    const sakura_back_light = ref(0.01);

    return {
        showSakura, sakura_transparency, sakura_background, sakura_back_color,
        sakura_reverse, sakura_point_number, sakura_back_light,
    };
});
