/**
 * Domain store: background
 * Background/wallpaper/slide/video settings (Phase 3)
 */
import { defineStore } from 'pinia';
import { ref } from 'vue';

export const useBackgroundStore = defineStore('background', () => {
    const wallpaper_mode = ref(1);
    const random = ref(0);
    const speed = ref(1);
    const slide_now = ref(false);
    const switch_interval_input = ref(60);
    const transition_mode = ref(1);
    const transition_mode_choose_0 = ref(false);
    const transition_mode_choose_1 = ref(false);
    const transition_mode_choose_4 = ref(false);
    const bg_style = ref(1);
    const bgx = ref('512px'); const bgy = ref('512px');
    const bgxy = ref('512px 512px '); const bgs = ref('100%');
    const custom = ref(''); const customdirectory = ref('');
    const galaxy_api = ref(1); const chiyuanapi = ref('https://t.alcy.cc/ycy/?json');
    const background_route = ref('./source/imgs/1.jpg');
    const pictures_url = ref('');
    const select_video = ref(''); const video_route = ref('');
    const video_model = ref(1); const video_model_now = ref(1);
    const video_volume = ref(0.5);
    const cusvideo_route = ref(''); const cusaudio_route = ref('');
    const selectmusic = ref(''); const musicdirectory = ref('');
    const music_model = ref(0); const music_volume = ref(0.5);
    const music_playlist = ref([] as string[]);
    const music_playlist_index = ref(0);
    const music_playlist_random = ref(false);
    const music_playlist_repeat = ref(0);
    const wallpaper_settings = ref({ ledPlugin: false, cuePlugin: false });

    // PictureInfo (slide picture overlay)
    const frist_picturesinfo = ref(true);
    const pictures_info_show = ref<boolean | null>(null as boolean | null);
    const pictures_info_color = ref<[number, number, number] | null>(null);
    const pictures_info_blurcolor_show = ref<boolean | null>(null);
    const pictures_info_blurcolor = ref<[number, number, number] | null>(null);
    const pictures_info_yakeli_show = ref<boolean | null>(null);
    const pictures_info_yakelic_color = ref<[number, number, number] | null>(null);
    const pictures_info_yakeli = ref<number | null>(null);
    const pictures_info_bluryakeli = ref<number | null>(null);
    const pictures_info_y = ref(50); const pictures_info_x = ref(50);
    const pictures_info_size = ref(30);
    const pictures_info_timetransparency = ref(1);
    const pictures_info_roundedcorners = ref(0);
    const pictures_info_showaway = ref(false);
    const pictures_info_showwidth = ref(0);
    const pictures_info_description = ref(false);
    const pictures_info_show_ror_l = ref<boolean | null>(null);

    return {
        wallpaper_mode, random, speed, slide_now,
        switch_interval_input, transition_mode,
        transition_mode_choose_0, transition_mode_choose_1, transition_mode_choose_4,
        bg_style, bgx, bgy, bgxy, bgs,
        custom, customdirectory, galaxy_api, chiyuanapi,
        background_route, pictures_url,
        select_video, video_route, video_model, video_model_now, video_volume,
        cusvideo_route, cusaudio_route,
        selectmusic, musicdirectory, music_model, music_volume,
        music_playlist, music_playlist_index, music_playlist_random, music_playlist_repeat,
        wallpaper_settings,
        frist_picturesinfo,
        pictures_info_show, pictures_info_color,
        pictures_info_blurcolor_show, pictures_info_blurcolor,
        pictures_info_yakeli_show, pictures_info_yakelic_color,
        pictures_info_yakeli, pictures_info_bluryakeli,
        pictures_info_y, pictures_info_x, pictures_info_size,
        pictures_info_timetransparency, pictures_info_roundedcorners,
        pictures_info_showaway, pictures_info_showwidth, pictures_info_description,
        pictures_info_show_ror_l,
    };
});
