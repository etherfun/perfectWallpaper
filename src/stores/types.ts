/**
 * Pinia store 类型定义
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

    // propertyHandlers 通过 WE 推送的字段（phase 6 之后会迁移到独立 store）
    // 为兼容旧模块，仅声明本次涉及到的字段
    tStyle?: boolean;
    timetransparency?: number;
    datetransparency?: number;
    TimeColor?: string;
    showTime?: boolean;
    showDate?: boolean;
    tSize?: number;
    DateSize?: number;
    DateX?: number;
    DateY?: number;
    tX?: number;
    tY?: number;
    time_color_rhythm_alias?: boolean;
    odateColorhythm?: boolean;

    // ===== Phase 2 字段 (Weather/SystemMonitor/DockBar/PlayerControl/PictureInfo) =====
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
    player_control_visualaudiobar?: boolean;
    /** 播放器封面旋转 */
    player_control_thumbnail_rotation?: boolean;
    /** 播放器缩略图大小 */
    player_control_thumbnail_size?: boolean;

    /** 显示图片信息（slide 模式） */
    picturesinfo_show?: boolean;

    // ===== Phase 3 字段 (Sakura/PWCircle/PWLine/PWParticles/RGB/FluidEffect) =====
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

    // ===== Phase 4 字段 (Version/DebugModal/FullscreenLyrics) =====
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
    /** 更新日志自动打开 */
    wallpaper_updata_open_on_update?: boolean;

    // ===== Phase 3 字段补强 (FluidEffect / RGB / Sakura / Weather / Player / Audio) =====
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
    sakura_back_color?: string;
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

    // ===== Phase 5 字段 (Background/Slide/Video) =====
    /** 壁纸模式 (1-9) */
    wallpapermode?: number;
    /** 随机播放 */
    random?: boolean;
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
}

export interface HitokotoRuntime {
    hitokoto_text: string;
    from_text: string;
    from_who_text: string;
}

export interface RuntimeStoreState {
    hitokoto: HitokotoRuntime;
    // 其他 runtime 字段（playerInfo / param / PWLineParam / photo / files 等）
    // 在 Phase 2+ 实际用到时再补，保持本阶段 store 体积最小。
}
