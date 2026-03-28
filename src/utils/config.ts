// 默认配置值
const DEFAULTS = {
  // 核心运行时配置
  language: "zh-CN",
  firstLoad: true,
  paused: false,
  playbackState: 0, // 播放状态: 0=停止, 1=播放, 2=暂停

  // 初始化状态配置
  dateInitComplete: false,
  bgInitComplete: false,
  weatherInitComplete: false,
  fluidEffectInitComplete: false,
  updateInitComplete: false,

  // 路径配置
  backgroundRoute: "./src/source/imgs/1.jpg",
  videoRoute: "",
  cusvideoRoute: "",
  cusaudioRoute: "",
  mapRoute: "./src/source/map/1.png",

  // 视频配置
  videoModel: 1,
  videoVolume: 0.5,
  videoModelNow: 1,
  selectvideo: "",

  // 图片API配置
  galaxyapi: 1,
  chiyuanapi: "https://t.alcy.cc/ycy/?json",

  // 图片背景位置和尺寸配置
  bgy: "512px",
  bgx: "512px",
  bgs: "100%",
  bgxy: "512px 512px ",
  custom: "",

  // 图片信息配置
  fristPicturesinfo: true,
  picturesInfoLanguage: 1,
  picturesInfoShowRorL: null,
  picturesInfoColor: null,
  picturesInfoBlurcolorShow: null,
  picturesInfoBlurcolor: null,
  picturesInfoYakeliShow: null,
  picturesInfoYakeli: null,
  picturesInfoYakelicColor: null,
  picturesInfoBluryakeli: null,
  picturesInfoShow: null,
  picturesUrl: "",

  // 音频配置
  musicModel: 0,
  musicVolume: 0.5,
  selectmusic: {},

  // 音频可视化配置
  visualAudioModel: 1,
  audioSmoothEnabled: true,
  audioSmoothFactor: 70,
  audioSpatialWindow: 3,
  pwCircleShowBool: true,
  pwLineShowBool: true,

  // 圆圈可视化配置
  pwCircleStyle: 1,
  pwCircleRadius: 50,
  pwCircleRange: 50,
  pwCircleColor: [255, 255, 255],
  pwCircleBlurColor: [255, 255, 255],
  pwCircleX: 50,
  pwCircleY: 50,
  pwCircleColorMode: 0,
  pwCircleSolidColorGradient: false,
  pwCircleBlurColorGradient: false,
  pwCircleColorRhythm: false,
  pwCircleGradientRate: 10,
  pwCircleLineWidth: 2,
  pwCircleRotation: 0,
  pwCircleDirection: 0,
  pwCircleWavetransparency: 80,
  pwCircleShowSemiCircle: false,
  pwCircleSemiCircledirection: 0,

  // 直线可视化配置
  pwLinePosition: 50,
  pwLineStyle: 1,
  pwLineDirection: 0,
  pwLineWidth: 2,
  pwLineSpacing: 50,
  pwLineDensity: 100,
  pwLineRange: 50,
  pwLineTransparency: 80,
  pwLineColor: [255, 255, 255],
  pwLineBlurColor: [255, 255, 255],
  pwLineX: 50,
  pwLineY: 50,
  pwLineMiddleLine: false,
  pwLineColorMode: 0,
  pwLineSolidColorGradient: false,
  pwLineBlurColorGradient: false,
  pwLineColorRhythm: false,
  pwLineGradientRate: 10,

  // 音频可视化(wallpaper.audiovisualizer)参数
  audioAmplitude: 50,
  audioDecline: 50,
  audioIsRing: false,
  audioIsStaticRing: false,
  audioIsInnerRing: false,
  audioIsOuterRing: false,
  audioRadius: 50,
  audioRingRotation: 50,
  audioOpacity: 90,
  audioColor: [255, 255, 255],
  audioShadowColor: [255, 255, 255],
  audioShadowBlur: 75,
  audioOffsetX: 50,
  audioOffsetY: 50,
  audioIsClickOffset: false,
  audioIsLineTo: false,
  audioFirstPoint: 50,
  audioSecondPoint: 50,
  audioPointNum: 120,
  audioDistance: 50,
  audioLineWidth: 50,
  audioIsBall: false,
  audioBallSpacer: 50,
  audioBallSize: 50,
  audioBallRotation: 50,

  // 幻灯片配置
  slideNow: false,
  wallpaperMode: 1,
  transitionMode: 1,
  transitionModeChoose_0: 0,
  transitionModeChoose_1: 0,
  transitionModeChoose_4: "",
  random: false,
  speed: 1,
  bgStyle: 1,

  // 樱花配置
  showSakura: true,
  sakuraTransparency: 0.15,
  sakuraBackground: true,
  sakuraBackColor: true,
  sakuraReverse: false,
  sakuraPointNumber: 300,
  sakuraBackLight: 1 / 100.0,

  // 时间配置
  timeTransparency: 0.8,
  timeX: 50,
  timeY: 50,

  // 日期格式配置
  dateFormat: {
    yearFormat: 1,
    monthFormat: 1,
    dayFormat: 1,
    weekFormat: 1,
    separator: 1,
    order: 1
  },

  // 天气配置
  weatherApiChoose: "",
  cityNumber: "",
  weatherUpdate: 3,
  weatherUnit: "metric",
  weatherLang: "en",
  qweatherApiPaymode: false,

  // 一言配置
  hitokotoUpdate: 6,
  hitokotoInit: false,
  hitoktoFormatTest: 1,
  hitokotoSizeXShow: null,

  // 一言分类配置
  hitA: "",
  hitB: "",
  hitC: "",
  hitD: "",
  hitE: "",
  hitF: "",
  hitG: "",
  hitH: "",
  hitI: "",
  hitJ: "",
  hitK: "",
  hitL: "",

  // 一言颜色配置
  hitokotoColor: [255, 255, 255],
  hitokotoBlurcolorShow: false,
  hitokotoBlurcolor: [255, 255, 255],
  hitokotoYakeliShow: false,
  hitokotoYakelicColor: [255, 255, 255],
  hitokotoYakeli: 0,
  hitokotoBluryakeli: 10,

  // 天气API配置
  cityKey: "",
  apiHost: "",
  visualCrossingKey: "",
  weatherAppId: "",
  weatherAppSecret: "",

  // 天气颜色配置
  weatherColor: [255, 255, 255],
  weatherBlurcolorShow: false,
  weatherBlurcolor: [255, 255, 255],
  weatherYakeliShow: false,
  weatherYakelicColor: [255, 255, 255],
  weatherYakeli: 0,
  weatherBluryakeli: 10,
  weatherDailyTip: false,

  // 倒计时日期配置
  countdownYear: new Date().getFullYear(),
  countdownMonth: new Date().getMonth() + 1,
  countdownDay: new Date().getDate(),
  countdownColor: [255, 255, 255],
  countdownBlurcolorShow: false,
  countdownBlurcolor: [255, 255, 255],
  countdownYakeliShow: false,
  countdownYakelicColor: [255, 255, 255],
  countdownYakeli: 0,
  countdownBluryakeli: 10,

  // 倒计时文本配置
  countdownTxt: "",
  countdownTxt1: "",
  firstLoadCountdown: true,

  // 播放器自动隐藏配置
  playerControlAutohide: true,

  // 播放器控制配置
  playerControlShow: false,
  playerControlScalefactor: 1,
  playerControlColor: [255, 255, 255],
  playerControlBlurcolorShow: false,
  playerControlBlurcolor: [255, 255, 255],
  playerControlYakeliShow: false,
  playerControlYakelicColor: [255, 255, 255],
  playerControlYakeli: 0,
  playerControlBluryakeli: 10,
  playerControlThumbnailSize: 0,
  playerControlSizeValue: 100,
  playerControlThumbnailSizeValue: 100,
  playerControlThumbnailRotation: false,
  playerControlThumbnailRotationSpeed: 5,
  playerControlTimetransparency: 1,
  playerControlShowwidth: 0,
  playerControlYakelibgusetb: 1,
  playerControlFontusetb: 5,
  playerControlThumbnailrorl: false,
  playerControlSamealbumTitle: false,
  playerControlVisualaudiobar: 0,
  playerControlBarline: 0,
  colorPickupMethod: 1,
  playerControlHdong: 0.1,
  playerControlX: 50,
  playerControlY: 50,

  // 日期格式测试
  dateFormatTest: 1,

  // 时间显示配置
  tShowSencends: true,
  timeColorRhythm: false,
  timeColor: "rgb(255, 255, 255)",
  timeBlurColor: "0 0 20px rgb(255, 255, 255)",
  dateColorRhythm: false,
  dateColor: [255, 255, 255],

  // 日期透明度
  dateTransparency: 0.8,

  // 日期位置
  dateX: 50,
  dateY: 45,

  // 日期颜色配置
  oDateColor: [255, 255, 255],
  oDateBlurcolorShow: false,
  oDateBlurcolor: [255, 255, 255],
  oDateYakeliShow: false,
  oDateYakelicColor: [255, 255, 255],
  oDateYakeli: 0,
  oDateBluryakeli: 10,

  // 时钟颜色配置
  oClockColor: [255, 255, 255],
  oClockBlurcolorShow: false,
  oClockBlurcolor: [255, 255, 255],
  oClockYakeliShow: false,
  oClockYakelicColor: [255, 255, 255],
  oClockYakeli: 0,
  oClockBluryakeli: 10,

  // RGB灯光效果配置
  backgroundRGB: false,
  sakuraRGB: false,
  particlesRGB: false,
  audiobarRGB: false,
  RGBRefresh: 0,
  RGBShow: false,
  nextphoto: false,
  opacitySaRGB: 1,
  aurgbcolor: '255,255,255',
  aurgbhigh: 1,
  audiobarrainbowcolor: false,
  rainbowmove: false,
  rainbowmovespeed: 1,

  // 流体效果配置
  fluidEffectEnabled: false,
  fluidEffectEnabledFullscreen: false,
  fluidEffectResolution: 240,
  fluidEffectBlurAmount: 20,
  fluidEffectDisplacementScale: 0.5,
  fluidEffectTurbulenceOctaves: 4,
  fluidEffectCanvasDisplacement: 0,
  fluidEffectDarkOverlayStrength: 50,
  fluidEffectBackdropFilterStrength: 10,

  // 全屏歌词配置
  fullscreenLyricsEnabled: false,
  fullscreenLyricsShowTranslation: true,
  fullscreenLyricsShowRoman: false,
  fullscreenLyricsDelay: 0,
  fullscreenLyricsEnableBlur: true,
  fullscreenLyricsHideOther: true,
  fullscreenLyricsShowClock: false,
};

