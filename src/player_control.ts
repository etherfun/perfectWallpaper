// 播放器控制模块 - 从 player_control.js 迁移

import { appConfig, config } from './utils/config';
import { elements } from './utils/elementManager';
import { debugLogger } from './utils/logger';
import {
    initFluidEffect,
    initFullscreenFluidEffect,
    updateFullscreenFluidSource
} from './fluid_control';
import { getColor, getPalette } from 'colorthief';

// 进度条定时器
let timelineTimer: any = null;
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

// 检查是否有播放内容的函数
export function hasPlaybackContent(): boolean {
    const { singtitle } = appConfig.runtime.playerInfo;

    const hasSongInfo = singtitle &&
        singtitle !== '' &&
        singtitle !== 'loading...' &&
        singtitle !== '✧ପ(๑･ω･)੭' &&
        singtitle !== '٩(๑❛ᴗ❛๑)۶';

    if (!hasSongInfo) {
        return false;
    }

    const isPlaying = appConfig.runtime.playerInfo.playerState === 1;
    const isPaused = appConfig.runtime.playerInfo.playerState === 2;

    if (!isPlaying && !isPaused) {
        return false;
    }

    return true;
}

/*msct封面*/
async function wallpaperMediaThumbnailListener(event: MediaThumbnailEvent): Promise<void> {
    if (event && config.playerControlShow) {
        player_control_thumbnail.src = event.thumbnail;

        const img = elements.playerControl.thumbnail;
        img.onload = async function () {
            const [palette, dominantColor] = await Promise.all([
                getPalette(player_control_thumbnail, { colorCount: 3 }),
                getColor(player_control_thumbnail)
            ]);

            const playerControlYakelicColor = config.playerControlYakelicColor;
            const playerControlColor = config.playerControlColor;

            // ColorImpl 对象转换为 RGB 数组
            const colorToRgb = (color: any): [number, number, number] | null => {
                if (!color) return null;
                return [color._r ?? color.r ?? 0, color._g ?? color.g ?? 0, color._b ?? color.b ?? 0];
            };

            appConfig.runtime.playerInfo.colorGroup = [
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
            if (appConfig.runtime.FluidEffectConfig && appConfig.runtime.FluidEffectConfig.enabled) {
                const hasContent = hasPlaybackContent();
                if (hasContent) {
                    initFluidEffect();
                    if (appConfig.runtime.playerInfo.playerState === 2 && appConfig.runtime.fluidEffect?.setPlayState) {
                        appConfig.runtime.fluidEffect.setPlayState(false);
                    }
                }
            }

            // 更新全屏流体效果
            if (appConfig.runtime.FluidEffectConfig?.fullscreenEnabled && hasPlaybackContent()) {
                updateFullscreenFluidSource();
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

        if (appConfig.runtime.playerInfo.playerState === 0 ||
            appConfig.runtime.playerInfo.playerState === 2) {
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

        appConfig.runtime.playerInfo.singtitle = event.title || '';
        appConfig.runtime.playerInfo.singartist = event.artist || '';
        appConfig.runtime.playerInfo.singalbumTitle = event.albumTitle || '';
        appConfig.runtime.playerInfo.aubarstop = true;

        player_control_aubar.width = 0;
        player_control_aubar.height = 0;

        const playerControlShow = config.playerControlShow;
        if (playerControlShow && appConfig.runtime.playerInfo.singtitle && appConfig.runtime.playerInfo.singtitle !== '') {
            player_control.style.display = 'flex';
        } else {
            player_control.style.display = 'none';
        }
    } else {
        player_control.style.display = 'none';
    }

    const playerControlShow = config.playerControlShow;
    if (!playerControlShow || appConfig.runtime.playerInfo.singtitle === undefined || appConfig.runtime.playerInfo.singtitle === '') return;

    playertitle();

    const playerControlVisualaudiobar = config.playerControlVisualaudiobar;
    if (playerControlVisualaudiobar) pc_aubar();
}

export function playertitle(): void {
    let titleToShow = appConfig.runtime.playerInfo.singtitle || '';
    let artistToShow = appConfig.runtime.playerInfo.singartist || '';
    let albumToShow = appConfig.runtime.playerInfo.singalbumTitle || '';
    const playerControlAutohide = config.playerControlAutohide;
    const playerControlShow = config.playerControlShow;
    const playerControlThumbnailrorl = config.playerControlThumbnailrorl;
    const playerControlSamealbumTitle = config.playerControlSamealbumTitle;

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

            // 同步更新 appConfig.runtime.playerInfo.playerState
            if (newState === 1) {
                appConfig.runtime.playerInfo.playerState = 1;
                config.playbackState = 1;
                debugLogger.info('[Player] 播放');
            } else if (newState === 2) {
                appConfig.runtime.playerInfo.playerState = 2;
                config.playbackState = 2;
                debugLogger.info('[Player] 暂停');
            } else if (newState === 0) {
                appConfig.runtime.playerInfo.playerState = 0;
                config.playbackState = 0;
                debugLogger.info('[Player] 停止');
            }
        }
    }

    const playerControlShow = config.playerControlShow;
    const playerControlAutohide = config.playerControlAutohide;
    const playerControlThumbnailRotation = config.playerControlThumbnailRotation;
    const playerControlThumbnailRotationSpeed = config.playerControlThumbnailRotationSpeed;

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
    if (!appConfig.runtime.FluidEffectConfig || appConfig.runtime.FluidEffectConfig.enabled === undefined) return;
    if (!window.wallpaperMediaIntegration) return;

    if (appConfig.runtime.FluidEffectConfig.enabled && !appConfig.runtime.FluidEffectConfig.fullscreenEnabled) {
        if (playbackState === window.wallpaperMediaIntegration.PLAYBACK_PLAYING) {
            resumeFluidEffect();
        } else if (playbackState === window.wallpaperMediaIntegration.PLAYBACK_PAUSED) {
            pauseFluidEffect();
        } else if (playbackState === window.wallpaperMediaIntegration.PLAYBACK_STOPPED) {
            stopFluidEffect();
        }
    }

    if (appConfig.runtime.FluidEffectConfig.fullscreenEnabled) {
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
    // 使用 appConfig.runtime.fluidEffect（来自 fluid_control.ts）
    if (!appConfig.runtime.fluidEffect && appConfig.runtime.FluidEffectConfig?.enabled) {
        initFluidEffect();
    }
    if (appConfig.runtime.fluidEffect?.setPlayState) appConfig.runtime.fluidEffect.setPlayState(true);
}

function pauseFluidEffect(): void {
    if (appConfig.runtime.fluidEffect?.setPlayState) appConfig.runtime.fluidEffect.setPlayState(false);
}

function stopFluidEffect(): void {
    if (appConfig.runtime.fluidEffect) {
        if (appConfig.runtime.fluidEffect.stop) appConfig.runtime.fluidEffect.stop();
        if (appConfig.runtime.fluidEffect.destroy) appConfig.runtime.fluidEffect.destroy();
        appConfig.runtime.fluidEffect = null;
    }
}

function resumeFullscreenFluidEffect(): void {
    if (!hasPlaybackContent()) return;
    if (appConfig.runtime.fullscreenFluidEffect?.setPlayState) {
        appConfig.runtime.fullscreenFluidEffect.setPlayState(true);
    } else if (appConfig.runtime.FluidEffectConfig?.fullscreenEnabled) {
        initFullscreenFluidEffect();
    }
}

function pauseFullscreenFluidEffect(): void {
    if (appConfig.runtime.fullscreenFluidEffect?.setPlayState) appConfig.runtime.fullscreenFluidEffect.setPlayState(false);
}

function stopFullscreenFluidEffect(): void {
    if (appConfig.runtime.fullscreenFluidEffect) {
        if (appConfig.runtime.fullscreenFluidEffect.stop) appConfig.runtime.fullscreenFluidEffect.stop();
        if (appConfig.runtime.fullscreenFluidEffect.destroy) appConfig.runtime.fullscreenFluidEffect.destroy();
        appConfig.runtime.fullscreenFluidEffect = null;
    }
}

export function thumbnailsue(): void {
    if (!appConfig.runtime.playerInfo.colorGroup) return;

    const colorPickupMethod = config.colorPickupMethod;
    const playerControlYakelibgusetb = config.playerControlYakelibgusetb;
    const playerControlFontusetb = config.playerControlFontusetb;
    const playerControlYakeli = config.playerControlYakeli;
    const playerControlColor = config.playerControlColor;

    let thumbnailcolor: any;

    if (playerControlYakelibgusetb !== 5) {
        thumbnailcolor = appConfig.runtime.playerInfo.colorGroup[colorPickupMethod - 1][playerControlYakelibgusetb - 1];
    } else {
        thumbnailcolor = playerControlYakeli;
    }

    if (playerControlFontusetb !== 5) {
        appConfig.runtime.playerInfo.fontcolor = appConfig.runtime.playerInfo.colorGroup[colorPickupMethod - 1][playerControlFontusetb - 1];
    } else {
        appConfig.runtime.playerInfo.fontcolor = playerControlColor;
    }

    player_control_background.style.background = "rgba(" + thumbnailcolor + "," + playerControlYakeli + ")";
    player_control_info.style.color = "rgb(" + appConfig.runtime.playerInfo.fontcolor + ")";
    player_iconcolor(appConfig.runtime.playerInfo.fontcolor);
    player_control_timeline.style.backgroundColor = "rgb(" + appConfig.runtime.playerInfo.fontcolor + ")";

    const timelineEl = elements.playerControl.timeline?.parentElement;
    if (timelineEl) timelineEl.style.backgroundColor = "rgba(" + [255, 255, 255] + "," + (playerControlYakeli + 0.4) + ")";
}

function player_iconcolor(rgb: any): void {
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

    appConfig.runtime.playerInfo.aubarstop = false;

    const previousHeights = new Array(64).fill(aubar.height);
    const barHeights = new Array(64).fill(0);

    function lerp(start: number, end: number, amount: number): number {
        return (1 - amount) * start + amount * end;
    }

    const draw = (): void => {
        rgbbg.clearRect(0, 0, aubar.width, aubar.height);
        const barWidth = aubar.width / 64;
        rgbbg.fillStyle = 'rgb(' + appConfig.runtime.playerInfo.fontcolor + ')';

        // 每次绘制时获取最新的音频数据
        const currentAudioArr = appConfig.runtime.playerInfo.audioArray;

        for (let i = 0, l = 64; i < 64; ++i, ++l) {
            const bar = (currentAudioArr[i] + currentAudioArr[l]) / 2;
            const targetHeight = aubar.height * Math.min(bar, 1) * config.playerControlScalefactor;
            const actualHeight = Math.min(targetHeight, aubar.height);

            barHeights[i] = lerp(barHeights[i], actualHeight, config.playerControlHdong);

            rgbbg.fillRect(barWidth * i, aubar.height - barHeights[i], barWidth, barHeights[i]);
        }

        if (!appConfig.runtime.playerInfo.aubarstop && config.playerControlVisualaudiobar && appConfig.runtime.playerInfo.playerState !== 0) {
            requestAnimationFrame(draw);
        } else {
            rgbbg.clearRect(0, 0, aubar.width, aubar.height);
        }
    };

    const drawline = (): void => {
        rgbbg.clearRect(0, 0, aubar.width, aubar.height);
        rgbbg.lineWidth = 2;
        rgbbg.strokeStyle = 'rgb(' + appConfig.runtime.playerInfo.fontcolor + ')';
        const spacing = aubar.width / 64;

        // 每次绘制时获取最新的音频数据
        const currentAudioArr = appConfig.runtime.playerInfo.audioArray;

        rgbbg.beginPath();

        // 计算所有高度点
        const heights: number[] = [];
        for (let i = 0, l = 64; i < 64; ++i, ++l) {
            const amplitude = (currentAudioArr[i] + currentAudioArr[l]) / 2;
            let targetHeight = aubar.height - aubar.height * Math.min(amplitude, 1) * config.playerControlScalefactor;
            targetHeight = Math.max(0, Math.min(targetHeight, aubar.height));
            previousHeights[i] = lerp(previousHeights[i], targetHeight, config.playerControlHdong);
            heights[i] = previousHeights[i];
        }

        if (heights.length < 2) {
            if (!appConfig.runtime.playerInfo.aubarstop && config.playerControlVisualaudiobar && appConfig.runtime.playerInfo.playerState !== 0) {
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

        if (!appConfig.runtime.playerInfo.aubarstop && config.playerControlVisualaudiobar && appConfig.runtime.playerInfo.playerState !== 0) {
            requestAnimationFrame(drawline);
        } else {
            rgbbg.clearRect(0, 0, aubar.width, aubar.height);
        }
    };

    const playerControlBarline = config.playerControlBarline;
    const playerControlVisualaudiobar = config.playerControlVisualaudiobar;

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
