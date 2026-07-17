/**
 * Wallpaper Properties 类型定义
 */

// 樱花配置
export interface SakuraConfig {
    showSakura: boolean;
    sakuratransparency: number;
    sakuraBackground: boolean;
    sakuraBackColor: boolean;
    sakuraReverse: boolean;
    sakuraPointNumber: number;
    sakuraBackLight: number;
}

// 音频可视化配置
export interface AudioVisualizerConfig {
    visual_audio_model: number;
    PWCircle_show_bool: boolean;
    PWLine_show_bool: boolean;
}

// PWCircle 配置
export interface AudioPoint {
    x: number;
    y: number;
}

export interface PWCircleConfig {
    style: number;
    r: number;
    color: string;
    blurColor: string;
    arr1: AudioPoint[];
    arr2: AudioPoint[];
    rotation: number;
    rotationcopy: number;
    offsetAngle: number;
    waveArr: number[];
    cX: number;
    cY: number;
    range: number;
    shadowBlur: number;
    lineWidth: number;
    showCircle: boolean;
    wavetransparency: number;
    showSemiCircle: boolean;
    SemiCircledirection: number;
    Polygon: number;
    SolidColorGradient: boolean;
    BlurColorGradient: boolean;
    ColorRhythm: boolean;
    ColorMode: number;
    TagNow: number;
    GradientRate: number;
}

// PWLine 配置
export interface PWLineConfig {
    style: number;
    sw: number;
    lineWidth: number;
    waveArr: number[];
    range: number;
    color: string;
    blurColor: string;
    shadowBlur: number;
    arr1: AudioPoint[];
    arr2: AudioPoint[];
    arr3: AudioPoint[];
    LineX: number;
    LineY: number;
    showLine: boolean;
    LinePosition: number;
    Direction: number;
    LineDensity: number;
    LineTransparency: number;
    MiddleLine: boolean;
    TagNow: number;
    SolidColorGradient: boolean;
    BlurColorGradient: boolean;
    ColorRhythm: boolean;
    ColorMode: number;
    GradientRate: number;
}

// 播放器控制配置
export interface PlayerControlConfig {
    player_control_autohide: boolean;
}

// API URLs 配置
export interface APIUrlsConfig {
    galaxyapi: number;
    chiyuanapi: string;
}

// 日期格式配置
export interface DateFormatConfig {
    yearFormat: number;
    monthFormat: number;
    dayFormat: number;
    weekFormat: number;
    separator: number;
    order: number;
}

// 音频配置
export interface AudioConfig {
    opacity: number;
    color: string;
    shadowColor: string;
    shadowBlur: number;
    offsetX: number;
    offsetY: number;
    isClickOffset: boolean;
}

// 时间位置配置
export interface TimePositionConfig {
    TimeX: number;
    TimeY: number;
}

// 幻灯片配置
export interface SlideConfig {
    SlideNow: boolean;
    wallpapermode: number;
    TransitionMode: number;
    TransitionMode_choose_0: number;
    TransitionMode_choose_1: number;
    TransitionMode_choose_4: string;
    random: boolean;
    speed: number;
    bgStyle: number;
}

// 天气配置
export interface WeatherConfig {
    weather_api_choose: string;
    citynumber: string;
    CityKey: string;
    APIHost: string;
    VisualCrossing_Key: string;
    weather_updata: number;
    appid: string;
    appsecret: string;
    weather_unit: string;
    weather_lang: string;
    qweatherapi_paymode: boolean;
}

// WallpaperProperties 接口 - 所有属性的类型定义
export interface WallpaperProperties {
    // 全局设置
    global_settings_language?: { value: string };
    wallpaper_updata?: { value: boolean };
    wallpaper_updata_open_on_update?: { value: boolean };
    debugger_copy?: { value: boolean };
    fontSetting?: { value: string };

