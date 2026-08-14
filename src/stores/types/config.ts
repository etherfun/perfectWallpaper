/**
 * Pinia store 类型定义 — 配置状态
 *
 * 这是一个面向 Vue 3 重构期间使用的"超集"类型，覆盖了原 `AppConfig`
 * 暴露在 `config.xxx` 与 `config.runtime.xxx` 上的全部字段。
 * 重构期间保留旧字段名以减少 propertyHandlers 改写范围，
 * 长期目标是把每个字段搬到独立的 store（config/runtime/player）。
 */

export interface ConfigStoreState {
    // core
    language: string;
    language_code: string;
    font_setting: string;
    first_load: boolean;
    paused: boolean;
    date_init_complete: boolean;
    bg_init_complete: boolean;
    weather_init_complete: boolean;
    fluid_effect_init_complete: boolean;
    particles_init_complete: boolean;
    update_init_complete: boolean;

    // time/date
    time_transparency: number;
    time_x: number;
    time_y: number;
    date_format: {
        year_format: number;
        month_format: number;
        day_format: number;
        week_format: number;
        separator: number;
        order: number;
    };
    date_format_test: number;
    t_show_sencends: boolean;
    time_color_rhythm: boolean;
    time_color: string;
    time_blur_color: string;
    show_time: boolean;
    time_style: boolean;
    t_size: number;
    odate_roundedcorners: number;
    oclock_roundedcorners: number;
    date_color_rhythm: boolean;
    date_color: [number, number, number];
    date_transparency: number;
    show_date: boolean;
    date_x: number;
    date_y: number;
    date_size: number;
    date_showwidth: number;
    odate_color: [number, number, number];
    odate_blurcolor_show: boolean;
    odate_blurcolor: [number, number, number];
    odate_yakeli_show: boolean;
    odate_yakelic_color: [number, number, number];
    odate_yakeli: number;
    odate_bluryakeli: number;
    oclock_color: [number, number, number];
    oclock_blurcolor_show: boolean;
    oclock_blurcolor: [number, number, number];
    oclock_yakeli_show: boolean;
    oclock_yakelic_color: [number, number, number];
    oclock_yakeli: number;
    oclock_bluryakeli: number;

    // hitokoto
    hitokoto_update: number;
    hitokoto_init: boolean;
    hitokoto_format_test: number;
    hitokoto_size_x_show: number | null;
    hitokoto_show: boolean;
    hitokoto_timetransparency: number;
    hitokoto_roundedcorners: number;
    hitokoto_size: number;
    hitokoto_showwidth: number;
    hitokoto_x: number;
    hitokoto_y: number;
    hit_a: string;
    hit_b: string;
    hit_c: string;
    hit_d: string;
    hit_e: string;
    hit_f: string;
    hit_g: string;
    hit_h: string;
    hit_i: string;
    hit_j: string;
    hit_k: string;
    hit_l: string;
    hitokoto_color: [number, number, number];
    hitokoto_blurcolor_show: boolean;
    hitokoto_blurcolor: [number, number, number];
    hitokoto_yakeli_show: boolean;
    hitokoto_yakelic_color: [number, number, number];
    hitokoto_yakeli: number;
    hitokoto_bluryakeli: number;

    // countdown
    countdown_year: number;
    countdown_month: number;
    countdown_day: number;
    countdown_color: [number, number, number];
    countdown_blurcolor_show: boolean;
    countdown_blurcolor: [number, number, number];
    countdown_yakeli_show: boolean;
    countdown_yakelic_color: [number, number, number];
    countdown_yakeli: number;
    countdown_bluryakeli: number;
    countdown_txt: string;
    countdown_txt1: string;
    first_load_countdown: boolean;
    countdown_y: number;
    countdown_x: number;
    countdown_size: number;
    countdown_show: boolean;
    countdown_timetransparency: number;
    countdown_roundedcorners: number;
    /** 启用天气 */
    weather_show?: boolean;
    /** 天气 API 选择 (1-5) */
    weather_api_choose?: number;
    /** 天气更新间隔 (1-5) */
    weather_updata?: number;
    /** 天气城市名 */
    weather_city?: string;

