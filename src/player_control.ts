import { config } from './utils/config';
import { elements } from './utils/elementManager';
import { debugLogger } from './utils/logger';
import { FluidEffect } from './fluid';
import { hasPlaybackContent } from './utils/playback';
import { getColor, getPalette } from 'colorthief';

// 进度条定时器
let timelineTimer: ReturnType<typeof setTimeout> | null = null;
let currentPosition = 0;
let waitingForData = false;

// 上一次播放状态，用于检测是否真的状态变化
let lastPlaybackState = -1;

// DOM元素引用（从 elementManager 获取）
const player_control = elements.playerControl.container;
const player_control_background = elements.playerControl.background;
const player_control_thumbnail = elements.playerControl.thumbnail;
const player_control_thumbnailWrap = elements.playerControl.thumbnailWrap;
const player_control_info = elements.playerControl.info;
const player_control_title = elements.playerControl.title;
const player_control_artist = elements.playerControl.artist;
const player_control_albumTitle = elements.playerControl.albumTitle;
const player_control_timeline = elements.playerControl.timeline;
const player_control_aubar = elements.playerControl.aubar;


/*msct封面*/
async function wallpaperMediaThumbnailListener(event: MediaThumbnailEvent): Promise<void> {
    if (event && config.player_control_show) {
        player_control_thumbnail.src = event.thumbnail;

        const img = elements.playerControl.thumbnail;
        img.onload = async function () {
            const [palette, dominantColor] = await Promise.all([
                getPalette(player_control_thumbnail, { colorCount: 3 }),
                getColor(player_control_thumbnail)
            ]);

            const playerControlYakelicColor = config.player_control_yakelic_color;
            const playerControlColor = config.player_control_color;

            // ColorImpl 对象转换为 RGB 数组
            const colorToRgb = (color: [number, number, number] | { rgb(): { r: number; g: number; b: number } } | null | undefined): [number, number, number] | null => {
                if (!color) return null;
                if (Array.isArray(color)) {
                    return color as [number, number, number];
                }
                // colorthief Color object with rgb() method
                const rgb = color.rgb();
                return [rgb.r, rgb.g, rgb.b];
            };

            config.runtime.playerInfo.colorGroup = [
                [
                    hexToRgb(event.primaryColor),
                    hexToRgb(event.secondaryColor),
                    hexToRgb(event.tertiaryColor),
                    hexToRgb(event.highContrastColor),
                ],
                [
                    colorToRgb(dominantColor),
                    colorToRgb(palette?.[0]),
                    colorToRgb(palette?.[1]),
                    colorToRgb(palette?.[2])
                ],
                playerControlYakelicColor,
                playerControlColor
            ];

            // 初始化或更新流体效果（只在有播放内容时）
            if (config.runtime.FluidEffect && config.runtime.FluidEffect.enabled) {
                const hasContent = hasPlaybackContent();
                if (hasContent) {
                    config.runtime.FluidEffect.initNormalEffect();
                    if (config.runtime.playerInfo.playerState === 2 && config.runtime.FluidEffect.normalEffect?.setPlayState) {
                        config.runtime.FluidEffect.normalEffect.setPlayState(false);
                    }
                }
            }

            // 更新全屏流体效果
            if (config.runtime.FluidEffect?.fullscreenEnabled && hasPlaybackContent()) {
                config.runtime.FluidEffect.updateFullscreenSource();
            }

            setTimeout(() => thumbnailsue(), 50);
        };
    }
}

/*msct进度*/
function wallpaperMediaTimelineListener(event: MediaTimelineEvent): void {
    const { position: pos, duration: dur } = event;

    waitingForData = false;
    currentPosition = pos;

    if (timelineTimer) {
        clearTimeout(timelineTimer);
        timelineTimer = null;
    }

    function updateTimeline(): void {
        if (waitingForData) return;

        if (config.runtime.playerInfo.playerState === 0 ||
            config.runtime.playerInfo.playerState === 2) {
            timelineTimer = setTimeout(updateTimeline, 500);
            return;
        }

        currentPosition += 0.1;
        if (currentPosition >= dur) {
            currentPosition = dur;
            waitingForData = true;
        }

        const progressPercent = (currentPosition / dur) * 100;
        player_control_timeline.style.width = progressPercent + "%";

        if (!waitingForData) {
            timelineTimer = setTimeout(updateTimeline, 100);
        } else {
            timelineTimer = null;
        }
    }

    updateTimeline();
}

