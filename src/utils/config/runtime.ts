import type { FluidEffect } from '../../fluid';
import { versionManager } from '../../version';
import type { WallpaperEffectController } from '../../WallpaperEffectController';
import type { DebugLogger } from '../logger';

// ────────────────────────────────────────────────────────────────────────
// Stage 3.5-B 架构边界（锁定）：
//
// 以下类型描述的命令式单例，**不**通过 Pinia 管理：
//   - PlayerRuntime.playerInfo（媒体元数据 + 高频 FFT/color 数据）
//   - VisualRuntime.param / PWLineParam（PWCircle/PWLine 渲染参数，60 Hz 写入）
//   - FluidRuntime.*（WebGL 流体实例）
//   - PhotoRuntime.photo（幻灯片状态）
//   - HitokotoRuntime.hitokoto（仅 hitokoto 已 Pinia 化，见 src/stores/runtime.ts）
//   - DockRuntime.{files, myList}（文件列表）
//   - WallpaperRuntime.wallpaper（WallpaperEffectController）
//   - ServiceRuntime.{versionManager, debugLogger}（服务实例）
//
// 这些字段被 WebGL / RAF / FFT 以 60 Hz 写入；Pinia 化会引入每帧 Vue 响应式
// 触发，导致性能崩溃。详见 src/stores/configBridge.ts 顶部架构边界说明。
//
// Vue 组件如需读这些字段：通过 useConfigStore()（已镜像的 user-tweakable 设置）
// + appConfig.runtime.xxx（未 Pinia 化的字段）混合访问。
// ────────────────────────────────────────────────────────────────────────

export interface PlayerRuntime {
    playerInfo: {
        audioArray: number[];
        playerState: number | null;
        singtitle: string;
        singartist: string;
        singalbumTitle: string;
        aubarstop: boolean;
        colorGroup: ([number, number, number] | string | null)[][] | null;
        fontcolor: string | [number, number, number] | null;
        externalMediaActive: boolean;
        builtInPlayerInitializing: boolean;
    };
}

export interface VisualRuntime {
    param: {
        style: number;
        r: number;
        color: string;
        blurColor: string;
        arr1: { x: number; y: number }[];
        arr2: { x: number; y: number }[];
        rotation: number;
        rotationcopy: number;
        offsetAngle: number;
        waveArr: number[];
        cX: number;
        cY: number;
        range: number;
        shadowBlur: number;
        lineWidth: number;
        showCircle: boolean;
        wavetransparency: number;
        showSemiCircle: boolean;
        SemiCircledirection: number;
        Polygon: number;
        PolygonAngle: number;
        direction: number;
        SolidColorGradient: boolean;
        BlurColorGradient: boolean;
        ColorRhythm: boolean;
        ColorMode: number;
        TagNow: number;
        GradientRate: number;
    };
    PWLineParam: {
        style: number;
        sw: number;
        lineWidth: number;
        waveArr: number[];
        range: number;
        color: string;
        blurColor: string;
        shadowBlur: number;
        arr1: { x: number; y: number }[];
        arr2: { x: number; y: number }[];
        arr3: { x: number; y: number }[];
        LineX: number;
        LineY: number;
        showLine: boolean;
        LinePosition: number;
        Direction: number;
        LineDensity: number;
        LineTransparency: number;
        MiddleLine: boolean;
        TagNow: number;
        SolidColorGradient: boolean;
        BlurColorGradient: boolean;
        ColorRhythm: boolean;
        ColorMode: number;
        GradientRate: number;
    };
}

export interface PhotoRuntime {
    photo: {
        currentImg: string | null;
        nextphoto: boolean;
        infomation: {
            title: string;
            text: string;
            copyright: string;
            where: string;
        };
    };
}

export interface HitokotoRuntime {
    hitokoto: {
        hitokoto_text: string;
        from_text: string;
        from_who_text: string;
    };
}

export interface FluidRuntime {
    FluidEffect2: FluidEffect | null | undefined;
    fluidEffect: FluidEffect | null | undefined;
    fullscreenFluidEffect: FluidEffect | null | undefined;
    FluidEffect: FluidEffect | null | undefined;
    fullscreenFluidEnabled: boolean;
    pictureInfoHideStyleAdded: boolean;
}

export interface DockRuntime {
    files: Record<string, string[]>;
    myList: string[];
}

export interface WallpaperRuntime {
    wallpaper: WallpaperEffectController | null;
}

export interface ServiceRuntime {
    versionManager: versionManager | undefined;
    debugLogger: DebugLogger | undefined;
}

export interface RuntimeData
    extends
        PlayerRuntime,
        VisualRuntime,
        PhotoRuntime,
        HitokotoRuntime,
        FluidRuntime,
        DockRuntime,
        WallpaperRuntime,
        ServiceRuntime {}
