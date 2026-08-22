/**
 * RGB 灯光效果模块
 * 将视频/图片/樱花/粒子/音频可视化效果合成为 LED 灯光数据
 */
import { useConfigStore } from '@/stores/config';
import { useRuntimeStore } from '@/stores/runtime';

import { elements } from '../../utils/elementManager';
import { debugLogger } from '../../utils/logger';
import { backgroundLayers } from '../slide/types';

function cfg() { return useConfigStore(); }
function rt() { return useRuntimeStore(); }

// 单条定时链管理
let currentRafId: number | null = null;
let lastRafVideoMode: boolean | null = null;

// 背景图跨帧缓存
let globalCachedSrc: string | null = null;
let globalCachedImg: HTMLImageElement | null = null;

// 复用编码缓冲
const ENCODED_CHANNEL_COUNT = 100 * 20 * 3;
const _rgbColorArray: number[] = new Array(ENCODED_CHANNEL_COUNT);
let _rgbCanvasCtx: CanvasRenderingContext2D | null | undefined;

function handleVisibilityChange(): void {
    if (document.visibilityState === 'visible' && cfg().rgb_show) {
        debugLogger.log('RGB: visibility restored, resuming RAF');
        background2canvas(null, lastRafVideoMode ?? undefined);
    }
}
if (typeof document !== 'undefined') document.addEventListener('visibilitychange', handleVisibilityChange);

function getEncodedCanvasImageData(canvas: HTMLCanvasElement): string {
    if (_rgbCanvasCtx === undefined) _rgbCanvasCtx = canvas.getContext('2d', { willReadFrequently: true });
    const ctx = _rgbCanvasCtx;
    if (!ctx) return '';
    const imageData = ctx.getImageData(0, 0, 100, 20);
    const data = imageData.data;
    for (let d = 0, w = 0; d < data.length; d += 4, w += 3) {
        _rgbColorArray[w] = data[d] ?? 0;
        _rgbColorArray[w + 1] = data[d + 1] ?? 0;
        _rgbColorArray[w + 2] = data[d + 2] ?? 0;
    }
    return String.fromCharCode.apply(null, _rgbColorArray as unknown as number[]);
}

function startRGBInternal(canvas: HTMLCanvasElement): void {
    if (!cfg().wallpaper_settings?.ledPlugin || !cfg().rgb_show) return;
    const encoded = getEncodedCanvasImageData(canvas);
    window.wpPlugins?.led?.setAllDevicesByImageData(encoded, canvas.width, canvas.height);
}