/*msct监听*/
function wallpaperMediaPropertiesListener(event: MediaPropertiesEvent): void {
    if (event) {
        debugLogger.info(`[Player] 收到新歌曲信息: ${event.title || '未知'} - ${event.artist || '未知'}`);

        config.runtime.playerInfo.singtitle = event.title || '';
        config.runtime.playerInfo.singartist = event.artist || '';
        config.runtime.playerInfo.singalbumTitle = event.albumTitle || '';
        config.runtime.playerInfo.aubarstop = true;

        player_control_aubar.width = 0;
        player_control_aubar.height = 0;

        const playerControlShow = config.player_control_show;
        if (playerControlShow && config.runtime.playerInfo.singtitle && config.runtime.playerInfo.singtitle !== '') {
            player_control.style.display = 'flex';
        } else {
            player_control.style.display = 'none';
        }
    } else {
        player_control.style.display = 'none';
    }

    const playerControlShow = config.player_control_show;
    if (!playerControlShow || config.runtime.playerInfo.singtitle === undefined || config.runtime.playerInfo.singtitle === '') return;

    playertitle();

    const playerControlVisualaudiobar = config.player_control_visualaudiobar;
    if (playerControlVisualaudiobar) pc_aubar();
}

export function playertitle(): void {
    let titleToShow = config.runtime.playerInfo.singtitle || '';
    let artistToShow = config.runtime.playerInfo.singartist || '';
    let albumToShow = config.runtime.playerInfo.singalbumTitle || '';
    const playerControlAutohide = config.player_control_autohide;
    const playerControlShow = config.player_control_show;
    const playerControlThumbnailrorl = config.player_control_thumbnailrorl;
    const playerControlSamealbumTitle = config.player_control_samealbum_title;

    if ((!titleToShow || titleToShow === "loading...") && !playerControlAutohide && playerControlShow) {
        titleToShow = "✧ପ(๑･ω･)੭";
        artistToShow = "少女祈祷中……";
        albumToShow = "";
    }

    let titleEl: Element, artistEl: Element, albumEl: Element;

    if (playerControlThumbnailrorl === false) {
        titleEl = player_control_title.querySelector(".left")!;
        artistEl = player_control_artist.querySelector(".left")!;
        albumEl = player_control_albumTitle.querySelector(".left")!;
        const rightElements = player_control.querySelectorAll(".right");
        for (let i = 0; i < rightElements.length; i++) rightElements[i].innerHTML = '';
    } else {
        titleEl = player_control_title.querySelector(".right")!;
        artistEl = player_control_artist.querySelector(".right")!;
        albumEl = player_control_albumTitle.querySelector(".right")!;
        const leftElements = player_control.querySelectorAll(".left");
        for (let i = 0; i < leftElements.length; i++) leftElements[i].innerHTML = '';
    }

    titleEl.innerHTML = titleToShow;
    artistEl.innerHTML = artistToShow;
    albumEl.innerHTML = albumToShow;

    if (albumToShow !== titleToShow || playerControlSamealbumTitle === true) {
        player_control_albumTitle.style.display = '';
    } else {
        player_control_albumTitle.style.display = 'none';
    }
}

