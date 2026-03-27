/**
 * 幻灯片模块 - 背景切换和图片轮播功能
 */

import { appConfig, config } from "./utils/config";
import { elements } from "./utils/elementManager";
import { background2canvas } from "./RGB";
import { timerManager } from "@/utils/timer";
import { ChangeVideoModel } from "./video";

// DOM 元素
const pictures = {
    picture_info: elements.slide.picture_info,
    info: elements.slide.info,
    title: elements.slide.title,
    author: elements.slide.author,
    where: elements.slide.location,
    text: elements.slide.description
};
//
// 背景层相关变量 (DOM元素)
const backgroundLayers = {
    container: elements.background.container,
    layer1: elements.background.layer1,
    layer2: elements.background.layer2,
    blurLayer1: elements.background.blurLayer1,
    blurLayer2: elements.background.blurLayer2,
    currentActive: 1 as 1 | 2,
    blurCurrentActive: 1 as 1 | 2,
    isTransitioning: false
};

/** 使用两层背景进行渐变切换（支持模糊背景层两层切换） */
export function transitionBackground(newImageUrl: string): void {
    // 如果图片URL无效，跳过
    if (!newImageUrl || newImageUrl === 'null' || newImageUrl === 'undefined') {
        return;
    }

    if (backgroundLayers.isTransitioning) return;

    // 获取当前活动层
    const activeLayer = backgroundLayers.currentActive === 1 ? backgroundLayers.layer1 : backgroundLayers.layer2;

    // 如果新图片与当前图片相同，跳过切换
    if (activeLayer && activeLayer.style.backgroundImage) {
        // 统一引号格式后比较 (backgroundImage 可能用双引号或单引号)
        const currentBg = activeLayer.style.backgroundImage.replace(/"/g, "'");
        const newBg = "url('" + newImageUrl + "')";
        if (currentBg === newBg) return;
    }

    backgroundLayers.isTransitioning = true;

    // 获取当前和下一层（主背景层）
    const currentLayer = backgroundLayers.currentActive === 1 ? backgroundLayers.layer1 : backgroundLayers.layer2;
    const nextLayer = backgroundLayers.currentActive === 1 ? backgroundLayers.layer2 : backgroundLayers.layer1;

    // 获取当前和下一层（模糊背景层）
    const currentBlurLayer = backgroundLayers.blurCurrentActive === 1 ? backgroundLayers.blurLayer1 : backgroundLayers.blurLayer2;
    const nextBlurLayer = backgroundLayers.blurCurrentActive === 1 ? backgroundLayers.blurLayer2 : backgroundLayers.blurLayer1;

    // 设置下一层的背景图片（主背景层）
    nextLayer.style.backgroundImage = "url('" + newImageUrl + "')";

    // 设置下一层的背景图片（模糊背景层）
    if (nextBlurLayer) {
        nextBlurLayer.style.backgroundImage = "url('" + newImageUrl + "')";
    }

    // 自动应用背景样式到新层
    applyBackgroundStyle();

    // 开始渐变过渡
    setTimeout(function() {
        // 淡出当前层（主背景层）
        currentLayer.style.opacity = "0";

        // 淡入下一层（主背景层）
        nextLayer.style.opacity = "1";

        // 淡出当前层（模糊背景层）
        if (currentBlurLayer) {
            currentBlurLayer.style.opacity = "0";
        }

        // 淡入下一层（模糊背景层）
        if (nextBlurLayer) {
            nextBlurLayer.style.opacity = "1";
        }

        // 切换活动层
        backgroundLayers.currentActive = backgroundLayers.currentActive === 1 ? 2 : 1;
        backgroundLayers.blurCurrentActive = backgroundLayers.blurCurrentActive === 1 ? 2 : 1;

        // 重置过渡状态
        setTimeout(function() {
            backgroundLayers.isTransitioning = false;
        }, 1000);
    }, 50);
}

/** 更新播放列表 */
export function updateFileList(currentFiles: string[]): void {
    // 列入播放列表
    for (let i = 0; i < currentFiles.length; ++i) {
        if (appConfig.runtime.myList.indexOf(currentFiles[i]) === -1) {
            appConfig.runtime.myList.push(currentFiles[i]);
        }
    }
}

/** 计算切换周期 */
function calculate(t: number): number {
    let res = 1;
    switch (t) {
        case 0.5:
            res = 30;
            break;
        case 1:
            // 1min
            res = 60;
            break;
        case 2:
            // 5min
            res = 5 * 60;
            break;
        case 3:
            // 10min
            res = 10 * 60;
            break;
        case 4:
            // 30min
            res = 30 * 60;
            break;
        case 5:
            // 60min
            res = 60 * 60;
            break;
        default:
            res = 60;
    }
    return res * 1000;
}

/** 变换背景 */
export function changeBackground(): void {
    switch (config.wallpaperMode) {
        case 1: // 单一壁纸模式
            shouldShow();
            break;
        case 2: // 随机模式
            if (appConfig.runtime.myList.length) {
                if (config.random) {
                    // 随机模式
                    nextImage(true);
                } else {
                    // 顺序模式
                    nextImage(false);
                }
            } else {
                shouldShow();
            }
            timerManager.remove('backgroundChange');
            timerManager.create(changeBackground, calculate(config.speed), 'backgroundChange');
            break;
        case 3: // 视频模式
            shouldShow();
            break;
        case 4: // Bing壁纸
            shouldShow();
            timerManager.remove('backgroundChange');
            timerManager.create(changeBackground, 10800000, 'backgroundChange');
            break;
        case 5: // Lorem Picsum
            shouldShow();
            timerManager.remove('backgroundChange');
            timerManager.create(changeBackground, calculate(config.speed), 'backgroundChange');
            break;
        case 6: // NASA
            shouldShow();
            timerManager.remove('backgroundChange');
            timerManager.create(changeBackground, calculate(config.speed), 'backgroundChange');
            break;
        case 7: // 次元api
            shouldShow();
            timerManager.remove('backgroundChange');
            timerManager.create(changeBackground, calculate(config.speed), 'backgroundChange');
            break;
        case 8: // Windows聚焦
            shouldShow();
            timerManager.remove('backgroundChange');
            timerManager.create(changeBackground, calculate(config.speed), 'backgroundChange');
            break;
        case 9: // 自定义
            shouldShow();
            timerManager.remove('backgroundChange');
            timerManager.create(changeBackground, calculate(config.speed), 'backgroundChange');
            break;
        default:
    }

    if (document.querySelector(".fluid-effect-wrapper:not(#player_control .fluid-effect-wrapper)")) {
        timerManager.pause('backgroundChange');
    }
}

// 顺序切or随机切换
export function nextImage(rands: boolean): void {
    const photoInfo = appConfig.runtime.photo;
    let index = -1;
    let indexNow = -1;

    // 首次为空
    if (photoInfo.currentImg) {
        indexNow = appConfig.runtime.myList.indexOf(photoInfo.currentImg);
        index = indexNow;
    }

    // 是否随机
    if (rands) {
        while (index == indexNow) {
            index = Math.floor(Math.random() * (appConfig.runtime.myList.length));
        }
        photoInfo.currentImg = appConfig.runtime.myList[index];
    } else {
        if (index + 1 == appConfig.runtime.myList.length) {
            // 播放循环到首个图片
            photoInfo.currentImg = appConfig.runtime.myList[0];
        } else {
            // 播放下一张图片
            photoInfo.currentImg = appConfig.runtime.myList[index + 1];
        }
    }
    shouldShow();
}

/** 应该展示的背景 */
export function shouldShow(): void {
    document.body.style.backgroundImage = "";

    switch (config.wallpaperMode) {
        case 1: // 单一壁纸模式
            // 关闭视频
            (elements.myvideo as HTMLVideoElement).src = "";
            backgroundLayers.container.style.display = "block"; // 确保背景层可见
            // 清除body的背景图片
            document.body.style.backgroundImage = "";
            
            let imageUrl: string;
            if (config.custom) {
                imageUrl = 'file:///' + config.custom;
            } else {
                imageUrl = config.backgroundRoute.replace(/^url\("(.+?)"\)$/, '$1');
            }
            
            // 使用两层背景系统进行渐变切换
            transitionBackground(imageUrl);
            
            clearpicturesinfo();
            pictures.picture_info.style.display = "none";
            if (config.RGBShow) {
                appConfig.runtime.photo.nextphoto = true;
                setTimeout(function () {
                    background2canvas(imageUrl, false);
                    appConfig.runtime.photo.nextphoto = false;
                }, 100);
            }
            break;

        case 2: // 随机模式
            // 关闭视频
            (elements.myvideo as HTMLVideoElement).src = "";
            backgroundLayers.container.style.display = "block"; // 确保背景层可见
            if (appConfig.runtime.myList.length) {
                // 使用两层背景系统进行渐变切换
                transitionBackground('file:///' + appConfig.runtime.photo.currentImg!);
            } else {
                // 使用两层背景系统进行渐变切换
                transitionBackground("imgs/1.jpg");
            }
            clearpicturesinfo();
            pictures.picture_info.style.display = "none";
            if (config.RGBShow) {
                appConfig.runtime.photo.nextphoto = true;
                setTimeout(function () {
                    background2canvas(appConfig.runtime.photo.currentImg!, false);
                    appConfig.runtime.photo.nextphoto = false;
                }, 100);
            }
            break;

        case 3: // 视频模式
            ChangeVideoModel();
            clearpicturesinfo();
            backgroundLayers.container.style.display = "none"; // 视频模式下隐藏背景层
            pictures.picture_info.style.display = "none";
            if (config.RGBShow) {
                appConfig.runtime.photo.nextphoto = true;
                setTimeout(function () {
                    background2canvas(undefined, true);
                    appConfig.runtime.photo.nextphoto = false;
                }, 100);
            }
            break;
            
        case 4: // Bing壁纸
            if (config.picturesInfoShow && pictures.picture_info.style.display == "none") {
                pictures.picture_info.style.display = "flex";
            }
            // 关闭视频
            elements.myvideo.src = "";
            backgroundLayers.container.style.display = "block"; // 确保背景层可见

            fetch("https://www.bing.com/HPImageArchive.aspx?format=js&idx=0&n=1&mkt=" + config.language)
                .then(response => response.json())
                .then((get: any) => {
                    appConfig.runtime.photo.infomation.title = get.images[0].title;
                    appConfig.runtime.photo.infomation.text = "";
                    appConfig.runtime.photo.infomation.copyright = "";
                    appConfig.runtime.photo.infomation.where = "";
                    const match = get.images[0].copyright.match(/\(([^)]+)\)/);
                    if (match) {
                        appConfig.runtime.photo.infomation.copyright = match[1];
                        appConfig.runtime.photo.infomation.where = get.images[0].copyright.replace(/\(([^)]+)\)/, '').trim();
                    }

                    picturesinfo_showrl(
                        appConfig.runtime.photo.infomation.title,
                        appConfig.runtime.photo.infomation.copyright,
                        appConfig.runtime.photo.infomation.where,
                        appConfig.runtime.photo.infomation.text
                    );

                    const bingurl = 'https://www.bing.com' + get.images[0].urlbase;
                    const img = new Image();
                    img.src = bingurl + "_UHD.jpg";

                    img.onload = function () {
                        transitionBackground(img.src);

                        if (config.RGBShow) {
                            appConfig.runtime.photo.nextphoto = true;
                            setTimeout(function () {
                                background2canvas(img.src, false);
                                appConfig.runtime.photo.nextphoto = false;
                            }, 100);
                        }
                    };
                });
            break;

        case 5: // Lorem Picsum
            // 关闭视频
            elements.myvideo.src = "";
            backgroundLayers.container.style.display = "block"; // 确保背景层可见
            const timestamp = new Date().getTime();

            const loremImg = new Image();
            loremImg.src = "https://picsum.photos/3840/2160?random=" + timestamp;

            loremImg.onload = function () {
                transitionBackground(loremImg.src);

                if (config.RGBShow) {
                    appConfig.runtime.photo.nextphoto = true;
                    setTimeout(function () {
                        background2canvas(loremImg.src, false);
                        appConfig.runtime.photo.nextphoto = false;
                    }, 100);
                }
            };
            clearpicturesinfo();
            pictures.picture_info.style.display = "none";
            break;

        case 6: // NASA星空
            if (config.picturesInfoShow && pictures.picture_info.style.display == "none") {
                pictures.picture_info.style.display = "flex";
            }
            // 关闭视频
            elements.myvideo.src = "";
            backgroundLayers.container.style.display = "block"; // 确保背景层可见

            const galaxyapi = config.galaxyapi;

            switch (galaxyapi) {
                case 2:
                    fetch("https://apod.nasa.gov/")
                        .then(response => response.text())
                        .then((get: any) => {
                            const parser = new DOMParser();
                            const doc = parser.parseFromString(get, 'text/html');
                            const url = "https://apod.nasa.gov/apod/" + doc.querySelector("img")?.getAttribute("src");

                            appConfig.runtime.photo.infomation.title = doc.querySelector('b')?.textContent || "";
                            appConfig.runtime.photo.infomation.text = doc.querySelectorAll('p')[2]?.textContent || "";
                            appConfig.runtime.photo.infomation.copyright = doc.querySelectorAll('a')[2]?.textContent || "";
                            appConfig.runtime.photo.infomation.where = "";
                            picturesinfo_showrl(
                                appConfig.runtime.photo.infomation.title,
                                appConfig.runtime.photo.infomation.copyright,
                                appConfig.runtime.photo.infomation.where,
                                appConfig.runtime.photo.infomation.text
                            );
                            doNasa(url);
                        });
                    break;
                case 1:
                default:
                    fetch("https://api.nasa.gov/planetary/apod?api_key=DEMO_KEY&thumbs=true")
                        .then(response => response.json())
                        .then((get: any) => {
                            console.log(JSON.stringify(get));

                            let url: string;
                            if (get.media_type == "video") {
                                url = get.thumbnail_url;
                            } else {
                                url = get.hdurl;
                            }

                            appConfig.runtime.photo.infomation.title = get.title;
                            appConfig.runtime.photo.infomation.text = get.explanation;
                            if (get.copyright == undefined) {
                                appConfig.runtime.photo.infomation.copyright = "";
                            } else {
                                appConfig.runtime.photo.infomation.copyright = get.copyright;
                            }
                            appConfig.runtime.photo.infomation.where = "";
                            picturesinfo_showrl(
                                appConfig.runtime.photo.infomation.title,
                                appConfig.runtime.photo.infomation.copyright,
                                appConfig.runtime.photo.infomation.where,
                                appConfig.runtime.photo.infomation.text
                            );

                            doNasa(url);
                        });
                    break;
            }

            function doNasa(url: string) {
                const img = new Image();
                img.src = url;
                img.onload = function () {
                    transitionBackground(img.src);

                    if (config.RGBShow) {
                        appConfig.runtime.photo.nextphoto = true;
                        setTimeout(function () {
                            background2canvas(img.src, false);
                            appConfig.runtime.photo.nextphoto = false;
                        }, 100);
                    }
                };
            }
            break;

        case 7: // 次元api
            // 关闭视频
            elements.myvideo.src = "";
            backgroundLayers.container.style.display = "block"; // 确保背景层可见

            fetch(config.chiyuanapi)
                .then(response => response.text())
                .then((getchiyuan: any) => {
                    const img = new Image();
                    img.src = getchiyuan;

                    img.onload = function () {
                        transitionBackground(img.src);

                        if (config.RGBShow) {
                            appConfig.runtime.photo.nextphoto = true;
                            setTimeout(function () {
                                background2canvas(img.src, false);
                                appConfig.runtime.photo.nextphoto = false;
                            }, 100);
                        }
                    };
                });
            clearpicturesinfo();
            pictures.picture_info.style.display = "none";
            break;

        case 8: // Windows聚焦
            if (config.picturesInfoShow && pictures.picture_info.style.display == "none") {
                pictures.picture_info.style.display = "flex";
            }
            // 关闭视频
            elements.myvideo.src = "";
            backgroundLayers.container.style.display = "block"; // 确保背景层可见

            const city = config.language.slice(3);

            fetch(`https://fd.api.iris.microsoft.com/v4/api/selection?&placement=88000820&bcnt=1&country=${city}&locale=${config.language}&fmt=json`)
                .then(response => response.json())
                .then((get: any) => {
                    const rawjson = JSON.parse(get.batchrsp.items[0].item);

                    const url = rawjson.ad.landscapeImage.asset;
                    const img = new Image();
                    img.src = url;

                    appConfig.runtime.photo.infomation.title = rawjson.ad.title;
                    appConfig.runtime.photo.infomation.text = rawjson.ad.description;
                    appConfig.runtime.photo.infomation.copyright = rawjson.ad.copyright;
                    appConfig.runtime.photo.infomation.where = rawjson.ad.iconHoverText.split(/\r?\n/)[0].trim();
                    picturesinfo_showrl(
                        appConfig.runtime.photo.infomation.title,
                        appConfig.runtime.photo.infomation.copyright,
                        appConfig.runtime.photo.infomation.where,
                        appConfig.runtime.photo.infomation.text
                    );

                    img.onload = function () {
                        transitionBackground(img.src);

                        if (config.RGBShow) {
                            appConfig.runtime.photo.nextphoto = true;
                            setTimeout(function () {
                                background2canvas(img.src, false);
                                appConfig.runtime.photo.nextphoto = false;
                            }, 100);
                        }
                    };
                });
            break;

        case 9: // 自定义
            if (config.picturesInfoShow && pictures.picture_info.style.display == "none") {
                pictures.picture_info.style.display = "flex";
            }
            // 关闭视频
            elements.myvideo.src = "";
            backgroundLayers.container.style.display = "block"; // 确保背景层可见
            const customImg = new Image();
            customImg.src = config.picturesUrl;

            customImg.onload = function () {
                transitionBackground(customImg.src);

                if (config.RGBShow) {
                    appConfig.runtime.photo.nextphoto = true;
                    setTimeout(function () {
                        background2canvas(customImg.src, false);
                        appConfig.runtime.photo.nextphoto = false;
                    }, 100);
                }
            };
            clearpicturesinfo();
            pictures.picture_info.style.display = "none";
            break;

        default:
            // 默认处理
            backgroundLayers.container.style.display = "block";
            pictures.picture_info.style.display = "none";
    }
}

