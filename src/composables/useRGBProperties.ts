/**
 * useRGBProperties — Vue 3 composable wrapper for RGB lighting properties
 *
 * Stage 3-3 (Phase 7 批次 3-3): wrap src/propertyHandlers/rgbPropertyHandler.ts
 * as a composable. Pure Pinia-side effects (no DOM, no runtime calls).
 */
import { useConfigStore } from '@/stores/config';

import { logInitComplete } from '../propertyHandlers/_helpers';
import { WallpaperProperties } from '../propertyHandlers/types';

const config = useConfigStore();

export function useRGBProperties(properties: WallpaperProperties, FirstLoad: boolean): void {
    const store = useConfigStore();
    const patch: Record<string, unknown> = {};

    // RGB FPS刷新率
    if (properties.rgb_fps) {
        const fpsMap: Record<number, number> = {
            24: 41,
            30: 33,
            45: 22,
            60: 16,
        };
        const fps = properties.rgb_fps.value;
        if (fpsMap[fps] !== undefined) {
            patch.rgb_refresh = fpsMap[fps];
            config.rgb_refresh = fpsMap[fps]; // sync
        }
    }

    // 是否显示RGB效果
    if (properties.rgb_show) {
        const v = properties.rgb_show.value;
        patch.rgb_show = v;
        config.rgb_show = v; // sync
    }

    // 背景RGB开关
    if (properties.rgb_bg) {
        const v = properties.rgb_bg.value;
        patch.background_rgb = v;
        config.background_rgb = v; // sync
    }

    // 樱花RGB开关
    if (properties.rgb_sa) {
        const v = properties.rgb_sa.value;
        patch.sakura_rgb = v;
        config.sakura_rgb = v; // sync
    }

    // 粒子RGB开关
    if (properties.rgb_pa) {
        const v = properties.rgb_pa.value;
        patch.particles_rgb = v;
        config.particles_rgb = v; // sync
    }

    // 音频条RGB开关
    if (properties.rgb_au) {
        const v = properties.rgb_au.value;
        patch.audiobar_rgb = v;
        config.audiobar_rgb = v; // sync
    }

    // 樱花不透明度
    if (properties.rgb_sa_op) {
        const v = properties.rgb_sa_op.value / 100;
        patch.opacity_sa_rgb = v;
        config.opacity_sa_rgb = v; // sync
    }

    // 音频条高度
    if (properties.rgb_au_high) {
        const v = properties.rgb_au_high.value / 2;
        patch.aurgbhigh = v;
        config.aurgbhigh = v; // sync
    }

    // 音频条颜色
    if (properties.rgb_au_color) {
        const color = properties.rgb_au_color.value
            .split(' ')
            .map(c => Math.ceil(parseFloat(c) * 255));
        const v = color.join(',');
        patch.aurgbcolor = v;
        config.aurgbcolor = v; // sync
    }

    // 彩虹颜色模式
    if (properties.rgb_color_rainbow) {
        const v = properties.rgb_color_rainbow.value;
        patch.audiobar_rainbow_color = v;
        config.audiobar_rainbow_color = v; // sync
    }

    // 彩虹移动
    if (properties.rgb_color_rainbow_move) {
        const v = properties.rgb_color_rainbow_move.value;
        patch.rainbow_move = v;
        config.rainbow_move = v; // sync
    }

    // 彩虹移动速度
    if (properties.rgb_color_rainbow_movespeed) {
        const v = properties.rgb_color_rainbow_movespeed.value;
        patch.rainbow_move_speed = v;
        config.rainbow_move_speed = v; // sync
    }

    // Single batched $patch (one Vue reactivity trigger instead of 14)
    if (Object.keys(patch).length > 0) {
        store.$patch(patch);
    }

    if (FirstLoad) {
        logInitComplete('[RGB]', 'RGB灯光', FirstLoad);
    }
}
