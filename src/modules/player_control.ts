// 播放器控制模块 - 从 player_control.js 迁移

import { appConfig } from '../utils/config';
import { elements } from '../utils/elementManager';
import { debugLogger } from '../utils/logger';
import {
    initFluidEffect,
    initFullscreenFluidEffect,
    updateFullscreenFluidSource
} from './fluid_control';

// ColorThief 全局声明
declare const ColorThief: any;

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

// 运行时状态现在通过 appConfig.runtime.playerInfo 管理

// 检查是否有播放内容的函数
export function hasPlaybackContent(): boolean {
    const w = (window as any);
    const { singtitle } = appConfig.runtime.playerInfo;

    const hasSongInfo = singtitle &&
        singtitle !== '' &&
        singtitle !== 'loading...' &&
        singtitle !== '✧ପ(๑･ω･)੭' &&
        singtitle !== '٩(๑❛ᴗ❛๑)۶';

    if (!hasSongInfo) {
        return false;
    }

    if (!w.wallpaperMediaIntegration) {
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
function wallpaperMediaThumbnailListener(event: any): void {
    if (event && appConfig.getPlayerControlShow()) {
        player_control_thumbnail.src = event.thumbnail;

        const img = elements.playerControl.thumbnail;
        img.onload = function () {
            const colorThief = new ColorThief();
            const palette = colorThief.getPalette(player_control_thumbnail, 3);

            const playerControlYakelicColor = appConfig.getPlayerControlYakelicColor();
            const playerControlColor = appConfig.getPlayerControlColor();

            appConfig.runtime.playerInfo.colorGroup = [
                [
                    hexToRgb(event.primaryColor),
                    hexToRgb(event.secondaryColor),
                    hexToRgb(event.tertiaryColor),
                    hexToRgb(event.highContrastColor),
                ],
                [
                    colorThief.getColor(player_control_thumbnail),
                    palette[0],
                    palette[1],
                    palette[2]
                ],
                playerControlYakelicColor,
                playerControlColor
            ];

            debugLogger.info(`[Player] 收到新歌曲信息: ${event.title || '未知'} - ${event.artist || '未知'}`);

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
function wallpaperMediaTimelineListener(event: any): void {
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
function wallpaperMediaPropertiesListener(event: any): void {
    const w = (window as any);
    if (event) {
        appConfig.runtime.playerInfo.singtitle = event.title || '';
        appConfig.runtime.playerInfo.singartist = event.artist || '';
        appConfig.runtime.playerInfo.singalbumTitle = event.albumTitle || '';
        appConfig.runtime.playerInfo.aubarstop = true;

        player_control_aubar.width = 0;
        player_control_aubar.height = 0;

        const playerControlShow = appConfig.getPlayerControlShow();
        if (playerControlShow && appConfig.runtime.playerInfo.singtitle && appConfig.runtime.playerInfo.singtitle !== '') {
            player_control.style.display = 'flex';
        } else {
            player_control.style.display = 'none';
        }
    } else {
        player_control.style.display = 'none';
    }

    const playerControlShow = appConfig.getPlayerControlShow();
    if (!playerControlShow || appConfig.runtime.playerInfo.singtitle === undefined || appConfig.runtime.playerInfo.singtitle === '') return;

    playertitle();

    const playerControlVisualaudiobar = appConfig.getPlayerControlVisualaudiobar();
    if (playerControlVisualaudiobar) pc_aubar();
}

export function playertitle(): void {
    let titleToShow = appConfig.runtime.playerInfo.singtitle || '';
    let artistToShow = appConfig.runtime.playerInfo.singartist || '';
    let albumToShow = appConfig.runtime.playerInfo.singalbumTitle || '';
    const playerControlAutohide = appConfig.getPlayerControlAutohide();
    const playerControlShow = appConfig.getPlayerControlShow();
    const playerControlThumbnailrorl = appConfig.getPlayerControlThumbnailrorl();
    const playerControlSamealbumTitle = appConfig.getPlayerControlSamealbumTitle();

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
function wallpaperMediaPlaybackListener(event: any): void {
    const w = (window as any);
    if (event) {
        // 获取新状态
        let newState = -1;
        if (event.state === w.wallpaperMediaIntegration?.PLAYBACK_PLAYING) {
            newState = 1;
        } else if (event.state === w.wallpaperMediaIntegration?.PLAYBACK_PAUSED) {
            newState = 2;
        } else if (event.state === w.wallpaperMediaIntegration?.PLAYBACK_STOPPED) {
            newState = 0;
        }

        // 只有状态真正变化时才处理
        if (newState !== lastPlaybackState && newState !== -1) {
            lastPlaybackState = newState;

            // 同步更新 appConfig.runtime.playerInfo.playerState
            if (newState === 1) {
                appConfig.runtime.playerInfo.playerState = 1;
                appConfig.setPlaybackState(1);
                debugLogger.info('[Player] 播放');
            } else if (newState === 2) {
                appConfig.runtime.playerInfo.playerState = 2;
                appConfig.setPlaybackState(2);
                debugLogger.info('[Player] 暂停');
            } else if (newState === 0) {
                appConfig.runtime.playerInfo.playerState = 0;
                appConfig.setPlaybackState(0);
                debugLogger.info('[Player] 停止');
            }
        }
    }

    const playerControlShow = appConfig.getPlayerControlShow();
    const playerControlAutohide = appConfig.getPlayerControlAutohide();
    const playerControlThumbnailRotation = appConfig.getPlayerControlThumbnailRotation();
    const playerControlThumbnailRotationSpeed = appConfig.getPlayerControlThumbnailRotationSpeed();

    if (playerControlShow) {
        if (event.state === w.wallpaperMediaIntegration?.PLAYBACK_PLAYING ||
            event.state === w.wallpaperMediaIntegration?.PLAYBACK_PAUSED) {
            player_control.style.display = "flex";
        } else if (event.state === w.wallpaperMediaIntegration?.PLAYBACK_STOPPED) {
            player_control.style.display = playerControlAutohide ? "none" : "flex";
        }
    } else {
        return;
    }

    controlFluidEffectPlayback(event.state);

    if (!playerControlThumbnailRotation) return;

    if (event.state === w.wallpaperMediaIntegration?.PLAYBACK_STOPPED ||
        event.state === w.wallpaperMediaIntegration?.PLAYBACK_PAUSED) {
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
function controlFluidEffectPlayback(playbackState: any): void {
    const w = (window as any);
    if (!appConfig.runtime.FluidEffectConfig || appConfig.runtime.FluidEffectConfig.enabled === undefined) return;
    if (!w.wallpaperMediaIntegration) return;

    if (appConfig.runtime.FluidEffectConfig.enabled && !appConfig.runtime.FluidEffectConfig.fullscreenEnabled) {
        if (playbackState === w.wallpaperMediaIntegration.PLAYBACK_PLAYING) {
            resumeFluidEffect();
        } else if (playbackState === w.wallpaperMediaIntegration.PLAYBACK_PAUSED) {
            pauseFluidEffect();
        } else if (playbackState === w.wallpaperMediaIntegration.PLAYBACK_STOPPED) {
            stopFluidEffect();
        }
    }

    if (appConfig.runtime.FluidEffectConfig.fullscreenEnabled) {
        if (playbackState === w.wallpaperMediaIntegration.PLAYBACK_PLAYING) {
            resumeFullscreenFluidEffect();
        } else if (playbackState === w.wallpaperMediaIntegration.PLAYBACK_PAUSED) {
            pauseFullscreenFluidEffect();
        } else if (playbackState === w.wallpaperMediaIntegration.PLAYBACK_STOPPED) {
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

    const colorPickupMethod = appConfig.getColorPickupMethod();
    const playerControlYakelibgusetb = appConfig.getPlayerControlYakelibgusetb();
    const playerControlFontusetb = appConfig.getPlayerControlFontusetb();
    const playerControlYakeli = appConfig.getPlayerControlYakeli();
    const playerControlColor = appConfig.getPlayerControlColor();

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
            const targetHeight = aubar.height * Math.min(bar, 1) * appConfig.getPlayerControlScalefactor();
            const actualHeight = Math.min(targetHeight, aubar.height);

            barHeights[i] = lerp(barHeights[i], actualHeight, appConfig.getPlayerControlHdong());

            rgbbg.fillRect(barWidth * i, aubar.height - barHeights[i], barWidth, barHeights[i]);
        }

        if (!appConfig.runtime.playerInfo.aubarstop && appConfig.getPlayerControlVisualaudiobar() && appConfig.runtime.playerInfo.playerState !== 0) {
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

        let x: number, y: number, prevX: number, prevY: number;
        const cornerRadius = 4;

        for (let i = 0, l = 64; i < 64; ++i, ++l) {
            const amplitude = (currentAudioArr[i] + currentAudioArr[l]) / 2;
            let targetHeight = aubar.height - aubar.height * Math.min(amplitude, 1) * appConfig.getPlayerControlScalefactor();

            targetHeight = Math.max(0, Math.min(targetHeight, aubar.height));

            previousHeights[i] = lerp(previousHeights[i], targetHeight, appConfig.getPlayerControlHdong());

            x = spacing * i;
            y = previousHeights[i];

            if (i === 0) {
                rgbbg.moveTo(x, y);
            } else {
                prevX = spacing * (i - 1);
                prevY = previousHeights[i - 1];

                const dx = x - prevX;
                const dy = y - prevY;
                const distance = Math.sqrt(dx * dx + dy * dy);

                if (distance > cornerRadius * 2) {
                    const controlX = prevX + (x - prevX) / 2;
                    const controlY = prevY + (y - prevY) / 2;

                    rgbbg.quadraticCurveTo(prevX, prevY, controlX, controlY);
                    rgbbg.quadraticCurveTo(controlX, controlY, x, y);
                } else {
                    rgbbg.lineTo(x, y);
                }
            }
        }
        rgbbg.stroke();

        if (!appConfig.runtime.playerInfo.aubarstop && appConfig.getPlayerControlVisualaudiobar() && appConfig.runtime.playerInfo.playerState !== 0) {
            requestAnimationFrame(drawline);
        } else {
            rgbbg.clearRect(0, 0, aubar.width, aubar.height);
        }
    };

    const playerControlBarline = appConfig.getPlayerControlBarline();
    const playerControlVisualaudiobar = appConfig.getPlayerControlVisualaudiobar();

    if (playerControlVisualaudiobar && playerControlBarline == 2) {
        drawline();
    } else if (playerControlVisualaudiobar && playerControlBarline == 1) {
        draw();
    }
}

// 注册Wallpaper Engine媒体监听器
(window as any).wallpaperRegisterMediaThumbnailListener(wallpaperMediaThumbnailListener);
(window as any).wallpaperRegisterMediaTimelineListener(wallpaperMediaTimelineListener);
(window as any).wallpaperRegisterMediaPropertiesListener(wallpaperMediaPropertiesListener);
(window as any).wallpaperRegisterMediaPlaybackListener(wallpaperMediaPlaybackListener);

// 辅助函数
function hexToRgb(hex: string): [number, number, number] {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? [
        parseInt(result[1], 16),
        parseInt(result[2], 16),
        parseInt(result[3], 16)
    ] : [0, 0, 0];
}
