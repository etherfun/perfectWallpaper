/**
 * Particle Property Handler
 * 处理粒子效果相关的属性监听
 */

import { WallpaperProperties } from './types';
import { appConfig } from '@/utils/config';
import { shouldShow } from '../slide';

export interface ParticlePropertyHandlerResult {
    // empty for now
}

/**
 * 处理粒子效果相关属性
 * @param properties 属性对象
 * @param FirstLoad 是否首次加载
 * @returns 处理结果
 */
export function handleParticleProperties(
    properties: WallpaperProperties,
    FirstLoad: boolean
): ParticlePropertyHandlerResult {
    const result: ParticlePropertyHandlerResult = {};

    const wallpaper = appConfig.runtime.wallpaper;

    // 显示粒子
    if (properties.particles_isParticles) {
        if (properties.particles_isParticles.value) {
            wallpaper.particles('startParticles');
        } else {
            wallpaper.particles('clearCanvas').particles('stopParticles');
        }
    }

    // 粒子数量
    if (properties.particles_number) {
        wallpaper.particles('addParticles', properties.particles_number.value);
    }

    // 粒子不透明度
    if (properties.particles_opacity) {
        wallpaper.particles('set', 'opacity', properties.particles_opacity.value / 100);
    }

    // 粒子随机不透明度
    if (properties.particles_opacityRandom) {
        wallpaper.particles('set', 'opacityRandom', properties.particles_opacityRandom.value);
    }

    // 粒子颜色
    if (properties.particles_color) {
        const color = properties.particles_color.value.split(' ').map((c: string) => Math.ceil(parseFloat(c) * 255));
        wallpaper.particles('set', 'color', color);
    }

    // 粒子模糊颜色
    if (properties.particles_shadowColor) {
        const color = properties.particles_shadowColor.value.split(' ').map((c: string) => Math.ceil(parseFloat(c) * 255));
        wallpaper.particles('set', 'shadowColor', color);
    }

    // 粒子模糊大小
    if (properties.particles_shadowBlur) {
        wallpaper.particles('set', 'shadowBlur', properties.particles_shadowBlur.value);
    }

    // 自定义粒子图片
    if (properties.particles_image) {
        shouldShow();
    }

    // 粒子类型
    if (properties.particles_shapeType) {
        switch (properties.particles_shapeType.value) {
            case 1:
                wallpaper.particles('set', 'shapeType', 'circle');
                break;
            case 2:
                wallpaper.particles('set', 'shapeType', 'edge');
                break;
            case 3:
                wallpaper.particles('set', 'shapeType', 'triangle');
                break;
            case 4:
                wallpaper.particles('set', 'shapeType', 'star');
                break;
            case 5:
                wallpaper.particles('set', 'shapeType', 'image');
                shouldShow();
                break;
            default:
                wallpaper.particles('set', 'shapeType', 'circle');
        }
    }

    // 默认图片
    if (properties.particles_picdef) {
        shouldShow();
    }

    // 粒子大小
    if (properties.particles_sizeValue) {
        wallpaper.particles('set', 'sizeValue', properties.particles_sizeValue.value);
    }

    // 粒子随机大小
    if (properties.particles_sizeRandom) {
        wallpaper.particles('set', 'sizeRandom', properties.particles_sizeRandom.value);
    }

    // 显示连线
    if (properties.particles_linkEnable) {
        wallpaper.particles('set', 'linkEnable', properties.particles_linkEnable.value);
    }

    // 连线距离
    if (properties.particles_linkDistance) {
        wallpaper.particles('set', 'linkDistance', properties.particles_linkDistance.value);
    }

    // 连线宽度
    if (properties.particles_linkWidth) {
        wallpaper.particles('set', 'linkWidth', properties.particles_linkWidth.value);
    }

    // 连线颜色
    if (properties.particles_linkColor) {
        const color = properties.particles_linkColor.value.split(' ').map((c: string) => Math.ceil(parseFloat(c) * 255));
        wallpaper.particles('set', 'linkColor', color);
    }

    // 连线不透明度
    if (properties.particles_linkOpacity) {
        wallpaper.particles('set', 'linkOpacity', properties.particles_linkOpacity.value / 100);
    }

    // 粒子是否移动
    if (properties.particles_isMove) {
        wallpaper.particles('set', 'isMove', properties.particles_isMove.value);
    }

    // 粒子速度
    if (properties.particles_speed) {
        wallpaper.particles('set', 'speed', properties.particles_speed.value);
    }

    // 随机粒子速度
    if (properties.particles_speedRandom) {
        wallpaper.particles('set', 'speedRandom', properties.particles_speedRandom.value);
    }

    // 粒子方向
    if (properties.particles_direction) {
        switch (properties.particles_direction.value) {
            case 1:
                wallpaper.particles('set', 'direction', 'none');
                break;
            case 2:
                wallpaper.particles('set', 'direction', 'top');
                break;
            case 3:
                wallpaper.particles('set', 'direction', 'top-right');
                break;
            case 4:
                wallpaper.particles('set', 'direction', 'right');
                break;
            case 5:
                wallpaper.particles('set', 'direction', 'bottom-right');
                break;
            case 6:
                wallpaper.particles('set', 'direction', 'bottom');
                break;
            case 7:
                wallpaper.particles('set', 'direction', 'bottom-left');
                break;
            case 8:
                wallpaper.particles('set', 'direction', 'left');
                break;
            case 9:
                wallpaper.particles('set', 'direction', 'top-left');
                break;
            default:
                wallpaper.particles('set', 'direction', 'none');
        }
    }

    // 粒子是否笔直移动
    if (properties.particles_isStraight) {
        wallpaper.particles('set', 'isStraight', properties.particles_isStraight.value);
    }

    // 粒子反弹
    if (properties.particles_isBounce) {
        wallpaper.particles('set', 'isBounce', properties.particles_isBounce.value);
    }

    // 粒子离屏模式
    if (properties.particles_moveOutMode) {
        switch (properties.particles_moveOutMode.value) {
            case 1:
                wallpaper.particles('set', 'moveOutMode', 'out');
                break;
            case 2:
                wallpaper.particles('set', 'moveOutMode', 'bounce');
                break;
            default:
                wallpaper.particles('set', 'moveOutMode', 'out');
        }
    }

    return result;
}
