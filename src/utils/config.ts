// 默认配置值
import { debugLogger, registerDebugLogger, DebugLogger } from './logger';
import { FluidEffect } from '../fluid';
import { WallpaperEffectController } from '../WallpaperEffectController';
import { versionManager } from '../version';

// ============== 类型定义 ==============

type ConfigListener = (key: string, value: unknown) => void;
type ConfigValue = typeof SYNC_DEFAULTS[keyof typeof SYNC_DEFAULTS];

// ============== 运行时数据类型 ==============

interface RuntimeData {
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
    versionManager: versionManager | undefined;
    debugLogger: DebugLogger | undefined;
    FluidEffect2: FluidEffect | null | undefined;
    fluidEffect: FluidEffect | null | undefined;
    fullscreenFluidEffect: FluidEffect | null | undefined;
    FluidEffect: FluidEffect | null | undefined;
    fullscreenFluidEnabled: boolean;
    pictureInfoHideStyleAdded: boolean;
    files: Record<string, string[]>;
    myList: string[];
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
    wallpaper: WallpaperEffectController | null;
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
    hitokoto: {
        hitokoto_text: string;
        from_text: string;
        from_who_text: string;
    };
}

// ============== 默认配置 ==============

const SYNC_DEFAULTS = {
    // 核心运行时配置
    language: "zh-CN",
    language_code: "zh",
    font_setting: "",
    first_load: true,
    paused: false,

    // 初始化状态配置
    date_init_complete: false,
    bg_init_complete: false,
    weather_init_complete: false,
    fluid_effect_init_complete: false,
    update_init_complete: false,

    // 路径配置
    background_route: "./src/source/imgs/1.jpg",
    video_route: "",
    cusvideo_route: "",
    cusaudio_route: "",
    map_route: "./src/source/map/1.png",

    // 视频配置
    video_model: 1,
    video_volume: 0.5,
    video_model_now: 1,
    select_video: "",

    // 图片API配置
    galaxy_api: 1,
    chiyuanapi: "https://t.alcy.cc/ycy/?json",

    // 图片背景位置和尺寸配置
    bgy: "512px",
    bgx: "512px",
    bgs: "100%",
    bgxy: "512px 512px ",
    custom: "",
    customdirectory: "",

    // 图片信息配置
    frist_picturesinfo: true,
    pictures_info_show_ror_l: null,
    pictures_info_color: null,
    pictures_info_blurcolor_show: null,
    pictures_info_blurcolor: null,
    pictures_info_yakeli_show: null,
    pictures_info_yakeli: null,
    pictures_info_yakelic_color: null,
    pictures_info_bluryakeli: null,
    pictures_info_show: null,
    pictures_url: "",
    pictures_info_y: 50,
    pictures_info_x: 50,
    pictures_info_size: 30,
    pictures_info_timetransparency: 1,
    pictures_info_roundedcorners: 0,
    pictures_info_showaway: false,
    pictures_info_showwidth: 0,
    pictures_info_description: false,

    // 音频配置
    music_model: 0,
    music_volume: 0.5,
    selectmusic: {} as Record<string, string>,
    musicdirectory: "",
    music_playlist: [] as string[],
    music_playlist_index: 0,
    music_playlist_random: false,
    music_playlist_repeat: 0, // 0: none, 1: all, 2: one

    // 音频可视化配置
    visual_audio_model: 1,
    audio_smooth_enabled: true,
    audio_smooth_factor: 70,
    audio_spatial_window: 3,
    pw_circle_show_bool: true,
    pw_line_show_bool: true,
    polygon_angle: 1,

    // 圆圈可视化配置
    pw_circle_style: 1,
    pw_circle_radius: 50,
    pw_circle_range: 50,
    pw_circle_color: [255, 255, 255] as [number, number, number],
    pw_circle_blur_color: [255, 255, 255] as [number, number, number],
    pw_circle_x: 50,
    pw_circle_y: 50,
    pw_circle_color_mode: 0,
    pw_circle_solid_color_gradient: false,
    pw_circle_blur_color_gradient: false,
    pw_circle_color_rhythm: false,
    pw_circle_gradient_rate: 10,
    pw_circle_line_width: 2,
    pw_circle_rotation: 0,
    pw_circle_direction: 0,
    pw_circle_wavetransparency: 80,
    pw_circle_show_semi_circle: false,
    pw_circle_semicircle_direction: 0,

    // 直线可视化配置
    pw_line_position: 50,
    pw_line_style: 1,
    pw_line_direction: 0,
    pw_line_width: 2,
    pw_line_spacing: 50,
    pw_line_density: 100,
    pw_line_range: 50,
    pw_line_transparency: 80,
    pw_line_color: [255, 255, 255] as [number, number, number],
    pw_line_blur_color: [255, 255, 255] as [number, number, number],
    pw_line_x: 50,
    pw_line_y: 50,
    pw_line_middle_line: false,
    pw_line_color_mode: 0,
    pw_line_solid_color_gradient: false,
    pw_line_blur_color_gradient: false,
    pw_line_color_rhythm: false,
    pw_line_gradient_rate: 10,

    // 音频可视化(wallpaper.audiovisualizer)参数
    audio_amplitude: 50,
    audio_decline: 50,
    audio_is_ring: false,
    audio_is_static_ring: false,
    audio_is_inner_ring: false,
    audio_is_outer_ring: false,
    audio_radius: 50,
    audio_ring_rotation: 50,
    audio_opacity: 90,
    audio_color: [255, 255, 255] as [number, number, number],
    audio_shadow_color: [255, 255, 255] as [number, number, number],
    audio_shadow_blur: 75,
    audio_offset_x: 50,
    audio_offset_y: 50,
    audio_is_click_offset: false,
    audio_is_line_to: false,
    audio_first_point: 50,
    audio_second_point: 50,
    audio_point_num: 120,
    audio_distance: 50,
    audio_line_width: 50,
    audio_is_ball: false,
    audio_ball_spacer: 50,
    audio_ball_size: 50,
    audio_ball_rotation: 50,

    // 幻灯片配置
    slide_now: false,
    wallpaper_mode: 1,
    transition_mode: 1,
    transition_mode_choose_0: 0,
    transition_mode_choose_1: 0,
    transition_mode_choose_4: "",
    random: false,
    speed: 1,
    bg_style: 1,

    // 樱花配置
    show_sakura: true,
    sakura_transparency: 0.15,
    sakura_background: true,
    sakura_back_color: true,
    sakura_reverse: false,
    sakura_point_number: 300,
    sakura_back_light: 1 / 100.0,

    // 时间配置
    time_transparency: 0.8,
    time_x: 50,
    time_y: 50,

    // 日期格式配置
    date_format: {
        year_format: 1,
        month_format: 1,
        day_format: 1,
        week_format: 1,
        separator: 1,
        order: 1,
    },

    // 天气配置
    weather_api_choose: null,
    citynumber: "",
    weather_updata: 3,
    weather_unit: "metric",
    weather_lang: "en",
    qweather_api_paymode: false,

    // 一言配置
    hitokoto_update: 6,
    hitokoto_init: false,
    hitokoto_format_test: 1,
    hitokoto_size_x_show: null,
    hitokoto_show: false,
    hitokoto_timetransparency: 100,
    hitokoto_roundedcorners: 0,
    hitokoto_size: 50,
    hitokoto_showwidth: 0,
    hitokoto_x: 50,
    hitokoto_y: 50,

    // 一言分类配置
    hit_a: "",
    hit_b: "",
    hit_c: "",
    hit_d: "",
    hit_e: "",
    hit_f: "",
    hit_g: "",
    hit_h: "",
    hit_i: "",
    hit_j: "",
    hit_k: "",
    hit_l: "",

    // 一言颜色配置
    hitokoto_color: [255, 255, 255] as [number, number, number],
    hitokoto_blurcolor_show: false,
    hitokoto_blurcolor: [255, 255, 255] as [number, number, number],
    hitokoto_yakeli_show: false,
    hitokoto_yakelic_color: [255, 255, 255] as [number, number, number],
    hitokoto_yakeli: 0,
    hitokoto_bluryakeli: 10,

    // 天气API配置
    city_key: "",
    api_host: "",
    visual_crossing_key: "",
    weather_app_id: "",
    weather_app_secret: "",

    // 天气颜色配置
    weather_color: [255, 255, 255] as [number, number, number],
    weather_blurcolor_show: false,
    weather_blurcolor: [255, 255, 255] as [number, number, number],
    weather_yakeli_show: false,
    weather_yakelic_color: [255, 255, 255] as [number, number, number],
    weather_yakeli: 0,
    weather_bluryakeli: 10,
    weather_daily_tip: false,

    // 天气位置和尺寸配置
    weather_latitude: "",
    weather_longitude: "",
    weather_city_text: "",
    weather_timetransparency: 80,
    weather_roundedcorners: 10,
    weather_size: 100,
    weather_showwidth: 0,
    weather_x: 50,
    weather_y: 50,

    // 倒计时日期配置
    countdown_year: new Date().getFullYear(),
    countdown_month: new Date().getMonth() + 1,
    countdown_day: new Date().getDate(),
    countdown_color: [255, 255, 255] as [number, number, number],
    countdown_blurcolor_show: false,
    countdown_blurcolor: [255, 255, 255] as [number, number, number],
    countdown_yakeli_show: false,
    countdown_yakelic_color: [255, 255, 255] as [number, number, number],
    countdown_yakeli: 0,
    countdown_bluryakeli: 10,

    // 倒计时文本配置
    countdown_txt: "",
    countdown_txt1: "",
    first_load_countdown: true,

    // 倒计时样式配置
    countdown_y: 80,
    countdown_x: 50,
    countdown_size: 50,
    countdown_show: false,
    countdown_timetransparency: 80,
    countdown_roundedcorners: 0,

    // 播放器自动隐藏配置
    player_control_autohide: true,

    // 播放器控制配置
    player_control_show: false,
    player_control_scalefactor: 1,
    player_control_color: [255, 255, 255] as [number, number, number],
    player_control_blurcolor_show: false,
    player_control_blurcolor: [255, 255, 255] as [number, number, number],
    player_control_yakeli_show: false,
    player_control_yakelic_color: [255, 255, 255] as [number, number, number],
    player_control_yakeli: 0,
    player_control_bluryakeli: 10,
    player_control_thumbnail_size: 0,
    player_control_size_value: 100,
    player_control_thumbnail_size_value: 100,
    player_control_thumbnail_rotation: false,
    player_control_thumbnail_rotation_speed: 5,
    player_control_timetransparency: 1,
    player_control_showwidth: 0,
    player_control_yakelibgusetb: 1,
    player_control_fontusetb: 5,
    player_control_thumbnailrorl: false,
    player_control_samealbum_title: false,
    player_control_visualaudiobar: 0,
    player_control_barline: 0,
    color_pickup_method: 1,
    player_control_hdong: 0.1,
    player_x: 50,
    player_y: 50,
    playery: 80,
    playerx: 50,
    player_control_roundedcorners: 0,

    // 日期格式测试
    date_format_test: 1,

    // 时间显示配置
    t_show_sencends: true,
    time_color_rhythm: false,
    time_color: "rgb(255, 255, 255)",
    time_blur_color: "0 0 20px rgb(255, 255, 255)",
    show_time: true,
    time_style: true,
    t_size: 100,

    // 日期圆角配置
    odate_roundedcorners: 0,
    oclock_roundedcorners: 0,
    date_color_rhythm: false,
    date_color: [255, 255, 255] as [number, number, number],

    // 日期透明度
    date_transparency: 0.8,

    // 日期显示配置
    show_date: true,

    // 日期位置
    date_x: 50,
    date_y: 45,

    // 日期大小
    date_size: 100,
    date_showwidth: 0,

    // 日期颜色配置
    odate_color: [255, 255, 255] as [number, number, number],
    odate_blurcolor_show: false,
    odate_blurcolor: [255, 255, 255] as [number, number, number],
    odate_yakeli_show: false,
    odate_yakelic_color: [255, 255, 255] as [number, number, number],
    odate_yakeli: 0,
    odate_bluryakeli: 10,

    // 时钟颜色配置
    oclock_color: [255, 255, 255] as [number, number, number],
    oclock_blurcolor_show: false,
    oclock_blurcolor: [255, 255, 255] as [number, number, number],
    oclock_yakeli_show: false,
    oclock_yakelic_color: [255, 255, 255] as [number, number, number],
    oclock_yakeli: 0,
    oclock_bluryakeli: 10,

    // RGB灯光效果配置
    wallpaper_settings: {
        ledPlugin: false,
        cuePlugin: false,
    },
    background_rgb: false,
    sakura_rgb: false,
    particles_rgb: false,
    audiobar_rgb: false,
    rgb_refresh: 0,
    rgb_show: false,
    nextphoto: false,
    opacity_sa_rgb: 1,
    aurgbcolor: '255,255,255',
    aurgbhigh: 1,
    audiobar_rainbow_color: false,
    rainbow_move: false,
    rainbow_move_speed: 1,

    // 流体效果配置
    fluid_effect_enabled: false,
    fluid_effect_enabled_fullscreen: false,
    fluid_effect_resolution: 240,
    fluid_effect_blur_amount: 20,
    fluid_effect_displacement_scale: 0.5,
    fluid_effect_turbulence_octaves: 4,
    fluid_effect_canvas_displacement: 0,
    fluid_effect_dark_overlay_strength: 50,
    fluid_effect_backdrop_filter_strength: 10,

    // 全屏歌词配置
    fullscreen_lyrics_enabled: false,
    fullscreen_lyrics_show_translation: true,
    fullscreen_lyrics_show_roman: false,
    fullscreen_lyrics_delay: 0,
    fullscreen_lyrics_enable_blur: true,
    fullscreen_lyrics_hide_other: true,
    fullscreen_lyrics_show_clock: false,

    // 粒子效果配置
    particles_is_particles: false,
    particles_number: 100,
    particles_opacity: 100,
    particles_opacity_random: false,
    particles_color: [255, 255, 255] as [number, number, number],
    particles_shadow_color: [255, 255, 255] as [number, number, number],
    particles_shadow_blur: 10,
    particles_image: "",
    particles_shape_type: 1,
    particles_size_value: 10,
    particles_size_random: false,
    particles_link_enable: false,
    particles_link_distance: 50,
    particles_link_width: 1,
    particles_link_color: [255, 255, 255] as [number, number, number],
    particles_link_opacity: 50,
    particles_is_move: true,
    particles_speed: 1,
    particles_speed_random: false,
    particles_direction: 1,
    particles_is_straight: false,
    particles_is_bounce: false,
    particles_move_out_mode: 1,

    // 插件配置
    server_mode: false,
};