/** 清除图片信息 */
export function clearpicturesinfo(): void {
    // Clear .left and .right spans in title, author, location, and description
    const titleLeft = document.querySelector("#picture_info .title .left");
    const titleRight = document.querySelector("#picture_info .title .right");
    const authorLeft = document.querySelector("#picture_info .author .left");
    const authorRight = document.querySelector("#picture_info .author .right");
    const locationLeft = document.querySelector("#picture_info .location .left");
    const locationRight = document.querySelector("#picture_info .location .right");
    const description = document.querySelector("#picture_info .description");

    if (titleLeft) titleLeft.innerHTML = "";
    if (titleRight) titleRight.innerHTML = "";
    if (authorLeft) authorLeft.innerHTML = "";
    if (authorRight) authorRight.innerHTML = "";
    if (locationLeft) locationLeft.innerHTML = "";
    if (locationRight) locationRight.innerHTML = "";
    if (description) description.innerHTML = "";
}

/** 显示图片信息 */
export function picturesinfo_showrl(title: string, author: string, where: string, text: string): void {
    clearpicturesinfo();

    const text_w = document.querySelector("#picture_info .description");

    let title_w: Element | null, author_w: Element | null, where_w: Element | null;

    if (config.picturesInfoShowRorL) {
        title_w = document.querySelector("#picture_info .title .right");
        author_w = document.querySelector("#picture_info .author .right");
        where_w = document.querySelector("#picture_info .location .right");
    } else {
        title_w = document.querySelector("#picture_info .title .left");
        author_w = document.querySelector("#picture_info .author .left");
        where_w = document.querySelector("#picture_info .location .left");
    }

    if (title_w) title_w.innerHTML = title;
    if (author_w) author_w.innerHTML = author;
    if (where_w) where_w.innerHTML = where;
    if (text_w) text_w.innerHTML = text;
}

