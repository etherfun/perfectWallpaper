import { WallpaperProperties } from './types';
import { config } from '../utils/config';
import { elements } from '../utils/elementManager';
import { pc_aubar, thumbnailsue, playertitle } from '../player_control';
import { debugLogger } from '@/utils/logger';

const player_control = elements.playerControl.container;
const player_control_thumbnail = elements.playerControl.thumbnail;
const player_control_thumbnailWrap = elements.playerControl.thumbnailWrap;
const player_control_background = elements.playerControl.background;
const player_control_info = elements.playerControl.info;
const player_control_artist = elements.playerControl.artist;
const player_control_albumTitle = elements.playerControl.albumTitle;

let player_control_show = false;
let player_control_thumbnail_size_value = 100;

/**
 * 处理播放器相关属性
 * @param properties 属性对象
 * @param FirstLoad 是否首次加载
 */
export function handlePlayerControlProperties(
    properties: WallpaperProperties,
    FirstLoad: boolean
): void {

    if (properties.player_control_show) {
        config.player_control_show = properties.player_control_show.value;
        player_control_show = properties.player_control_show.value;
        if (FirstLoad === false) {
            player_control.style.visibility = player_control_show ? 'visible' : 'hidden';
            player_control.style.display = player_control_show ? 'flex' : 'none';
            if (player_control_show) {
                thumbnailsue();
            }
        } else {
            player_control.style.display = "flex";
            player_control.style.visibility = player_control_show ? 'visible' : 'hidden';

            setTimeout(function () {
                if (!player_control_show) {
                    player_control.style.display = "none";
                    return;
                }

                const leftTitle = document.querySelector("#player_control .title .left") as HTMLElement | null;
                const rightTitle = document.querySelector("#player_control .title .right") as HTMLElement | null;
                const isTitleLoading = (leftTitle && leftTitle.innerText == "loading...") ||
                    (rightTitle && rightTitle.innerText == "loading...");

                if (!isTitleLoading) {
                    return;
                }

                if (config.player_control_autohide) {
                    player_control.style.display = "none";
                } else {
                    const titleElement = leftTitle || rightTitle;
                    const artistElement = document.querySelector("#player_control .artist .left") as HTMLElement ||
                        document.querySelector("#player_control .artist .right") as HTMLElement;

                    if (titleElement) {
                        titleElement.innerHTML = "✧ପ(๑･ω･)੭";
                    }
                    if (artistElement) {
                        artistElement.innerHTML = "少女祈祷中……";
                    }

                    const albumTitleElement = document.querySelector("#player_control .albumTitle") as HTMLElement | null;
                    if (albumTitleElement) {
                        albumTitleElement.style.display = 'none';
                    }
                }
            }, 3000);
        }
    }

    if (properties.player_control_scalefactor) {
        config.player_control_scalefactor = properties.player_control_scalefactor.value;
    }

    if (properties.playery) {
        config.playery = properties.playery.value;
        player_control.style.top = properties.playery.value + "%";
    }

    if (properties.playerx) {
        config.playerx = properties.playerx.value;
        player_control.style.left = properties.playerx.value + "%";
    }

    if (properties.player_control_color) {
        const color = properties.player_control_color.value.split(' ').map((c: string) => Math.ceil(parseFloat(c) * 255));
        config.player_control_color = color;
        elements.body.style.setProperty("--player-color", color.join(', '));
    }

    if (properties.player_control_blurcolor_show) {
        config.player_control_blurcolor_show = properties.player_control_blurcolor_show.value;
        elements.body.style.setProperty("--player-blur-enabled", properties.player_control_blurcolor_show.value ? '1' : '0');
    }

    if (properties.player_control_blurcolor) {
        const blurcolor = properties.player_control_blurcolor.value.split(' ').map((c: string) => Math.ceil(parseFloat(c) * 255));
        config.player_control_blurcolor = blurcolor;
        elements.body.style.setProperty("--player-blur-color", blurcolor.join(', '));
    }

    if (properties.player_control_yakeli_show) {
        config.player_control_yakeli_show = properties.player_control_yakeli_show.value;
        elements.body.style.setProperty("--player-yakeli-enabled", properties.player_control_yakeli_show.value ? '1' : '0');
    }

    if (properties.player_control_yakelicolor) {
        const yakeliccolor = properties.player_control_yakelicolor.value.split(' ').map((c: string) => Math.ceil(parseFloat(c) * 255));
        config.player_control_yakelic_color = yakeliccolor;
        elements.body.style.setProperty("--player-yakeli-color", yakeliccolor.join(', '));
    }

    if (properties.player_control_yakeli) {
        const yakeli = properties.player_control_yakeli.value / 100;
        config.player_control_yakeli = yakeli;
        elements.body.style.setProperty("--player-yakeli", String(yakeli));
    }

    if (properties.player_control_bluryakeli) {
        config.player_control_bluryakeli = properties.player_control_bluryakeli.value;
        elements.body.style.setProperty("--player-blur-yakeli", `${properties.player_control_bluryakeli.value}px`);
    }

    if (properties.player_control_size) {
        const s = properties.player_control_size.value;
        config.player_control_size_value = Math.floor(config.screenHeight / 150 * s);
        player_control.style.fontSize = Math.floor(config.screenHeight / 300 * s) + 'px';
        player_control.style.lineHeight = Math.floor(config.screenHeight / 700 * s) + 'px';
        player_control_artist.style.lineHeight = Math.floor(config.screenHeight / 1000 * s) + 'px';
        player_control_albumTitle.style.lineHeight = Math.floor(config.screenHeight / 1000 * s) + 'px';
       
    }

    if (properties.player_control_thumbnail_size) {
        config.player_control_thumbnail_size = properties.player_control_thumbnail_size.value;
        if (config.player_control_thumbnail_size) {
            player_control_thumbnailWrap.style.display = 'flex';
            player_control_thumbnailWrap.style.alignItems = 'center';
            player_control_thumbnailWrap.style.justifyContent = 'center';
            player_control_thumbnailWrap.style.width = config.player_control_size_value + 'px';
            player_control_thumbnailWrap.style.height = config.player_control_size_value + 'px';
            if (FirstLoad === false) {
                const ss = (config.player_control_size_value * (player_control_thumbnail_size_value / 100));
                player_control_thumbnail.style.width = ss + 'px';
                player_control_thumbnail.style.height = ss + 'px';
            }
        } else {
            player_control_thumbnail.style.width = config.player_control_size_value + 'px';
            player_control_thumbnail.style.height = config.player_control_size_value + 'px';
            player_control_thumbnailWrap.style.width = config.player_control_size_value + 'px';
            player_control_thumbnailWrap.style.height = config.player_control_size_value + 'px';
        }
    }

    if (properties.player_control_thumbnail_size_value) {
        const s = config.player_control_size_value;
        config.player_control_thumbnail_size_value = properties.player_control_thumbnail_size_value.value;
        const ss = (s * (properties.player_control_thumbnail_size_value.value / 100));
        if (config.player_control_thumbnail_size) {
            player_control_thumbnailWrap.style.width = s + 'px';
            player_control_thumbnailWrap.style.height = s + 'px';
            player_control_thumbnail.style.width = ss + 'px';
            player_control_thumbnail.style.height = ss + 'px';
        }
    }

    if (properties.player_control_roundedcorners) {
        config.player_control_roundedcorners = properties.player_control_roundedcorners.value;
        const rounded = properties.player_control_roundedcorners.value;

        const updateCorners = () => {
            const height = parseFloat(getComputedStyle(player_control_thumbnail).height);
            if (!height) return;

            const radius = (height / 2) * (rounded / 100);
            const padding = (height / 2) * (rounded / 200);

            player_control.style.borderRadius = radius + 'px';
            player_control_background.style.paddingRight = padding + 'px';

            // 只有当旋转功能关闭时才设置圆角
            if (config.player_control_thumbnail_rotation !== true) {
                player_control_thumbnail.style.borderRadius = radius + 'px';
                player_control_thumbnailWrap.classList.remove('circular');
            }
        };

        updateCorners();

        const observer = new ResizeObserver(() => {
            if (config.player_control_thumbnail_rotation === false) updateCorners();
        });
        observer.observe(player_control_thumbnail);
    }

    if (properties.player_control_thumbnail_rotation) {
        config.player_control_thumbnail_rotation = properties.player_control_thumbnail_rotation.value;
        if (properties.player_control_thumbnail_rotation.value === false) {
            player_control_thumbnail.style.animation = '';
            player_control_thumbnailWrap.classList.remove('circular');
        } else {
            player_control_thumbnail.style.animation = `spin ${config.player_control_thumbnail_rotation_speed}s linear infinite`;
            player_control_thumbnailWrap.classList.add('circular');
        }
    }

    if (properties.player_control_thumbnail_rotation_speed) {
        config.player_control_thumbnail_rotation_speed = 10 - properties.player_control_thumbnail_rotation_speed.value;
        if (player_control_thumbnail.style.animation) {
            player_control_thumbnail.style.animationDuration = config.player_control_thumbnail_rotation_speed + 's';
        }
    }

    if (properties.player_control_timetransparency) {
        config.player_control_timetransparency = properties.player_control_timetransparency.value;
        player_control.style.opacity = String(properties.player_control_timetransparency.value / 100);
    }

    if (properties.player_control_showwidth) {
        config.player_control_showwidth = properties.player_control_showwidth.value;
        if (properties.player_control_showwidth.value === 0) {
            player_control_background.style.width = 'auto';
        } else {
            const s = properties.player_control_showwidth.value / 100;
            player_control_background.style.width = config.screenWidth * s + 'px';
        }
    }

    if (properties.player_control_yakelibgusetb) {
        config.player_control_yakelibgusetb = properties.player_control_yakelibgusetb.value;
        if (FirstLoad === false) {
            thumbnailsue();
        }
    }

    if (properties.player_control_fontusetb) {
        config.player_control_fontusetb = properties.player_control_fontusetb.value;
        if (FirstLoad === false) {
            thumbnailsue();
        }
    }

    if (properties.player_control_thumbnailrorl) {
        config.player_control_thumbnailrorl = properties.player_control_thumbnailrorl.value;
        if (properties.player_control_thumbnailrorl.value === true) {
            setTimeout(function () {
                player_control_background.style.flexDirection = 'row-reverse';
                const rawpadding = window.getComputedStyle(player_control_background).paddingRight;
                player_control_background.style.paddingRight = '';
                player_control_background.style.paddingLeft = rawpadding;
                player_control_info.style.alignItems = 'flex-end';
            }, 2500);
        } else {
            if (FirstLoad === false) {
                player_control_background.style.flexDirection = 'row';
                const rawpadding = window.getComputedStyle(player_control_background).paddingLeft;
                player_control_background.style.paddingLeft = '';
                player_control_background.style.paddingRight = rawpadding;
                player_control_info.style.alignItems = 'flex-start';
            }
        }
        if (FirstLoad === false) {
            thumbnailsue();
            playertitle();
        }
    }

    if (properties.player_control_showaway) {
        config.player_control_showaway = properties.player_control_showaway.value;
        if (properties.player_control_showaway.value === true) {
            player_control.style.transform = 'translate(-100%, 0)';
        } else {
            player_control.style.transform = 'translate(0, 0)';
        }
    }

    if (properties.player_control_samealbumtitle) {
        config.player_control_samealbum_title = properties.player_control_samealbumtitle.value;
        if (FirstLoad === false) {
            playertitle();
        }
    }

    if (properties.player_control_visualaudiobar) {
        config.player_control_visualaudiobar = properties.player_control_visualaudiobar.value;
        if (FirstLoad === false) {
            pc_aubar();
        }
    }

    if (properties.player_control_barline) {
        config.player_control_barline = properties.player_control_barline.value;
        if (FirstLoad === false) {
            pc_aubar();
        }
    }

    if (properties.player_control_getcolor) {
        config.color_pickup_method = properties.player_control_getcolor.value;
        if (FirstLoad === false) {
            thumbnailsue();
        }
    }

    if (properties.player_control_hdong) {
        config.player_control_hdong = properties.player_control_hdong.value / 500;
    }

    if (FirstLoad) {
        debugLogger.info('[PlayerControl] 播放器参数初始化完成');
    }
}
