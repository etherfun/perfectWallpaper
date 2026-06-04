import { elements } from '@/utils/elementManager';

import { applyBackgroundStyle, changeBackground, shouldShow, TransitionSwith } from '../slide';
import { config } from '../utils/config';
import { debugLogger } from '../utils/logger';
import { timerManager } from '../utils/timer';
import { ChangeAudioModel, ChangeVideoModel, updateMusicPlaylist } from '../video';
import { logInitComplete } from './_helpers';
import { WallpaperProperties } from './types';

/**
 * 处理壁纸/背景相关属性
 * @param properties 属性对象
 * @param FirstLoad 是否首次加载
 */
export function handleBackgroundProperties(
    properties: WallpaperProperties,
    FirstLoad: boolean
): void {
    debugLogger.warn(
        `[handleBackgroundProperties] FirstLoad=${FirstLoad}, keys=${Object.keys(properties).join(', ')}`
    );
    // 自定义壁纸
    if (properties.image) {
        config.custom = properties.image.value;
        if (FirstLoad === false) {
            shouldShow();
        }
    }

    // 星河图片api选择
    if (properties.galaxyapi) {
        config.galaxy_api = properties.galaxyapi.value;
    }

    // 次元api
    if (properties.chiyuanapi) {
        const s = properties.chiyuanapi.value;
        let apiUrl = 'https://t.alcy.cc/ycy/?json';
        switch (s) {
            case 1:
                apiUrl = 'https://t.alcy.cc/ycy/?json';
                break;
            case 2:
                apiUrl = 'https://t.alcy.cc/moez/?json';
                break;
            case 3:
                apiUrl = 'https://t.alcy.cc/ai/?json';
                break;
            case 4:
                apiUrl = 'https://t.alcy.cc/ysz/?json';
                break;
            case 5:
                apiUrl = 'https://t.alcy.cc/fj/?json';
                break;
        }
        config.chiyuanapi = apiUrl;
        if (FirstLoad === false) {
            shouldShow();
        }
    }

    // 自定义目录
    if (properties.customdirectory) {
        debugLogger.warn(
            `[handleBackgroundProperties] customdirectory changed, FirstLoad=${FirstLoad}`
        );
        config.customdirectory = properties.customdirectory.value;
        timerManager.remove('backgroundChange');
        if (properties.customdirectory && FirstLoad === false) {
            changeBackground();
        }
    }

    // 监听幻灯开关变化
    if (properties.wallpapermode) {
        debugLogger.warn(
            `[handleBackgroundProperties] wallpapermode changed, FirstLoad=${FirstLoad}`
        );
        timerManager.remove('backgroundChange');
        config.wallpaper_mode = properties.wallpapermode.value;
        if (FirstLoad) {
            setTimeout(function () {
                changeBackground();
            }, 5000);
        } else {
            changeBackground();
        }
    }

    // 幻灯片特效 - 批量更新，只在最后调用一次 TransitionSwith
    let transitionModeChanged = false;

    if (properties.TransitionMode) {
        config.transition_mode = properties.TransitionMode.value;
        transitionModeChanged = true;
    }

    if (properties.TransitionMode_choose_0) {
        config.transition_mode_choose_0 = properties.TransitionMode_choose_0.value;
        transitionModeChanged = true;
    }

    if (properties.TransitionMode_choose_1) {
        config.transition_mode_choose_1 = properties.TransitionMode_choose_1.value;
        transitionModeChanged = true;
    }

    if (properties.TransitionMode_choose_4) {
        config.transition_mode_choose_4 = properties.TransitionMode_choose_4.value;
        transitionModeChanged = true;
    }

    // 统一调用一次 TransitionSwith
    if (transitionModeChanged) {
        TransitionSwith();
    }

    if (properties.background_wallpapermode_9_URL) {
        config.pictures_url = properties.background_wallpapermode_9_URL.value;
        if (config.wallpaper_mode == 9) {
            changeBackground();
        }
    }

    // 自定义视频
    if (properties.selectvideo) {
        config.select_video = properties.selectvideo.value;

        if (properties.selectvideo.value) {
            config.cusvideo_route = 'file:///' + properties.selectvideo.value;
        } else {
            config.cusvideo_route = '';
        }
        if (config.wallpaper_mode == 3) {
            ChangeVideoModel();
        }
    }

    // 音量
    if (properties.VideoVolume) {
        config.video_volume = properties.VideoVolume.value / 100;
        elements.myvideo.volume = config.video_volume;
    }

    // 自定义音乐
    if (properties.selectmusic) {
        config.selectmusic = properties.selectmusic.value;
        if (properties.selectmusic.value) {
            config.cusaudio_route = 'file:///' + properties.selectmusic.value;
        } else {
            config.cusaudio_route = '';
        }
        ChangeAudioModel();
    }

    // 音乐目录（播放列表）
    if (properties.musicdirectory && config.server_mode) {
        config.musicdirectory = properties.musicdirectory.value;
        // 通过服务器获取目录中的音频文件
        updateMusicPlaylist();
    }

    // 播放列表随机模式
    if (properties.musicPlaylistRandom) {
        config.music_playlist_random = properties.musicPlaylistRandom.value;
    }

    // 播放列表循环模式
    if (properties.musicPlaylistRepeat) {
        config.music_playlist_repeat = properties.musicPlaylistRepeat.value;
    }

    // 音量
    if (properties.MuiscVolume) {
        config.music_volume = properties.MuiscVolume.value / 100;
        elements.myAudio.volume = config.music_volume;
    }

    // 监听随机模式开关变化
    if (properties.random) {
        config.random = properties.random.value;
    }

    // 更改幻灯切换时间
    if (properties.imageswitchtimes) {
        config.speed = properties.imageswitchtimes.value;
        if (FirstLoad === false) {
            changeBackground();
        }
    }

    // 处理自定义切换时间输入
    if (properties.imageswitchtimeinput) {
        config.switch_interval_input = properties.imageswitchtimeinput.value;
        if (FirstLoad === false && String(config.speed) === 'custom') {
            changeBackground();
        }
    }

    // 自由变换
    if (properties.bgy) {
        const y = properties.bgy.value;
        config.bgy = (y - 50) * 2 + '%';
        applyBackgroundStyle();
    }

    if (properties.bgx) {
        const x = properties.bgx.value;
        config.bgx = (x - 50) * 2 + '%';
        applyBackgroundStyle();
    }

    if (properties.bgs) {
        config.bgs = properties.bgs.value + '%';
        applyBackgroundStyle();
    }

    // 更改背景展示样式
    if (properties.imagedisplaystlye) {
        config.bg_style = properties.imagedisplaystlye.value;
        applyBackgroundStyle();
    }

    // 图片信息Y轴位置
    if (properties.picturesinfoY) {
        const y = properties.picturesinfoY.value;
        config.pictures_info_y = y;
        elements.body.style.setProperty('--picture-info-top', `${y}%`);
    }

    // 图片信息X轴位置
    if (properties.picturesinfoX) {
        const x = properties.picturesinfoX.value;
        config.pictures_info_x = x;
        elements.body.style.setProperty('--picture-info-left', `${x}%`);
    }

    // 图片信息字体大小
    if (properties.picturesinfo_size) {
        const s = properties.picturesinfo_size.value;
        config.pictures_info_size = s;
        elements.body.style.setProperty(
            '--picture-info-font-size',
            Math.floor((window.innerHeight / 600) * s) + 'px'
        );
        elements.body.style.setProperty(
            '--picture-info-line-height',
            Math.floor((window.innerHeight / 1140) * s) + 'px'
        );
    }

    // 图片信息显示开关
    if (properties.picturesinfo_show) {
        const show = properties.picturesinfo_show.value;
        config.pictures_info_show = show;
        // 静默加载: FirstLoad 阶段不立即把 CSS 变量设为 flex/visible,
        // 保持 #picture_info 默认隐藏;真正的显示交给 picturesinfo_showrl()
        // 在 loader 拿到真实版权/标题数据后触发。后续 prop 变更正常应用。
        if (!FirstLoad) {
            elements.body.style.setProperty('--picture-info-display', show ? 'flex' : 'none');
            elements.body.style.setProperty(
                '--picture-info-visibility',
                show ? 'visible' : 'hidden'
            );
        }
    }

    // 图片信息文字颜色
    if (properties.picturesinfo_color) {
        const color = properties.picturesinfo_color.value
            .split(' ')
            .map((c: string) => Math.ceil(Number(c) * 255)) as [number, number, number];
        config.pictures_info_color = color;
        elements.body.style.setProperty('--picture-info-color', color.join(', '));
    }

    // 图片信息模糊背景开关
    if (properties.picturesinfo_blurcolor_show) {
        const show = properties.picturesinfo_blurcolor_show.value;
        config.pictures_info_blurcolor_show = show;
        elements.body.style.setProperty('--picture-info-blur-enabled', show ? '1' : '0');
    }

    // 图片信息模糊背景颜色
    if (properties.picturesinfo_blurcolor) {
        const color = properties.picturesinfo_blurcolor.value
            .split(' ')
            .map((c: string) => Math.ceil(Number(c) * 255)) as [number, number, number];
        config.pictures_info_blurcolor = color;
        elements.body.style.setProperty('--picture-info-blur-color', color.join(', '));
    }

    // 图片信息亚克力效果开关
    if (properties.picturesinfo_yakeli_show) {
        const show = properties.picturesinfo_yakeli_show.value;
        config.pictures_info_yakeli_show = show;
        elements.body.style.setProperty('--picture-info-yakeli-enabled', show ? '1' : '0');
    }

    // 图片信息亚克力效果颜色
    if (properties.picturesinfo_yakelicolor) {
        const color = properties.picturesinfo_yakelicolor.value
            .split(' ')
            .map((c: string) => Math.ceil(Number(c) * 255)) as [number, number, number];
        config.pictures_info_yakelic_color = color;
        elements.body.style.setProperty('--picture-info-yakeli-color', color.join(', '));
    }

    // 图片信息亚克力效果强度
    if (properties.picturesinfo_yakeli) {
        const yakeli = properties.picturesinfo_yakeli.value / 100;
        config.pictures_info_yakeli = yakeli;
        elements.body.style.setProperty('--picture-info-yakeli', String(yakeli));
    }

    // 图片信息模糊亚克力效果
    if (properties.picturesinfo_bluryakeli) {
        const blur = properties.picturesinfo_bluryakeli.value;
        config.pictures_info_bluryakeli = blur;
        elements.body.style.setProperty('--picture-info-blur-yakeli', `${blur}px`);
        config.frist_picturesinfo = false;
    }

    // 图片信息时间透明度
    if (properties.picturesinfo_timetransparency) {
        config.pictures_info_timetransparency = properties.picturesinfo_timetransparency.value;
        const t = properties.picturesinfo_timetransparency.value / 100;
        elements.body.style.setProperty('--picture-info-opacity', String(t));
    }

    // 图片信息圆角
    if (properties.picturesinfo_roundedcorners) {
        const roundedcorners = properties.picturesinfo_roundedcorners.value;
        config.pictures_info_roundedcorners = roundedcorners;
        elements.body.style.setProperty('--picture-info-roundedcorners', String(roundedcorners));

        const updateHeight = () => {
            const height = elements.slide.picture_info?.getBoundingClientRect().height;
            if (!height) return;
            elements.body.style.setProperty('--picture-info-height', height + 'px');
        };

        updateHeight();
        const observer = new ResizeObserver(updateHeight);
        observer.observe(elements.slide.picture_info);
    }

    // 图片信息划出动画方向
    if (properties.picturesinfo_showaway) {
        const showaway = properties.picturesinfo_showaway.value;
        config.pictures_info_showaway = showaway;
        elements.body.style.setProperty(
            '--picture-info-transform',
            showaway ? 'translate(-100%, 0)' : 'translate(0, 0)'
        );
    }

    // 图片信息文字对齐方向
    if (properties.picturesinfo_showRorL) {
        const rorL = properties.picturesinfo_showRorL.value;
        config.pictures_info_show_ror_l = rorL;
        elements.body.style.setProperty('--picture-info-text-align', rorL ? 'right' : 'left');
    }

    // 图片信息显示宽度
    if (properties.picturesinfo_showwidth) {
        const width = properties.picturesinfo_showwidth.value;
        config.pictures_info_showwidth = width;
        if (width === 0) {
            elements.body.style.setProperty('--picture-info-show-width', 'auto');
        } else {
            const s = width / 100;
            elements.body.style.setProperty(
                '--picture-info-show-width',
                window.innerWidth * s + 'px'
            );
        }
    }

    // 图片信息描述显示
    if (properties.picturesinfo_description) {
        const desc = properties.picturesinfo_description.value;
        config.pictures_info_description = desc;
        elements.body.style.setProperty(
            '--picture-info-description-display',
            desc ? 'block' : 'none'
        );
    }

    if (FirstLoad) {
        logInitComplete('[Background]', '壁纸', FirstLoad);
        config.bg_init_complete = true;
    }
}