/** 切换过渡效果 */
export function TransitionSwith(): void {
    let transitionValue = "";

    const TransitionMode = config.transitionMode;
    const TransitionMode_choose_0 = config.transitionModeChoose_0;
    const TransitionMode_choose_1 = config.transitionModeChoose_1;
    const TransitionMode_choose_4 = config.transitionModeChoose_4;

    switch (TransitionMode) {
        case 0:
            switch (TransitionMode_choose_0) {
                case 0: transitionValue = "opacity 1s linear 0s"; break;
                case 1: transitionValue = "opacity 1s linear(0 0%, 0.22 2.1%, 0.86 6.5%, 1.11 8.6%, 1.3 10.7%, 1.35 11.8%, 1.37 12.9%, 1.37 13.7%, 1.36 14.5%, 1.32 16.2%, 1.03 21.8%, 0.94 24%, 0.89 25.9%, 0.88 26.85%, 0.87 27.8%, 0.87 29.25%, 0.88 30.7%, 0.91 32.4%, 0.98 36.4%, 1.01 38.3%, 1.04 40.5%, 1.05 42.7%, 1.05 44.1%, 1.04 45.7%, 1 53.3%, 0.99 55.4%, 0.98 57.5%, 0.99 60.7%, 1 68.1%, 1.01 72.2%, 1 86.7%, 1 100%) 0s"; break;
                case 2: transitionValue = "opacity 1s linear(0 0%, 0 2.27%, 0.02 4.53%, 0.04 6.8%, 0.06 9.07%, 0.1 11.33%, 0.14 13.6%, 0.25 18.15%, 0.39 22.7%, 0.56 27.25%, 0.77 31.8%, 1 36.35%, 0.89 40.9%, 0.85 43.18%, 0.81 45.45%, 0.79 47.72%, 0.77 50%, 0.75 52.27%, 0.75 54.55%, 0.75 56.82%, 0.77 59.1%, 0.79 61.38%, 0.81 63.65%, 0.85 65.93%, 0.89 68.2%, 1 72.7%, 0.97 74.98%, 0.95 77.25%, 0.94 79.53%, 0.94 81.8%, 0.94 84.08%, 0.95 86.35%, 0.97 88.63%, 1 90.9%, 0.99 93.18%, 0.98 95.45%, 0.99 97.73%, 1 100%) 0s"; break;
                case 3: transitionValue = "opacity 1s linear(0 0%, 0 1.8%, 0.01 3.6%, 0.03 6.35%, 0.07 9.1%, 0.13 11.4%, 0.19 13.4%, 0.27 15%, 0.34 16.1%, 0.54 18.35%, 0.66 20.6%, 0.72 22.4%, 0.77 24.6%, 0.81 27.3%, 0.85 30.4%, 0.88 35.1%, 0.92 40.6%, 0.94 47.2%, 0.96 55%, 0.98 64%, 0.99 74.4%, 1 86.4%, 1 100%) 0s"; break;
            }
            break;
        case 1:
            switch (TransitionMode_choose_1) {
                case 0: transitionValue = "opacity 1s ease-in-out 0s"; break;
                case 1: transitionValue = "opacity 1s cubic-bezier(0.45, 0.05, 0.55, 0.95) 0s"; break;
                case 2: transitionValue = "opacity 1s cubic-bezier(0.46, 0.03, 0.52, 0.96) 0s"; break;
                case 3: transitionValue = "opacity 1s cubic-bezier(0.65, 0.05, 0.36, 1) 0s"; break;
                case 4: transitionValue = "opacity 1s cubic-bezier(0.4, 0, 0.2, 1) 0s"; break;
            }
            break;
        case 2:
            transitionValue = "opacity 1s ease-in 0s"; break;
        case 3:
            transitionValue = "opacity 1s ease-out 0s"; break;
        case 4:
            transitionValue = TransitionMode_choose_4; break;
    }

    // 应用到所有背景层（主背景层和模糊背景层）
    if (backgroundLayers.layer1 && backgroundLayers.layer2) {
        backgroundLayers.layer1.style.transition = transitionValue;
        backgroundLayers.layer2.style.transition = transitionValue;
    }

    // 应用到模糊背景层
    if (backgroundLayers.blurLayer1 && backgroundLayers.blurLayer2) {
        backgroundLayers.blurLayer1.style.transition = transitionValue;
        backgroundLayers.blurLayer2.style.transition = transitionValue;
    }

}

