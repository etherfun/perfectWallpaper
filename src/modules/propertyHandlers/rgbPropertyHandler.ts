/**
 * RGB Property Handler
 * 处理RGB灯光效果相关的属性监听
 */

import { appConfig } from '../../utils/config';
import { WallpaperProperties } from './types';

export interface RGBPropertyHandlerResult {
    // empty for now
}

/**
 * 处理RGB灯光效果相关属性
 * @param properties 属性对象
 * @param FirstLoad 是否首次加载
 * @returns 处理结果
 */
export function handleRGBProperties(
    properties: WallpaperProperties,
    _FirstLoad: boolean
): RGBPropertyHandlerResult {
    const result: RGBPropertyHandlerResult = {};

    // RGB FPS刷新率
    if (properties.rgb_fps) {
        const fpsMap: Record<number, number> = {
            24: 41,
            30: 33,
            45: 22,
            60: 16
        };
        const fps = properties.rgb_fps.value;
        if (fpsMap[fps] !== undefined) {
            appConfig.setRGBRefresh(fpsMap[fps]);
        }
    }

    // 是否显示RGB效果
    if (properties.rgb_show) {
        appConfig.setRGBShow(properties.rgb_show.value);
    }

    // 背景RGB开关
    if (properties.rgb_bg) {
        appConfig.setBackgroundRGB(properties.rgb_bg.value);
    }

    // 樱花RGB开关
    if (properties.rgb_sa) {
        appConfig.setSakuraRGB(properties.rgb_sa.value);
    }

    // 粒子RGB开关
    if (properties.rgb_pa) {
        appConfig.setParticlesRGB(properties.rgb_pa.value);
    }

    // 音频条RGB开关
    if (properties.rgb_au) {
        appConfig.setAudiobarRGB(properties.rgb_au.value);
    }

    // 樱花不透明度
    if (properties.rgb_sa_op) {
        appConfig.setOpacitySaRGB(properties.rgb_sa_op.value / 100);
    }

    // 音频条高度
    if (properties.rgb_au_high) {
        appConfig.setAurgbhigh(properties.rgb_au_high.value / 2);
    }

    // 音频条颜色
    if (properties.rgb_au_color) {
        const color = properties.rgb_au_color.value.split(' ').map((c) => Math.ceil(parseFloat(c) * 255));
        appConfig.setAurgbcolor(color.join(','));
    }

    // 彩虹颜色模式
    if (properties.rgb_color_rainbow) {
        appConfig.setAudiobarrainbowcolor(properties.rgb_color_rainbow.value);
    }

    // 彩虹移动
    if (properties.rgb_color_rainbow_move) {
        appConfig.setRainbowmove(properties.rgb_color_rainbow_move.value);
    }

    // 彩虹移动速度
    if (properties.rgb_color_rainbow_movespeed) {
        appConfig.setRainbowmovespeed(properties.rgb_color_rainbow_movespeed.value);
    }

    return result;
}
