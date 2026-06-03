import { config } from '@/utils/config';

import { logInitComplete } from './_helpers';
import { WallpaperProperties } from './types';

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
        config.particles_is_particles = properties.particles_isParticles.value;
        if (properties.particles_isParticles.value) {
            wallpaper?.particles('startParticles');
        } else {
            wallpaper?.particles('clearCanvas').particles('stopParticles');
        }
    }

    if (properties.particles_number) {
        config.particles_number = properties.particles_number.value;
        wallpaper?.particles('addParticles', properties.particles_number.value);
    }

    if (properties.particles_opacity) {
        config.particles_opacity = properties.particles_opacity.value;
        wallpaper?.particles('set', 'opacity', properties.particles_opacity.value / 100);
    }

    if (properties.particles_opacityRandom) {
        config.particles_opacity_random = properties.particles_opacityRandom.value;
        wallpaper?.particles('set', 'opacityRandom', properties.particles_opacityRandom.value);
    }

    if (properties.particles_color) {
        const color = properties.particles_color.value
            .split(' ')
            .map((c: string) => Math.ceil(parseFloat(c) * 255)) as [number, number, number];
        config.particles_color = color;
        wallpaper?.particles('set', 'color', color);
    }

    if (properties.particles_shadowColor) {
        const color = properties.particles_shadowColor.value
            .split(' ')
            .map((c: string) => Math.ceil(parseFloat(c) * 255)) as [number, number, number];
        config.particles_shadow_color = color;
        wallpaper?.particles('set', 'shadowColor', color);
    }

    if (properties.particles_shadowBlur) {
        config.particles_shadow_blur = properties.particles_shadowBlur.value;
        wallpaper?.particles('set', 'shadowBlur', properties.particles_shadowBlur.value);
    }

    let cusmapRoute: string | null = null;

    if (properties.particles_image) {
        config.particles_image = properties.particles_image.value;
        cusmapRoute = properties.particles_image.value;
        if (wallpaper && typeof wallpaper?.particles === 'function') {
            wallpaper?.particles('particlesImage', cusmapRoute, 'false');
        }
    }

    if (properties.particles_shapeType) {
        config.particles_shape_type = properties.particles_shapeType.value;
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
                        wallpaper?.particles('particlesImage', config.map_route, 'true');
                    }
                }
                break;
            default:
                wallpaper?.particles('set', 'shapeType', 'circle');
        }
    }

    if (properties.particles_picdef) {
        const mapRoute = 'map/' + properties.particles_picdef.value + '.png';
        config.map_route = mapRoute;
        if (wallpaper && typeof wallpaper?.particles === 'function') {
            wallpaper?.particles('particlesImage', mapRoute, 'true');
        }
    }

    if (properties.particles_sizeValue) {
        config.particles_size_value = properties.particles_sizeValue.value;
        wallpaper?.particles('set', 'sizeValue', properties.particles_sizeValue.value);
    }

    if (properties.particles_sizeRandom) {
        config.particles_size_random = properties.particles_sizeRandom.value;
        wallpaper?.particles('set', 'sizeRandom', properties.particles_sizeRandom.value);
    }

    if (properties.particles_linkEnable) {
        config.particles_link_enable = properties.particles_linkEnable.value;
        wallpaper?.particles('set', 'linkEnable', properties.particles_linkEnable.value);
    }

    if (properties.particles_linkDistance) {
        config.particles_link_distance = properties.particles_linkDistance.value;
        wallpaper?.particles('set', 'linkDistance', properties.particles_linkDistance.value);
    }

    if (properties.particles_linkWidth) {
        config.particles_link_width = properties.particles_linkWidth.value;
        wallpaper?.particles('set', 'linkWidth', properties.particles_linkWidth.value);
    }

    if (properties.particles_linkColor) {
        const color = properties.particles_linkColor.value
            .split(' ')
            .map((c: string) => Math.ceil(parseFloat(c) * 255)) as [number, number, number];
        config.particles_link_color = color;
        wallpaper?.particles('set', 'linkColor', color);
    }

    if (properties.particles_linkOpacity) {
        config.particles_link_opacity = properties.particles_linkOpacity.value;
        wallpaper?.particles('set', 'linkOpacity', properties.particles_linkOpacity.value / 100);
    }

    if (properties.particles_isMove) {
        config.particles_is_move = properties.particles_isMove.value;
        wallpaper?.particles('set', 'isMove', properties.particles_isMove.value);
    }

    if (properties.particles_speed) {
        config.particles_speed = properties.particles_speed.value;
        wallpaper?.particles('set', 'speed', properties.particles_speed.value);
    }

    if (properties.particles_speedRandom) {
        config.particles_speed_random = properties.particles_speedRandom.value;
        wallpaper?.particles('set', 'speedRandom', properties.particles_speedRandom.value);
    }

    if (properties.particles_direction) {
        config.particles_direction = properties.particles_direction.value;
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
        config.particles_is_straight = properties.particles_isStraight.value;
        wallpaper?.particles('set', 'isStraight', properties.particles_isStraight.value);
    }

    if (properties.particles_isBounce) {
        config.particles_is_bounce = properties.particles_isBounce.value;
        wallpaper?.particles('set', 'isBounce', properties.particles_isBounce.value);
    }

    if (properties.particles_moveOutMode) {
        config.particles_move_out_mode = properties.particles_moveOutMode.value;
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
        logInitComplete('[Particles]', '粒子效果', FirstLoad);
    }
}
