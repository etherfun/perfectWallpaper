// Init state now via appConfig
// declare let dateInitComplate: boolean;
// declare let bgInitComplate: boolean;
// declare let weatherInitComplate: boolean;
// declare let updateInitComplate: boolean;
// globalSettingsLanguage now via appConfig.getLanguage()

// Weather related globals
// Weather config now via appConfig
// declare let weather_api_choose: number;
// declare let weather_unit: string;
// declare let weather_updata: number;
declare let weather_daliy_tip: boolean;
declare let showTemperatureInsteadOfPrecip: boolean;
declare let precipTemperatureToggleTimer: NodeJS.Timeout | null;
declare let isAnimatingPrecipToggle: boolean;
// API keys now via appConfig
// declare let APIHost: string;
// declare let CityKey: string;
// declare let qweatherapi_paymode: boolean;
// declare let appid: string;
// declare let appsecret: string;
// declare let VisualCrossing_Key: string;
declare let generateWeatherTable: () => Promise<void>;
declare let weather_address: {
    checkcity: string;
    cityname: string;
    citynumber: string;
    latitude: string;
    longitude: string;
};
declare const weather_data: {
    updateTime: string;
    icon: string;
    temperature: string;
    feels: string;
    weathernow: string;
    windSpeed: string;
    humidity: string;
    temperature_max: string;
    temperature_min: string;
    feels_max: string;
    feels_min: string;
    wind: string;
    precip: string;
    precipcover: string;
    precipprob: string;
    snow: string;
    snowdepth: string;
    preciptype: string;
    windgust: string;
    visibility: string;
    solarradiation: string;
    uvindex: string;
    sunrise: string;
    sunset: string;
    moonphase: string;
    cloud: string;
    vis: string;
    dew: string;
    pressure: string;
    rangefeelstemperature: string;
    rangetemperature: string;
    obstime: string;
    windLv: string;
    air: string;
    weatherAlert: any;
    weatherAlertColor: string;
    sevenHourlyData: {
        updateTime: string;
        Times: string[];
        Pops: string[];
        Temps: string[];
        Icons: string[];
        Texts: string[];
        Wind360s: string[];
        Winds: string[];
        WindLvs: string[];
        WindSpeeds: string[];
        Humidities: string[];
        Precips: string[];
        Pressures: string[];
        Clouds: string[];
        Dews: string[];
        preciptype: string[];
    };
    hourlyData?: any;
    dailyData?: any;
};

// Other globals from main.js
// Runtime state (keep):

// Route config now via appConfig
// declare let backgroundRoute: string;
// declare let videoRoute: string;
// declare let cusvideoRoute: string;
// declare let cusaudioRoute: string;
// declare let mapRoute: string;
// declare let cusmapRoute: any;

// Core state now via appConfig
// declare let Paused: boolean;

// DOM elements now managed via elementManager.ts (elements object)
// declare const bodyElement: HTMLElement;
// declare const sakura: HTMLElement;
// declare const sakurashow: HTMLElement;
// declare const myvideo: HTMLVideoElement;

// Video config now via appConfig
// declare let videomodel: number;
// declare let VideoVolume: number;
// declare let VideoModelNow: number;

// Image API config now via appConfig
// declare let galaxyapi: number;

// Countdown config now via appConfig
// declare let countdown_year: number;
// declare let countdown_month: number;
// declare let countdown_day: number;
// declare let countdown_txt: string;
// declare let countdown_txt1: string;

// Hitokoto config now via appConfig
// declare let hit_a: string;
// declare let hit_b: string;
// declare let hit_c: string;
// declare let hit_d: string;
// declare let hit_e: string;
// declare let hit_f: string;
// declare let hit_g: string;
// declare let hit_h: string;
// declare let hit_i: string;
// declare let hit_j: string;
// declare let hit_k: string;
// declare let hit_l: string;
// declare let HitoktoFormatTest: number;


// Functions (keep)
declare function i18n(key: string): string;
declare function fetch_with_retry(url: string, options?: RequestInit): Promise<Response>;

// Date format config now via appConfig.getDateFormat()
// declare let dateFormat: {
//     yearFormat: number;
//     monthFormat: number;
//     dayFormat: number;
//     weekFormat: number;
//     separator: number;
//     order: number;
// };

// Date and time functions
declare function getdate(): void;