/*msct状态*/
function wallpaperMediaPlaybackListener(event: MediaPlaybackEvent): void {
    if (event) {
        // 获取新状态
        let newState = -1;
        if (event.state === window.wallpaperMediaIntegration?.PLAYBACK_PLAYING) {
            newState = 1;
        } else if (event.state === window.wallpaperMediaIntegration?.PLAYBACK_PAUSED) {
            newState = 2;
        } else if (event.state === window.wallpaperMediaIntegration?.PLAYBACK_STOPPED) {
            newState = 0;
        }

        // 只有状态真正变化时才处理
        if (newState !== lastPlaybackState && newState !== -1) {
            lastPlaybackState = newState;

            // 同步更新 config.runtime.playerInfo.playerState
            if (newState === 1) {
                config.runtime.playerInfo.playerState = 1;
                config.playbackState = 1;
                debugLogger.info('[Player] 播放');
            } else if (newState === 2) {
                config.runtime.playerInfo.playerState = 2;
                config.playbackState = 2;
                debugLogger.info('[Player] 暂停');
            } else if (newState === 0) {
                config.runtime.playerInfo.playerState = 0;
                config.playbackState = 0;
                debugLogger.info('[Player] 停止');
            }
        }
    }

    const playerControlShow = config.player_control_show;
    const playerControlAutohide = config.player_control_autohide;
    const playerControlThumbnailRotation = config.player_control_thumbnail_rotation;
    const playerControlThumbnailRotationSpeed = config.player_control_thumbnail_rotation_speed;

    if (playerControlShow) {
        if (event.state === window.wallpaperMediaIntegration?.PLAYBACK_PLAYING ||
            event.state === window.wallpaperMediaIntegration?.PLAYBACK_PAUSED) {
            player_control.style.display = "flex";
        } else if (event.state === window.wallpaperMediaIntegration?.PLAYBACK_STOPPED) {
            player_control.style.display = playerControlAutohide ? "none" : "flex";
        }
    } else {
        return;
    }

    controlFluidEffectPlayback(event.state);

    if (!playerControlThumbnailRotation) return;

    if (event.state === window.wallpaperMediaIntegration?.PLAYBACK_STOPPED ||
        event.state === window.wallpaperMediaIntegration?.PLAYBACK_PAUSED) {
        player_control_thumbnail.style.animationPlayState = 'paused';
    } else {
        player_control_thumbnail.style.borderRadius = '50%';
        if (!player_control_thumbnail.style.animation.includes('spin')) {
            player_control_thumbnail.style.animation = `spin ${playerControlThumbnailRotationSpeed}s linear infinite`;
        }
        player_control_thumbnail.style.animationPlayState = 'running';
    }
}

// 控制流体效果播放状态
function controlFluidEffectPlayback(playbackState: number): void {
    if (!config.runtime.FluidEffect || config.runtime.FluidEffect.enabled === undefined) return;
    if (!window.wallpaperMediaIntegration) return;

    if (config.runtime.FluidEffect.enabled && !config.runtime.FluidEffect.fullscreenEnabled) {
        if (playbackState === window.wallpaperMediaIntegration.PLAYBACK_PLAYING) {
            resumeFluidEffect();
        } else if (playbackState === window.wallpaperMediaIntegration.PLAYBACK_PAUSED) {
            pauseFluidEffect();
        } else if (playbackState === window.wallpaperMediaIntegration.PLAYBACK_STOPPED) {
            stopFluidEffect();
        }
    }

    if (config.runtime.FluidEffect.fullscreenEnabled) {
        if (playbackState === window.wallpaperMediaIntegration.PLAYBACK_PLAYING) {
            resumeFullscreenFluidEffect();
        } else if (playbackState === window.wallpaperMediaIntegration.PLAYBACK_PAUSED) {
            pauseFullscreenFluidEffect();
        } else if (playbackState === window.wallpaperMediaIntegration.PLAYBACK_STOPPED) {
            stopFullscreenFluidEffect();
        }
    }
}

function resumeFluidEffect(): void {
    if (!hasPlaybackContent()) return;
    // 使用 config.runtime.FluidEffect（来自 fluid.ts）
    if (!config.runtime.FluidEffect?.normalEffect && config.runtime.FluidEffect?.enabled) {
        config.runtime.FluidEffect.initNormalEffect();
    }
    if (config.runtime.FluidEffect?.normalEffect?.setPlayState) config.runtime.FluidEffect.normalEffect.setPlayState(true);
}

function pauseFluidEffect(): void {
    if (config.runtime.FluidEffect?.normalEffect?.setPlayState) config.runtime.FluidEffect.normalEffect.setPlayState(false);
}

function stopFluidEffect(): void {
    if (config.runtime.FluidEffect) {
        if (config.runtime.FluidEffect.normalEffect?.stop) config.runtime.FluidEffect.normalEffect.stop();
        config.runtime.FluidEffect.destroyNormalEffect();
    }
}

function resumeFullscreenFluidEffect(): void {
    if (!hasPlaybackContent()) return;
    if (config.runtime.FluidEffect?.fullscreenEffect?.setPlayState) {
        config.runtime.FluidEffect.fullscreenEffect.setPlayState(true);
    } else if (config.runtime.FluidEffect?.fullscreenEnabled) {
        config.runtime.FluidEffect.initFullscreenEffect();
    }
}