    /** 启用系统监控 */
    sysmon_enabled?: boolean;
    /** sysmon 配置 port（与 server 通信） */
    sysmon_server_port?: number;
    /** sysmon 显示模式 (rows / cards) */
    sysmon_display_style?: number;
    /** sysmon 字体大小 */
    sysmon_size?: number;
    /** sysmon 颜色 */
    sysmon_color?: string;
    /** sysmon 更新间隔 (秒) */
    sysmon_update_interval?: number;

    /** 启用 Dock 栏 */
    dockbar_enabled?: boolean;
    /** Dock 栏位置 (0=bottom / 1=top / 2=left / 3=right) */
    dockbar_position?: number;
    /** Dock 栏图标大小 */
    dockbar_icon_size?: number;
    /** Dock 栏亚克力 */
    dockbar_yakeli_show?: boolean;

    /** 启用播放器控制 */
    player_control_show?: boolean;
    /** 播放器可视化音频条 */
    player_control_visualaudiobar?: number;
    /** 播放器封面旋转 */
    player_control_thumbnail_rotation?: boolean;
    /** 播放器缩略图大小 */
    player_control_thumbnail_size?: number;

    /** 显示图片信息（slide 模式） */
    picturesinfo_show?: boolean;
    /** 启用樱花 */
    showSakura?: boolean;
    /** PWCircle 显示 */
    PWCircle_show_bool?: boolean;
    /** PWLine 显示 */
    PWLine_show_bool?: boolean;
    /** 可视化音频模式 (0-4) */
    visual_audio_model?: number;
    /** RGB 灯光启用 */
    rgb_show?: boolean;
    /** 流体效果启用 */
    fluidEffectEnabled?: boolean;
    /** 调试日志启用 */
    debugger_copy?: boolean;
    /** 全屏歌词启用 */
    fullscreen_lyrics_enabled?: boolean;
    /** 全屏歌词显示翻译 */
    fullscreen_lyrics_show_translation?: boolean;
    /** 全屏歌词显示罗马音 */
    fullscreen_lyrics_show_roman?: boolean;
    /** 全屏歌词延迟 (秒) */
    fullscreen_lyrics_delay?: number;
    /** 全屏歌词启用模糊 */
    fullscreen_lyrics_enable_blur?: boolean;
    /** 全屏歌词隐藏其他元素 */
    fullscreen_lyrics_hide_other?: boolean;
    /** 全屏歌词显示时钟 */
    fullscreen_lyrics_show_clock?: boolean;
    /** 更新日志按钮 (点击打开) */
    wallpaper_updata?: boolean;
    /** 更新日志自动打开 */
    wallpaper_updata_open_on_update?: boolean;
    /** RGB 刷新间隔 (ms) */
    rgb_refresh?: number;
    /** RGB 背景 */
    background_rgb?: boolean;
    /** RGB 樱花 */
    sakura_rgb?: boolean;
    /** RGB 粒子 */
    particles_rgb?: boolean;
    /** RGB 音频条 */
    audiobar_rgb?: boolean;
    /** 樱花 RGB 不透明度 */
    opacity_sa_rgb?: number;
    /** RGB 音频条高度 */
    aurgbhigh?: number;
    /** RGB 音频条颜色 */
    aurgbcolor?: string;
    /** 彩虹颜色模式 */
    audiobar_rainbow_color?: boolean;
    /** 彩虹移动 */
    rainbow_move?: boolean;
    /** 彩虹移动速度 */
    rainbow_move_speed?: number;
    /** 樱花透明 */
    sakura_transparency?: number;
    /** 樱花背景 */
    sakura_background?: boolean;
    /** 樱花背景色 */
    sakura_back_color?: boolean;
    /** 樱花反转 */
    sakura_reverse?: boolean;
    /** 樱花点数 */
    sakura_point_number?: number;
    /** 樱花背光 */
    sakura_back_light?: number;
    /** 流体效果全屏启用 */
    fluid_effect_enabled_fullscreen?: boolean;
    /** 流体效果分辨率 */
    fluid_effect_resolution?: number;
    /** 流体效果模糊 */
    fluid_effect_blur_amount?: number;
    /** 流体效果置换图缩放 */
    fluid_effect_displacement_scale?: number;
    /** 流体效果湍流八度 */
    fluid_effect_turbulence_octaves?: number;
    /** 流体效果画布位移幅度 */
    fluid_effect_canvas_displacement?: number;
    /** 流体效果暗化 */
    fluid_effect_dark_overlay_strength?: number;
    /** 流体效果模糊背景 */
    fluid_effect_backdrop_filter_strength?: number;
    /** 壁纸模式 (1-9) */
    wallpapermode?: number;
    /** 随机播放 */
    random?: number;
    /** 切换时间 */
    imageswitchtimes?: number | string;
    /** 单图片文件 */
    image?: string;
    /** 自定义视频 */
    selectvideo?: string;
    /** 自定义目录 */
    customdirectory?: string;
    /** 背景图片显示风格 (1-6) */
    imagedisplaystlye?: number;