    // 日期相关
    showDate?: { value: boolean };
    odate_roundedcorners?: { value: number };
    odate_color?: { value: string };
    odateColorhythm?: { value: boolean };
    odate_blurcolor_show?: { value: boolean };
    odate_blurcolor?: { value: string };
    odate_yakeli_show?: { value: boolean };
    odate_yakelicolor?: { value: string };
    odate_yakeli?: { value: number };
    odate_bluryakeli?: { value: number };
    DateX?: { value: number };
    DateY?: { value: number };
    DateSize?: { value: number };
    date_showwidth?: { value: number };
    date_transparency?: { value: number };
    date_separator?: { value: number };
    date_order?: { value: number };
    date_yearFormat?: { value: number };
    date_monthFormat?: { value: number };
    date_dayFormat?: { value: number };
    date_weekFormat?: { value: number };
    datetransparency?: { value: number };

    // 时间相关
    showTime?: { value: boolean };
    tShowSencends?: { value: boolean };
    tX?: { value: number };
    tY?: { value: number };
    TimeX?: { value: number };
    TimeY?: { value: number };
    tSize?: { value: number };
    oclock_roundedcorners?: { value: number };
    time_color_rhythm?: { value: boolean };
    TimeColor?: { value: string };
    TimeBlurColor?: { value: string };
    tStyle?: { value: boolean };
    timetransparency?: { value: number };
    oclock_blurcolor_show?: { value: boolean };
    oclock_blurcolor?: { value: string };
    oclock_yakeli_show?: { value: boolean };
    oclock_yakelicolor?: { value: string };
    oclock_yakeli?: { value: number };
    oclock_bluryakeli?: { value: number };

    // 樱花相关
    showSakura?: { value: boolean };
    sakuratransparency?: { value: number };
    sakurabackground?: { value: boolean };
    sakurabackcolor?: { value: boolean };
    sakurareverse?: { value: boolean };
    sakurapointnumber?: { value: number };
    sakurabacklight?: { value: number };

    // 音频可视化相关
    visual_audio_model?: { value: number };
    PWCircle_show_bool?: { value: boolean };
    PWLine_show_bool?: { value: boolean };

    // 播放器控制
    player_control_autohide?: { value: boolean };
    player_control_show?: { value: boolean };
    player_control_scalefactor?: { value: number };
    player_control_color?: { value: string };
    player_control_blurcolor_show?: { value: boolean };
    player_control_blurcolor?: { value: string };
    player_control_yakeli_show?: { value: boolean };
    player_control_yakelicolor?: { value: string };
    player_control_yakeli?: { value: number };
    player_control_bluryakeli?: { value: number };
    player_control_thumbnail_size?: { value: number };
    player_control_size?: { value: number };
    player_control_thumbnail_size_value?: { value: number };
    player_control_roundedcorners?: { value: number };
    player_control_thumbnail_rotation?: { value: boolean };
    player_control_thumbnail_rotation_speed?: { value: number };
    player_control_timetransparency?: { value: number };
    player_control_showwidth?: { value: number };
    player_control_yakelibgusetb?: { value: number };
    player_control_fontusetb?: { value: number };
    player_control_thumbnailrorl?: { value: boolean };
    player_control_showaway?: { value: boolean };
    player_control_samealbumtitle?: { value: boolean };
    player_control_visualaudiobar?: { value: number };
    player_control_barline?: { value: number };
    player_control_getcolor?: { value: number };
    player_control_hdong?: { value: number };
    playerx?: { value: number };
    playery?: { value: number };

    // 天气相关
    weather_api_choose?: { value: number };
    citynumber?: { value: string };
    CityKey?: { value: string };
    APIHost?: { value: string };
    VisualCrossing_Key?: { value: string };
    weather_updata?: { value: number };
    appid?: { value: string };
    appsecret?: { value: string };
    weather_unit?: { value: string };
    weather_lang?: { value: string };
    getcitykey_qweather?: { value: string };
    getAPIHOST_qweather?: { value: string };
    getcityappid_tianqiapi?: { value: string };
    getcityappsecret_tianqiapi?: { value: string };
    getcitykey_visualcrossing?: { value: string };

