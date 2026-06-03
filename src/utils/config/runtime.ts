import type { FluidEffect } from '../../fluid';
import { versionManager } from '../../version';
import type { WallpaperEffectController } from '../../WallpaperEffectController';
import type { DebugLogger } from '../logger';

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
