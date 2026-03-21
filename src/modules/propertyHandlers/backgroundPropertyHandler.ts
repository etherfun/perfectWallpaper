/**
 * Background Property Handler
 * 处理壁纸/背景相关的属性监听
 */

import { WallpaperProperties } from './types';
import { appConfig } from '../../utils/config';
import { debugLogger } from '../../utils/logger';
import { timerManager } from '../../utils/timer';
import {
    shouldShow,
    changeBackground,
    applyBackgroundStyle,
    TransitionSwith
} from '../slide';
import { ChangeVideoModel, ChangeAudioModel } from '../video';
import { elements } from '@/utils/elementManager';

declare let custom: any;
declare let galaxyapi: number;
declare let chiyuanapi: string;
declare let pictures_URL: string;
declare let selectvideo: any;
declare let cusvideoRoute: string;
declare let wallpapermode: number;
declare let speed: number;
declare let TransitionMode: number;
declare let TransitionMode_choose_0: number;
declare let TransitionMode_choose_1: number;
declare let TransitionMode_choose_4: string;
declare let random: boolean;
declare let bgStyle: number;
declare let bodyElement: HTMLElement;
declare let h: number;
declare let w: number;
declare let myvideo: HTMLVideoElement;

export interface BackgroundPropertyHandlerResult {
    // bgInitComplate 现在通过 appConfig 管理
}

/**
 * 处理壁纸/背景相关属性
 * @param properties 属性对象
 * @param FirstLoad 是否首次加载
 * @returns 处理结果
 */