// ============== ConfigClass ==============

/**
 * AppConfig - 应用程序运行时配置管理类
 */
class AppConfig {
    private static _instance: AppConfig | null = null;
    private _values: Map<string, ConfigValue>;
    private _listeners: Set<ConfigListener>;
    private _changeBuffer: Map<string, ConfigValue>;
    private _flushScheduled = false;
    public runtime: RuntimeData;

    private constructor() {
        this._values = new Map();
        this._listeners = new Set();
        this._changeBuffer = new Map();
        this._flushScheduled = false;

        // 初始化默认配置
        this._initDefaults();

        // 运行时数据
        this.runtime = this._createRuntime();

        // 注册 debugLogger
        registerDebugLogger(this as unknown as { runtime: { debugLogger: typeof debugLogger } });
    }

    private _createRuntime(): RuntimeData {
        return {
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
            versionManager: undefined,
            debugLogger: undefined,
            FluidEffect2: undefined,
            fluidEffect: undefined,
            fullscreenFluidEffect: undefined,
            FluidEffect: undefined,
            fullscreenFluidEnabled: false,
            pictureInfoHideStyleAdded: false,
            files: {},
            myList: [],
            photo: {
                currentImg: null,
                nextphoto: false,
                infomation: {
                    title: "",
                    text: "",
                    copyright: "",
                    where: "",
                },
            },
            wallpaper: null,
            param: {
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
                GradientRate: 0.5,
            },
            hitokoto: {
                hitokoto_text: "未获取",
                from_text: "未获取",
                from_who_text: "未获取",
            },
        };
    }

