/**
 * RGB 灯光效果模块
 * 将视频/图片/樱花/粒子/音频可视化效果合成为LED灯光数据
 */

import { useConfigStore } from '@/stores/config';
import { useRuntimeStore } from '@/stores/runtime';
import { elements } from './utils/elementManager';
import { debugLogger } from './utils/logger';

const config = useConfigStore();
const runtimeStore = useRuntimeStore();

// RAF chain tracking to prevent memory leaks
let currentRafId: number | null = null;
// Track last src to detect if we need to restart RAF loop
let lastRafSrc: string | null = null;
let lastRafVideoMode: boolean | null = null;

// Visibility change handler to resume RAF when tab becomes visible
function handleVisibilityChange(): void {
    if (document.visibilityState === 'visible') {
        // Check if RGB is enabled and we had an active RAF before
        if (config.rgb_show && lastRafSrc !== null) {
            debugLogger.log('RGB: visibility restored, resuming RAF');
            // Re-trigger background2canvas to restart the RAF chain
            background2canvas(lastRafSrc, lastRafVideoMode ?? undefined);
        }
    }
}

// Register visibility change listener once
if (typeof document !== 'undefined') {
    document.addEventListener('visibilitychange', handleVisibilityChange);
}

/**
 * 获取编码的Canvas图像数据
 */
function getEncodedCanvasImageData(canvas: HTMLCanvasElement): string {
    const context = canvas.getContext('2d', { willReadFrequently: true });
    if (!context) return '';

    const imageData = context.getImageData(0, 0, 100, 20);
    const colorArray: number[] = [];

    for (let d = 0; d < imageData.data.length; d += 4) {
        const write = (d / 4) * 3;
        colorArray[write] = imageData.data[d] ?? 0;
        colorArray[write + 1] = imageData.data[d + 1] ?? 0;
        colorArray[write + 2] = imageData.data[d + 2] ?? 0;
    }
    return String.fromCharCode(...colorArray);
}

/**
 * 发送RGB数据到LED设备
 */
function startRGBInternal(canvas: HTMLCanvasElement): void {
    if (!config.wallpaper_settings?.ledPlugin) return;
    const encodedImageData = getEncodedCanvasImageData(canvas);
    if (window.wpPlugins?.led) {
        window.wpPlugins.led.setAllDevicesByImageData(
            encodedImageData,
            canvas.width,
            canvas.height
        );
    }
}

/**
 * 开始RGB背景渲染
 * @param src 背景图片路径
 * @param videoORimages 是否为视频模式
 */