function pauseFullscreenFluidEffect(): void {
    if (config.runtime.FluidEffect?.fullscreenEffect?.setPlayState) config.runtime.FluidEffect.fullscreenEffect.setPlayState(false);
}

function stopFullscreenFluidEffect(): void {
    if (config.runtime.FluidEffect) {
        if (config.runtime.FluidEffect.fullscreenEffect?.stop) config.runtime.FluidEffect.fullscreenEffect.stop();
        config.runtime.FluidEffect.destroyFullscreenEffect();
    }
}

export function thumbnailsue(): void {
    if (!config.runtime.playerInfo.colorGroup) return;

    const colorPickupMethod = config.color_pickup_method;
    const playerControlYakelibgusetb = config.player_control_yakelibgusetb;
    const playerControlFontusetb = config.player_control_fontusetb;
    const playerControlYakeli = config.player_control_yakeli;
    const playerControlColor = config.player_control_color;

    let thumbnailcolor: [number, number, number] | string | null;

    if (playerControlYakelibgusetb !== 5) {
        thumbnailcolor = config.runtime.playerInfo.colorGroup[colorPickupMethod - 1][playerControlYakelibgusetb - 1];
    } else {
        thumbnailcolor = playerControlYakeli;
    }

    if (playerControlFontusetb !== 5) {
        config.runtime.playerInfo.fontcolor = config.runtime.playerInfo.colorGroup[colorPickupMethod - 1][playerControlFontusetb - 1];
    } else {
        config.runtime.playerInfo.fontcolor = playerControlColor;
    }

    player_control_background.style.background = "rgba(" + thumbnailcolor + "," + playerControlYakeli + ")";
    player_control_info.style.color = "rgb(" + config.runtime.playerInfo.fontcolor + ")";
    player_iconcolor(config.runtime.playerInfo.fontcolor);
    player_control_timeline.style.backgroundColor = "rgb(" + config.runtime.playerInfo.fontcolor + ")";

    const timelineEl = elements.playerControl.timeline?.parentElement;
    if (timelineEl) timelineEl.style.backgroundColor = "rgba(" + [255, 255, 255] + "," + (playerControlYakeli + 0.4) + ")";
}

function player_iconcolor(rgb: [number, number, number] | string | null): void {
    const titleicon = elements.playerControl.title?.querySelector('.titleicon');
    const artisticon = elements.playerControl.artist?.querySelector('.artisticon');
    const albumTitleicon = elements.playerControl.albumTitle?.querySelector('.albumTitleicon');

    const filter = 'drop-shadow(0 10240px ' + 'rgb(' + rgb + '))';
    if (titleicon) (titleicon as HTMLElement).style.filter = filter;
    if (artisticon) (artisticon as HTMLElement).style.filter = filter;
    if (albumTitleicon) (albumTitleicon as HTMLElement).style.filter = filter;
}

