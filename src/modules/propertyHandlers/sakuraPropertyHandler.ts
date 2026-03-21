/**
 * Sakura Property Handler
 * 处理樱花效果相关的属性监听
 */

import { WallpaperProperties } from './types';
import { appConfig } from '../../utils/config';
import { elements } from '../../utils/elementManager';
import * as sakuraModule from '../sakura';

export interface SakuraPropertyHandlerResult {
    // empty for now
}

/**
 * 处理樱花效果相关属性
 * @param properties 属性对象
 * @param _FirstLoad 是否首次加载
 * @returns 处理结果
 */
export function handleSakuraProperties(
    properties: WallpaperProperties,
    _FirstLoad: boolean
): SakuraPropertyHandlerResult {
    const result: SakuraPropertyHandlerResult = {};

    // 樱花特效
    if (properties.showSakura) {
        const showSakura = properties.showSakura.value;
        appConfig.setShowSakura(showSakura);
        (window as any).showSakura = showSakura;

        if (showSakura) {
            // 开启樱花，全屏樱花
            const canvas = elements.sakura;
            const canvasshow = elements.sakurashow;
            if (canvas && canvasshow) {
                sakuraModule.makeCanvasFullScreen(canvas, canvasshow);
            }
            sakuraModule.setAnimating(true);
            (window as any).animate();
            sakuraModule.removesakura();
        } else {
            // 关闭樱花，隐藏樱花
            const canvas = elements.sakura;
            const canvasshow = elements.sakurashow;
            if (canvas && canvasshow) {
                sakuraModule.makeCanvasHide(canvas, canvasshow);
            }
            sakuraModule.setAnimating(false);
        }
    }

    // 樱花透明度
    if (properties.sakuratransparency) {
        const transparency = properties.sakuratransparency.value / 100;
        appConfig.setSakuraTransparency(transparency);
        const ctx = elements.sakurashow?.getContext('2d');
        if (ctx) {
            ctx.canvas.style.opacity = String(transparency);
        }
    }

    // 樱花背景
    if (properties.sakurabackground) {
        appConfig.setSakuraBackground(properties.sakurabackground.value);
    }

    // 樱花背景色
    if (properties.sakurabackcolor) {
        appConfig.setSakuraBackColor(properties.sakurabackcolor.value);
    }

    // 樱花反转
    if (properties.sakurareverse) {
        appConfig.setSakuraReverse(properties.sakurareverse.value);
    }

    // 樱花数量
    if (properties.sakurapointnumber) {
        appConfig.setSakuraPointNumber(properties.sakurapointnumber.value);
        sakuraModule.sakuraResize();
    }

    // 背景亮度
    if (properties.sakurabacklight) {
        appConfig.setSakuraBackLight(properties.sakurabacklight.value / 100);
        sakuraModule.sakuraReLoadEffect();
    }

    return result;
}