    // Weather 补强
    api_host?: string;
    city_key?: string;
    qweather_api_paymode?: boolean;
    visual_crossing_key?: string;
    weather_app_id?: string;
    weather_app_secret?: string;
    weather_blurcolor?: [number, number, number];
    weather_blurcolor_show?: boolean;
    weather_bluryakeli?: number;
    weather_city_text?: string;
    weather_color?: [number, number, number];
    weather_daily_tip?: boolean;
    weather_lang?: string;
    weather_latitude?: string;
    weather_longitude?: string;
    weather_roundedcorners?: number;
    weather_showwidth?: number;
    weather_size?: number;
    weather_timetransparency?: number;
    weather_unit?: string;
    weather_x?: number;
    weather_y?: number;
    weather_yakeli?: number;
    weather_yakeli_show?: boolean;
    weather_yakelic_color?: [number, number, number];

    // PlayerControl 补强
    color_pickup_method?: number;
    player_control_barline?: number;
    pictures_info_show?: boolean | null;
    pictures_info_y?: number;
    pictures_info_x?: number;
    pictures_info_size?: number;
    pictures_info_timetransparency?: number;
    pictures_info_roundedcorners?: number;
    pictures_info_showaway?: boolean;
    pictures_info_showwidth?: number;
    pictures_info_description?: boolean;
    pictures_info_color?: [number, number, number] | null;
    pictures_info_blurcolor_show?: boolean | null;
    pictures_info_blurcolor?: [number, number, number] | null;
    pictures_info_yakeli_show?: boolean | null;
    pictures_info_yakelic_color?: [number, number, number] | null;
    pictures_info_yakeli?: number | null;
    pictures_info_bluryakeli?: number | null;
    frist_picturesinfo?: boolean;
    pictures_info_show_ror_l?: boolean | null;
    player_control_blurcolor?: [number, number, number];
    player_control_blurcolor_show?: boolean;
    player_control_bluryakeli?: number;
    player_control_color?: [number, number, number];
    player_control_fontusetb?: number;
    player_control_hdong?: number;
    player_control_roundedcorners?: number;
    player_control_samealbum_title?: boolean; // preserved
    player_control_scalefactor?: number;
    player_control_showwidth?: number;
    player_control_size_value?: number;
    player_control_thumbnail_rotation_speed?: number;
    player_control_thumbnail_size_value?: number;
    player_control_thumbnailrorl?: boolean;
    player_control_timetransparency?: number;
    player_control_yakeli?: number;
    player_control_yakeli_show?: boolean;
    player_control_yakelibgusetb?: number;
    player_control_yakelic_color?: [number, number, number];
    playerx?: number;
    playery?: number;

    // Particle 补强
    map_route?: string;
    particles_color?: [number, number, number];
    particles_direction?: number;
    particles_image?: string;
    particles_is_bounce?: boolean;
    particles_is_move?: boolean;
    particles_is_particles?: boolean;
    particles_is_straight?: boolean;
    particles_link_color?: [number, number, number];
    particles_link_distance?: number;
    particles_link_enable?: boolean;
    particles_link_opacity?: number;
    particles_link_width?: number;
    particles_move_out_mode?: number;
    particles_number?: number;
    particles_opacity?: number;
    particles_opacity_random?: boolean;
    particles_shadow_blur?: number;
    particles_shadow_color?: [number, number, number];
    particles_shape_type?: number;
    particles_size_random?: boolean;
    particles_size_value?: number;
    particles_speed?: number;
    particles_speed_random?: boolean;