    private _initDefaults(): void {
        for (const [key, value] of Object.entries(SYNC_DEFAULTS)) {
            this._values.set(key, this._clone(value));
        }
    }

    private _clone<T>(value: T): T {
        if (Array.isArray(value)) return [...value] as unknown as T;
        if (typeof value === 'object' && value !== null) return { ...value } as T;
        return value;
    }

    public static getInstance(): AppConfig {
        if (AppConfig._instance === null) {
            AppConfig._instance = new AppConfig();
        }
        return AppConfig._instance;
    }

    public addListener(listener: ConfigListener): void {
        this._listeners.add(listener);
    }

    public removeListener(listener: ConfigListener): void {
        this._listeners.delete(listener);
    }

    private _notify(): void {
        if (this._changeBuffer.size === 0) return;

        const changes = new Map(this._changeBuffer);
        this._changeBuffer.clear();
        this._flushScheduled = false;

        for (const [key, value] of changes) {
            for (const listener of this._listeners) {
                listener(key, value);
            }
        }
    }

    public batchSet(settings: Record<string, unknown>): void {
        for (const [key, value] of Object.entries(settings)) {
            if (this._values.has(key)) {
                const safeValue = this._clone(value) as ConfigValue;
                this._values.set(key, safeValue);
                this._changeBuffer.set(key, safeValue);
            }
        }

        if (!this._flushScheduled) {
            this._flushScheduled = true;
            Promise.resolve().then(() => this._notify());
        }
    }

