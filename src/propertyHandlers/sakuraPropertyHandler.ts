import { WallpaperProperties } from './types';
import { config } from '../utils/config';
import { elements } from '../utils/elementManager';
import * as sakuraModule from '../sakura';
import { debugLogger } from '@/utils/logger';

/**
 * 处理樱花效果相关属性
 * @param properties 属性对象
 * @param FirstLoad 是否首次加载
 */
export function handleSakuraProperties(
    properties: WallpaperProperties,
    FirstLoad: boolean
): void {

    // 樱花特效
    if (properties.showSakura) {
        const showSakura = properties.showSakura.value;
        config.show_sakura = showSakura;

        if (showSakura) {
            // 开启樱花，全屏樱花
            const canvas = elements.sakura;
            const canvasshow = elements.sakurashow;
            if (canvas && canvasshow) {
                sakuraModule.makeCanvasFullScreen(canvas, canvasshow);
            }
            sakuraModule.setAnimating(true);
            sakuraModule.animate();
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
        config.sakura_transparency = transparency;
        const ctx = elements.sakurashow?.getContext('2d');
        if (ctx) {
            ctx.canvas.style.opacity = String(transparency);
        }
    }

    // 樱花背景
    if (properties.sakurabackground) {
        config.sakura_background = properties.sakurabackground.value;
    }

    // 樱花背景色
    if (properties.sakurabackcolor) {
        config.sakura_back_color = properties.sakurabackcolor.value;
    }

    // 樱花反转
    if (properties.sakurareverse) {
        config.sakura_reverse = properties.sakurareverse.value;
    }

    // 樱花数量
    if (properties.sakurapointnumber) {
        config.sakura_point_number = properties.sakurapointnumber.value;
        sakuraModule.sakuraResize();
    }

    // 背景亮度
    if (properties.sakurabacklight) {
        config.sakura_back_light = properties.sakurabacklight.value / 100;
        sakuraModule.sakuraReLoadEffect();
    }

    if (FirstLoad) {
        debugLogger.info('[Sakura] 樱花效果参数初始化完成');
    }
}