// 运行时数据（存储动态变化的数据）
const RUNTIME_DEFAULTS = {
  playerInfo: {
    audioArray: [] as number[], // 音频可视化数据，128个元素
    playerState: null as number | null, // 播放器状态: null=未初始化, 0=停止, 1=播放, 2=暂停
    singtitle: '',
    singartist: '',
    singalbumTitle: '',
    aubarstop: true,
    colorGroup: null as any,
    fontcolor: null as any,
  },
};

// 类型定义
type ConfigListener = (key: string, value: any) => void;
type ConfigValue = typeof DEFAULTS[keyof typeof DEFAULTS];

// 动态生成 AppConfig 运行时类型
type AppConfigRuntime = {
  playerInfo: {
    audioArray: number[];
    playerState: number | null;
    singtitle: string;
    singartist: string;
    singalbumTitle: string;
    aubarstop: boolean;
    colorGroup: any;
    fontcolor: any;
  };
  versionManager: any;
  debugLogger: any;
  FluidEffect2: any;
  fluidEffect: any;
  fullscreenFluidEffect: any;
  FluidEffectConfig: any;
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
  wallpaper: any;
  param: any;
  PWLineParam: any;
  hitokoto: {
    hitokoto_text: string;
    from_text: string;
    from_who_text: string;
  };
};