// DOM elements now managed via elementManager.ts (elements object)
// declare let oDate: HTMLElement;
// declare let oClock: HTMLElement;
// declare let chiyuanapi: string;

// Slide module functions (keep)
declare function applyBackgroundStyle(): void;
declare function clearpicturesinfo(): void;
declare function background2canvas(imageUrl: string | null, isVideo: boolean): void;
declare function ChangeVideoModel(): void;

// Video module globals - config now via appConfig
// declare let cusvideoRoute: string;
// declare let videoRoute: string;
// declare let cusaudioRoute: string;
// declare let VideoVolume: number;
// declare let Paused: boolean;

// Fluid effect globals
declare function initFullscreenFluidEffect(): void;
declare function destroyFullscreenFluidEffect(): void;
declare function destroyFluidEffect(): void;

// Player control globals
declare let singtitle: string;
declare let singartist: string;
declare let singalbumTitle: string;
declare let player_now: any;
declare let duration: number;
declare let position: number;

// RGB globals
declare let backgroundRGB: any;
declare let sakuraRGB: any;
declare let RGBRefresh: any;
declare let particlesRGB: any;
declare let nextphoto: boolean;
declare let audiobarRGB: any;
declare let opacity_saRGb: any;
declare let audioArray: number[];
declare let aurgbcolor: any;
declare let aurgbhigh: any;
declare let audiobarrainbowcolor: any;
declare let rainbowmove: any;
declare let rainbowmovespeed: any;

// Visual audio model
declare let visual_audio_model: number;
declare let TimeColorRhythm: boolean;

// PWLine global parameters
interface PWLineParamType {
    arr1: { x: number; y: number }[];
    arr2: { x: number; y: number }[];
    waveArr: number[];
    LineDensity: number;
    LinePosition: number;
    LineX: number;
    LineY: number;
    style: number;
    showLine: boolean;
    ColorMode: number;
    color: string;
    blurColor: string;
    TagNow: number;
    GradientRate: number;
    SolidColorGradient: boolean;
    BlurColorGradient: boolean;
    ColorRhythm: boolean;
    Direction: number;
    MiddleLine: boolean;
    range: number;
    sw: number;
    lineWidth: number;
    shadowBlur: number;
}
declare let PWLineParam: PWLineParamType;

// PWCircle global parameters
interface ParamType {
    arr1: { x: number; y: number }[];
    arr2: { x: number; y: number }[];
    waveArr: number[];
    showCircle: boolean;
    style: number;
    ColorMode: number;
    color: string;
    blurColor: string;
    TagNow: number;
    GradientRate: number;
    SolidColorGradient: boolean;
    BlurColorGradient: boolean;
    ColorRhythm: boolean;
    rotation: number;
    PolygonAngle: number;
    offsetAngle: number;
    range: number;
    r: number;
    cX: number;
    cY: number;
    direction: number;
    showSemiCircle: boolean;
    SemiCircledirection: number;
    lineWidth: number;
    shadowBlur: number;
}
declare let param: ParamType;

// PWParticles globals
declare let audioArrayPar: number[];
declare let ratio: number;
declare let isShowLine: boolean;
declare let isShowPoint: boolean;
declare let isMoveFollow: boolean;
declare let numLevel: number;
declare let equalize: number;
declare let pStyle: number;
declare let usePColor: boolean;
declare let pColor: string;
declare let isBlur: boolean;
declare let blurColor: string;
declare let points: {
    num: number;
    maxSize: number;
    mRadius: number;
    distance: number;
    arr: any[];
};
declare let num: number;
declare let sum: number;
declare let mouse: { x: number; y: number };
declare let CanPar: HTMLCanvasElement;
declare let CXTPar: CanvasRenderingContext2D;

// Wallpaper Engine API
interface WallpaperMediaIntegration {
    PLAYBACK_PLAYING: number;
    PLAYBACK_PAUSED: number;
    PLAYBACK_STOPPED: number;
    pauseMedia(): void;
    playMedia(): void;
    nextMedia(): void;
    previousMedia(): void;
    setMediaPosition(position: number): void;
    setMediaVolume(volume: number): void;
    toggleMediaMute(): void;
}

interface WallpaperPropertyListener {
    applyGeneralProperties(properties: any): void;
}

interface WallpaperPluginListener {
    onPluginLoaded(name: string, version: string): void;
}