export function background2canvas(src?: string | null, videoORimages?: boolean): void {
    lastRafVideoMode = videoORimages ?? null;

    const sakura = elements.sakura;
    const particles = document.getElementById('canvas-particles') as HTMLCanvasElement | null;
    const bg = elements.slide.RGBuse as HTMLCanvasElement | null;
    if (!bg) return;
    const rgbbg = bg.getContext('2d') as CanvasRenderingContext2D | null;
    if (!rgbbg) return;

    let time = 0;

    function drawAudioBars(ctx: CanvasRenderingContext2D): void {
        const audioArray = rt().playerInfo.audioArray;
        const audiobarRGB = cfg().audiobar_rgb;
        if (!audiobarRGB || !audioArray?.length) return;

        const barWidth = bg!.width / 128;
        const scaleFactor = cfg().aurgbhigh ?? 1;
        const rainbow = cfg().audiobar_rainbow_color;
        const rainbowMove = cfg().rainbow_move;
        const hueStep = 360 / 128;

        if (!window.smoothedAudioArray || window.smoothedAudioArray.length !== audioArray.length) {
            window.smoothedAudioArray = new Array(audioArray.length).fill(0);
        }
        const smoothed = window.smoothedAudioArray;
        for (let i = 0; i < audioArray.length; i++) smoothed[i] = (smoothed[i] ?? 0) + ((audioArray[i] ?? 0) - (smoothed[i] ?? 0)) * 0.1;

        for (let i = 0; i < audioArray.length; i++) {
            const height = Math.min(bg!.height * Math.min(smoothed[i] ?? 0, 1) * scaleFactor, bg!.height);
            // 128 根柱均匀铺满画布宽度（旧表达式 (i%64+(i>=64?64:0)) 恒等于 i，属冗余）
            const x = barWidth * i;
            if (rainbow) {
                const hue = (i * hueStep + time) % 360;
                ctx.fillStyle = `hsl(${hue}, 100%, 50%)`;
            } else {
                ctx.fillStyle = `rgb(${cfg().aurgbcolor})`;
            }
            ctx.fillRect(x, bg!.height - height, barWidth, height);
        }
        if (rainbow && rainbowMove) time += cfg().rainbow_move_speed ?? 1;
    }

    function drawLayers(): void {
        const ctx = rgbbg as CanvasRenderingContext2D;
        const sakuraRGB = cfg().sakura_rgb;
        const sakurause = sakuraRGB && sakura.width === window.screen.width && sakura.height === window.screen.height;
        const opacitySaRGB = cfg().opacity_sa_rgb ?? 1;
        const particlesRGB = cfg().particles_rgb;
        const audiobarRGB = cfg().audiobar_rgb;
        const hasAudio = !!rt().playerInfo.audioArray?.length;

        ctx.save();
        ctx.globalAlpha = opacitySaRGB;
        if (sakurause) ctx.drawImage(sakura, 0, 0, sakura.width, sakura.height, 0, 0, 100, 20);
        ctx.globalAlpha = 1;
        if (particlesRGB && particles) ctx.drawImage(particles, 0, 0, particles.width, particles.height, 0, 0, 100, 20);

        // 统一音频柱绘制（消除两套几乎相同的分支）
        if (audiobarRGB && hasAudio) drawAudioBars(ctx);

        const hasBgImage = cfg().background_rgb && (cfg().wallpaper_mode === 3 || (globalCachedSrc && globalCachedImg?.complete));
        if (cfg().rgb_show && !hasBgImage && !sakurause && !particlesRGB && !hasAudio) {
            ctx.fillStyle = `hsl(${(time * 5) % 360}, 80%, 40%)`;
            ctx.fillRect(0, 0, 100, 20);
            time += 0.5;
        }

        ctx.restore();
        if (bg) startRGBInternal(bg);

        // 修复空转：任一有效源才继续调度，避免 `|| true` 导致无源空刷新
        const shouldContinue = Boolean(
            cfg().wallpaper_settings?.ledPlugin && !cfg().nextphoto && !cfg().paused && cfg().rgb_show &&
            (cfg().wallpaper_mode === 3 || cfg().background_rgb || sakurause || particlesRGB || hasAudio)
        );
        if (shouldContinue) {
            const r = cfg().rgb_refresh;
            const refreshMs = r !== undefined && r > 0 ? r : 33;
            currentRafId = window.setTimeout(drawbackground, refreshMs);
        }
    }

    function drawbackground(): void {
        if (!cfg().rgb_show) return;
        const ctx = rgbbg as CanvasRenderingContext2D;

        const backgroundRGB = cfg().background_rgb;
        const isVideoMode = videoORimages === true || cfg().wallpaper_mode === 3;

        let resolvedSrc: string | null = null;
        if (backgroundRGB && !isVideoMode) {
            resolvedSrc = rt().photo.currentImg;
            if (backgroundLayers.isTransitioning && globalCachedSrc && resolvedSrc !== globalCachedSrc) {
                resolvedSrc = globalCachedSrc;
            }
        }

        ctx.clearRect(0, 0, 100, 20);

        if (backgroundRGB) {
            if (isVideoMode) {
                const video = elements.myvideo;
                if (video && !video.paused && !video.ended) ctx.drawImage(video, 0, 0, 100, 20);
            } else if (resolvedSrc) {
                if (resolvedSrc !== globalCachedSrc) {
                    globalCachedSrc = resolvedSrc;
                    globalCachedImg = new Image();
                    globalCachedImg.src = resolvedSrc;
                }
                if (globalCachedImg?.complete && globalCachedImg.naturalWidth > 0) ctx.drawImage(globalCachedImg, 0, 0, 100, 20);
            }
        }

        drawLayers();
    }

    if (currentRafId !== null) { clearTimeout(currentRafId); currentRafId = null; }
    currentRafId = window.setTimeout(drawbackground, 0);
}