    // 一言相关
    hitokoto_updata?: { value: number };
    hitokoto_auth?: { value: boolean };
    hitokoto_a?: { value: boolean };
    hitokoto_b?: { value: boolean };
    hitokoto_c?: { value: boolean };
    hitokoto_d?: { value: boolean };
    hitokoto_e?: { value: boolean };
    hitokoto_f?: { value: boolean };
    hitokoto_g?: { value: boolean };
    hitokoto_h?: { value: boolean };
    hitokoto_i?: { value: boolean };
    hitokoto_j?: { value: boolean };
    hitokoto_k?: { value: boolean };
    hitokoto_l?: { value: boolean };
    hitokoto_show?: { value: boolean };
    hitokoto_timetransparency?: { value: number };
    hitokoto_roundedcorners?: { value: number };
    hitokoto_size?: { value: number };
    hitokoto_showwidth?: { value: number };
    hitokotoX?: { value: number };
    hitokotoY?: { value: number };

    // 一言颜色相关
    hitokoto_color?: { value: string };
    hitokoto_blurcolor_show?: { value: boolean };
    hitokoto_blurcolor?: { value: string };
    hitokoto_yakeli_show?: { value: boolean };
    hitokoto_yakeli?: { value: number };
    hitokoto_yakelicolor?: { value: string };
    hitokoto_bluryakeli?: { value: number };
    hitokoto_sizeX_show?: { value: boolean };

    // 天气显示相关
    weather_show?: { value: boolean };
    weather_daliy_tip?: { value: boolean };
    weather_lat_latitude?: { value: number };
    weather_lat_longitude?: { value: number };
    weather_CityText?: { value: string };
    freeapi?: { value: boolean };
    qweatherapi?: { value: boolean };
    qweatherapi_paymode?: { value: boolean };
    tianqiapi?: { value: boolean };
    visualcrossingapi?: { value: boolean };
    open_meteoapi?: { value: boolean };
    weather_Color?: { value: string };
    weather_blurcolor_show?: { value: boolean };
    weather_blurcolor?: { value: string };
    weather_yakeli_show?: { value: boolean };
    weather_yakeli?: { value: number };
    weather_yakelicolor?: { value: string };
    weather_bluryakeli?: { value: number };
    weather_timetransparency?: { value: number };
    weather_roundedcorners?: { value: number };
    weather_size?: { value: number };
    weather_showwidth?: { value: number };
    weatherX?: { value: number };
    weatherY?: { value: number };

    // 壁纸/背景相关
    image?: { value: string };
    galaxyapi?: { value: number };
    chiyuanapi?: { value: number };
    customdirectory?: { value: string };
    wallpapermode?: { value: number };
    TransitionMode?: { value: number };
    TransitionMode_choose_0?: { value: number };
    TransitionMode_choose_1?: { value: number };
    TransitionMode_choose_4?: { value: string };
    background_wallpapermode_9_URL?: { value: string };
    selectvideo?: { value: string };
    VideoVolume?: { value: number };
    random?: { value: boolean };
    imageswitchtimes?: { value: number | string };
    imageswitchtimeinput?: { value: string };
    bgy?: { value: number };
    bgx?: { value: number };
    bgs?: { value: number };
    imagedisplaystlye?: { value: number };
    selectmusic?: { value: string };
    musicdirectory?: { value: string };
    MuiscVolume?: { value: number };
    musicPlaylistRandom?: { value: boolean };
    musicPlaylistRepeat?: { value: number };

    // 图片信息相关
    picturesinfoY?: { value: number };
    picturesinfoX?: { value: number };
    picturesinfo_size?: { value: number };
    picturesinfo_show?: { value: boolean };
    picturesinfo_color?: { value: string };
    picturesinfo_blurcolor_show?: { value: boolean };
    picturesinfo_blurcolor?: { value: string };
    picturesinfo_yakeli_show?: { value: boolean };
    picturesinfo_yakelicolor?: { value: string };
    picturesinfo_yakeli?: { value: number };
    picturesinfo_bluryakeli?: { value: number };
    picturesinfo_timetransparency?: { value: number };
    picturesinfo_roundedcorners?: { value: number };
    picturesinfo_showaway?: { value: boolean };
    picturesinfo_showRorL?: { value: boolean };
    picturesinfo_showwidth?: { value: number };
    picturesinfo_description?: { value: boolean };
    pictures_URL?: { value: string };