export function handleBackgroundProperties(
    properties: WallpaperProperties,
    FirstLoad: boolean
): BackgroundPropertyHandlerResult {
    const result: BackgroundPropertyHandlerResult = {};

    // 自定义壁纸
    if (properties.image) {
        custom = properties.image.value;
        if (FirstLoad === false) {
            shouldShow();
        }
    }

    // 星河图片api选择
    if (properties.galaxyapi) {
        appConfig.setGalaxyapi(properties.galaxyapi.value);
    }

    // 次元api
    if (properties.chiyuanapi) {
        const s = properties.chiyuanapi.value;
        let apiUrl = "https://t.alcy.cc/ycy/?json";
        switch (s) {
            case 1:
                apiUrl = "https://t.alcy.cc/ycy/?json";
                break;
            case 2:
                apiUrl = "https://t.alcy.cc/moez/?json";
                break;
            case 3:
                apiUrl = "https://t.alcy.cc/ai/?json";
                break;
            case 4:
                apiUrl = "https://t.alcy.cc/ysz/?json";
                break;
            case 5:
                apiUrl = "https://t.alcy.cc/fj/?json";
                break;
        }
        appConfig.setChiyuanapi(apiUrl);
        if (FirstLoad === false) {
            shouldShow();
        }
    }

    // 自定义目录
    if (properties.customdirectory) {
        timerManager.remove('backgroundChange');
        if (properties.customdirectory && FirstLoad === false) {
            changeBackground();
        }
    }

    // 监听幻灯开关变化
    if (properties.wallpapermode) {
        timerManager.remove('backgroundChange');
        appConfig.setWallpaperMode(properties.wallpapermode.value);
        if (FirstLoad) {
            setTimeout(function () {
                changeBackground();
            }, 5000);
        } else {
            changeBackground();
        }
    }

    // 幻灯片特效
    if (properties.TransitionMode) {
        appConfig.setTransitionMode(properties.TransitionMode.value);
        (window as any).TransitionMode = properties.TransitionMode.value;
        TransitionSwith();
    }

    if (properties.TransitionMode_choose_0) {
        appConfig.setTransitionModeChoose_0(properties.TransitionMode_choose_0.value);
        (window as any).TransitionMode_choose_0 = properties.TransitionMode_choose_0.value;
        TransitionSwith();
    }

    if (properties.TransitionMode_choose_1) {
        appConfig.setTransitionModeChoose_1(properties.TransitionMode_choose_1.value);
        (window as any).TransitionMode_choose_1 = properties.TransitionMode_choose_1.value;
        TransitionSwith();
    }

    if (properties.TransitionMode_choose_4) {
        appConfig.setTransitionModeChoose_4(properties.TransitionMode_choose_4.value);
        (window as any).TransitionMode_choose_4 = properties.TransitionMode_choose_4.value;
        TransitionSwith();
    }

    if (properties.background_wallpapermode_9_URL) {
        appConfig.setPicturesUrl(properties.background_wallpapermode_9_URL.value);
        if (appConfig.getWallpaperMode() == 9) {
            changeBackground();
        }
    }

    // 自定义视频
    if (properties.selectvideo) {
        appConfig.setSelectvideo(properties.selectvideo.value);

        if (properties.selectvideo.value) {
            appConfig.setCusvideoRoute('file:///' + properties.selectvideo.value);
        } else {
            appConfig.setCusvideoRoute("");
        }
        if (appConfig.getWallpaperMode() == 3) {
            ChangeVideoModel();
        }
    }

    // 音量
    if (properties.VideoVolume) {
        elements.myvideo.volume = properties.VideoVolume.value / 100;
    }

    // 自定义音乐
    if (properties.selectmusic) {
        appConfig.setSelectmusic(properties.selectmusic.value);
        if (properties.selectmusic.value) {
            appConfig.setCusaudioRoute('file:///' + properties.selectmusic.value);
        } else {
            appConfig.setCusaudioRoute("");
        }
        ChangeAudioModel();
    }

    // 音量
    if (properties.MuiscVolume) {
        elements.myAudio.volume = properties.MuiscVolume.value / 100;
    }

    // 监听随机模式开关变化
    if (properties.random) {
        appConfig.setRandom(properties.random.value);
    }

    // 更改幻灯切换时间
    if (properties.imageswitchtimes) {
        appConfig.setSpeed(properties.imageswitchtimes.value);
        if (FirstLoad === false) {
            changeBackground();
        }
    }

    // 自由变换
    if (properties.bgy) {
        const y = properties.bgy.value;
        appConfig.setBgy(h * ((y - 50) / 50) + "px");
        applyBackgroundStyle();
    }

    if (properties.bgx) {
        const x = properties.bgx.value;
        appConfig.setBgx(w * ((x - 50) / 50) + "px");
        applyBackgroundStyle();
    }

    if (properties.bgs) {
        appConfig.setBgs(properties.bgs.value + "%");
        applyBackgroundStyle();
    }

    // 更改背景展示样式
    if (properties.imagedisplaystlye) {
        appConfig.setBgStyle(properties.imagedisplaystlye.value);
        applyBackgroundStyle();
    }

    // ========== 图片信息(picturesinfo_*)处理 ==========

    // 图片信息语言
    if (properties.picturesinfo_language) {
        appConfig.setPicturesInfoLanguage(properties.picturesinfo_language.value);
    }

    // 图片信息Y轴位置
    if (properties.picturesinfoY) {
        const y = properties.picturesinfoY.value;
        elements.body.style.setProperty("--picture-info-top", `${y}%`);
    }

    // 图片信息X轴位置
    if (properties.picturesinfoX) {
        const x = properties.picturesinfoX.value;
        elements.body.style.setProperty("--picture-info-left", `${x}%`);
    }

    // 图片信息字体大小
    if (properties.picturesinfo_size) {
        const s = properties.picturesinfo_size.value;
        elements.body.style.setProperty("--picture-info-font-size", Math.floor(h / 600 * s) + 'px');
        elements.body.style.setProperty("--picture-info-line-height", Math.floor(h / 1140 * s) + 'px');
    }

    // 图片信息显示开关
    if (properties.picturesinfo_show) {
        const show = properties.picturesinfo_show.value;
        appConfig.setPicturesInfoShow(show);
        elements.body.style.setProperty("--picture-info-display", show ? 'flex' : 'none');
        elements.body.style.setProperty("--picture-info-visibility", show ? 'visible' : 'hidden');
    }

    // 图片信息文字颜色
    if (properties.picturesinfo_color) {
        const color = properties.picturesinfo_color.value.split(' ').map((c: string) => Math.ceil(Number(c) * 255));
        appConfig.setPicturesInfoColor(color);
        elements.body.style.setProperty("--picture-info-color", color.join(', '));
    }

    // 图片信息模糊背景开关
    if (properties.picturesinfo_blurcolor_show) {
        const show = properties.picturesinfo_blurcolor_show.value;
        appConfig.setPicturesInfoBlurcolorShow(show);
        elements.body.style.setProperty("--picture-info-blur-enabled", show ? '1' : '0');
    }

    // 图片信息模糊背景颜色
    if (properties.picturesinfo_blurcolor) {
        const color = properties.picturesinfo_blurcolor.value.split(' ').map((c: string) => Math.ceil(Number(c) * 255));
        appConfig.setPicturesInfoBlurcolor(color);
        elements.body.style.setProperty("--picture-info-blur-color", color.join(', '));
    }

    // 图片信息亚克力效果开关
    if (properties.picturesinfo_yakeli_show) {
        const show = properties.picturesinfo_yakeli_show.value;
        appConfig.setPicturesInfoYakeliShow(show);
        elements.body.style.setProperty("--picture-info-yakeli-enabled", show ? '1' : '0');
    }

    // 图片信息亚克力效果颜色
    if (properties.picturesinfo_yakelicolor) {
        const color = properties.picturesinfo_yakelicolor.value.split(' ').map((c: string) => Math.ceil(Number(c) * 255));
        appConfig.setPicturesInfoYakelicColor(color);
        elements.body.style.setProperty("--picture-info-yakeli-color", color.join(', '));
    }

    // 图片信息亚克力效果强度
    if (properties.picturesinfo_yakeli) {
        const yakeli = properties.picturesinfo_yakeli.value / 100;
        appConfig.setPicturesInfoYakeli(yakeli);
        elements.body.style.setProperty("--picture-info-yakeli", String(yakeli));
    }

    // 图片信息模糊亚克力效果
    if (properties.picturesinfo_bluryakeli) {
        const blur = properties.picturesinfo_bluryakeli.value;
        appConfig.setPicturesInfoBluryakeli(blur);
        elements.body.style.setProperty("--picture-info-blur-yakeli", `${blur}px`);
        appConfig.setFristPicturesinfo(false);
    }

    // 图片信息时间透明度
    if (properties.picturesinfo_timetransparency) {
        const t = properties.picturesinfo_timetransparency.value / 100;
        elements.body.style.setProperty("--picture-info-opacity", String(t));
    }

    // 图片信息圆角
    if (properties.picturesinfo_roundedcorners) {
        elements.body.style.setProperty(
            "--picture-info-roundedcorners",
            String(properties.picturesinfo_roundedcorners.value)
        );

        const updateHeight = () => {
            const height = elements.slide.picture_info?.getBoundingClientRect().height;
            if (!height) return;
            elements.body.style.setProperty("--picture-info-height", height + "px");
        };

        updateHeight();
        const observer = new ResizeObserver(updateHeight);
        observer.observe(elements.slide.picture_info);
    }

    // 图片信息划出动画方向
    if (properties.picturesinfo_showaway) {
        const showaway = properties.picturesinfo_showaway.value;
        elements.body.style.setProperty("--picture-info-transform", showaway ? 'translate(-100%, 0)' : 'translate(0, 0)');
    }

    // 图片信息文字对齐方向
    if (properties.picturesinfo_showRorL) {
        const rorL = properties.picturesinfo_showRorL.value;
        appConfig.setPicturesInfoShowRorL(rorL);
        elements.body.style.setProperty("--picture-info-text-align", rorL ? "right" : "left");
    }

    // 图片信息显示宽度
    if (properties.picturesinfo_showwidth) {
        const width = properties.picturesinfo_showwidth.value;
        if (width === 0) {
            elements.body.style.setProperty("--picture-info-show-width", 'auto');
        } else {
            const s = width / 100;
            elements.body.style.setProperty("--picture-info-show-width", w * s + "px");
        }
    }

    // 图片信息描述显示
    if (properties.picturesinfo_description) {
        const desc = properties.picturesinfo_description.value;
        elements.body.style.setProperty("--picture-info-description-display", desc ? "block" : "none");
    }

    if (FirstLoad) {
        debugLogger.info('[Background] 壁纸参数初始化完成');
        appConfig.setBgInitComplete(true);
    }

    return result;
}
