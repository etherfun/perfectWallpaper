/**
 * useParticleProperties — Vue 3 composable wrapper for particle effect properties
 *
 * Stage 3-3 (Phase 7 批次 3-3): wrap src/propertyHandlers/particlePropertyHandler.ts
 * as a composable.
 *
 * runtime.wallpaper is the WallpaperEffectController instance — a non-Pinia
 * imperative object that manages the canvas/RAF lifecycle. The Pinia store
 * mirrors every user-tweakable setting.
 */
import { useConfigStore } from '@/stores/config';
import { useRuntimeStore } from '@/stores/runtime';

const runtimeStore = useRuntimeStore();

import { WallpaperProperties } from '../../types/types';
import { logInitComplete } from '../core/propertyHandlers/_helpers';

export function useParticleProperties(properties: WallpaperProperties, FirstLoad: boolean): void {
    const store = useConfigStore();
     
    const wallpaper = runtimeStore.wallpaper as any;
    const patch: Record<string, unknown> = {};
    let cusmapRoute: string | null = null;

    if (properties.particles_isParticles) {
        patch.particles_is_particles = properties.particles_isParticles.value;
        if (properties.particles_isParticles.value) {
            wallpaper?.particles('startParticles');
        } else {
            wallpaper?.particles('clearCanvas');
            wallpaper?.particles('stopParticles');
        }
    }

    if (properties.particles_number) {
        patch.particles_number = properties.particles_number.value;
        wallpaper?.particles('addParticles', properties.particles_number.value);
    }

    if (properties.particles_opacity) {
        patch.particles_opacity = properties.particles_opacity.value;
        wallpaper?.particles('set', 'opacity', properties.particles_opacity.value / 100);
    }

    if (properties.particles_opacityRandom) {
        patch.particles_opacity_random = properties.particles_opacityRandom.value;
        wallpaper?.particles('set', 'opacityRandom', properties.particles_opacityRandom.value);
    }

    if (properties.particles_color) {
        const color = properties.particles_color.value
            .split(' ')
            .map((c: string) => Math.ceil(parseFloat(c) * 255));
        patch.particles_color = color;
        wallpaper?.particles('set', 'color', color);
    }

    if (properties.particles_shadowColor) {
        const color = properties.particles_shadowColor.value
            .split(' ')
            .map((c: string) => Math.ceil(parseFloat(c) * 255));
        patch.particles_shadow_color = color;
        wallpaper?.particles('set', 'shadowColor', color);
    }

    if (properties.particles_shadowBlur) {
        patch.particles_shadow_blur = properties.particles_shadowBlur.value;
        wallpaper?.particles('set', 'shadowBlur', properties.particles_shadowBlur.value);
    }

    if (properties.particles_image) {
        patch.particles_image = properties.particles_image.value;
        cusmapRoute = properties.particles_image.value;
        if (wallpaper && typeof wallpaper?.particles === 'function') {
            wallpaper?.particles('particlesImage', cusmapRoute, 'false');
        }
    }

    if (properties.particles_shapeType) {
        patch.particles_shape_type = properties.particles_shapeType.value;
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
                        wallpaper?.particles('particlesImage', store.map_route ?? '', 'true');
                    }
                }
                break;
            default:
                wallpaper?.particles('set', 'shapeType', 'circle');
        }
    }

    if (properties.particles_picdef) {
        const mapRoute = 'map/' + properties.particles_picdef.value + '.png';
        patch.map_route = mapRoute;
        if (wallpaper && typeof wallpaper?.particles === 'function') {
            wallpaper?.particles('particlesImage', mapRoute, 'true');
        }
    }

    if (properties.particles_sizeValue) {
        patch.particles_size_value = properties.particles_sizeValue.value;
        wallpaper?.particles('set', 'sizeValue', properties.particles_sizeValue.value);
    }

    if (properties.particles_sizeRandom) {
        patch.particles_size_random = properties.particles_sizeRandom.value;
        wallpaper?.particles('set', 'sizeRandom', properties.particles_sizeRandom.value);
    }

    if (properties.particles_linkEnable) {
        patch.particles_link_enable = properties.particles_linkEnable.value;
        wallpaper?.particles('set', 'linkEnable', properties.particles_linkEnable.value);
    }

    if (properties.particles_linkDistance) {
        patch.particles_link_distance = properties.particles_linkDistance.value;
        wallpaper?.particles('set', 'linkDistance', properties.particles_linkDistance.value);
    }

    if (properties.particles_linkWidth) {
        patch.particles_link_width = properties.particles_linkWidth.value;
        wallpaper?.particles('set', 'linkWidth', properties.particles_linkWidth.value);
    }

    if (properties.particles_linkColor) {
        const color = properties.particles_linkColor.value
            .split(' ')
            .map((c: string) => Math.ceil(parseFloat(c) * 255));
        patch.particles_link_color = color;
        wallpaper?.particles('set', 'linkColor', color);
    }

    if (properties.particles_linkOpacity) {
        patch.particles_link_opacity = properties.particles_linkOpacity.value;
        wallpaper?.particles('set', 'linkOpacity', properties.particles_linkOpacity.value / 100);
    }

    if (properties.particles_isMove) {
        patch.particles_is_move = properties.particles_isMove.value;
        wallpaper?.particles('set', 'isMove', properties.particles_isMove.value);
    }

    if (properties.particles_speed) {
        patch.particles_speed = properties.particles_speed.value;
        wallpaper?.particles('set', 'speed', properties.particles_speed.value);
    }

    if (properties.particles_speedRandom) {
        patch.particles_speed_random = properties.particles_speedRandom.value;
        wallpaper?.particles('set', 'speedRandom', properties.particles_speedRandom.value);
    }

    if (properties.particles_direction) {
        patch.particles_direction = properties.particles_direction.value;
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
        patch.particles_is_straight = properties.particles_isStraight.value;
        wallpaper?.particles('set', 'isStraight', properties.particles_isStraight.value);
    }

    if (properties.particles_isBounce) {
        patch.particles_is_bounce = properties.particles_isBounce.value;
        wallpaper?.particles('set', 'isBounce', properties.particles_isBounce.value);
    }

    if (properties.particles_moveOutMode) {
        patch.particles_move_out_mode = properties.particles_moveOutMode.value;
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

    if (Object.keys(patch).length > 0) {
        store.$patch(patch);
    }

    if (FirstLoad) {
        logInitComplete('[Particles]', '粒子效果', FirstLoad);
        store.$patch({ particles_init_complete: true });
    }
}
