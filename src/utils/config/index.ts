import { debugLogger, registerDebugLogger } from '../logger';
import { SYNC_DEFAULTS, type SyncDefaults } from './defaults';
import type { RuntimeData } from './runtime';

const RUNTIME_DATA_DEFAULTS: RuntimeData = {
    playerInfo: {
        audioArray: [],
        playerState: null,
        singtitle: '',
        singartist: '',
        singalbumTitle: '',
        aubarstop: true,
        colorGroup: null,
        fontcolor: null,
        externalMediaActive: false,
        builtInPlayerInitializing: false,
    },
    param: {
        style: 1,
        r: 0.45,
        color: 'rgba(255,255,255,0.8)',
        blurColor: '#ffcccc',
        arr1: [],
        arr2: [],
        rotation: 0,
        rotationcopy: 0,
        offsetAngle: 0,
        waveArr: new Array(120),
        cX: 0.5,
        cY: 0.5,
        range: 9,
        shadowBlur: 15,
        lineWidth: 9,
        showCircle: true,
        wavetransparency: 0.8,
        showSemiCircle: false,
        SemiCircledirection: 1,
        Polygon: 12,
        PolygonAngle: 0,
        direction: 1,
        SolidColorGradient: true,
        BlurColorGradient: true,
        ColorRhythm: true,
        ColorMode: 1,
        TagNow: 1,
        GradientRate: 0.5,
    },
    PWLineParam: {
        style: 1,
        sw: 0.8,
        lineWidth: 9,
        waveArr: new Array(120),
        range: 5,
        color: 'rgba(255,255,255,0.8)',
        blurColor: '#ffcccc',
        shadowBlur: 100,
        arr1: [],
        arr2: [],
        arr3: [],
        LineX: 0.5,
        LineY: 0.5,
        showLine: true,
        LinePosition: 1,
        Direction: 1,
        LineDensity: 120,
        LineTransparency: 0.8,
        MiddleLine: false,
        TagNow: 1,
        SolidColorGradient: true,
        BlurColorGradient: true,
        ColorRhythm: true,
        ColorMode: 1,
        GradientRate: 0.5,
    },
    hitokoto: { hitokoto_text: '未获取', from_text: '未获取', from_who_text: '未获取' },
    photo: {
        currentImg: null,
        nextphoto: false,
        infomation: { title: '', text: '', copyright: '', where: '' },
    },
    files: {},
    myList: [],
    versionManager: undefined,
    debugLogger: undefined,
    FluidEffect2: undefined,
    fluidEffect: undefined,
    fullscreenFluidEffect: undefined,
    FluidEffect: undefined,
    fullscreenFluidEnabled: false,
    pictureInfoHideStyleAdded: false,
    wallpaper: null,
};

class AppConfig {
    public runtime: RuntimeData;

    constructor() {
        this.runtime = structuredClone(RUNTIME_DATA_DEFAULTS);
        for (const key of Object.keys(SYNC_DEFAULTS)) {
            (this as Record<string, unknown>)[`_${key}`] = (
                SYNC_DEFAULTS as Record<string, unknown>
            )[key];
        }
        registerDebugLogger(this as unknown as { runtime: { debugLogger: typeof debugLogger } });
    }
}

const appConfig = new AppConfig();

for (const key of Object.keys(SYNC_DEFAULTS)) {
    const internalKey = `_${key}`;
    Object.defineProperty(appConfig, key, {
        get(this: AppConfig) {
            return (this as unknown as Record<string, unknown>)[internalKey];
        },
        set(this: AppConfig, value: unknown) {
            (this as unknown as Record<string, unknown>)[internalKey] = value;
        },
        configurable: true,
        enumerable: true,
    });
}

export const config = appConfig as AppConfig & SyncDefaults & { runtime: RuntimeData };
export { AppConfig, SYNC_DEFAULTS };
