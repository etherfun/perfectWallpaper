/**
 * Pinia store 类型定义 — 运行时状态
 */

export interface HitokotoRuntime {
    hitokoto_text: string;
    from_text: string;
    from_who_text: string;
}

/**
 * RuntimeStoreState — 运行时数据状态类型。
 *
 * 等价于 `RuntimeData`（来自 `src/utils/config/runtime.ts`），
 * 但使用 ref/shallowRef 包裹实现高性能响应式。
 *
 * 高频字段（playerInfo / param / PWLineParam）：shallowRef → 不深度追踪，
 * 避免 60Hz RAF 更新触发 Vue 响应式开销。
 * 中低频字段（photo / files / hitokoto）：ref → 正常响应式。
 * 实例字段（wallpaper / versionManager / fluidEffect*）：shallowRef → 仅引用追踪。
 */
export interface RuntimeStoreState {
    // ── PlayerRuntime ──
    /** 媒体元数据 + FFT 数据（60Hz 写入，shallowRef） */
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

    // ── VisualRuntime ──
    /** PWCircle 渲染参数（60Hz 写入，shallowRef） */
    param: {
        style: number; r: number; color: string; blurColor: string;
        arr1: { x: number; y: number }[]; arr2: { x: number; y: number }[];
        rotation: number; rotationcopy: number; offsetAngle: number;
        waveArr: number[]; cX: number; cY: number; range: number;
        shadowBlur: number; lineWidth: number; showCircle: boolean;
        wavetransparency: number; showSemiCircle: boolean;
        SemiCircledirection: number; Polygon: number; PolygonAngle: number;
        direction: number; SolidColorGradient: boolean;
        BlurColorGradient: boolean; ColorRhythm: boolean;
        ColorMode: number; TagNow: number; GradientRate: number;
    };
    /** PWLine 渲染参数（60Hz 写入，shallowRef） */
    PWLineParam: {
        style: number; sw: number; lineWidth: number; waveArr: number[];
        range: number; color: string; blurColor: string; shadowBlur: number;
        arr1: { x: number; y: number }[]; arr2: { x: number; y: number }[];
        arr3: { x: number; y: number }[]; LineX: number; LineY: number;
        showLine: boolean; LinePosition: number; Direction: number;
        LineDensity: number; LineTransparency: number; MiddleLine: boolean;
        TagNow: number; SolidColorGradient: boolean; BlurColorGradient: boolean;
        ColorRhythm: boolean; ColorMode: number; GradientRate: number;
    };

    // ── PhotoRuntime ──
    /** 幻灯片状态 */
    photo: {
        currentImg: string | null;
        nextphoto: boolean;
        infomation: { title: string; text: string; copyright: string; where: string };
    };

    // ── HitokotoRuntime ──
    /** 一言数据 */
    hitokoto: { hitokoto_text: string; from_text: string; from_who_text: string };

    // ── FluidRuntime ──
    /** WebGL 流体实例（shallowRef） */
    FluidEffect2: unknown;
    fluidEffect: unknown;
    fullscreenFluidEffect: unknown;
    FluidEffect: unknown;
    /** 全屏流体启用 */
    fullscreenFluidEnabled: boolean;
    /** 图片信息隐藏样式已添加 */
    pictureInfoHideStyleAdded: boolean;

    // ── DockRuntime ──
    /** 文件列表 */
    files: Record<string, string[]>;
    /** 文件列表顺序 */
    myList: string[];

    // ── WallpaperRuntime ──
    /** WallpaperEffectController 实例（shallowRef） */
    wallpaper: unknown;

    // ── ServiceRuntime ──
    /** 版本管理器实例（shallowRef） */
    versionManager: unknown;
    /** 调试日志器实例（shallowRef） */
    debugLogger: unknown;
}
