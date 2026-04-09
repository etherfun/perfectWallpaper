import { debugLogger } from '@/utils/logger';

import { config } from '../utils/config';
import { WallpaperProperties } from './types';

/**
 * 处理RGB灯光效果相关属性
 * @param properties 属性对象
 * @param FirstLoad 是否首次加载
 */
export function handleRGBProperties(
    properties: WallpaperProperties,
    FirstLoad: boolean
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
            config.rgb_refresh = fpsMap[fps];
        }
    }

    // 是否显示RGB效果
    if (properties.rgb_show) {
        config.rgb_show = properties.rgb_show.value;
    }

    // 背景RGB开关
    if (properties.rgb_bg) {
        config.background_rgb = properties.rgb_bg.value;
    }

    // 樱花RGB开关
    if (properties.rgb_sa) {
        config.sakura_rgb = properties.rgb_sa.value;
    }

    // 粒子RGB开关
    if (properties.rgb_pa) {
        config.particles_rgb = properties.rgb_pa.value;
    }

    // 音频条RGB开关
    if (properties.rgb_au) {
        config.audiobar_rgb = properties.rgb_au.value;
    }

    // 樱花不透明度
    if (properties.rgb_sa_op) {
        config.opacity_sa_rgb = properties.rgb_sa_op.value / 100;
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
        config.audiobar_rainbow_color = properties.rgb_color_rainbow.value;
    }

    // 彩虹移动
    if (properties.rgb_color_rainbow_move) {
        config.rainbow_move = properties.rgb_color_rainbow_move.value;
    }

    // 彩虹移动速度
    if (properties.rgb_color_rainbow_movespeed) {
        config.rainbow_move_speed = properties.rgb_color_rainbow_movespeed.value;
    }

    if (FirstLoad) {
        debugLogger.info('[RGB] RGB灯光参数初始化完成');
    }
}