export function pc_aubar(): void {
    const full = elements.playerControl.info?.parentElement;
    const usage = elements.playerControl.info;
    const aubar = elements.playerControl.aubar;
    if (!aubar || !full || !usage) return;

    const rgbbg = aubar.getContext('2d');
    if (!rgbbg) return;

    const height = full.clientHeight - usage.clientHeight;
    const width = full.clientWidth;

    aubar.width = width;
    aubar.height = height;

    config.runtime.playerInfo.aubarstop = false;

    const previousHeights = new Array(64).fill(aubar.height);
    const barHeights = new Array(64).fill(0);

    function lerp(start: number, end: number, amount: number): number {
        return (1 - amount) * start + amount * end;
    }

    const draw = (): void => {
        rgbbg.clearRect(0, 0, aubar.width, aubar.height);
        const barWidth = aubar.width / 64;
        rgbbg.fillStyle = 'rgb(' + config.runtime.playerInfo.fontcolor + ')';

        // 每次绘制时获取最新的音频数据
        const currentAudioArr = config.runtime.playerInfo.audioArray;

        for (let i = 0, l = 64; i < 64; ++i, ++l) {
            const bar = (currentAudioArr[i] + currentAudioArr[l]) / 2;
            const targetHeight = aubar.height * Math.min(bar, 1) * config.player_control_scalefactor;
            const actualHeight = Math.min(targetHeight, aubar.height);

            barHeights[i] = lerp(barHeights[i], actualHeight, config.player_control_hdong);

            rgbbg.fillRect(barWidth * i, aubar.height - barHeights[i], barWidth, barHeights[i]);
        }

        if (!config.runtime.playerInfo.aubarstop && config.player_control_visualaudiobar && config.runtime.playerInfo.playerState !== 0) {
            requestAnimationFrame(draw);
        } else {
            rgbbg.clearRect(0, 0, aubar.width, aubar.height);
        }
    };

    const drawline = (): void => {
        rgbbg.clearRect(0, 0, aubar.width, aubar.height);
        rgbbg.lineWidth = 2;
        rgbbg.strokeStyle = 'rgb(' + config.runtime.playerInfo.fontcolor + ')';
        const spacing = aubar.width / 64;

        // 每次绘制时获取最新的音频数据
        const currentAudioArr = config.runtime.playerInfo.audioArray;

        rgbbg.beginPath();

        // 计算所有高度点
        const heights: number[] = [];
        for (let i = 0, l = 64; i < 64; ++i, ++l) {
            const amplitude = (currentAudioArr[i] + currentAudioArr[l]) / 2;
            let targetHeight = aubar.height - aubar.height * Math.min(amplitude, 1) * config.player_control_scalefactor;
            targetHeight = Math.max(0, Math.min(targetHeight, aubar.height));
            previousHeights[i] = lerp(previousHeights[i], targetHeight, config.player_control_hdong);
            heights[i] = previousHeights[i];
        }

        if (heights.length < 2) {
            if (!config.runtime.playerInfo.aubarstop && config.player_control_visualaudiobar && config.runtime.playerInfo.playerState !== 0) {
                requestAnimationFrame(drawline);
            }
            return;
        }

        // 起始点
        rgbbg.moveTo(0, heights[0]);

        // 使用三次贝塞尔曲线连接所有点，实现真正的平滑
        for (let i = 0; i < heights.length - 1; i++) {
            const x0 = i > 0 ? spacing * (i - 1) : 0;
            const y0 = heights[i - 1] ?? heights[0];
            const x1 = spacing * i;
            const y1 = heights[i];
            const x2 = spacing * (i + 1);
            const y2 = heights[i + 1];
            const x3 = i < heights.length - 2 ? spacing * (i + 2) : x2;
            const y3 = heights[i + 2] ?? y2;

            // Catmull-Rom 样条转贝塞尔曲线控制点
            const cp1x = x1 + (x2 - x0) / 6;
            const cp1y = y1 + (y2 - y0) / 6;
            const cp2x = x2 - (x3 - x1) / 6;
            const cp2y = y2 - (y3 - y1) / 6;

            rgbbg.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, x2, y2);
        }

        rgbbg.stroke();

        if (!config.runtime.playerInfo.aubarstop && config.player_control_visualaudiobar && config.runtime.playerInfo.playerState !== 0) {
            requestAnimationFrame(drawline);
        } else {
            rgbbg.clearRect(0, 0, aubar.width, aubar.height);
        }
    };

    const playerControlBarline = config.player_control_barline;
    const playerControlVisualaudiobar = config.player_control_visualaudiobar;

    if (playerControlVisualaudiobar && playerControlBarline == 2) {
        drawline();
    } else if (playerControlVisualaudiobar && playerControlBarline == 1) {
        draw();
    }
}

// 注册Wallpaper Engine媒体监听器
window.wallpaperRegisterMediaThumbnailListener?.(wallpaperMediaThumbnailListener);
window.wallpaperRegisterMediaTimelineListener?.(wallpaperMediaTimelineListener);
window.wallpaperRegisterMediaPropertiesListener?.(wallpaperMediaPropertiesListener);
window.wallpaperRegisterMediaPlaybackListener?.(wallpaperMediaPlaybackListener);

// 辅助函数
function hexToRgb(hex: string): [number, number, number] {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? [
        parseInt(result[1], 16),
        parseInt(result[2], 16),
        parseInt(result[3], 16)
    ] : [0, 0, 0];
}
