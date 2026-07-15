/**
 * RGB 灯光效果模块
 * 将视频/图片/樱花/粒子/音频可视化效果合成为LED灯光数据
 */

import { useConfigStore } from '@/stores/config';
import { useRuntimeStore } from '@/stores/runtime';

import { elements } from '../../utils/elementManager';
import { debugLogger } from '../../utils/logger';
import { backgroundLayers } from '../slide/types';

const config = useConfigStore();
const runtimeStore = useRuntimeStore();

// RAF chain tracking to prevent memory leaks
let currentRafId: number | null = null;
// Track last video mode for visibility recovery
let lastRafVideoMode: boolean | null = null;
// 模块级缓存 — 跨多次 background2canvas 调用持久化，确保过渡锁生效
let globalCachedSrc: string | null = null;
let globalCachedImg: HTMLImageElement | null = null;

// Visibility change handler to resume RAF when tab becomes visible
function handleVisibilityChange(): void {
    if (document.visibilityState === 'visible') {
        if (config.rgb_show) {
            debugLogger.log('RGB: visibility restored, resuming RAF');
            background2canvas(null, lastRafVideoMode ?? undefined);
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
    // 主开关关闭时不发送 LED 数据
    if (!config.rgb_show) return;
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
    lastRafVideoMode = videoORimages ?? null;

    const sakura = elements.sakura;
    const particles = document.getElementById('canvas-particles') as HTMLCanvasElement | null;
    const bg = elements.slide.RGBuse as HTMLCanvasElement;
    const rgbbgCtx = bg?.getContext('2d');
    if (!rgbbgCtx) return;
    const rgbbg = rgbbgCtx;

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
        const isVideoMode = config.wallpaper_mode === 3;

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

        // 兜底：RGB 已启用但画布仍为空白时，显示动态色块（确保 LED 设备有反馈）
        const hasBgImage = config.background_rgb && (isVideoMode || (globalCachedSrc && globalCachedImg?.complete));
        if (RGBShow && !hasBgImage && !sakurause && !particlesRGB && !audiobarRGB) {
            const hue = (time * 5) % 360;
            rgbbg.fillStyle = `hsl(${hue}, 80%, 40%)`;
            rgbbg.fillRect(0, 0, 100, 20);
            time += 0.5; // 兜底层也随时间变化
        }

        rgbbg.restore();
        startRGBInternal(bg);

        if (
            config.wallpaper_settings?.ledPlugin &&
            !nextphoto &&
            !isPaused &&
            RGBShow &&
            (isVideoMode || config.background_rgb || sakurause || particlesRGB || audiobarRGB || true)
        ) {
            // 默认 30fps 刷新率（33ms），防止无限制 60fps 导致高 CPU
            const refreshMs = (RGBRefresh > 0) ? RGBRefresh : 33;
            setTimeout(() => {
                requestAnimationFrame(drawbackground);
            }, refreshMs);
        }
    }

    function drawbackground(): void {
        // 主开关关闭时不渲染任何内容
        if (!config.rgb_show) return;

        const backgroundRGB = config.background_rgb;
        const wallpaperMode = config.wallpaper_mode;
        const isVideoMode = videoORimages === true || wallpaperMode === 3;

        // 从 runtime 读取当前图片（所有源在切图时已显式写入 currentImg）
        let resolvedSrc: string | null = null;
        if (backgroundRGB && !isVideoMode) {
            resolvedSrc = runtimeStore.photo.currentImg;
            // 过渡期间锁定到旧缓存，避免闪烁
            if (backgroundLayers.isTransitioning && globalCachedSrc && resolvedSrc !== globalCachedSrc) {
                resolvedSrc = globalCachedSrc;
            }
        }

        // 始终先清空画布，防止上一帧残留
        rgbbg.clearRect(0, 0, 100, 20);

        if (backgroundRGB) {
            if (isVideoMode) {
                const video = elements.myvideo;
                if (video && !video.paused && !video.ended) {
                    rgbbg.drawImage(video, 0, 0, 100, 20);
                }
            } else if (resolvedSrc) {
                if (resolvedSrc !== globalCachedSrc) {
                    globalCachedSrc = resolvedSrc;
                    globalCachedImg = new Image();
                    globalCachedImg.src = resolvedSrc;
                }
                if (globalCachedImg?.complete && globalCachedImg.naturalWidth > 0) {
                    rgbbg.drawImage(globalCachedImg, 0, 0, 100, 20);
                }
            }
            // background_rgb 开启但无可用源时画布保持 clearRect 后的黑色
        }

        drawLayers();
    }

    // Cancel any existing RAF chain before starting new one
    if (currentRafId !== null) {
        cancelAnimationFrame(currentRafId);
    }
    currentRafId = requestAnimationFrame(drawbackground);
}