    // AudioVisual (partial — full pw_circle_*/pw_line_*/audio_* fields handled in Stage 3.5-B)
    audio_smooth_enabled?: boolean;
    audio_smooth_factor?: number;
    audio_spatial_window?: number;
    pw_circle_show_bool?: boolean;
    pw_line_show_bool?: boolean;
    polygon_angle?: number;
    pw_circle_style?: number;
    pw_circle_radius?: number;
    pw_circle_range?: number;
    pw_circle_color?: [number, number, number];
    pw_circle_blur_color?: [number, number, number];
    pw_circle_x?: number;
    pw_circle_y?: number;
    pw_circle_color_mode?: number;
    pw_circle_solid_color_gradient?: boolean;
    pw_circle_blur_color_gradient?: boolean;
    pw_circle_color_rhythm?: boolean;
    pw_circle_gradient_rate?: number;
    pw_circle_line_width?: number;
    pw_circle_rotation?: number;
    pw_circle_direction?: number;
    pw_circle_wavetransparency?: number;
    pw_circle_show_semi_circle?: boolean;
    pw_circle_semicircle_direction?: number;
    pw_line_position?: number;
    pw_line_style?: number;
    pw_line_direction?: number;
    pw_line_width?: number;
    pw_line_spacing?: number;
    pw_line_density?: number;
    pw_line_range?: number;
    pw_line_transparency?: number;
    pw_line_color?: [number, number, number];
    pw_line_blur_color?: [number, number, number];
    pw_line_x?: number;
    pw_line_y?: number;
    pw_line_middle_line?: boolean;
    pw_line_color_mode?: number;
    pw_line_solid_color_gradient?: boolean;
    pw_line_blur_color_gradient?: boolean;
    pw_line_color_rhythm?: boolean;
    pw_line_gradient_rate?: number;
    audio_amplitude?: number;
    audio_decline?: number;
    audio_is_ring?: boolean;
    audio_is_static_ring?: boolean;
    audio_is_inner_ring?: boolean;
    audio_is_outer_ring?: boolean;
    audio_radius?: number;
    audio_ring_rotation?: number;
    audio_opacity?: number;
    audio_color?: [number, number, number];
    audio_shadow_color?: [number, number, number];
    audio_shadow_blur?: number;
    audio_offset_x?: number;
    audio_offset_y?: number;
    audio_is_click_offset?: boolean;
    audio_is_line_to?: boolean;
    audio_first_point?: number;
    audio_second_point?: number;
    audio_point_num?: number;
    audio_distance?: number;
    audio_line_width?: number;
    audio_is_ball?: boolean;
    audio_ball_spacer?: number;
    audio_ball_size?: number;
    audio_ball_rotation?: number;

    // Shared flags (used by wallpaperPropertyListener + background + systemMonitor)
    server_mode?: boolean;

    // Background 补强（server_mode + bg_style 等未在前面定义）
    bg_style?: number;
    bgs?: string;
    bgx?: string;
    bgy?: string;
    chiyuanapi?: string;
    cusaudio_route?: string;
    custom?: string;
    cusvideo_route?: string;
    galaxy_api?: number;
    // 在 store 中读到 single-image mode (case 1) 的本地图片路径。
    background_route?: string;
    music_playlist_random?: boolean;
    music_playlist_repeat?: number;
    music_volume?: number;
    musicdirectory?: string;
    pictures_url?: string;
    select_video?: string;
    selectmusic?: string;
    /** 切图速度档位：数字档（0.5–5）或 'custom'（自定义秒数） */
    speed?: number | string;
    switch_interval_input?: number;
    transition_mode?: number;
    transition_mode_choose_0?: boolean;
    transition_mode_choose_1?: boolean;
    transition_mode_choose_4?: boolean;
    video_volume?: number;
    wallpaper_mode?: number;
    /** 幻灯片启用状态 */
    slide_now?: boolean;
    /** Wallpaper Engine 插件状态 */
    wallpaper_settings?: { ledPlugin: boolean; cuePlugin: boolean };
    /** 音频播放模式 */
    music_model?: number;
    /** 播放列表 */
    music_playlist?: string[];
    /** 播放列表当前索引 */
    music_playlist_index?: number;
    /** 切换下一张（rgb 默认值） */
    nextphoto?: boolean;
    /** 视频文件路径 */
    video_route?: string;
    /** 视频播放模式 */
    video_model?: number;
    /** 视频当前模式 */
    video_model_now?: number;
    /** 背景位置简写 (512px 512px) */
    bgxy?: string;
    /** 播放器自动隐藏 */
    player_control_autohide?: boolean;
    /** 播放器 X 坐标（独立于 playerx） */
    player_x?: number;
    /** 播放器 Y 坐标（独立于 playery） */
    player_y?: number;
}
