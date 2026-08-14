/**
 * Wallpaper Properties 类型定义 — 流体效果/全屏歌词/系统监控/Dock栏
 *
 * 从 `src/types/types.ts` 拆出的 WallpaperProperties 声明片段（流体/全屏歌词/系统监控/Dock栏），
 * 由 ./wallpaper-properties 交叉类型聚合，对外类型完全不变。
 */

// WallpaperProperties 接口 - 所有属性的类型定义
export interface WallpaperPropertiesExtra {
    // 流体效果参数
    fluidEffectEnabledFullscreen?: { value: boolean };
    fluidEffectEnabled?: { value: boolean };
    fluidEffectResolution?: { value: number };
    fluidEffectBlurAmount?: { value: number };
    fluidEffectDisplacementScale?: { value: number };
    fluidEffectTurbulenceOctaves?: { value: number };
    fluidEffectCanvasDisplacement?: { value: number };
    fluidEffect_DarkOverlayStrength?: { value: number };
    fluidEffect_backdropFilterStrength?: { value: number };

    // 全屏歌词参数
    fullscreen_lyrics_enabled?: { value: boolean };
    fullscreen_lyrics_show_translation?: { value: boolean };
    fullscreen_lyrics_show_roman?: { value: boolean };
    fullscreen_lyrics_delay?: { value: number };
    fullscreen_lyrics_enable_blur?: { value: boolean };
    fullscreen_lyrics_hide_other?: { value: boolean };
    fullscreen_lyrics_show_clock?: { value: boolean };

    // 系统监控参数
    sysmon_server_port?: { value: number };
    sysmon_auto_start?: { value: boolean };
    server_mode?: { value: boolean }; // 启用插件
    sysmon_update_interval?: { value: number };
    sysmon_cpu_mode?: { value: number };
    sysmon_gpu_mode?: { value: number };
    sysmon_memory_mode?: { value: number };
    sysmon_network_mode?: { value: number };
    sysmon_show_cpu?: { value: boolean };
    sysmon_show_gpu?: { value: boolean };
    sysmon_show_memory?: { value: boolean };
    sysmon_show_network?: { value: boolean };
    sysmon_x?: { value: number };
    sysmon_y?: { value: number };
    sysmon_size?: { value: number };
    sysmon_color?: { value: string };
    sysmon_enabled?: { value: boolean };
    sysmon_bar_layout?: { value: number };
    sysmon_position?: { value: number };
    sysmon_disconnect_timeout?: { value: number };
    sysmon_yakeli_show?: { value: boolean };
    sysmon_bluryakeli?: { value: number };
    sysmon_yakeli?: { value: number };
    sysmon_yakelicolor?: { value: string };
    sysmon_roundedcorners?: { value: number };
    sysmon_display_style?: { value: number };
    sysmon_show_disk?: { value: boolean };

    // Dock栏参数
    dockbar_enabled?: { value: boolean };
    dockbar_position?: { value: number };
    dockbar_icon_size?: { value: number };
    dockbar_spacing?: { value: number };
    dockbar_yakeli_show?: { value: boolean };
    dockbar_yakeli?: { value: number };
    dockbar_bluryakeli?: { value: number };
    dockbar_yakelicolor?: { value: string };
    dockbar_roundedcorners?: { value: number };
    dockbar_x?: { value: number };
    dockbar_y?: { value: number };
    dockbar_show_add_btn?: { value: boolean };
}