    // 派生值：取语言代码的前两位
    public getLanguageCode(): string {
        return (this._values.get('language') as string).slice(0, 2);
    }

    // 直接读取 window 尺寸
    public getScreenHeight(): number {
        return window.innerHeight;
    }

    public getScreenWidth(): number {
        return window.innerWidth;
    }

    // weather_api_choose 有类型转换
    public getWeatherApiChoose(): number {
        return Number(this._values.get('weather_api_choose')) || 0;
    }

    // runtime 属性直接访问
    public getFiles(): Record<string, string[]> {
        return this.runtime.files;
    }

    public setFiles(files: Record<string, string[]>): void {
        this.runtime.files = files;
    }

    public getMyList(): string[] {
        return this.runtime.myList;
    }

    public setMyList(list: string[]): void {
        this.runtime.myList = list;
    }

    private _setValue(key: string, value: ConfigValue): void {
        if (!this._values.has(key)) return;

        const safeValue = this._clone(value);
        this._values.set(key, safeValue);
        this._changeBuffer.set(key, safeValue);
        this._scheduleFlush();
    }

    private _scheduleFlush(): void {
        if (!this._flushScheduled) {
            this._flushScheduled = true;
            Promise.resolve().then(() => this._notify());
        }
    }

    public get(key: string): ConfigValue | undefined {
        return this._values.get(key);
    }

