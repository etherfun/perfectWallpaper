import { useConfigStore } from '@/stores/config';
import { applyGlobalGlassOverride, registerGlassReplay } from '@/tokens/glass.tokens';
import { parseColorString } from '@/utils/color';

import type { WallpaperProperties } from '@/types/types';

/**
 * 全局亚克力覆盖处理器
 * 启用时用一套值覆盖所有组件的 yakeli 令牌，禁用时恢复各组件自身值
 */
export function useGlobalYakeliProperties(properties: WallpaperProperties): void {
    const store = useConfigStore();
    const patch: Record<string, unknown> = {};
    let enabledChanged = false;
    let enabledVal: boolean | undefined;

    if (properties.global_yakeli_enabled !== undefined) {
        enabledVal = properties.global_yakeli_enabled.value;
        patch.global_yakeli_enabled = enabledVal;
        enabledChanged = true;
    }
    if (properties.global_yakelicolor !== undefined) {
        try {
            const col = parseColorString(properties.global_yakelicolor.value) as [number, number, number];
            if (col.length >= 3) patch.global_yakelicolor = col;
        } catch {
            // 解析失败忽略
        }
    }
    if (properties.global_yakeli !== undefined) {
        patch.global_yakeli = properties.global_yakeli.value / 100;
    }
    if (properties.global_bluryakeli !== undefined) {
        patch.global_bluryakeli = properties.global_bluryakeli.value;
    }
    if (properties.global_yakeli_roundedcorners !== undefined) {
        patch.global_yakeli_roundedcorners = properties.global_yakeli_roundedcorners.value;
    }

    if (Object.keys(patch).length > 0) store.$patch(patch);

    const enabled = enabledVal ?? (store.global_yakeli_enabled ?? false);
    // 注册重放函数：关闭覆盖时用 store 各组件原值立刻回写，避免闪白。
    // 注意：sysmon/dockbar 的 yakeli 值不在 config store（在各自模块状态/缓存），
    // 由 glass.tokens 的 componentTokenCache 恢复；此处仅回写有 store 键的组件。
    registerGlassReplay(() => {
        const body = document.body.style;
        const s = store as unknown as Record<string, unknown>;
        const write = (prefix: string, key: string, cssVar: string, fmt?: (v: unknown) => string) => {
            const v = s[key];
            if (v !== undefined && v !== null) body.setProperty(cssVar, fmt ? fmt(v) : String(v));
        };
        // 各组件 handler 写 store 时已归一化 yakeli 到 0..1（value/100），
        // 此处直接回写即可；切勿再除 100（会二次归一化 → 透明度趋近 0）
        // 仅回写各组件已有的 yakeli 相关键（避免误写非 yakeli 变量）
        // clock / date
        write('clock', 'oclock_yakeli_show', '--clock-yakeli-enabled', v => (v ? '1' : '0'));
        write('clock', 'oclock_yakelic_color', '--clock-yakeli-color', v => (v as number[]).join(','));
        write('clock', 'oclock_yakeli', '--clock-yakeli');
        write('clock', 'oclock_bluryakeli', '--clock-blur-yakeli', v => `${v}px`);
        write('clock', 'oclock_roundedcorners', '--clock-roundedcorners');
        write('date', 'odate_yakeli_show', '--date-yakeli-enabled', v => (v ? '1' : '0'));
        write('date', 'odate_yakelic_color', '--date-yakeli-color', v => (v as number[]).join(','));
        write('date', 'odate_yakeli', '--date-yakeli');
        write('date', 'odate_bluryakeli', '--date-blur-yakeli', v => `${v}px`);
        write('date', 'odate_roundedcorners', '--date-roundedcorners');
        // hitokoto / countdown / weather
        write('hitokoto', 'hitokoto_yakeli_show', '--hitokoto-yakeli-enabled', v => (v ? '1' : '0'));
        write('hitokoto', 'hitokoto_yakelic_color', '--hitokoto-yakeli-color', v => (v as number[]).join(','));
        write('hitokoto', 'hitokoto_yakeli', '--hitokoto-yakeli');
        write('hitokoto', 'hitokoto_bluryakeli', '--hitokoto-blur-yakeli', v => `${v}px`);
        write('hitokoto', 'hitokoto_roundedcorners', '--hitokoto-roundedcorners');
        write('countdown', 'countdown_yakeli_show', '--countdown-yakeli-enabled', v => (v ? '1' : '0'));
        write('countdown', 'countdown_yakelic_color', '--countdown-yakeli-color', v => (v as number[]).join(','));
        write('countdown', 'countdown_yakeli', '--countdown-yakeli');
        write('countdown', 'countdown_bluryakeli', '--countdown-blur-yakeli', v => `${v}px`);
        write('countdown', 'countdown_roundedcorners', '--countdown-roundedcorners');
        write('weather', 'weather_yakeli_show', '--weather-yakeli-enabled', v => (v ? '1' : '0'));
        write('weather', 'weather_yakelic_color', '--weather-yakeli-color', v => (v as number[]).join(','));
        // weather handler 已改为存归一化值（原 bug：存 raw 0..100 → 回写后 alpha≥1）
        write('weather', 'weather_yakeli', '--weather-yakeli');
        write('weather', 'weather_bluryakeli', '--weather-blur-yakeli', v => `${v}px`);
        write('weather', 'weather_roundedcorners', '--weather-roundedcorners');
        write('player', 'player_control_yakeli_show', '--player-yakeli-enabled', v => (v ? '1' : '0'));
        write('player', 'player_control_yakelic_color', '--player-yakeli-color', v => (v as number[]).join(','));
        write('player', 'player_control_yakeli', '--player-yakeli');
        write('player', 'player_control_bluryakeli', '--player-blur-yakeli', v => `${v}px`);
        write('player', 'player_control_roundedcorners', '--player-roundedcorners');
        write('picture-info', 'pictures_info_yakeli_show', '--picture-info-yakeli-enabled', v => (v ? '1' : '0'));
        write('picture-info', 'pictures_info_yakelic_color', '--picture-info-yakeli-color', v => (v as number[]).join(','));
        write('picture-info', 'pictures_info_yakeli', '--picture-info-yakeli');
        write('picture-info', 'pictures_info_bluryakeli', '--picture-info-blur-yakeli', v => `${v}px`);
        write('picture-info', 'pictures_info_roundedcorners', '--picture-info-roundedcorners');
    });

    if (enabledChanged || enabled) {
        if (!enabled) {
            applyGlobalGlassOverride(false, {});
        } else {
            applyGlobalGlassOverride(true, {
                yakeliColor: store.global_yakelicolor,
                yakeli: store.global_yakeli,
                blurYakeli: store.global_bluryakeli !== undefined ? String(store.global_bluryakeli) + 'px' : undefined,
                roundedCorners: store.global_yakeli_roundedcorners,
            });
        }
    }
}
