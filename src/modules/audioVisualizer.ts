/**
 * 音频可视化模块
 * 注册 Wallpaper Engine 音频监听器，将音频数据存储到 appConfig.runtime
 * 并在音频数据到达时触发 PWCircle 和 PWLine 的绘制
 */

import { appConfig } from '../utils/config';

// PWCircle 绘制函数
import { setCan, createPoint, style1, style2, style3 } from './PWCircle';

// PWLine 绘制函数
import { setCTXLine, PWLineCreatePoint, PWLineStyle1, PWLineStyle2, PWLineStyle3 } from './PWLine';

/**
 * 获取圆圈可视化canvas的2D上下文
 */
function getCircleCtx(): CanvasRenderingContext2D | null {
    const can = document.querySelector("#can") as HTMLCanvasElement | null;
    return can?.getContext("2d") ?? null;
}

/**
 * 获取直线可视化canvas的2D上下文
 */
function getLineCtx(): CanvasRenderingContext2D | null {
    const canLine = document.querySelector("#CanLine") as HTMLCanvasElement | null;
    return canLine?.getContext("2d") ?? null;
}

/**
 * 音频监听回调函数
 * 由 Wallpaper Engine 调用，约30fps
 */
let _audioInitLogged = false;
function wallpaperAudioListener(audioData: number[]): void {
    // 只在第一次调用时打印初始化信息
    if (!_audioInitLogged) {
        _audioInitLogged = true;
    }

    // 更新到 appConfig.runtime
    appConfig.runtime.playerInfo.audioArray = audioData;

    // 获取 canvas context
    const ctx = getCircleCtx();
    const CTXLine = getLineCtx();

    // 获取参数
    const param = appConfig.runtime.param;
    const PWLineParam = appConfig.runtime.PWLineParam;
    const wallpaper = appConfig.runtime.wallpaper;

    // 清除画布
    if (wallpaper) {
        wallpaper.audiovisualizer('clearCanvas');
    }
    if (CTXLine) {
        CTXLine.clearRect(0, 0, window.innerWidth, window.innerHeight);
    }
    if (ctx) {
        ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
    }

    // 获取当前可视化模式
    const model = appConfig.getVisualAudioModel();

    switch (model) {
        case 1: // 完美圆圈
            if (ctx && param) {
                setCan();
                createPoint(audioData);
                if (param.showCircle) {
                    switch (param.style) {
                        case 1:
                            style1();
                            break;
                        case 2:
                            style2();
                            break;
                        case 3:
                            style3();
                            break;
                    }
                }
            }
            break;
        case 2: // 完美直线
            if (CTXLine && PWLineParam) {
                setCTXLine();
                PWLineCreatePoint(audioData);
                if (PWLineParam.showLine) {
                    switch (PWLineParam.style) {
                        case 1:
                            PWLineStyle1();
                            break;
                        case 2:
                            PWLineStyle2();
                            break;
                        case 3:
                            PWLineStyle3();
                            break;
                    }
                }
            }
            break;
        case 3: // 内置可视化
            if (wallpaper) {
                wallpaper.audiovisualizer('drawCanvas', audioData);
            }
            break;
    }
}

// 注册音频监听器
(window as unknown as { wallpaperRegisterAudioListener: (callback: (audioData: number[]) => void) => void }).wallpaperRegisterAudioListener(wallpaperAudioListener);

export { };
