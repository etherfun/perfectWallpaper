/**
 * Wallpaper Properties 类型定义 — 壁纸/背景/图片信息/倒计时/RGB/粒子
 *
 * 从 `src/types/types.ts` 拆出的 WallpaperProperties 声明片段（壁纸/背景/图片信息/倒计时/RGB/粒子），
 * 由 ./wallpaper-properties 交叉类型聚合，对外类型完全不变。
 */

// WallpaperProperties 接口 - 所有属性的类型定义
export interface WallpaperPropertiesMedia {
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
}
