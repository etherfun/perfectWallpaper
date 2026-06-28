export const backgroundDefaults = {
    background_route: './source/imgs/1.jpg',
    video_route: '',
    cusvideo_route: '',
    cusaudio_route: '',
    map_route: './source/map/1.png',

    video_model: 1,
    video_volume: 0.5,
    video_model_now: 1,
    select_video: '',

    galaxy_api: 1,
    chiyuanapi: 'https://t.alcy.cc/ycy/?json',

    bgy: '512px',
    bgx: '512px',
    bgs: '100%',
    bgxy: '512px 512px ',
    custom: '',
    customdirectory: '',

    frist_picturesinfo: true,
    pictures_info_show_ror_l: null as boolean | null,
    pictures_info_color: null as [number, number, number] | null,
    pictures_info_blurcolor_show: null as boolean | null,
    pictures_info_blurcolor: null as [number, number, number] | null,
    pictures_info_yakeli_show: null as boolean | null,
    pictures_info_yakeli: null as number | null,
    pictures_info_yakelic_color: null as [number, number, number] | null,
    pictures_info_bluryakeli: null as number | null,
    pictures_info_show: null as boolean | null,
    pictures_url: '',
    pictures_info_y: 50,
    pictures_info_x: 50,
    pictures_info_size: 30,
    pictures_info_timetransparency: 1,
    pictures_info_roundedcorners: 0,
    pictures_info_showaway: false,
    pictures_info_showwidth: 0,
    pictures_info_description: false,
};

export type BackgroundDefaults = typeof backgroundDefaults;