/**
 * AppConfig - 应用程序运行时配置管理类
 */
class AppConfig {
  private static _instance: AppConfig | null = null;
  private _values: Map<string, ConfigValue>;
  private _listeners: Set<ConfigListener>;
  private _changeBuffer: Map<string, ConfigValue>;
  private _flushScheduled: boolean = false;
  public runtime: AppConfigRuntime;

  private constructor() {
    this._values = new Map();
    this._listeners = new Set();
    this._changeBuffer = new Map();
    this._flushScheduled = false;
    this.runtime = {
      playerInfo: {
        ...RUNTIME_DEFAULTS.playerInfo,
        audioArray: [...RUNTIME_DEFAULTS.playerInfo.audioArray]
      },
      versionManager: undefined,
      debugLogger: undefined,
      FluidEffect2: undefined,
      fluidEffect: undefined,
      fullscreenFluidEffect: undefined,
      FluidEffectConfig: undefined,
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
          where: ""
        }
      },
      wallpaper: null,
      param: {
        style: 1,
        r: 0.45,
        color: "rgba(255,255,255,0.8)",
        blurColor: "#ffcccc",
        arr1: [] as { x: number; y: number }[],
        arr2: [] as { x: number; y: number }[],
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
        arr1: [] as { x: number; y: number }[],
        arr2: [] as { x: number; y: number }[],
        arr3: [] as { x: number; y: number }[],
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
      },
      hitokoto: {
        hitokoto_text: "未获取",
        from_text: "未获取",
        from_who_text: "未获取"
      }
    };
    this._initDefaults();
  }

  private _initDefaults(): void {
    for (const [key, value] of Object.entries(DEFAULTS)) {
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

  public batchSet(settings: Record<string, any>): void {
    for (const [key, value] of Object.entries(settings)) {
      if (this._values.has(key)) {
        const safeValue = this._clone(value);
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
  public getScreenHeight(): number { return window.innerHeight; }
  public getScreenWidth(): number { return window.innerWidth; }

  // weatherApiChoose 有类型转换
  public getWeatherApiChoose(): number {
    return Number(this._values.get('weatherApiChoose')) || 0;
  }

  // runtime 属性直接访问
  public getFiles(): Record<string, string[]> { return this.runtime.files; }
  public setFiles(files: Record<string, string[]>): void { this.runtime.files = files; }
  public getMyList(): string[] { return this.runtime.myList; }
  public setMyList(list: string[]): void { this.runtime.myList = list; }

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

// 直接导出 AppConfig 单例
const appConfig = AppConfig.getInstance();

// 配置代理类型 - 支持 config.xxx 属性访问
// config.xxx → appConfig.get('xxx') → this._values.get('xxx')
// config.xxx = value → appConfig.set('xxx', value) → this._setValue('xxx', value)
// 特殊方法 (getLanguageCode, getScreenHeight 等) 直接在 appConfig 上查找并调用
interface ConfigProxy {
  // 通用方法
  get(key: string): ConfigValue | undefined;
  set(key: string, value: ConfigValue): void;
  has(key: string): boolean;
  keys(): string[];
  reset(): void;
  addListener(listener: ConfigListener): void;
  removeListener(listener: ConfigListener): void;
  batchSet(settings: Record<string, any>): void;
  runtime: AppConfig['runtime'];
  // 动态属性访问 (通过 Proxy 实现)
  [prop: string]: any;
}

// 导出配置代理，支持 config.xxx 属性访问
// config.xxx → 先查 getXxx() 方法存在则调用，否则 appConfig.get('xxx')
// config.xxx = value → 先查 setXxx() 方法存在则调用，否则 appConfig.set('xxx', value)
export const config = new Proxy({} as ConfigProxy, {
  get(_, prop: string) {
    // runtime 属性直接返回 appConfig.runtime
    if (prop === 'runtime') {
      return appConfig.runtime;
    }
    // 内部属性和方法直接返回
    if (prop === 'has' || prop === 'keys' || prop === 'reset' ||
        prop === 'addListener' || prop === 'removeListener' || prop === 'batchSet' ||
        prop === 'getInstance' || prop === 'constructor' ||
        prop === 'get' || prop === 'set') {
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
    // runtime 属性直接赋值
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
  }
});

export { AppConfig, DEFAULTS };
