import { debugLogger } from '@/utils/logger';
import { WallpaperProperties } from './types';
import { config } from '@/utils/config';

/**
 * 处理粒子效果相关属性
 * @param properties 属性对象
 * @param FirstLoad 是否首次加载
 */
export function handleParticleProperties(
    properties: WallpaperProperties,
    FirstLoad: boolean
): void {

    const wallpaper = config.runtime.wallpaper;

    if (properties.particles_isParticles) {
        if (properties.particles_isParticles.value) {
            wallpaper?.particles('startParticles');
        } else {
            wallpaper?.particles('clearCanvas').particles('stopParticles');
        }
    }

    if (properties.particles_number) {
        wallpaper?.particles('addParticles', properties.particles_number.value);
    }

    if (properties.particles_opacity) {
        wallpaper?.particles('set', 'opacity', properties.particles_opacity.value / 100);
    }

    if (properties.particles_opacityRandom) {
        wallpaper?.particles('set', 'opacityRandom', properties.particles_opacityRandom.value);
    }

    if (properties.particles_color) {
        const color = properties.particles_color.value.split(' ').map((c: string) => Math.ceil(parseFloat(c) * 255));
        wallpaper?.particles('set', 'color', color);
    }

    if (properties.particles_shadowColor) {
        const color = properties.particles_shadowColor.value.split(' ').map((c: string) => Math.ceil(parseFloat(c) * 255));
        wallpaper?.particles('set', 'shadowColor', color);
    }

    if (properties.particles_shadowBlur) {
        wallpaper?.particles('set', 'shadowBlur', properties.particles_shadowBlur.value);
    }

    let cusmapRoute: string | null = null;

    if (properties.particles_image) {
        cusmapRoute = properties.particles_image.value;
        if (wallpaper && typeof wallpaper?.particles === 'function') {
            wallpaper?.particles('particlesImage', cusmapRoute, 'false');
        }
    }

    if (properties.particles_shapeType) {
        switch (properties.particles_shapeType.value) {
            case 1:
                wallpaper?.particles('set', 'shapeType', 'circle');
                break;
            case 2:
                wallpaper?.particles('set', 'shapeType', 'edge');
                break;
            case 3:
                wallpaper?.particles('set', 'shapeType', 'triangle');
                break;
            case 4:
                wallpaper?.particles('set', 'shapeType', 'star');
                break;
            case 5:
                wallpaper?.particles('set', 'shapeType', 'image');
                if (wallpaper && typeof wallpaper?.particles === 'function') {
                    if (cusmapRoute) {
                        wallpaper?.particles('particlesImage', cusmapRoute, 'false');
                    } else {
                        wallpaper?.particles('particlesImage', config.mapRoute, 'true');
                    }
                }
                break;
            default:
                wallpaper?.particles('set', 'shapeType', 'circle');
        }
    }

    if (properties.particles_picdef) {
        const mapRoute = 'map/' + properties.particles_picdef.value + '.png';
        config.mapRoute = mapRoute;
        if (wallpaper && typeof wallpaper?.particles === 'function') {
            wallpaper?.particles('particlesImage', mapRoute, 'true');
        }
    }

    if (properties.particles_sizeValue) {
        wallpaper?.particles('set', 'sizeValue', properties.particles_sizeValue.value);
    }

    if (properties.particles_sizeRandom) {
        wallpaper?.particles('set', 'sizeRandom', properties.particles_sizeRandom.value);
    }

    if (properties.particles_linkEnable) {
        wallpaper?.particles('set', 'linkEnable', properties.particles_linkEnable.value);
    }

    if (properties.particles_linkDistance) {
        wallpaper?.particles('set', 'linkDistance', properties.particles_linkDistance.value);
    }

    if (properties.particles_linkWidth) {
        wallpaper?.particles('set', 'linkWidth', properties.particles_linkWidth.value);
    }

    if (properties.particles_linkColor) {
        const color = properties.particles_linkColor.value.split(' ').map((c: string) => Math.ceil(parseFloat(c) * 255));
        wallpaper?.particles('set', 'linkColor', color);
    }

    if (properties.particles_linkOpacity) {
        wallpaper?.particles('set', 'linkOpacity', properties.particles_linkOpacity.value / 100);
    }

    if (properties.particles_isMove) {
        wallpaper?.particles('set', 'isMove', properties.particles_isMove.value);
    }

    if (properties.particles_speed) {
        wallpaper?.particles('set', 'speed', properties.particles_speed.value);
    }

    if (properties.particles_speedRandom) {
        wallpaper?.particles('set', 'speedRandom', properties.particles_speedRandom.value);
    }

    if (properties.particles_direction) {
        switch (properties.particles_direction.value) {
            case 1:
                wallpaper?.particles('set', 'direction', 'none');
                break;
            case 2:
                wallpaper?.particles('set', 'direction', 'top');
                break;
            case 3:
                wallpaper?.particles('set', 'direction', 'top-right');
                break;
            case 4:
                wallpaper?.particles('set', 'direction', 'right');
                break;
            case 5:
                wallpaper?.particles('set', 'direction', 'bottom-right');
                break;
            case 6:
                wallpaper?.particles('set', 'direction', 'bottom');
                break;
            case 7:
                wallpaper?.particles('set', 'direction', 'bottom-left');
                break;
            case 8:
                wallpaper?.particles('set', 'direction', 'left');
                break;
            case 9:
                wallpaper?.particles('set', 'direction', 'top-left');
                break;
            default:
                wallpaper?.particles('set', 'direction', 'none');
        }
    }

    if (properties.particles_isStraight) {
        wallpaper?.particles('set', 'isStraight', properties.particles_isStraight.value);
    }

    if (properties.particles_isBounce) {
        wallpaper?.particles('set', 'isBounce', properties.particles_isBounce.value);
    }

    if (properties.particles_moveOutMode) {
        switch (properties.particles_moveOutMode.value) {
            case 1:
                wallpaper?.particles('set', 'moveOutMode', 'out');
                break;
            case 2:
                wallpaper?.particles('set', 'moveOutMode', 'bounce');
                break;
            default:
                wallpaper?.particles('set', 'moveOutMode', 'out');
        }
    }

    if (FirstLoad) {
        debugLogger.info('[Particles] 粒子效果参数初始化完成');
    }
}