    // 倒计时相关
    countdownY?: { value: number };
    countdownX?: { value: number };
    countdown_size?: { value: number };
    countdown_txt?: { value: string };
    countdown_txt1?: { value: string };
    countdown_show?: { value: boolean };
    countdown_showwidth?: { value: number };
    countdown_year?: { value: number };
    countdown_month?: { value: number };
    countdown_day?: { value: number };
    countdown_color?: { value: string };
    countdown_blurcolor_show?: { value: boolean };
    countdown_blurcolor?: { value: string };
    countdown_yakeli_show?: { value: boolean };
    countdown_yakelicolor?: { value: string };
    countdown_yakeli?: { value: number };
    countdown_bluryakeli?: { value: number };
    countdown_timetransparency?: { value: number };
    countdown_roundedcorners?: { value: number };

    // RGB灯光效果相关
    rgb_fps?: { value: number };
    rgb_show?: { value: boolean };
    rgb_bg?: { value: boolean };
    rgb_sa?: { value: boolean };
    rgb_pa?: { value: boolean };
    rgb_au?: { value: boolean };
    rgb_sa_op?: { value: number };
    rgb_au_high?: { value: number };
    rgb_au_color?: { value: string };
    rgb_color_rainbow?: { value: boolean };
    rgb_color_rainbow_move?: { value: boolean };
    rgb_color_rainbow_movespeed?: { value: number };

    // 粒子效果相关
    particles_isParticles?: { value: boolean };
    particles_number?: { value: number };
    particles_opacity?: { value: number };
    particles_opacityRandom?: { value: boolean };
    particles_color?: { value: string };
    particles_shadowColor?: { value: string };
    particles_shadowBlur?: { value: number };
    particles_image?: { value: string };
    particles_shapeType?: { value: number };
    particles_picdef?: { value: string };
    particles_sizeValue?: { value: number };
    particles_sizeRandom?: { value: boolean };
    particles_linkEnable?: { value: boolean };
    particles_linkDistance?: { value: number };
    particles_linkWidth?: { value: number };
    particles_linkColor?: { value: string };
    particles_linkOpacity?: { value: number };
    particles_isMove?: { value: boolean };
    particles_speed?: { value: number };
    particles_speedRandom?: { value: boolean };
    particles_direction?: { value: number };
    particles_isStraight?: { value: boolean };
    particles_isBounce?: { value: boolean };
    particles_moveOutMode?: { value: number };

    // 音频可视化圆圈参数
    PolygonAngle?: { value: number };
    style?: { value: number };
    radius?: { value: number };
    range?: { value: number };
    color?: { value: string };
    blurColor?: { value: string };
    cX?: { value: number };
    cY?: { value: number };
    ColorMode?: { value: number };
    SolidColorGradient?: { value: boolean };
    BlurColorGradient?: { value: boolean };
    ColorRhythm?: { value: boolean };
    GradientRate?: { value: number };
    lineWidth?: { value: number };
    rotation?: { value: number };
    direction?: { value: number };
    wavetransparency?: { value: number };
    showSemiCircle?: { value: boolean };
    SemiCircledirection?: { value: number };

    // PWLine参数
    PWLinePosition?: { value: number };
    PWLineStyle?: { value: number };
    PWLineDirection?: { value: number };
    PWLineWidth?: { value: number };
    PWLineSpacing?: { value: number };
    PWLineDensity?: { value: number };
    PWLineRange?: { value: number };
    PWLineTransparency?: { value: number };
    PWLineColor?: { value: string };
    PWLineBlurColor?: { value: string };
    PWLineX?: { value: number };
    PWLineY?: { value: number };
    PWMiddleLine?: { value: boolean };
    PWLineColorMode?: { value: number };
    PWLineSolidColorGradient?: { value: boolean };
    PWLineBlurColorGradient?: { value: boolean };
    PWLineColorRhythm?: { value: boolean };
    PWLineGradientRate?: { value: number };

