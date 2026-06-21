import { useConfigStore } from '@/stores/config';

import { logInitComplete } from './_helpers';
import { WallpaperProperties } from './types';

/**
 * 处理RGB灯光效果相关属性
 * @param properties 属性对象
 * @param FirstLoad 是否首次加载
 *
 * Stage 7-B: 改写 config.xxx = ... 为 useConfigStore().$patch({...})，
 * 解除本 handler 对 src/utils/config 单例的依赖（Stage 3.5 准备）。
 */
export function handleRGBProperties(properties: WallpaperProperties, FirstLoad: boolean): void {
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
        }
    }

    // 是否显示RGB效果
    if (properties.rgb_show) {
        patch.rgb_show = properties.rgb_show.value;
    }

    // 背景RGB开关
    if (properties.rgb_bg) {
        patch.background_rgb = properties.rgb_bg.value;
    }

    // 樱花RGB开关
    if (properties.rgb_sa) {
        patch.sakura_rgb = properties.rgb_sa.value;
    }

    // 粒子RGB开关
    if (properties.rgb_pa) {
        patch.particles_rgb = properties.rgb_pa.value;
    }

    // 音频条RGB开关
    if (properties.rgb_au) {
        patch.audiobar_rgb = properties.rgb_au.value;
    }

    // 樱花不透明度
    if (properties.rgb_sa_op) {
        patch.opacity_sa_rgb = properties.rgb_sa_op.value / 100;
    }

    // 音频条高度
    if (properties.rgb_au_high) {
        patch.aurgbhigh = properties.rgb_au_high.value / 2;
    }

    // 音频条颜色
    if (properties.rgb_au_color) {
        const color = properties.rgb_au_color.value
            .split(' ')
            .map(c => Math.ceil(parseFloat(c) * 255));
        patch.aurgbcolor = color.join(',');
    }

    // 彩虹颜色模式
    if (properties.rgb_color_rainbow) {
        patch.audiobar_rainbow_color = properties.rgb_color_rainbow.value;
    }

    // 彩虹移动
    if (properties.rgb_color_rainbow_move) {
        patch.rainbow_move = properties.rgb_color_rainbow_move.value;
    }

    // 彩虹移动速度
    if (properties.rgb_color_rainbow_movespeed) {
        patch.rainbow_move_speed = properties.rgb_color_rainbow_movespeed.value;
    }

    // Single batched $patch (one Vue reactivity trigger instead of 14)
    if (Object.keys(patch).length > 0) {
        store.$patch(patch);
    }

    if (FirstLoad) {
        logInitComplete('[RGB]', 'RGB灯光', FirstLoad);
    }
}