export function background2canvas(src?: string | null, videoORimages?: boolean): void {
    // Track last parameters for visibility recovery
    lastRafSrc = src ?? null;
    lastRafVideoMode = videoORimages ?? null;

    let Frist = true;
    const sakura = elements.sakura;
    const particles = document.getElementById('canvas-particles') as HTMLCanvasElement | null;
    const bg = elements.slide.RGBuse as HTMLCanvasElement;
    const rgbbgCtx = bg?.getContext('2d');
    if (!rgbbgCtx) return;
    const rgbbg = rgbbgCtx;

    // Image cache to avoid creating new Image objects every frame
    let cachedSrc: string | null = null;
    let cachedImg: HTMLImageElement | null = null;

    let time = 0;

    function drawLayers(): void {
        const sakuraRGB = config.sakura_rgb;
        const sakurause =
            sakuraRGB &&
            sakura.width === window.screen.width &&
            sakura.height === window.screen.height;
        const opacitySaRGB = config.opacity_sa_rgb ?? 1;
        const particlesRGB = config.particles_rgb;
        const audiobarRGB = config.audiobar_rgb;
        const audiobarRainbowColor = config.audiobar_rainbow_color;
        const rainbowMove = config.rainbow_move;
        const rainbowMoveSpeed = config.rainbow_move_speed ?? 1;
        const aurgbcolor = config.aurgbcolor;
        const aurgbhigh = config.aurgbhigh ?? 1;
        const RGBRefresh = config.rgb_refresh ?? 0;
        const RGBShow = config.rgb_show;
        const nextphoto = config.nextphoto;
        const isPaused = config.paused;

        rgbbg.save();
        rgbbg.globalAlpha = opacitySaRGB;
        if (sakurause) {
            rgbbg.drawImage(sakura, 0, 0, sakura.width, sakura.height, 0, 0, 100, 20);
        }

        rgbbg.globalAlpha = 1;
        if (particlesRGB && particles) {
            rgbbg.drawImage(particles, 0, 0, particles.width, particles.height, 0, 0, 100, 20);
        }

        const audioArray = runtimeStore.playerInfo.audioArray;
        if (audiobarRainbowColor) {
            if (audiobarRGB && audioArray && audioArray.length > 0) {
                const barWidth = bg.width / 128;
                const scaleFactor = aurgbhigh;
                const hueStep = 360 / 128;

                if (
                    !window.smoothedAudioArray ||
                    window.smoothedAudioArray.length !== audioArray.length
                ) {
                    window.smoothedAudioArray = new Array(audioArray.length).fill(0);
                }

                for (let i = 0; i < audioArray.length; ++i) {
                    window.smoothedAudioArray[i] =
                        (window.smoothedAudioArray[i] ?? 0) +
                        ((audioArray[i] ?? 0) - (window.smoothedAudioArray[i] ?? 0)) * 0.1;
                }

                for (let i = 0; i < audioArray.length; ++i) {
                    const hue = (i * hueStep + time) % 360;
                    const saturation = '100%';
                    const lightness = '50%';
                    const rgbColor = `hsl(${hue}, ${saturation}, ${lightness})`;

                    let channelIndex = i % 64;
                    if (i >= 64) {
                        channelIndex += 64;
                    }

                    const height =
                        bg.height * Math.min(window.smoothedAudioArray[i] ?? 0, 1) * scaleFactor;
                    const actualHeight = Math.min(height, bg.height);

                    rgbbg.fillStyle = rgbColor;
                    rgbbg.fillRect(
                        barWidth * channelIndex,
                        bg.height - actualHeight,
                        barWidth,
                        actualHeight
                    );
                }
                if (rainbowMove) {
                    time += rainbowMoveSpeed;
                }
            }
        } else {
            if (audiobarRGB && audioArray && audioArray.length > 0) {
                const barWidth = bg.width / 128;
                const scaleFactor = aurgbhigh;
                rgbbg.fillStyle = `rgb(${aurgbcolor})`;

                if (
                    !window.smoothedAudioArray ||
                    window.smoothedAudioArray.length !== audioArray.length
                ) {
                    window.smoothedAudioArray = new Array(audioArray.length).fill(0);
                }

                for (let i = 0; i < audioArray.length; ++i) {
                    window.smoothedAudioArray[i] =
                        (window.smoothedAudioArray[i] ?? 0) +
                        ((audioArray[i] ?? 0) - (window.smoothedAudioArray[i] ?? 0)) * 0.1;
                }

                for (let i = 0; i < audioArray.length; ++i) {
                    let channelIndex = i % 64;
                    if (i >= 64) {
                        channelIndex += 64;
                    }
                    const height =
                        bg.height * Math.min(window.smoothedAudioArray[i] ?? 0, 1) * scaleFactor;
                    const actualHeight = Math.min(height, bg.height);
                    rgbbg.fillRect(
                        barWidth * channelIndex,
                        bg.height - actualHeight,
                        barWidth,
                        actualHeight
                    );
                }
            }
        }

        rgbbg.restore();
        startRGBInternal(bg);

        if (
            config.wallpaper_settings?.ledPlugin &&
            !nextphoto &&
            !isPaused &&
            RGBShow &&
            (videoORimages || sakurause || particlesRGB || audiobarRGB)
        ) {
            if (RGBRefresh > 0) {
                setTimeout(() => {
                    requestAnimationFrame(drawbackground);
                }, RGBRefresh as number);
            } else {
                requestAnimationFrame(drawbackground);
            }
        }
    }

    function drawbackground(): void {
        const backgroundRGB = config.background_rgb;

        if (backgroundRGB) {
            if (videoORimages) {
                const video = elements.myvideo;
                if (video && !video.paused && !video.ended) {
                    rgbbg.drawImage(video, 0, 0, 100, 20);
                    drawLayers();
                    Frist = false;
                }
            } else {
                if (src) {
                    // Use cached image to avoid creating new Image objects every frame
                    if (cachedSrc !== src || !cachedImg) {
                        cachedSrc = src;
                        cachedImg = new Image();
                        cachedImg.src = src;
                    }
                    if (cachedImg.complete && cachedImg.naturalWidth > 0) {
                        if (Frist === true) {
                            setTimeout(() => {
                                rgbbg.drawImage(cachedImg!, 0, 0, 100, 20);
                                drawLayers();
                                Frist = false;
                            }, 500);
                        } else {
                            rgbbg.drawImage(cachedImg!, 0, 0, 100, 20);
                            drawLayers();
                            Frist = false;
                        }
                    }
                }
            }
        } else {
            rgbbg.clearRect(0, 0, 100, 20);
            drawLayers();
        }
    }

    // Cancel any existing RAF chain before starting new one
    if (currentRafId !== null) {
        cancelAnimationFrame(currentRafId);
    }
    currentRafId = requestAnimationFrame(drawbackground);
}