declare let wallpaperMediaIntegration: WallpaperMediaIntegration;
declare let wallpaperPropertyListener: WallpaperPropertyListener;
declare let wallpaperPluginListener: WallpaperPluginListener;

// Debug logger
declare let debugLogger: {
    info(message: string, data?: any): void;
    error(message: string, error?: any): void;
    warn(message: string, data?: any): void;
};

// Current time for animations
declare let currentTime: number;
// Image display config now via appConfig
// declare let bgy: string;
// declare let bgx: string;
// declare let bgs: string;
// declare let bgxy: string;
// declare let Fristpicturesinfo: boolean;
// declare let picturesinfo_language: number;
// declare let picturesinfo_showRorL: any;
// declare let picturesinfo_color: any;
// declare let picturesinfo_blurcolor_show: any;
// declare let picturesinfo_blurcolor: any;
// declare let picturesinfo_yakeli_show: any;
// declare let picturesinfo_yakeli: any;
// declare let picturesinfo_yakeliccolor: any;
// declare let picturesinfo_bluryakeli: any;
// declare let picturesinfo_show: any;
// declare let pictures_URL: any;
declare const myAudio: HTMLAudioElement;

// Audio visualizer config now via appConfig
// declare let visual_audio_model: number;
// declare let PWCircle_show_bool: boolean;
// declare let PWLine_show_bool: boolean;
// declare let SlideNow: boolean;
// declare let wallpapermode: number;
// declare let TransitionMode: number;
// declare let TransitionMode_choose_0: number;
// declare let TransitionMode_choose_1: number;
// declare let TransitionMode_choose_4: string;
// declare let random: boolean;
// Slideshow state now via appConfig
// declare let currentImg: string;
// declare let myList: any[];
// declare let randomHistory: any[];
// declare let maxHistorySize: number;
// declare let files: any;
// declare let custom: any;
// declare let bingurl: string;
// 幻灯片配置已迁移到 appConfig
// declare let speed: number;
declare let bgStyle: number;

// API keys and configs now via appConfig
// declare let qweatherapi_paymode: boolean;
// declare let CityKey: string;
// declare let APIHost: string;
// declare let VisualCrossing_Key: string;

// Functions
declare function i18n(key: string): string;
declare function fetch_with_retry(url: string, options?: any, retries?: number): Promise<Response>;
declare function weather_paymode(): boolean;
declare function getQWeatherIcon(icon: string, isNight: boolean): string;
declare function isNightTime(currentTime: string, sunrise: string, sunset: string): boolean;
declare function formatTime(timeString: string): string;
declare function getTime(timeString: string, includeDate: boolean): string;

// Debug Logger
declare class DebugLogger {
    outPutConsole: boolean;
    logs: never[];
    maxLogs: number;
    static _gettingStackTrace: any;
    levels: { DEBUG: number; INFO: number; WARN: number; ERROR: number; CRITICAL: number; };
    consoleCaptureConfig: {
        enabled: boolean;
        captureLog: boolean;
        aptureWarn: boolean;
        captureError: boolean;
        aptureInfo: boolean;
        captureDebug: boolean;
        captureAssert: boolean;
        captureDir: boolean;
        captureDirxml: boolean;
        captureTable: boolean;
        captureTrace: boolean;
        captureGroup: boolean;
        captureGroupCollapsed: boolean;
        captureGroupEnd: boolean;
        captureTime: boolean;
        captureTimeEnd: boolean;
        captureCount: boolean;
        captureCountReset: boolean;
        captureClear: boolean; // 新增：捕获 console.clear
        captureProfile: boolean; // 新增：捕获 console.profile
        captureProfileEnd: boolean; // 新增：捕获 console.profileEnd
        captureTimeStamp: boolean; // 新增：捕获 console.timeStamp
        preserveOriginal: boolean; // 保留原始控制台输出
        logOriginalCall: boolean; // 是否记录原始调用信息
        captureBrowserErrors: boolean; // 新增：捕获浏览器直接输出的错误
    };
    originalConsole: {};
    log(message: string, level?: string | number, extraData?: any): any;
    info(message: string, extraData?: any): any;
    warn(message: string, extraData?: any): any;
    error(message: string, extraData?: any): any;
    critical(message: string, extraData?: any): any;
}
declare const debugLogger: DebugLogger;