    // 音频参数
    audio_amplitude?: { value: number };
    audio_decline?: { value: number };
    audio_isRing?: { value: boolean };
    audio_isStaticRing?: { value: boolean };
    audio_isInnerRing?: { value: boolean };
    audio_isOuterRing?: { value: boolean };
    audio_radius?: { value: number };
    audio_ringRotation?: { value: number };
    audio_opacity?: { value: number };
    audio_color?: { value: string };
    audio_shadowColor?: { value: string };
    audio_shadowBlur?: { value: number };
    audio_offsetX?: { value: number };
    audio_offsetY?: { value: number };
    audio_isClickOffset?: { value: boolean };
    audio_isLineTo?: { value: boolean };
    audio_firstPoint?: { value: number };
    audio_secondPoint?: { value: number };
    audio_pointNum?: { value: number };
    audio_distance?: { value: number };
    audio_lineWidth?: { value: number };
    audio_isBall?: { value: boolean };
    audio_ballSpacer?: { value: number };
    audio_ballSize?: { value: number };
    audio_ballRotation?: { value: number };

    // 音频平滑参数
    audioSmoothEnabled?: { value: boolean };
    audioSmoothFactor?: { value: number };
    audioSpatialWindow?: { value: number };

    // 流体效果参数
    fluidEffectEnabledFullscreen?: { value: boolean };
    fluidEffectEnabled?: { value: boolean };
    fluidEffectResolution?: { value: number };
    fluidEffectBlurAmount?: { value: number };
    fluidEffectDisplacementScale?: { value: number };
    fluidEffectTurbulenceOctaves?: { value: number };
    fluidEffectCanvasDisplacement?: { value: number };
    fluidEffect_DarkOverlayStrength?: { value: number };
    fluidEffect_backdropFilterStrength?: { value: number };

    // 全屏歌词参数
    fullscreen_lyrics_enabled?: { value: boolean };
    fullscreen_lyrics_show_translation?: { value: boolean };
    fullscreen_lyrics_show_roman?: { value: boolean };
    fullscreen_lyrics_delay?: { value: number };
    fullscreen_lyrics_enable_blur?: { value: boolean };
    fullscreen_lyrics_hide_other?: { value: boolean };
    fullscreen_lyrics_show_clock?: { value: boolean };

    // 系统监控参数
    sysmon_server_port?: { value: number };
    sysmon_auto_start?: { value: boolean };
    server_mode?: { value: boolean }; // 启用插件
    sysmon_update_interval?: { value: number };
    sysmon_cpu_mode?: { value: number };
    sysmon_gpu_mode?: { value: number };
    sysmon_memory_mode?: { value: number };
    sysmon_network_mode?: { value: number };
    sysmon_show_cpu?: { value: boolean };
    sysmon_show_gpu?: { value: boolean };
    sysmon_show_memory?: { value: boolean };
    sysmon_show_network?: { value: boolean };
    sysmon_x?: { value: number };
    sysmon_y?: { value: number };
    sysmon_size?: { value: number };
    sysmon_color?: { value: string };
    sysmon_enabled?: { value: boolean };
    sysmon_bar_layout?: { value: number };
    sysmon_position?: { value: number };
    sysmon_disconnect_timeout?: { value: number };
    sysmon_yakeli_show?: { value: boolean };
    sysmon_bluryakeli?: { value: number };
    sysmon_yakeli?: { value: number };
    sysmon_yakelicolor?: { value: string };
    sysmon_roundedcorners?: { value: number };
    sysmon_display_style?: { value: number };
    sysmon_show_disk?: { value: boolean };

    // Dock栏参数
    dockbar_enabled?: { value: boolean };
    dockbar_position?: { value: number };
    dockbar_icon_size?: { value: number };
    dockbar_spacing?: { value: number };
    dockbar_yakeli_show?: { value: boolean };
    dockbar_yakeli?: { value: number };
    dockbar_bluryakeli?: { value: number };
    dockbar_yakelicolor?: { value: string };
    dockbar_roundedcorners?: { value: number };
    dockbar_x?: { value: number };
    dockbar_y?: { value: number };
    dockbar_show_add_btn?: { value: boolean };
}
