/**
 * RGB 灯光效果模块
 * 将视频/图片/樱花/粒子/音频可视化效果合成为LED灯光数据
 */

import { appConfig } from '../utils/config';
import { elements } from '../utils/elementManager';
import { debugLogger } from '../utils/logger';

// 壁纸设置接口
interface WallpaperSettings {
    ledPlugin: boolean;
    cuePlugin: boolean;
}

// 壁纸插件监听器
declare global {
    interface Window {
        wallpaperPluginListener?: {
            onPluginLoaded: (name: string, version: string) => void;
        };
        wpPlugins?: {
            led?: {
                setAllDevicesByImageData: (imageData: string, width: number, height: number) => void;
            };
        };
        smoothedAudioArray?: number[];
    }
}

// 壁纸设置状态
const wallpaperSettings: WallpaperSettings = {
    ledPlugin: false,
    cuePlugin: false
};

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
        colorArray[write] = imageData.data[d];
        colorArray[write + 1] = imageData.data[d + 1];
        colorArray[write + 2] = imageData.data[d + 2];
    }
    return String.fromCharCode(...colorArray);
}

/**
 * 发送RGB数据到LED设备
 */
function startRGBInternal(canvas: HTMLCanvasElement): void {
    if (!wallpaperSettings.ledPlugin) return;
    const encodedImageData = getEncodedCanvasImageData(canvas);
    if (window.wpPlugins?.led) {
        window.wpPlugins.led.setAllDevicesByImageData(encodedImageData, canvas.width, canvas.height);
    }
}

/**
 * 开始RGB背景渲染
 * @param src 背景图片路径
 * @param videoORimages 是否为视频模式
 */
