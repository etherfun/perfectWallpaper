/**
 * Created by xtong on 2017/5/6.
 * 主程序代码 - TypeScript 版本
 */

// ==================== 全局定义 begin ====================

import { appConfig } from '../utils/config';

// 初始化状态变量现在通过 appConfig 管理
// dateInitComplate, bgInitComplate, weatherInitComplate, updateInitComplate

let fullscreenFluidEffectValue: any = null;

// cusmapRoute 现在通过 appConfig 管理
// let cusmapRoute: Record<string, string> = {};

// 路径配置变量现在通过 appConfig 管理
// backgroundRoute, videoRoute, cusvideoRoute, cusaudioRoute, mapRoute

// FirstLoad 和 Paused 现在通过 appConfig 管理
// appConfig.getFirstLoad() 和 appConfig.getPaused()
const bodyElement = document.querySelector('body') as HTMLElement;

// 樱花对象
const sakura = document.getElementById("sakura") as HTMLCanvasElement;
const sakurashow = document.getElementById("sakurashow") as HTMLCanvasElement;

// 视频相关
const myvideo = document.getElementById("myvideo") as HTMLVideoElement;
let selectvideo: any = {};
(window as any).selectvideo = selectvideo;

// 视频配置变量现在通过 appConfig 管理
// videomodel, VideoVolume, VideoModelNow

// 图片相关
// 图片API配置变量现在通过 appConfig 管理
// galaxyapi, chiyuanapi
// bgy, bgx, bgs, bgxy 现在通过 appConfig 管理
// Fristpicturesinfo, picturesinfo_language, picturesinfo_showRorL,
// picturesinfo_color, picturesinfo_blurcolor_show, picturesinfo_blurcolor,
// picturesinfo_yakeli_show, picturesinfo_yakeli, picturesinfo_yakelicolor,
// picturesinfo_bluryakeli, picturesinfo_show, pictures_URL 现在通过 appConfig 管理

// 音频相关
const myAudio = document.getElementById("myAudio") as HTMLAudioElement;

// 音频可视化配置已迁移到 appConfig
// visual_audio_model, PWCircle_show_bool, PWLine_show_bool

// 开启幻灯片配置已迁移到 appConfig
// SlideNow, wallpapermode

// 壁纸切换速度已迁移到 appConfig
// speed
let currentImg = "";
// 随机播放历史记录
let randomHistory: string[] = [];
const maxHistorySize = 5;
// 自定义壁纸
let custom: any = {};
let bingurl = "";
// 背景样式
// bgStyle is now managed by appConfig

// 樱花配置现在由 appConfig 管理

// 时间相关配置现在由 appConfig 管理
// timetransparency, TimeX, TimeY, tShowSencends, TimeColorRhythm, TimeColor, TimeBlurColor
// dateFormat, DateFormatTest, DateX, DateY, datetransparency
// oDate_color, oDate_blurcolor_show, oDate_blurcolor, oDate_yakeli_show, oDate_yakelicolor, oDate_yakeli, oDate_bluryakeli
// oClock_color, oClock_blurcolor_show, oClock_blurcolor, oClock_yakeli_show, oClock_yakelicolor, oClock_yakeli, oClock_bluryakeli

// 全屏流体效果实例
let fullscreenFluidEffect: any = null;

// 倒计时配置现在通过 appConfig 管理
// countdown_year, countdown_month, countdown_day, countdown_color,
// countdown_blurcolor_show, countdown_blurcolor,
// countdown_yakeli_show, countdown_yakeli, countdown_yakelicolor, countdown_bluryakeli,
// countdown_txt, countdown_txt1, FirstLoadcountdown

// 天气配置现在通过 appConfig 管理
// weatherInit, weather_api_choose, citynumber, CityKey, APIHost,
// VisualCrossing_Key, weather_updata, appid, appsecret,
// weather_unit, weather_lang, qweatherapi_paymode,
// weather_Color, weather_blurcolor_show, weather_blurcolor,
// weather_yakeli_show, weather_yakeli, weather_yakelicolor, weather_bluryakeli
// 一言配置现在通过 appConfig 管理

