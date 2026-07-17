/**
 * Domain store: player
 * Player control settings (Phase 3)
 */
import { defineStore } from 'pinia';
import { ref } from 'vue';

export const usePlayerStore = defineStore('player', () => {
    const player_control_show = ref(false);
    const player_control_scalefactor = ref(1);
    const player_control_color = ref([255, 255, 255] as [number, number, number]);
    const player_control_blurcolor_show = ref(false);
    const player_control_blurcolor = ref([255, 255, 255] as [number, number, number]);
    const player_control_yakeli_show = ref(false);
    const player_control_yakelic_color = ref([255, 255, 255] as [number, number, number]);
    const player_control_yakeli = ref(0);
    const player_control_bluryakeli = ref(10);
    const player_control_thumbnail_size = ref(0);
    const player_control_size_value = ref(100);
    const player_control_thumbnail_size_value = ref(100);
    const player_control_thumbnail_rotation = ref(false);
    const player_control_thumbnail_rotation_speed = ref(5);
    const player_control_timetransparency = ref(1);
    const player_control_showwidth = ref(0);
    const player_control_yakelibgusetb = ref(1);
    const player_control_fontusetb = ref(5);
    const player_control_thumbnailrorl = ref(false);
    const player_control_samealbum_title = ref(false);
    const player_control_visualaudiobar = ref(0);
    const player_control_barline = ref(0);
    const color_pickup_method = ref(1);
    const player_control_hdong = ref(0.1);
    const player_control_roundedcorners = ref(0);
    const player_control_autohide = ref(true);
    const player_x = ref(50);
    const player_y = ref(50);

    return {
        player_control_show, player_control_scalefactor,
        player_control_color, player_control_blurcolor_show, player_control_blurcolor,
        player_control_yakeli_show, player_control_yakelic_color,
        player_control_yakeli, player_control_bluryakeli,
        player_control_thumbnail_size, player_control_size_value,
        player_control_thumbnail_size_value, player_control_thumbnail_rotation,
        player_control_thumbnail_rotation_speed, player_control_timetransparency,
        player_control_showwidth, player_control_yakelibgusetb, player_control_fontusetb,
        player_control_thumbnailrorl, player_control_samealbum_title,
        player_control_visualaudiobar, player_control_barline, color_pickup_method,
        player_control_hdong, player_control_roundedcorners,
        player_control_autohide, player_x, player_y,
    };
});
