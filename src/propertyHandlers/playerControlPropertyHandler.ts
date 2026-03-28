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
        config.playerControlShow = properties.player_control_show.value;
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
                // 检查播放器是否应该显示
                if (!player_control_show) {
                    player_control.style.display = "none";
                    return;
                }

                // 检查是否有歌曲信息
                const leftTitle = document.querySelector("#player_control .title .left") as HTMLElement | null;
                const rightTitle = document.querySelector("#player_control .title .right") as HTMLElement | null;
                const isTitleLoading = (leftTitle && leftTitle.innerText == "loading...") ||
                    (rightTitle && rightTitle.innerText == "loading...");

                // 如果有歌曲信息，保持显示
                if (!isTitleLoading) {
                    return;
                }

                // 没有歌曲信息，根据 autohide 设置处理
                if (config.playerControlAutohide) {
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
        config.playerControlScalefactor = properties.player_control_scalefactor.value;
    }

    if (properties.playery) {
        player_control.style.top = properties.playery.value + "%";
    }

    if (properties.playerx) {
        player_control.style.left = properties.playerx.value + "%";
    }

    // 外观
    if (properties.player_control_color) {
        const color = properties.player_control_color.value.split(' ').map((c: string) => Math.ceil(parseFloat(c) * 255));
        config.playerControlColor = color;
        elements.body.style.setProperty("--player-color", color.join(', '));
    }

    if (properties.player_control_blurcolor_show) {
        config.playerControlBlurcolorShow = properties.player_control_blurcolor_show.value;
        elements.body.style.setProperty("--player-blur-enabled", properties.player_control_blurcolor_show.value ? '1' : '0');
    }

    if (properties.player_control_blurcolor) {
        const blurcolor = properties.player_control_blurcolor.value.split(' ').map((c: string) => Math.ceil(parseFloat(c) * 255));
        config.playerControlBlurcolor = blurcolor;
        elements.body.style.setProperty("--player-blur-color", blurcolor.join(', '));
    }

    if (properties.player_control_yakeli_show) {
        config.playerControlYakeliShow = properties.player_control_yakeli_show.value;
        elements.body.style.setProperty("--player-yakeli-enabled", properties.player_control_yakeli_show.value ? '1' : '0');
    }

    if (properties.player_control_yakelicolor) {
        const yakeliccolor = properties.player_control_yakelicolor.value.split(' ').map((c: string) => Math.ceil(parseFloat(c) * 255));
        config.playerControlYakelicColor = yakeliccolor;
        elements.body.style.setProperty("--player-yakeli-color", yakeliccolor.join(', '));
    }

    if (properties.player_control_yakeli) {
        const yakeli = properties.player_control_yakeli.value / 100;
        config.playerControlYakeli = yakeli;
        elements.body.style.setProperty("--player-yakeli", String(yakeli));
    }

    if (properties.player_control_bluryakeli) {
        config.playerControlBluryakeli = properties.player_control_bluryakeli.value;
        elements.body.style.setProperty("--player-blur-yakeli", `${properties.player_control_bluryakeli.value}px`);
    }

    // 封面相对大小
    if (properties.player_control_thumbnail_size) {
        config.playerControlThumbnailSize = properties.player_control_thumbnail_size.value;
        if (properties.player_control_thumbnail_size.value) {
            player_control_thumbnailWrap.style.display = 'flex';
            player_control_thumbnailWrap.style.alignItems = 'center';
            player_control_thumbnailWrap.style.justifyContent = 'center';
        } else {
            player_control_thumbnail.style.width = config.playerControlSizeValue + 'px';
            player_control_thumbnail.style.height = config.playerControlSizeValue + 'px';
        }
    }

    // 大小
    if (properties.player_control_size) {
        const s = properties.player_control_size.value;
        config.playerControlSizeValue = Math.floor(config.screenHeight / 150 * s);
        player_control.style.fontSize = Math.floor(config.screenHeight / 300 * s) + 'px';
        player_control.style.lineHeight = Math.floor(config.screenHeight / 700 * s) + 'px';
        player_control_artist.style.lineHeight = Math.floor(config.screenHeight / 1000 * s) + 'px';
        player_control_albumTitle.style.lineHeight = Math.floor(config.screenHeight / 1000 * s) + 'px';
        if (config.playerControlThumbnailSize) {
            player_control_thumbnailWrap.style.width = config.playerControlSizeValue + 'px';
            player_control_thumbnailWrap.style.height = config.playerControlSizeValue + 'px';
            if (FirstLoad === false) {
                const ss = (config.playerControlSizeValue * (player_control_thumbnail_size_value / 100));
                player_control_thumbnail.style.width = ss + 'px';
                player_control_thumbnail.style.height = ss + 'px';
            }
        } else {
            player_control_thumbnail.style.width = config.playerControlSizeValue + 'px';
            player_control_thumbnail.style.height = config.playerControlSizeValue + 'px';
        }
    }

    // 封面相对大小
    if (properties.player_control_thumbnail_size_value) {
        const s = config.playerControlSizeValue;
        config.playerControlThumbnailSizeValue = properties.player_control_thumbnail_size_value.value;
        const ss = (s * (properties.player_control_thumbnail_size_value.value / 100));
        if (config.playerControlThumbnailSize) {
            player_control_thumbnailWrap.style.width = s + 'px';
            player_control_thumbnailWrap.style.height = s + 'px';
            player_control_thumbnail.style.width = ss + 'px';
            player_control_thumbnail.style.height = ss + 'px';
        }
    }

    // 圆角
    if (properties.player_control_roundedcorners) {
        const rounded = properties.player_control_roundedcorners.value;

        const updateCorners = () => {
            const height = parseFloat(getComputedStyle(player_control_thumbnail).height);
            if (!height) return;

            const radius = (height / 2) * (rounded / 100);
            const padding = (height / 2) * (rounded / 200);

            player_control.style.borderRadius = radius + 'px';
            player_control_thumbnail.style.borderRadius = radius + 'px';
            player_control_background.style.paddingRight = padding + 'px';
        };

        updateCorners();

        const observer = new ResizeObserver(() => {
            if (config.playerControlThumbnailRotation === false) updateCorners();
        });
        observer.observe(player_control_thumbnail);
    }

    // 封面旋转
    if (properties.player_control_thumbnail_rotation) {
        config.playerControlThumbnailRotation = properties.player_control_thumbnail_rotation.value;
        if (properties.player_control_thumbnail_rotation.value === false) {
            player_control_thumbnail.style.animation = '';
        } else {
            player_control_thumbnail.style.animation = `spin ${config.playerControlThumbnailRotationSpeed}s linear infinite`;
            player_control_thumbnail.style.borderRadius = '50%';
        }
    }

    if (properties.player_control_thumbnail_rotation_speed) {
        config.playerControlThumbnailRotationSpeed = 10 - properties.player_control_thumbnail_rotation_speed.value;
        if (player_control_thumbnail.style.animation) {
            player_control_thumbnail.style.animationDuration = config.playerControlThumbnailRotationSpeed + 's';
        }
    }

    // 透明度
    if (properties.player_control_timetransparency) {
        config.playerControlTimetransparency = properties.player_control_timetransparency.value;
        player_control.style.opacity = String(properties.player_control_timetransparency.value / 100);
    }

    if (properties.player_control_showwidth) {
        config.playerControlShowwidth = properties.player_control_showwidth.value;
        if (properties.player_control_showwidth.value === 0) {
            player_control_background.style.width = 'auto';
        } else {
            const s = properties.player_control_showwidth.value / 100;
            player_control_background.style.width = config.screenWidth * s + 'px';
        }
    }

    if (properties.player_control_yakelibgusetb) {
        config.playerControlYakelibgusetb = properties.player_control_yakelibgusetb.value;
        if (FirstLoad === false) {
            thumbnailsue();
        }
    }

    if (properties.player_control_fontusetb) {
        config.playerControlFontusetb = properties.player_control_fontusetb.value;
        if (FirstLoad === false) {
            thumbnailsue();
        }
    }

    if (properties.player_control_thumbnailrorl) {
        config.playerControlThumbnailrorl = properties.player_control_thumbnailrorl.value;
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
        if (properties.player_control_showaway.value === true) {
            player_control.style.transform = 'translate(-100%, 0)';
        } else {
            player_control.style.transform = 'translate(0, 0)';
        }
    }

    if (properties.player_control_samealbumtitle) {
        config.playerControlSamealbumTitle = properties.player_control_samealbumtitle.value;
        if (FirstLoad === false) {
            playertitle();
        }
    }

    if (properties.player_control_visualaudiobar) {
        config.playerControlVisualaudiobar = properties.player_control_visualaudiobar.value;
        if (FirstLoad === false) {
            pc_aubar();
        }
    }

    if (properties.player_control_barline) {
        config.playerControlBarline = properties.player_control_barline.value;
        if (FirstLoad === false) {
            pc_aubar();
        }
    }

    if (properties.player_control_getcolor) {
        config.colorPickupMethod = properties.player_control_getcolor.value;
        if (FirstLoad === false) {
            thumbnailsue();
        }
    }

    if (properties.player_control_hdong) {
        config.playerControlHdong = properties.player_control_hdong.value / 500;
    }

    if (FirstLoad) {
        debugLogger.info('[PlayerControl] 播放器参数初始化完成');
    }
}
