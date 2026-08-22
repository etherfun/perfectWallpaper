/**
 * Wallpaper Properties 类型定义 — 全局设置/日期/时间/樱花/音频可视化/
 * 播放器控制/天气/一言/一言颜色/天气显示
 *
 * 从 `src/types/types.ts` 拆出的 WallpaperProperties 声明片段（全局设置/日期/时间/樱花/
 * 音频可视化/播放器控制/天气/一言/一言颜色/天气显示），
 * 由 ./wallpaper-properties 交叉类型聚合，对外类型完全不变。
 */

// WallpaperProperties 接口 - 所有属性的类型定义
export interface WallpaperPropertiesGlobal {
    // 全局设置
    global_settings_language?: { value: string };
    wallpaper_updata?: { value: boolean };
    wallpaper_updata_open_on_update?: { value: boolean };
    debugger_copy?: { value: boolean };
    fontSetting?: { value: string };
    global_yakeli_enabled?: { value: boolean };
    global_yakelicolor?: { value: string };
    global_yakeli?: { value: number };
    global_bluryakeli?: { value: number };
    global_yakeli_roundedcorners?: { value: number };

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
    weather_hourly_enabled?: { value: boolean };
    weather_hourly_interval?: { value: number };
    weather_hourly_pop?: { value: boolean };
    weather_hourly_temp?: { value: boolean };
    weather_hourly_humidity?: { value: boolean };
    weather_hourly_windspeed?: { value: boolean };
    weather_hourly_pressure?: { value: boolean };
    weather_hourly_cloud?: { value: boolean };
    weather_hourly_precip?: { value: boolean };
    weather_hourly_dew?: { value: boolean };
    weather_hourly_windlv?: { value: boolean };
}
