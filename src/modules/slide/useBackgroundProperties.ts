import { ChangeAudioModel, ChangeVideoModel, updateMusicPlaylist } from '@/modules/core/video';
import { applyBackgroundStyle, changeBackground, shouldShow, TransitionSwith } from '@/modules/slide';
import { useConfigStore } from '@/stores/config';
import { WallpaperProperties } from '@/types/types';
import { parseColorString } from '@/utils/color';
import { registerDeferred } from '@/utils/deferredScheduler';
import { setShowWidth, syncElementHeightToCssVar } from '@/utils/dom';
import { elements } from '@/utils/elementManager';
import { logInitComplete } from '@/utils/helpers';
import { debugLogger } from '@/utils/logger';
import { timerManager } from '@/utils/timer';

export function useBackgroundProperties(properties: WallpaperProperties, FirstLoad: boolean): void {
    debugLogger.warn(
        `[useBackgroundProperties] FirstLoad=${FirstLoad}, keys=${Object.keys(properties).join(', ')}`
    );
    const store = useConfigStore();
    const patch: Record<string, unknown> = {};

    if (properties.image) {
        patch.custom = properties.image.value;
        if (FirstLoad === false) {
            shouldShow();
        }
    }

    if (properties.galaxyapi) {
        patch.galaxy_api = properties.galaxyapi.value;
    }

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
        patch.chiyuanapi = apiUrl;
        if (FirstLoad === false) {
            shouldShow();
        }
    }

    if (properties.customdirectory) {
        debugLogger.warn(
            `[useBackgroundProperties] customdirectory changed, FirstLoad=${FirstLoad}`
        );
        patch.customdirectory = properties.customdirectory.value;
        timerManager.remove('backgroundChange');
        if (FirstLoad === false) {
            changeBackground();
        }
    }

    if (properties.wallpapermode) {
        debugLogger.warn(
            `[useBackgroundProperties] wallpapermode changed, FirstLoad=${FirstLoad}`
        );
        timerManager.remove('backgroundChange');
        patch.wallpaper_mode = properties.wallpapermode.value;
        // 绔嬪嵆鍚屾鍒?store锛屼繚璇?changeBackground() 璇诲埌鏈€鏂板€?
        store.$patch({ wallpaper_mode: properties.wallpapermode.value });
        if (FirstLoad) {
            setTimeout(function () {
                changeBackground();
            }, 5000);
        } else {
            changeBackground();
        }
    }

    let transitionModeChanged = false;

    if (properties.TransitionMode) {
        patch.transition_mode = properties.TransitionMode.value;
        transitionModeChanged = true;
    }

    if (properties.TransitionMode_choose_0) {
        patch.transition_mode_choose_0 = properties.TransitionMode_choose_0.value;
        transitionModeChanged = true;
    }

    if (properties.TransitionMode_choose_1) {
        patch.transition_mode_choose_1 = properties.TransitionMode_choose_1.value;
        transitionModeChanged = true;
    }

    if (properties.TransitionMode_choose_4) {
        patch.transition_mode_choose_4 = properties.TransitionMode_choose_4.value;
        transitionModeChanged = true;
    }

    if (Object.keys(patch).length > 0) {
        store.$patch(patch);
    }

    if (transitionModeChanged) {
        TransitionSwith();
    }

    if (properties.background_wallpapermode_9_URL) {
        patch.pictures_url = properties.background_wallpapermode_9_URL.value;
        if (store.wallpaper_mode === 9) {
            changeBackground();
        }
    }

    if (properties.selectvideo) {
        patch.select_video = properties.selectvideo.value;
        if (properties.selectvideo.value) {
            patch.cusvideo_route = 'file:///' + properties.selectvideo.value;
        } else {
            patch.cusvideo_route = '';
        }
        if (store.wallpaper_mode === 3) {
            ChangeVideoModel();
        }
    }

    if (properties.VideoVolume) {
        patch.video_volume = properties.VideoVolume.value / 100;
        if (elements.myvideo) {
            elements.myvideo.volume = properties.VideoVolume.value / 100;
        }
    }

    if (properties.selectmusic) {
        patch.selectmusic = properties.selectmusic.value;
        if (properties.selectmusic.value) {
            patch.cusaudio_route = 'file:///' + properties.selectmusic.value;
        } else {
            patch.cusaudio_route = '';
        }
        ChangeAudioModel();
    }

    if (properties.musicdirectory && store.server_mode === true) {
        patch.musicdirectory = properties.musicdirectory.value;
        updateMusicPlaylist();
    }

    if (properties.musicPlaylistRandom) {
        patch.music_playlist_random = properties.musicPlaylistRandom.value;
    }

    if (properties.musicPlaylistRepeat) {
        patch.music_playlist_repeat = properties.musicPlaylistRepeat.value;
    }

    if (properties.MuiscVolume) {
        patch.music_volume = properties.MuiscVolume.value / 100;
        if (elements.myAudio) {
            elements.myAudio.volume = properties.MuiscVolume.value / 100;
        }
    }

    if (properties.random) {
        patch.random = properties.random.value;
    }

    if (properties.imageswitchtimes) {
        // 淇濈暀鍘熷绫诲瀷锛?.5鈥? 涓?number锛?custom' 涓?string
        const speedVal = properties.imageswitchtimes.value;
        patch.speed = speedVal;
        // 绔嬪嵆鍚屾鍒?store锛屼繚璇?changeBackground() / getSwitchInterval() 璇诲埌鏈€鏂板€?
        store.$patch({ speed: speedVal });
        if (FirstLoad === false) {
            // reseat 瀹氭椂鍣紙changeBackground 鍐呴儴浼氱敤鏂伴鐜囬噸鏂?create timer锛?
            changeBackground();
        }
    }

    if (properties.imageswitchtimeinput) {
        const intervalVal = Number(properties.imageswitchtimeinput.value);
        patch.switch_interval_input = intervalVal;
        store.$patch({ switch_interval_input: intervalVal });
        // store.speed 宸插湪涓婁竴姝ョ珛鍗冲悓姝ワ紝姝ゅ璇诲埌鐨勬槸鏈€鏂板€?
        if (FirstLoad === false && String(store.speed) === 'custom') {
            changeBackground();
        }
    }

    if (properties.bgy) {
        const y = properties.bgy.value;
        patch.bgy = (y - 50) * 2 + '%';
        store.$patch({ bgy: (y - 50) * 2 + '%' });
        applyBackgroundStyle();
    }

    if (properties.bgx) {
        const x = properties.bgx.value;
        patch.bgx = (x - 50) * 2 + '%';
        store.$patch({ bgx: (x - 50) * 2 + '%' });
        applyBackgroundStyle();
    }

    if (properties.bgs) {
        const bgsVal = properties.bgs.value + '%';
        patch.bgs = bgsVal;
        store.$patch({ bgs: bgsVal });
        applyBackgroundStyle();
    }

    if (properties.imagedisplaystlye) {
        patch.bg_style = properties.imagedisplaystlye.value;
        // 绔嬪嵆鍚屾鍒?store锛屼繚璇?applyBackgroundStyle() 璇诲埌鏈€鏂板€?
        store.$patch({ bg_style: properties.imagedisplaystlye.value });
        applyBackgroundStyle();
    }

    if (properties.picturesinfoY) {
        const y = properties.picturesinfoY.value;
        patch.pictures_info_y = y;
        elements.body.style.setProperty('--picture-info-top', `${y}%`);
    }

    if (properties.picturesinfoX) {
        const x = properties.picturesinfoX.value;
        patch.pictures_info_x = x;
        elements.body.style.setProperty('--picture-info-left', `${x}%`);
    }

    if (properties.picturesinfo_size) {
        const s = properties.picturesinfo_size.value;
        patch.pictures_info_size = s;
        elements.body.style.setProperty(
            '--picture-info-font-size',
            Math.floor((window.innerHeight / 600) * s) + 'px'
        );
        elements.body.style.setProperty(
            '--picture-info-line-height',
            Math.floor((window.innerHeight / 1140) * s) + 'px'
        );
    }

    if (properties.picturesinfo_show) {
        const show = properties.picturesinfo_show.value;
        patch.pictures_info_show = show;
        if (!FirstLoad) {
            elements.body.style.setProperty('--picture-info-display', show ? 'flex' : 'none');
            elements.body.style.setProperty(
                '--picture-info-visibility',
                show ? 'visible' : 'hidden'
            );
            // 清除 info.ts (picturesinfo_showrl / clearpicturesinfo) 设置的
            // 内联 style.display / style.visibility，让 CSS 变量接管控制权。
            // 内联样式优先级高于 var(--picture-info-display)，
            // 会导致关闭 pictures_info_show 开关后图片信息仍然可见。
            const picInfoEl = elements.slide?.picture_info;
            if (picInfoEl) {
                picInfoEl.style.display = '';
                picInfoEl.style.visibility = '';
            }
        }
    }

    if (properties.picturesinfo_color) {
        const color = parseColorString(properties.picturesinfo_color.value) as [number, number, number];
        patch.pictures_info_color = color;
        elements.body.style.setProperty('--picture-info-color', color.join(', '));
    }

    if (properties.picturesinfo_blurcolor_show) {
        const show = properties.picturesinfo_blurcolor_show.value;
        patch.pictures_info_blurcolor_show = show;
        elements.body.style.setProperty('--picture-info-blur-enabled', show ? '1' : '0');
    }

    if (properties.picturesinfo_blurcolor) {
        const color = parseColorString(properties.picturesinfo_blurcolor.value) as [number, number, number];
        patch.pictures_info_blurcolor = color;
        elements.body.style.setProperty('--picture-info-blur-color', color.join(', '));
    }

    if (properties.picturesinfo_yakeli_show) {
        const show = properties.picturesinfo_yakeli_show.value;
        patch.pictures_info_yakeli_show = show;
        elements.body.style.setProperty('--picture-info-yakeli-enabled', show ? '1' : '0');
    }

    if (properties.picturesinfo_yakelicolor) {
        const color = parseColorString(properties.picturesinfo_yakelicolor.value) as [number, number, number];
        patch.pictures_info_yakelic_color = color;
        elements.body.style.setProperty('--picture-info-yakeli-color', color.join(', '));
    }

    if (properties.picturesinfo_yakeli) {
        const yakeli = properties.picturesinfo_yakeli.value / 100;
        patch.pictures_info_yakeli = yakeli;
        elements.body.style.setProperty('--picture-info-yakeli', String(yakeli));
    }

    if (properties.picturesinfo_bluryakeli) {
        const blur = properties.picturesinfo_bluryakeli.value;
        patch.pictures_info_bluryakeli = blur;
        elements.body.style.setProperty('--picture-info-blur-yakeli', `${blur}px`);
        patch.frist_picturesinfo = false;
    }

    if (properties.picturesinfo_timetransparency) {
        patch.pictures_info_timetransparency = properties.picturesinfo_timetransparency.value;
        const t = properties.picturesinfo_timetransparency.value / 100;
        elements.body.style.setProperty('--picture-info-opacity', String(t));
    }

    if (properties.picturesinfo_roundedcorners) {
        const roundedcorners = properties.picturesinfo_roundedcorners.value;
        patch.pictures_info_roundedcorners = roundedcorners;
        elements.body.style.setProperty('--picture-info-roundedcorners', String(roundedcorners));

        // 鐩戝惉 picture-info 瀹瑰櫒灏哄鍙樺寲锛屽悓姝?--picture-info-height CSS 鍙橀噺銆?
        // picInfoEl 鐢?Vue mount 鍚庢墠瀛樺湪锛岄€氳繃 deferredScheduler 寤跺悗鎸傝浇 observer銆?
        registerDeferred('pictureinfo:height-observer', () =>
            syncElementHeightToCssVar('--picture-info-height', () => elements.slide?.picture_info)
        );
    }

    if (properties.picturesinfo_showaway) {
        const showaway = properties.picturesinfo_showaway.value;
        patch.pictures_info_showaway = showaway;
        elements.body.style.setProperty(
            '--picture-info-transform',
            showaway ? 'translate(-100%, 0)' : 'translate(0, 0)'
        );
    }

    if (properties.picturesinfo_showRorL) {
        const rorL = properties.picturesinfo_showRorL.value;
        patch.pictures_info_show_ror_l = rorL;
        elements.body.style.setProperty('--picture-info-text-align', rorL ? 'right' : 'left');
    }

    if (properties.picturesinfo_showwidth) {
        const width = properties.picturesinfo_showwidth.value;
        patch.pictures_info_showwidth = width;
        setShowWidth('--picture-info-show-width', width);
    }

    if (properties.picturesinfo_description) {
        const desc = properties.picturesinfo_description.value;
        patch.pictures_info_description = desc;
        elements.body.style.setProperty(
            '--picture-info-description-display',
            desc ? 'block' : 'none'
        );
    }

    if (Object.keys(patch).length > 0) {
        store.$patch(patch);
    }

    if (FirstLoad) {
        logInitComplete('[Background]', '壁纸', FirstLoad);
        store.$patch({ bg_init_complete: true });
    }
}