export function background2canvas(src?: string, videoORimages?: boolean): void {
    let Frist = true;
    const sakura = elements.sakura;
    const particles = document.getElementById('canvas-particles') as HTMLCanvasElement | null;
    const bg = elements.slide.RGBuse as HTMLCanvasElement;
    const rgbbgCtx = bg?.getContext('2d');
    if (!rgbbgCtx) return;
    const rgbbg = rgbbgCtx;

    let time = 0;

    function drawLayers(): void {
        const sakuraRGB = appConfig.getSakuraRGB();
        const sakurause = (sakuraRGB && ((sakura.width === window.screen.width) && (sakura.height === window.screen.height)));
        const opacitySaRGB = appConfig.getOpacitySaRGB();
        const particlesRGB = appConfig.getParticlesRGB();
        const audiobarRGB = appConfig.getAudiobarRGB();
        const audiobarrainbowcolor = appConfig.getAudiobarrainbowcolor();
        const rainbowmove = appConfig.getRainbowmove();
        const rainbowmovespeed = appConfig.getRainbowmovespeed();
        const aurgbcolor = appConfig.getAurgbcolor();
        const aurgbhigh = appConfig.getAurgbhigh();
        const RGBRefresh = appConfig.getRGBRefresh();
        const RGBShow = appConfig.getRGBShow();
        const nextphoto = appConfig.getNextphoto();
        const isPaused = appConfig.getPaused();

        rgbbg.save();
        rgbbg.globalAlpha = opacitySaRGB;
        if (sakurause) { rgbbg.drawImage(sakura, 0, 0, sakura.width, sakura.height, 0, 0, 100, 20); }

        rgbbg.globalAlpha = 1;
        if (particlesRGB && particles) { rgbbg.drawImage(particles, 0, 0, particles.width, particles.height, 0, 0, 100, 20); }

        const audioArray = appConfig.runtime.playerInfo.audioArray;
        if (audiobarrainbowcolor) {
            if (audiobarRGB && audioArray && audioArray.length > 0) {
                const barWidth = bg.width / 128;
                const scaleFactor = aurgbhigh;
                const hueStep = 360 / 128;

                if (!window.smoothedAudioArray || window.smoothedAudioArray.length !== audioArray.length) {
                    window.smoothedAudioArray = new Array(audioArray.length).fill(0);
                }

                for (let i = 0; i < audioArray.length; ++i) {
                    window.smoothedAudioArray[i] += (audioArray[i] - window.smoothedAudioArray[i]) * 0.1;
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

                    const height = bg.height * Math.min(window.smoothedAudioArray[i], 1) * scaleFactor;
                    const actualHeight = Math.min(height, bg.height);

                    rgbbg.fillStyle = rgbColor;
                    rgbbg.fillRect(barWidth * channelIndex, bg.height - actualHeight, barWidth, actualHeight);
                }
                if (rainbowmove) {
                    time += rainbowmovespeed;
                }
            }
        } else {
            if (audiobarRGB && audioArray && audioArray.length > 0) {
                const barWidth = bg.width / 128;
                const scaleFactor = aurgbhigh;
                rgbbg.fillStyle = `rgb(${aurgbcolor})`;

                if (!window.smoothedAudioArray || window.smoothedAudioArray.length !== audioArray.length) {
                    window.smoothedAudioArray = new Array(audioArray.length).fill(0);
                }

                for (let i = 0; i < audioArray.length; ++i) {
                    window.smoothedAudioArray[i] += (audioArray[i] - window.smoothedAudioArray[i]) * 0.1;
                }

                for (let i = 0; i < audioArray.length; ++i) {
                    let channelIndex = i % 64;
                    if (i >= 64) {
                        channelIndex += 64;
                    }
                    const height = bg.height * Math.min(window.smoothedAudioArray[i], 1) * scaleFactor;
                    const actualHeight = Math.min(height, bg.height);
                    rgbbg.fillRect(barWidth * channelIndex, bg.height - actualHeight, barWidth, actualHeight);
                }
            }
        }

        rgbbg.restore();
        startRGBInternal(bg);

        if (wallpaperSettings.ledPlugin && !nextphoto && !isPaused && RGBShow && (videoORimages || (sakurause || particlesRGB || audiobarRGB))) {
            if (RGBRefresh !== 'free') {
                setTimeout(() => {
                    requestAnimationFrame(drawbackground);
                }, RGBRefresh as number);
            } else {
                requestAnimationFrame(drawbackground);
            }
        }
    }

    function drawbackground(): void {
        const backgroundRGB = appConfig.getBackgroundRGB();

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
                    const img = new Image();
                    img.src = src;
                    img.onload = () => {
                        if (Frist === true) {
                            setTimeout(() => {
                                rgbbg.drawImage(img, 0, 0, 100, 20);
                                drawLayers();
                                Frist = false;
                            }, 500);
                        } else {
                            rgbbg.drawImage(img, 0, 0, 100, 20);
                            drawLayers();
                            Frist = false;
                        }
                    };
                }
            }
        } else {
            rgbbg.clearRect(0, 0, 100, 20);
            drawLayers();
        }
    }

    requestAnimationFrame(drawbackground);
}

/**
 * 启用RGB效果
 */
export function enableRGB(): void {
    appConfig.setRGBShow(true);
}

/**
 * 禁用RGB效果
 */
export function disableRGB(): void {
    appConfig.setRGBShow(false);
}

/**
 * 检查LED插件是否可用
 */
export function isLEDPluginAvailable(): boolean {
    return wallpaperSettings.ledPlugin;
}

/**
 * 检查CUE插件是否可用
 */
export function isCUEPluginAvailable(): boolean {
    return wallpaperSettings.cuePlugin;
}

// 壁纸插件监听器
window.wallpaperPluginListener = {
    onPluginLoaded: function (name: string, _version: string) {
        if (name === 'led') {
            wallpaperSettings.ledPlugin = true;
            debugLogger.info(`[RGB] LED 插件已加载`);
        }
        if (name === 'cue') {
            wallpaperSettings.cuePlugin = true;
            debugLogger.info(`[RGB] CUE 插件已加载`);
        }
    }
};

// 全局导出
(window as unknown as { wallpaperSettings: WallpaperSettings }).wallpaperSettings = wallpaperSettings;

debugLogger.info('[RGB] RGB 模块初始化完成');