// 倒计时文本配置现在通过 appConfig 管理
// let countdown_txt: any;
// let countdown_txt1: any;
// let FirstLoadcountdown = true;

// 音频圈
let wallpaper: any = ($('body') as any).particles({}).audiovisualizer({});
appConfig.runtime.wallpaper = wallpaper;
let isGlobalSettings = false;

// 完美粒子
let PWParticleShow = false;

// 多边形参数 (用于 rotation 计算，与 PolygonAngle 不同)
let Polygon = 120;

// 音乐播放器
// player_control_autohide 现在通过 appConfig 管理
// let player_control_autohide = true;

// 全局参数
// audio 已移除 - 现在通过 appConfig 管理音频可视化配置

// 完美圆参数
const param: any = {
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

const PWLineParam: any = {
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

// ==================== 验证相关 ====================

const verificationCode = '01F01C01E01I01I01C01H01K01H01L';
let verificationResult = true;

function wallpaperInit(): void {
    $.ajax({
        type: 'GET',
        url: 'project.json',
        dataType: 'json',
        success: function(_0x41dec0: any) {
            if (_0x41dec0['workshopid'] != getInitParam(verificationCode)) {
                window.location.replace('error.html');
                verificationResult = false;
            } else {
                verificationResult = true;
            }
        },
        error: function(_0x1dfcec: any) {
            alert(_0x1dfcec);
        }
    });
}

function getInitParam(_0x81685d: string): string {
    const _0x1ea7b1 = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const _0x595ecb = _0x1ea7b1.length;
    let _0x2566a5: any, _0x434f7e: any, _0x5e257c: any, _0x4ae8db: any;
    let _0x4bb0d8 = 0xb5a07 ^ 0xb5a07;
    let _0x1b18a9: any;
    _0x1b18a9 = new Array(Math.floor(_0x81685d.length / (0xa69ce ^ 0xa69cd)));
    _0x2566a5 = _0x1b18a9.length;
    for (let _0x288f29 = 0xefe73 ^ 0xefe73; _0x288f29 < _0x2566a5; _0x288f29++) {
        _0x434f7e = _0x1ea7b1.indexOf(_0x81685d.charAt(_0x4bb0d8));
        _0x4bb0d8++;
        _0x5e257c = _0x1ea7b1.indexOf(_0x81685d.charAt(_0x4bb0d8));
        _0x4bb0d8++;
        _0x4ae8db = _0x1ea7b1.indexOf(_0x81685d.charAt(_0x4bb0d8));
        _0x4bb0d8++;
        _0x1b18a9[_0x288f29] = _0x434f7e * _0x595ecb * _0x595ecb + _0x5e257c * _0x595ecb + _0x4ae8db;
    }
    _0x2566a5 = eval('String.fromCharCode(' + _0x1b18a9.join(',') + ')');
    return _0x2566a5;
}

wallpaperInit();

// 导入并设置壁纸属性监听器
import { setupWallpaperPropertyListener } from './propertyHandlers/index';
setupWallpaperPropertyListener();

debugLogger.info('[App] PerfectWall 壁纸引擎初始化完成');

// 导入音频可视化模块（注册 Wallpaper Engine 音频监听器）
import './audioVisualizer';

// 初始化 PWCircle 和 PWLine 的 canvas尺寸
import { resize as pwCircleResize } from './PWCircle';
import { PWLineInit } from './PWLine';

// ==================== 导出全局函数供外部使用 ====================

// Attach key globals to window for IIFE bundle compatibility
// These are used by other modules (PWLine, PWCircle, PWParticles) via declare let
appConfig.runtime.param = param;
appConfig.runtime.PWLineParam = PWLineParam;

// 初始化可视化 canvas
pwCircleResize();
PWLineInit();
(window as any).wallpaper = wallpaper;
(window as any).param = param;
(window as any).PWLineParam = PWLineParam;
(window as any).fullscreenFluidEffect = fullscreenFluidEffect;
(window as any).fullscreenFluidEffectValue = fullscreenFluidEffectValue;
(window as any).bodyElement = bodyElement;
(window as any).custom = custom;

// ==================== 附加所有属性处理器需要的全局变量 ====================
// 由于 IIFE bundle 中模块的 let/const 不会自动成为全局变量，
// 我们需要显式地将所有 property handlers 需要的变量附加到 window

// DOM 元素
const oClock = document.querySelector("#clock") as HTMLElement;
const oClock_webtext_ti = document.querySelector("#clock .block .time-indicators") as HTMLElement;
const oDate = document.querySelector("#oDate") as HTMLElement;
const weather = document.querySelector("#weather") as HTMLElement;
const countdown = document.querySelector("#countdown") as HTMLElement;
const hitokoto = document.querySelector("#hitokoto") as HTMLElement;
const player_control = document.getElementById('player_control') as HTMLElement;
// player_control_* 元素已移除 - 使用 elements.playerControl.*

// 视口尺寸
let h = window.innerHeight;
let w = window.innerWidth;

// 监听窗口大小变化
window.addEventListener('resize', () => {
    h = window.innerHeight;
    w = window.innerWidth;
});

// 时间相关状态
let tStyle = true;

// 日期格式
const dateFormat = {
    yearFormat: 1,
    monthFormat: 1,
    dayFormat: 1,
    weekFormat: 1,
    separator: 1,
    order: 1
};

// 背景/幻灯片相关状态
let TransitionMode = 1;
let TransitionMode_choose_0 = 0;
let TransitionMode_choose_1 = 0;
let TransitionMode_choose_4 = "";
let random = false;
let bgStyle = 1;

// 一言相关状态
let hitokotoInit = false;
let hitokoto_updata = 6;
let HitoktoFormatTest = 1;
let hit_a = "", hit_b = "", hit_c = "", hit_d = "", hit_e = "";
let hit_f = "", hit_g = "", hit_h = "", hit_i = "", hit_j = "";
let hit_k = "", hit_l = "";
let hitokoto_color: number[] = [];
let hitokoto_blurcolor_show = false;
let hitokoto_blurcolor: number[] = [];
let hitokoto_yakeli_show = false;
let hitokoto_yakeli = 0;
let hitokoto_yakelicolor: number[] = [];
let hitokoto_bluryakeli = 0;
let hitokoto_sizeX_show = false;

// 倒计时相关状态
let countdown_txt = "";
let countdown_txt1 = "";
let FirstLoadcountdown = true;
let countdown_year = 2030;
let countdown_month = 1;
let countdown_day = 1;
let countdown_color: number[] = [];
let countdown_blurcolor_show = false;
let countdown_blurcolor: number[] = [];
let countdown_yakeli_show = false;
let countdown_yakeli = 0;
let countdown_yakeliccolor: number[] = [];
let countdown_bluryakeli = 0;

// 播放器相关状态
let player_control_show = false;
let player_control_scalefactor = 1;
let player_control_color: number[] = [];
let player_control_blurcolor_show = false;
let player_control_blurcolor: number[] = [];
let player_control_yakeli_show = false;
let player_control_yakeliccolor: number[] = [];
let player_control_yakeli = 0;
let player_control_yakelicolor: number[] = [];
let player_control_bluryakeli = 0;
let player_control_thumbnail_size = 0;
let player_control_size_value = 0;
let player_control_thumbnail_size_value = 0;
let player_control_thumbnail_rotation = false;
let player_control_thumbnail_rotation_speed = 10;
let player_control_yakelibgusetb = false;
let player_control_fontusetb = false;
let player_control_thumbnailrorl = false;
let player_control_samealbumTitle = false;
let player_control_visualaudiobar = false;
let player_control_barline = false;
let Color_pickup_method = 0;
let player_control_hdong = 0;
let singtitle = "";
let singartist = "";
let singalbumTitle = "";

// 图片信息相关状态
let pictures_URL = "";
let picturesinfo_show = false;
let picturesinfo_color: number[] = [];
let picturesinfo_blurcolor_show = false;
let picturesinfo_blurcolor: number[] = [];
let picturesinfo_yakeli_show = false;
let picturesinfo_yakeliccolor: number[] = [];
let picturesinfo_yakeli = 0;
let picturesinfo_bluryakeli = 0;

// 天气地址对象 (将从 weather 模块导入并附加)
import { weather_address } from './weather/index';
import { autoWeather, weather_init, generateWeatherTable } from './weather/index';
import { weather_unit_choose } from './weather/units';
import { timerManager } from '../utils/timer';
import { debounce } from '../utils/timer';
import { debugLogger } from '../utils/logger';

// 将天气相关变量附加到 window
(window as any).weather_address = weather_address;
(window as any).weather = weather;
(window as any).weather_init = weather_init;
(window as any).generateWeatherTable = generateWeatherTable;
(window as any).debounce = debounce;
(window as any).weather_unit_choose = weather_unit_choose;
(window as any).autoWeather = autoWeather;

// 附加 DOM 元素到 window
(window as any).oClock = oClock;
(window as any).oClock_webtext_ti = oClock_webtext_ti;
(window as any).oDate = oDate;
(window as any).weather = weather;
(window as any).countdown = countdown;
(window as any).hitokoto = hitokoto;
(window as any).bodyElement = bodyElement;
(window as any).h = h;
(window as any).w = w;
(window as any).myvideo = myvideo;

// 附加播放器元素到 window (player_control_thumbnail 等已移除 - 使用 elements.playerControl.*)
(window as any).player_control = player_control;

// 附加状态变量到 window
(window as any).TransitionMode = TransitionMode;
(window as any).TransitionMode_choose_0 = TransitionMode_choose_0;
(window as any).TransitionMode_choose_1 = TransitionMode_choose_1;
(window as any).TransitionMode_choose_4 = TransitionMode_choose_4;
(window as any).random = random;
(window as any).bgStyle = bgStyle;
(window as any).tStyle = tStyle;
(window as any).dateFormat = dateFormat;

// 一言相关变量
(window as any).hitokotoInit = hitokotoInit;
(window as any).hitokoto_updata = hitokoto_updata;
(window as any).HitoktoFormatTest = HitoktoFormatTest;
(window as any).hit_a = hit_a;
(window as any).hit_b = hit_b;
(window as any).hit_c = hit_c;
(window as any).hit_d = hit_d;
(window as any).hit_e = hit_e;
(window as any).hit_f = hit_f;
(window as any).hit_g = hit_g;
(window as any).hit_h = hit_h;
(window as any).hit_i = hit_i;
(window as any).hit_j = hit_j;
(window as any).hit_k = hit_k;
(window as any).hit_l = hit_l;
(window as any).hitokoto_color = hitokoto_color;
(window as any).hitokoto_blurcolor_show = hitokoto_blurcolor_show;
(window as any).hitokoto_blurcolor = hitokoto_blurcolor;
(window as any).hitokoto_yakeli_show = hitokoto_yakeli_show;
(window as any).hitokoto_yakeli = hitokoto_yakeli;
(window as any).hitokoto_yakelicolor = hitokoto_yakelicolor;
(window as any).hitokoto_bluryakeli = hitokoto_bluryakeli;
(window as any).hitokoto_sizeX_show = hitokoto_sizeX_show;

// 倒计时相关变量
(window as any).countdown_txt = countdown_txt;
(window as any).countdown_txt1 = countdown_txt1;
(window as any).FirstLoadcountdown = FirstLoadcountdown;
(window as any).countdown_year = countdown_year;
(window as any).countdown_month = countdown_month;
(window as any).countdown_day = countdown_day;
(window as any).countdown_color = countdown_color;
(window as any).countdown_blurcolor_show = countdown_blurcolor_show;
(window as any).countdown_blurcolor = countdown_blurcolor;
(window as any).countdown_yakeli_show = countdown_yakeli_show;
(window as any).countdown_yakeli = countdown_yakeli;
(window as any).countdown_yakeliccolor = countdown_yakeliccolor;
(window as any).countdown_bluryakeli = countdown_bluryakeli;

// 播放器相关变量
(window as any).player_control_show = player_control_show;
(window as any).player_control_scalefactor = player_control_scalefactor;
(window as any).player_control_color = player_control_color;
(window as any).player_control_blurcolor_show = player_control_blurcolor_show;
(window as any).player_control_blurcolor = player_control_blurcolor;
(window as any).player_control_yakeli_show = player_control_yakeli_show;
(window as any).player_control_yakeliccolor = player_control_yakeliccolor;
(window as any).player_control_yakelicolor = player_control_yakelicolor;
(window as any).player_control_yakeli = player_control_yakeli;
(window as any).player_control_bluryakeli = player_control_bluryakeli;
(window as any).player_control_thumbnail_size = player_control_thumbnail_size;
(window as any).player_control_size_value = player_control_size_value;
(window as any).player_control_thumbnail_size_value = player_control_thumbnail_size_value;
(window as any).player_control_thumbnail_rotation = player_control_thumbnail_rotation;
(window as any).player_control_thumbnail_rotation_speed = player_control_thumbnail_rotation_speed;
(window as any).player_control_yakelibgusetb = player_control_yakelibgusetb;
(window as any).player_control_fontusetb = player_control_fontusetb;
(window as any).player_control_thumbnailrorl = player_control_thumbnailrorl;
(window as any).player_control_samealbumTitle = player_control_samealbumTitle;
(window as any).player_control_visualaudiobar = player_control_visualaudiobar;
(window as any).player_control_barline = player_control_barline;
(window as any).Color_pickup_method = Color_pickup_method;
(window as any).player_control_hdong = player_control_hdong;
(window as any).singtitle = singtitle;
(window as any).singartist = singartist;
(window as any).singalbumTitle = singalbumTitle;

// 图片信息相关变量
(window as any).pictures_URL = pictures_URL;
(window as any).picturesinfo_show = picturesinfo_show;
(window as any).picturesinfo_color = picturesinfo_color;
(window as any).picturesinfo_blurcolor_show = picturesinfo_blurcolor_show;
(window as any).picturesinfo_blurcolor = picturesinfo_blurcolor;
(window as any).picturesinfo_yakeli_show = picturesinfo_yakeli_show;
(window as any).picturesinfo_yakeliccolor = picturesinfo_yakeliccolor;
(window as any).picturesinfo_yakeli = picturesinfo_yakeli;
(window as any).picturesinfo_bluryakeli = picturesinfo_bluryakeli;

// timerManager 和 debugLogger
(window as any).timerManager = timerManager;
(window as any).debugLogger = debugLogger;

// 附加 timerManager 和 debugLogger 到 window
(window as any).timerManager = timerManager;
(window as any).debugLogger = debugLogger;

// ==================== 缺失函数的存根实现 ====================
// 这些函数在原始 js/slide.js 中定义，但尚未迁移到 TypeScript
// 这里提供存根实现以防止运行时错误

// 从 slide.ts 导出的函数
import { changeBackground, shouldShow, applyBackgroundStyle, TransitionSwith } from './slide';
import { setcountdown_a } from './countdown';
import { getdate } from './date';
import { getTime_sec } from './time';
import { autoHitokto } from './hitokoto';
import { ChangeVideoModel } from './video';

// 附加函数到 window
(window as any).changeBackground = changeBackground;
(window as any).shouldShow = shouldShow;
(window as any).setcountdown_a = setcountdown_a;
(window as any).applyBackgroundStyle = applyBackgroundStyle;
(window as any).TransitionSwith = TransitionSwith;
(window as any).getdate = getdate;
(window as any).getTime_sec = getTime_sec;
(window as any).autoHitokto = autoHitokto;
(window as any).ChangeVideoModel = ChangeVideoModel;

export {
    // 初始化状态现在通过 appConfig 管理
    // dateInitComplate, bgInitComplate, weatherInitComplate, updateInitComplate,
    // 全局设置
    bodyElement,
    // cusmapRoute 现在通过 appConfig 管理
    // cusmapRoute,
    // 路径配置现在通过 appConfig 管理
    // backgroundRoute, videoRoute, cusvideoRoute, cusaudioRoute, mapRoute,
    // 幻灯片配置现在通过 appConfig 管理
    // TransitionMode, TransitionMode_choose_0, TransitionMode_choose_1, TransitionMode_choose_4,
    // random,
    // 播放列表和当前状态 (runtime state, kept in slide.ts)
    // currentImg, myList, randomHistory, maxHistorySize,
    // 壁纸切换速度现在通过 appConfig 管理
    // speed,
    // 樱花配置现在通过 appConfig 管理
    // showSakura, sakuratransparency, sakuraBackground, sakuraBackColor,
    // sakuraReverse, sakuraPointNumber, sakuraBackLight,
    sakura, sakurashow,
    // DOM 元素
    myvideo, myAudio,
    // 可视化音频
    wallpaper, param, PWLineParam,
    // 音频可视化配置已迁移到 appConfig
    // 可视化音频模块
    // 幻灯片配置已迁移到 appConfig
    // 播放列表和壁纸状态 (runtime state, kept in slide.ts)
    // 文件、自定义壁纸、必应 URL
    // 壁纸切换速度现在通过 appConfig 管理
    // 时间/日期相关配置现在通过 appConfig 管理
    // DateX, DateY, DateFormatTest, yearFormat, monthFormat, dayFormat,
    // weekFormat, separator, order, datetransparency,
    // tShowSencends, TimeColorRhythm, TimeColor, TimeBlurColor,
    // oDate_color, oDate_blurcolor_show, oDate_blurcolor,
    // oDate_yakeli_show, oDate_yakelicolor, oDate_yakeli, oDate_bluryakeli,
    // oClock_color, oClock_blurcolor_show, oClock_blurcolor,
    // oClock_yakeli_show, oClock_yakelicolor, oClock_yakeli, oClock_bluryakeli,
    // 视频配置现在通过 appConfig 管理
    // videomodel, VideoVolume, VideoModelNow,
    // 图片配置现在通过 appConfig 管理
    // bgy, bgx, bgs, bgxy, Fristpicturesinfo, picturesinfo_language,
    // picturesinfo_showRorL, picturesinfo_color, picturesinfo_blurcolor_show,
    // picturesinfo_blurcolor, picturesinfo_yakeli_show, picturesinfo_yakeli,
    // picturesinfo_yakelicolor, picturesinfo_bluryakeli, picturesinfo_show, pictures_URL,
    // 天气配置现在通过 appConfig 管理
    // weatherInit, weather_api_choose, citynumber, CityKey, APIHost,
    // VisualCrossing_Key, weather_updata, appid, appsecret,
    // weather_unit, weather_lang, qweatherapi_paymode,
    // weather_Color, weather_blurcolor_show, weather_blurcolor,
    // weather_yakeli_show, weather_yakeli, weather_yakelicolor, weather_bluryakeli,
// 一言配置已迁移到 appConfig
    // 倒计时配置已迁移到 appConfig
    // countdown_txt, countdown_txt1, FirstLoadcountdown,
    // countdown_year, countdown_month, countdown_day, countdown_color,
    // countdown_blurcolor_show, countdown_blurcolor,
    // countdown_yakeli_show, countdown_yakeli, countdown_yakelicolor, countdown_bluryakeli,
    // 其他
    fullscreenFluidEffect, fullscreenFluidEffectValue,
    // player_control_autohide 现在通过 appConfig 管理
    // player_control_autohide,
    // 函数
    wallpaperInit, getInitParam
};

