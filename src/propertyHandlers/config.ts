/**
 * 配置文件 - 存放所有配置常量和默认参数
 */

import type {
    SakuraConfig,
    AudioVisualizerConfig,
    PWCircleConfig,
    PWLineConfig,
    PlayerControlConfig,
    APIUrlsConfig,
    DateFormatConfig,
    AudioConfig,
    TimePositionConfig,
    SlideConfig,
    WeatherConfig
} from './types';

// 樱花配置
export const sakuraConfig: SakuraConfig = {
    showSakura: true,
    sakuratransparency: 0.15,
    sakuraBackground: true,
    sakuraBackColor: true,
    sakuraReverse: false,
    sakuraPointNumber: 300,
    sakuraBackLight: 1 / 100.0
};

// 音频可视化配置
export const audioVisualizerConfig: AudioVisualizerConfig = {
    visual_audio_model: 1,
    PWCircle_show_bool: true,
    PWLine_show_bool: true
};

// PWCircle 配置
export const pWCircleConfig: PWCircleConfig = {
    style: 1,
    r: 0.45,
    color: "rgba(255,255,255,0.8)",
    blurColor: "#ffcccc",
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
    SolidColorGradient: true,
    BlurColorGradient: true,
    ColorRhythm: true,
    ColorMode: 1,
    TagNow: 1,
    GradientRate: 0.5
};

// PWLine 配置
export const pWLineConfig: PWLineConfig = {
    style: 1,
    sw: 0.8,
    lineWidth: 9,
    waveArr: new Array(120),
    range: 5,
    color: "rgba(255,255,255,0.8)",
    blurColor: "#ffcccc",
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
    GradientRate: 0.5
};

// 播放器控制配置
export const playerControlConfig: PlayerControlConfig = {
    player_control_autohide: true
};

// API URLs 配置
export const apiUrlsConfig: APIUrlsConfig = {
    galaxyapi: 1,
    chiyuanapi: "https://t.alcy.cc/ycy/?json"
};

// 日期格式配置
export const dateFormatConfig: DateFormatConfig = {
    yearFormat: 1,
    monthFormat: 1,
    dayFormat: 1,
    weekFormat: 1,
    separator: 1,
    order: 1
};

// 音频配置
export const audioConfig: AudioConfig = {
    opacity: 0.90,
    color: '255,255,255',
    shadowColor: '255,255,255',
    shadowBlur: 15,
    offsetX: 0.5,
    offsetY: 0.5,
    isClickOffset: false
};

// 时间位置配置
export const timePositionConfig: TimePositionConfig = {
    TimeX: 50,
    TimeY: 50
};

// 幻灯片配置
export const slideConfig: SlideConfig = {
    SlideNow: false,
    wallpapermode: 1,
    TransitionMode: 1,
    TransitionMode_choose_0: 0,
    TransitionMode_choose_1: 0,
    TransitionMode_choose_4: "",
    random: false,
    speed: 1,
    bgStyle: 1
};

// 天气配置
export const weatherConfig: WeatherConfig = {
    weather_api_choose: "",
    citynumber: "",
    CityKey: "",
    APIHost: "",
    VisualCrossing_Key: "",
    weather_updata: 3,
    appid: "",
    appsecret: "",
    weather_unit: "metric",
    weather_lang: "en",
    qweatherapi_paymode: false
};

// 壁纸初始化验证配置
export const verificationCode = '01F01C01E01I01I01C01H01K01H01L';
export let verificationResult = true;

// 随机播放历史记录配置
export const maxHistorySize = 5;

// 默认背景和视频路径
export const defaultBackgroundRoute = "imgs/1.jpg";
export const defaultVideoRoute = "video/1-test.webm";
export const defaultMapRoute = "map/1.png";

// 默认音量
export const defaultVideoVolume = 0.5;
export const defaultMusicVolume = 0.5;
