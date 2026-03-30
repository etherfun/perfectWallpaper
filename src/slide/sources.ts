/**
 * Wallpaper sources - Bing, NASA, Lorem Picsum, etc.
 */

import { config } from "../utils/config";
import { elements } from "../utils/elementManager";
import { transitionBackground, updateFileList } from "./transition";
import { background2canvas } from "../RGB";
import { ChangeVideoModel } from "../video";
import { pictures, backgroundLayers } from "./types";

/** Clear picture info */
export function clearpicturesinfo(): void {
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

/** Show picture info */
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

/** Handle NASA image loading */
function doNasa(url: string): void {
    const img = new Image();
    img.src = url;
    img.onload = function () {
        transitionBackground(img.src);

        if (config.RGBShow) {
            config.runtime.photo.nextphoto = true;
            setTimeout(function () {
                background2canvas(img.src, false);
                config.runtime.photo.nextphoto = false;
            }, 100);
        }
    };
}

/** Should show wallpaper based on current mode */
export function shouldShow(): void {
    document.body.style.backgroundImage = "";

    switch (config.wallpaper_mode) {
        case 1: // Single wallpaper mode
            (elements.myvideo as HTMLVideoElement).src = "";
            backgroundLayers.container.style.display = "block";
            document.body.style.backgroundImage = "";

            let imageUrl: string;
            if (config.custom) {
                imageUrl = 'file:///' + config.custom;
            } else {
                imageUrl = config.backgroundRoute.replace(/^url\("(.+?)"\)$/, '$1');
            }

            transitionBackground(imageUrl);

            clearpicturesinfo();
            pictures.picture_info.style.display = "none";
            if (config.RGBShow) {
                config.runtime.photo.nextphoto = true;
                setTimeout(function () {
                    background2canvas(imageUrl, false);
                    config.runtime.photo.nextphoto = false;
                }, 100);
            }
            break;

        case 2: // Random mode
            (elements.myvideo as HTMLVideoElement).src = "";
            backgroundLayers.container.style.display = "block";
            if (config.runtime.myList.length) {
                transitionBackground('file:///' + config.runtime.photo.currentImg!);
            } else {
                transitionBackground("imgs/1.jpg");
            }
            clearpicturesinfo();
            pictures.picture_info.style.display = "none";
            if (config.RGBShow) {
                config.runtime.photo.nextphoto = true;
                setTimeout(function () {
                    background2canvas(config.runtime.photo.currentImg!, false);
                    config.runtime.photo.nextphoto = false;
                }, 100);
            }
            break;

        case 3: // Video mode
            ChangeVideoModel();
            clearpicturesinfo();
            backgroundLayers.container.style.display = "none";
            pictures.picture_info.style.display = "none";
            if (config.RGBShow) {
                config.runtime.photo.nextphoto = true;
                setTimeout(function () {
                    background2canvas(undefined, true);
                    config.runtime.photo.nextphoto = false;
                }, 100);
            }
            break;

        case 4: // Bing wallpaper
            if (config.picturesInfoShow && pictures.picture_info.style.display == "none") {
                pictures.picture_info.style.display = "flex";
            }
            elements.myvideo.src = "";
            backgroundLayers.container.style.display = "block";

            fetch("https://www.bing.com/HPImageArchive.aspx?format=js&idx=0&n=1&mkt=" + config.language)
                .then(response => response.json())
                .then((get: any) => {
                    config.runtime.photo.infomation.title = get.images[0].title;
                    config.runtime.photo.infomation.text = "";
                    config.runtime.photo.infomation.copyright = "";
                    config.runtime.photo.infomation.where = "";
                    const match = get.images[0].copyright.match(/\(([^)]+)\)/);
                    if (match) {
                        config.runtime.photo.infomation.copyright = match[1];
                        config.runtime.photo.infomation.where = get.images[0].copyright.replace(/\(([^)]+)\)/, '').trim();
                    }

                    picturesinfo_showrl(
                        config.runtime.photo.infomation.title,
                        config.runtime.photo.infomation.copyright,
                        config.runtime.photo.infomation.where,
                        config.runtime.photo.infomation.text
                    );

                    const bingurl = 'https://www.bing.com' + get.images[0].urlbase;
                    const img = new Image();
                    img.src = bingurl + "_UHD.jpg";

                    img.onload = function () {
                        transitionBackground(img.src);

                        if (config.RGBShow) {
                            config.runtime.photo.nextphoto = true;
                            setTimeout(function () {
                                background2canvas(img.src, false);
                                config.runtime.photo.nextphoto = false;
                            }, 100);
                        }
                    };
                });
            break;

        case 5: // Lorem Picsum
            elements.myvideo.src = "";
            backgroundLayers.container.style.display = "block";
            const timestamp = new Date().getTime();

            const loremImg = new Image();
            loremImg.src = "https://picsum.photos/3840/2160?random=" + timestamp;

            loremImg.onload = function () {
                transitionBackground(loremImg.src);

                if (config.RGBShow) {
                    config.runtime.photo.nextphoto = true;
                    setTimeout(function () {
                        background2canvas(loremImg.src, false);
                        config.runtime.photo.nextphoto = false;
                    }, 100);
                }
            };
            clearpicturesinfo();
            pictures.picture_info.style.display = "none";
            break;

        case 6: // NASA
            if (config.picturesInfoShow && pictures.picture_info.style.display == "none") {
                pictures.picture_info.style.display = "flex";
            }
            elements.myvideo.src = "";
            backgroundLayers.container.style.display = "block";

            const galaxyapi = config.galaxyapi;

            switch (galaxyapi) {
                case 2:
                    fetch("https://apod.nasa.gov/")
                        .then(response => response.text())
                        .then((get: any) => {
                            const parser = new DOMParser();
                            const doc = parser.parseFromString(get, 'text/html');
                            const url = "https://apod.nasa.gov/apod/" + doc.querySelector("img")?.getAttribute("src");

                            config.runtime.photo.infomation.title = doc.querySelector('b')?.textContent || "";
                            config.runtime.photo.infomation.text = doc.querySelectorAll('p')[2]?.textContent || "";
                            config.runtime.photo.infomation.copyright = doc.querySelectorAll('a')[2]?.textContent || "";
                            config.runtime.photo.infomation.where = "";
                            picturesinfo_showrl(
                                config.runtime.photo.infomation.title,
                                config.runtime.photo.infomation.copyright,
                                config.runtime.photo.infomation.where,
                                config.runtime.photo.infomation.text
                            );
                            doNasa(url);
                        });
                    break;
                case 1:
                default:
                    fetch("https://api.nasa.gov/planetary/apod?api_key=DEMO_KEY&thumbs=true")
                        .then(response => response.json())
                        .then((get: any) => {
                            let url: string;
                            if (get.media_type == "video") {
                                url = get.thumbnail_url;
                            } else {
                                url = get.hdurl;
                            }

                            config.runtime.photo.infomation.title = get.title;
                            config.runtime.photo.infomation.text = get.explanation;
                            if (get.copyright == undefined) {
                                config.runtime.photo.infomation.copyright = "";
                            } else {
                                config.runtime.photo.infomation.copyright = get.copyright;
                            }
                            config.runtime.photo.infomation.where = "";
                            picturesinfo_showrl(
                                config.runtime.photo.infomation.title,
                                config.runtime.photo.infomation.copyright,
                                config.runtime.photo.infomation.where,
                                config.runtime.photo.infomation.text
                            );

                            doNasa(url);
                        });
                    break;
            }
            break;

        case 7: // 次元api
            elements.myvideo.src = "";
            backgroundLayers.container.style.display = "block";

            fetch(config.chiyuanapi)
                .then(response => response.text())
                .then((getchiyuan: any) => {
                    const img = new Image();
                    img.src = getchiyuan;

                    img.onload = function () {
                        transitionBackground(img.src);

                        if (config.RGBShow) {
                            config.runtime.photo.nextphoto = true;
                            setTimeout(function () {
                                background2canvas(img.src, false);
                                config.runtime.photo.nextphoto = false;
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
            elements.myvideo.src = "";
            backgroundLayers.container.style.display = "block";

            const city = config.language.slice(3);

            fetch(`https://fd.api.iris.microsoft.com/v4/api/selection?&placement=88000820&bcnt=1&country=${city}&locale=${config.language}&fmt=json`)
                .then(response => response.json())
                .then((get: any) => {
                    const rawjson = JSON.parse(get.batchrsp.items[0].item);

                    const url = rawjson.ad.landscapeImage.asset;
                    const img = new Image();
                    img.src = url;

                    config.runtime.photo.infomation.title = rawjson.ad.title;
                    config.runtime.photo.infomation.text = rawjson.ad.description;
                    config.runtime.photo.infomation.copyright = rawjson.ad.copyright;
                    config.runtime.photo.infomation.where = rawjson.ad.iconHoverText.split(/\r?\n/)[0].trim();
                    picturesinfo_showrl(
                        config.runtime.photo.infomation.title,
                        config.runtime.photo.infomation.copyright,
                        config.runtime.photo.infomation.where,
                        config.runtime.photo.infomation.text
                    );

                    img.onload = function () {
                        transitionBackground(img.src);

                        if (config.RGBShow) {
                            config.runtime.photo.nextphoto = true;
                            setTimeout(function () {
                                background2canvas(img.src, false);
                                config.runtime.photo.nextphoto = false;
                            }, 100);
                        }
                    };
                });
            break;

        case 9: // Custom
            if (config.picturesInfoShow && pictures.picture_info.style.display == "none") {
                pictures.picture_info.style.display = "flex";
            }
            elements.myvideo.src = "";
            backgroundLayers.container.style.display = "block";
            const customImg = new Image();
            customImg.src = config.picturesUrl;

            customImg.onload = function () {
                transitionBackground(customImg.src);

                if (config.RGBShow) {
                    config.runtime.photo.nextphoto = true;
                    setTimeout(function () {
                        background2canvas(customImg.src, false);
                        config.runtime.photo.nextphoto = false;
                    }, 100);
                }
            };
            clearpicturesinfo();
            pictures.picture_info.style.display = "none";
            break;

        default:
            backgroundLayers.container.style.display = "block";
            pictures.picture_info.style.display = "none";
    }
}
