/**
 * useBackgroundProperties — Vue 3 composable wrapper for background/wallpaper
 * properties (image, video, music, transitions, picture-info, audio bar).
 *
 * Stage 3-3 (Phase 7 批次 3-3): wrap src/propertyHandlers/backgroundPropertyHandler.ts
 * as a composable.
 *
 * Side effects live in @/slide and @/video (changeBackground, TransitionSwith,
 * ChangeVideoModel, ChangeAudioModel, updateMusicPlaylist) — these are
 * imperative and stay outside Pinia. Batched $patch mirrors every user-tweakable
 * setting.
 */
import { useConfigStore } from '@/stores/config';
import { elements } from '@/utils/elementManager';

import { applyBackgroundStyle, changeBackground, shouldShow, TransitionSwith } from '@/slide';
import { logInitComplete } from '@/propertyHandlers/_helpers';
import { WallpaperProperties } from '@/propertyHandlers/types';
import { debugLogger } from '@/utils/logger';
import { timerManager } from '@/utils/timer';
import { ChangeAudioModel, ChangeVideoModel, updateMusicPlaylist } from '@/video';

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
        patch.speed = properties.imageswitchtimes.value;
        if (FirstLoad === false) {
            changeBackground();
        }
    }

    if (properties.imageswitchtimeinput) {
        patch.switch_interval_input = properties.imageswitchtimeinput.value;
        if (FirstLoad === false && String(store.speed) === 'custom') {
            changeBackground();
        }
    }

    if (properties.bgy) {
        const y = properties.bgy.value;
        patch.bgy = (y - 50) * 2 + '%';
        applyBackgroundStyle();
    }

    if (properties.bgx) {
        const x = properties.bgx.value;
        patch.bgx = (x - 50) * 2 + '%';
        applyBackgroundStyle();
    }

    if (properties.bgs) {
        patch.bgs = properties.bgs.value + '%';
        applyBackgroundStyle();
    }

    if (properties.imagedisplaystlye) {
        patch.bg_style = properties.imagedisplaystlye.value;
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
        }
    }

    if (properties.picturesinfo_color) {
        const color = properties.picturesinfo_color.value
            .split(' ')
            .map((c: string) => Math.ceil(Number(c) * 255)) as [number, number, number];
        patch.pictures_info_color = color;
        elements.body.style.setProperty('--picture-info-color', color.join(', '));
    }

    if (properties.picturesinfo_blurcolor_show) {
        const show = properties.picturesinfo_blurcolor_show.value;
        patch.pictures_info_blurcolor_show = show;
        elements.body.style.setProperty('--picture-info-blur-enabled', show ? '1' : '0');
    }

    if (properties.picturesinfo_blurcolor) {
        const color = properties.picturesinfo_blurcolor.value
            .split(' ')
            .map((c: string) => Math.ceil(Number(c) * 255)) as [number, number, number];
        patch.pictures_info_blurcolor = color;
        elements.body.style.setProperty('--picture-info-blur-color', color.join(', '));
    }

    if (properties.picturesinfo_yakeli_show) {
        const show = properties.picturesinfo_yakeli_show.value;
        patch.pictures_info_yakeli_show = show;
        elements.body.style.setProperty('--picture-info-yakeli-enabled', show ? '1' : '0');
    }

    if (properties.picturesinfo_yakelicolor) {
        const color = properties.picturesinfo_yakelicolor.value
            .split(' ')
            .map((c: string) => Math.ceil(Number(c) * 255)) as [number, number, number];
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

        const picInfoEl = elements.slide?.picture_info;
        const updateHeight = () => {
            const height = picInfoEl?.getBoundingClientRect().height;
            if (!height) return;
            elements.body.style.setProperty('--picture-info-height', height + 'px');
        };

        updateHeight();
        if (picInfoEl) {
            const observer = new ResizeObserver(updateHeight);
            observer.observe(picInfoEl);
        }
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