    public set(key: string, value: ConfigValue): void {
        if (this._values.has(key)) {
            this._setValue(key, value);
        }
    }

    public has(key: string): boolean {
        return this._values.has(key);
    }

    public keys(): string[] {
        return [...this._values.keys()];
    }

    public reset(): void {
        this._values.clear();
        this._initDefaults();
    }
}

// ============== 配置代理 ==============

// 直接导出 AppConfig 单例
const appConfig = AppConfig.getInstance();

// 配置代理类型
interface ConfigProxy {
    get(key: string): ConfigValue | undefined;
    set(key: string, value: ConfigValue): void;
    has(key: string): boolean;
    keys(): string[];
    reset(): void;
    addListener(listener: ConfigListener): void;
    removeListener(listener: ConfigListener): void;
    batchSet(settings: Record<string, unknown>): void;
    runtime: RuntimeData;
    [prop: string]: any;  // Proxy pattern requires dynamic access
}

// 导出配置代理
export const config = new Proxy({} as ConfigProxy, {
    get(_, prop: string) {
        if (prop === 'runtime') {
            return appConfig.runtime;
        }
        if (
            prop === 'has' ||
            prop === 'keys' ||
            prop === 'reset' ||
            prop === 'addListener' ||
            prop === 'removeListener' ||
            prop === 'batchSet' ||
            prop === 'getInstance' ||
            prop === 'constructor' ||
            prop === 'get' ||
            prop === 'set'
        ) {
            const val = (appConfig as any)[prop];
            if (typeof val === 'function') {
                return val.bind(appConfig);
            }
            return val;
        }
        // 直接方法名调用 (getScreenHeight, setFiles 等)
        if (typeof (appConfig as any)[prop] === 'function') {
            return (appConfig as any)[prop];
        }
        // getXxx 命名规范查找 (config.screenHeight → getScreenHeight())
        const capital = prop.charAt(0).toUpperCase() + prop.slice(1);
        const getterName = 'get' + capital;
        if (typeof (appConfig as any)[getterName] === 'function') {
            return (appConfig as any)[getterName]();
        }
        // 普通配置属性：通过通用 get 方法访问
        return appConfig.get(prop);
    },
    set(_, prop: string, value) {
        if (prop === 'runtime') {
            (appConfig as any).runtime = value;
            return true;
        }
        // 直接方法名调用 (setFiles 等)
        if (typeof (appConfig as any)[prop] === 'function') {
            (appConfig as any)[prop](value);
            return true;
        }
        // setXxx 命名规范查找 (config.xxx = value → setXxx(value))
        const capital = prop.charAt(0).toUpperCase() + prop.slice(1);
        const setterName = 'set' + capital;
        if (typeof (appConfig as any)[setterName] === 'function') {
            (appConfig as any)[setterName](value);
            return true;
        }
        // 普通配置属性：通过通用 set 方法访问
        appConfig.set(prop, value as ConfigValue);
        return true;
    },
});

export { AppConfig, SYNC_DEFAULTS };
