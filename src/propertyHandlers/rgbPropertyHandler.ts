/**
 * RGB Property Handler
 * 处理RGB灯光效果相关的属性监听
 */

import { config } from '../utils/config';
import { WallpaperProperties } from './types';

/**
 * 处理RGB灯光效果相关属性
 * @param properties 属性对象
 * @param FirstLoad 是否首次加载
 */
export function handleRGBProperties(
    properties: WallpaperProperties,
    _FirstLoad: boolean
): void {

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
            config.rGBRefresh = fpsMap[fps];
        }
    }

    // 是否显示RGB效果
    if (properties.rgb_show) {
        config.rGBShow = properties.rgb_show.value;
    }

    // 背景RGB开关
    if (properties.rgb_bg) {
        config.backgroundRGB = properties.rgb_bg.value;
    }

    // 樱花RGB开关
    if (properties.rgb_sa) {
        config.sakuraRGB = properties.rgb_sa.value;
    }

    // 粒子RGB开关
    if (properties.rgb_pa) {
        config.particlesRGB = properties.rgb_pa.value;
    }

    // 音频条RGB开关
    if (properties.rgb_au) {
        config.audiobarRGB = properties.rgb_au.value;
    }

    // 樱花不透明度
    if (properties.rgb_sa_op) {
        config.opacitySaRGB = properties.rgb_sa_op.value / 100;
    }

    // 音频条高度
    if (properties.rgb_au_high) {
        config.aurgbhigh = properties.rgb_au_high.value / 2;
    }

    // 音频条颜色
    if (properties.rgb_au_color) {
        const color = properties.rgb_au_color.value.split(' ').map((c) => Math.ceil(parseFloat(c) * 255));
        config.aurgbcolor = color.join(',');
    }

    // 彩虹颜色模式
    if (properties.rgb_color_rainbow) {
        config.audiobarrainbowcolor = properties.rgb_color_rainbow.value;
    }

    // 彩虹移动
    if (properties.rgb_color_rainbow_move) {
        config.rainbowmove = properties.rgb_color_rainbow_move.value;
    }

    // 彩虹移动速度
    if (properties.rgb_color_rainbow_movespeed) {
        config.rainbowmovespeed = properties.rgb_color_rainbow_movespeed.value;
    }
}