/** 应用背景样式到两层背景系统（支持模糊背景层两层切换） */
export function applyBackgroundStyle(): void {
    // 确保背景层存在
    if (!backgroundLayers.layer1 || !backgroundLayers.layer2) {
        return;
    }

    // 获取当前活动的模糊背景层
    const currentBlurLayer = backgroundLayers.blurCurrentActive === 1 ? backgroundLayers.blurLayer1 : backgroundLayers.blurLayer2;
    const nextBlurLayer = backgroundLayers.blurCurrentActive === 1 ? backgroundLayers.blurLayer2 : backgroundLayers.blurLayer1;

    // 首先隐藏所有模糊背景层（默认状态）
    if (backgroundLayers.blurLayer1) {
        backgroundLayers.blurLayer1.style.opacity = "0";
    }
    if (backgroundLayers.blurLayer2) {
        backgroundLayers.blurLayer2.style.opacity = "0";
    }

    // 清除所有可能由适应模式设置的样式
    backgroundLayers.layer1.style.filter = "";
    backgroundLayers.layer2.style.filter = "";
    backgroundLayers.layer1.style.transform = "";
    backgroundLayers.layer2.style.transform = "";
    backgroundLayers.container.style.backgroundColor = "";
    backgroundLayers.layer1.style.backgroundRepeat = "";
    backgroundLayers.layer2.style.backgroundRepeat = "";
    backgroundLayers.layer1.style.backgroundSize = "";
    backgroundLayers.layer2.style.backgroundSize = "";
    backgroundLayers.layer1.style.backgroundPosition = "";
    backgroundLayers.layer2.style.backgroundPosition = "";

    // 单壁纸样式
    switch (config.bgStyle) {
        case 1:
            // 填充
            backgroundLayers.layer1.style.backgroundRepeat = "no-repeat";
            backgroundLayers.layer2.style.backgroundRepeat = "no-repeat";
            backgroundLayers.layer1.style.backgroundSize = "cover";
            backgroundLayers.layer2.style.backgroundSize = "cover";
            backgroundLayers.layer1.style.backgroundPosition = "center";
            backgroundLayers.layer2.style.backgroundPosition = "center";
            break;
        case 2:
            // 拉伸
            backgroundLayers.layer1.style.backgroundRepeat = "no-repeat";
            backgroundLayers.layer2.style.backgroundRepeat = "no-repeat";
            backgroundLayers.layer1.style.backgroundSize = "100% 100%";
            backgroundLayers.layer2.style.backgroundSize = "100% 100%";
            backgroundLayers.layer1.style.backgroundPosition = "center";
            backgroundLayers.layer2.style.backgroundPosition = "center";
            break;
        case 3:
            // 适应模式：图片保持清晰，空白区域显示模糊背景
            backgroundLayers.layer1.style.backgroundRepeat = "no-repeat";
            backgroundLayers.layer2.style.backgroundRepeat = "no-repeat";
            backgroundLayers.layer1.style.backgroundSize = "contain";
            backgroundLayers.layer2.style.backgroundSize = "contain";
            backgroundLayers.layer1.style.backgroundPosition = "center";
            backgroundLayers.layer2.style.backgroundPosition = "center";

            // 显示当前活动的模糊背景层填充空白区域
            if (currentBlurLayer) {
                currentBlurLayer.style.opacity = "1";
                currentBlurLayer.style.backgroundSize = "cover";
                currentBlurLayer.style.backgroundPosition = "center";
                currentBlurLayer.style.backgroundRepeat = "no-repeat";
            }

            // 设置背景颜色为深色以增强模糊效果
            backgroundLayers.container.style.backgroundColor = "rgba(0, 0, 0, 0.3)";
            break;
        case 4:
            // 平铺
            backgroundLayers.layer1.style.backgroundRepeat = "repeat";
            backgroundLayers.layer2.style.backgroundRepeat = "repeat";
            backgroundLayers.layer1.style.backgroundSize = "contain";
            backgroundLayers.layer2.style.backgroundSize = "contain";
            backgroundLayers.layer1.style.backgroundPosition = "center";
            backgroundLayers.layer2.style.backgroundPosition = "center";
            break;
        case 5:
            // 居中模式：图片居中显示，空白区域显示模糊背景
            backgroundLayers.layer1.style.backgroundRepeat = "no-repeat";
            backgroundLayers.layer2.style.backgroundRepeat = "no-repeat";
            backgroundLayers.layer1.style.backgroundPosition = "center";
            backgroundLayers.layer2.style.backgroundPosition = "center";

            // 显示当前活动的模糊背景层填充空白区域
            if (currentBlurLayer) {
                currentBlurLayer.style.opacity = "1";
                currentBlurLayer.style.backgroundSize = "cover";
                currentBlurLayer.style.backgroundPosition = "center";
                currentBlurLayer.style.backgroundRepeat = "no-repeat";
            }

            // 设置背景颜色为深色以增强模糊效果
            backgroundLayers.container.style.backgroundColor = "rgba(0, 0, 0, 0.3)";
            break;
        case 6:
            // 自由模式：自定义大小和位置，空白区域显示模糊背景
            backgroundLayers.layer1.style.backgroundRepeat = "no-repeat";
            backgroundLayers.layer2.style.backgroundRepeat = "no-repeat";
            backgroundLayers.layer1.style.backgroundSize = config.bgs || "100% 100%";
            backgroundLayers.layer2.style.backgroundSize = config.bgs || "100% 100%";
            backgroundLayers.layer1.style.backgroundPosition = config.bgx + " " + config.bgy;
            backgroundLayers.layer2.style.backgroundPosition = config.bgx + " " + config.bgy;

            // 显示当前活动的模糊背景层填充空白区域
            if (currentBlurLayer) {
                currentBlurLayer.style.opacity = "1";
                currentBlurLayer.style.backgroundSize = "cover";
                currentBlurLayer.style.backgroundPosition = "center";
                currentBlurLayer.style.backgroundRepeat = "no-repeat";
            }

            // 设置背景颜色为深色以增强模糊效果
            backgroundLayers.container.style.backgroundColor = "rgba(0, 0, 0, 0.3)";
            break;
        default:
            // 默认填充
            backgroundLayers.layer1.style.backgroundRepeat = "no-repeat";
            backgroundLayers.layer2.style.backgroundRepeat = "no-repeat";
            backgroundLayers.layer1.style.backgroundSize = "cover";
            backgroundLayers.layer2.style.backgroundSize = "cover";
            backgroundLayers.layer1.style.backgroundPosition = "center";
            backgroundLayers.layer2.style.backgroundPosition = "center";
    }

    // 清除body的背景样式，让两层背景系统接管
    document.body.style.backgroundRepeat = "";
    document.body.style.backgroundSize = "";
    document.body.style.backgroundPosition = "";
    document.body.style.backgroundImage = "";
}

