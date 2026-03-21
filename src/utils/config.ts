/**
 * AppConfig - 应用程序运行时配置管理
 * 支持 config.xxx 属性访问 和 appConfig.getXxx()/setXxx() 方法访问
 */

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
  updateInitComplete: false,

  // 路径配置
  backgroundRoute: "imgs/1.jpg",
  videoRoute: "video/1-test.webm",
  cusvideoRoute: "",
  cusaudioRoute: "",
  mapRoute: "map/1.png",

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

/**
 * AppConfig - 应用程序运行时配置管理类
 */
class AppConfig {
  private static _instance: AppConfig | null = null;
  private _values: Map<string, ConfigValue>;
  private _listeners: Set<ConfigListener>;
  private _changeBuffer: Map<string, ConfigValue>;
  private _flushScheduled: boolean = false;
  public runtime: {
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
    // 运行时状态
    files: Record<string, string[]>;
    myList: string[];
    // 幻灯片/图片运行时状态
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
    // 音频可视化相关运行时对象
    wallpaper: any;
    param: any;
    PWLineParam: any;
  };

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
      param: null,
      PWLineParam: null
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

  // ==================== 监听器管理 ====================

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

  // ==================== 语言相关方法 ====================

  public getLanguage(): string {
    return this._values.get('language') as string;
  }

  public setLanguage(lang: string): void {
    this._setValue('language', lang);
  }

  public getLanguageCode(): string {
    return this.getLanguage().slice(0, 2);
  }

  // ==================== 核心运行时状态方法 ====================

  public getFirstLoad(): boolean { return this._values.get('firstLoad') as boolean; }
  public setFirstLoad(value: boolean): void { this._setValue('firstLoad', value); }

  public getPaused(): boolean { return this._values.get('paused') as boolean; }
  public setPaused(value: boolean): void { this._setValue('paused', value); }

  // ==================== 播放状态方法 ====================

  public getPlaybackState(): number { return this._values.get('playbackState') as number; }
  public setPlaybackState(value: number): void { this._setValue('playbackState', value); }

  // ==================== 初始化状态方法 ====================

  public getDateInitComplete(): boolean { return this._values.get('dateInitComplete') as boolean; }
  public setDateInitComplete(value: boolean): void { this._setValue('dateInitComplete', value); }

  public getBgInitComplete(): boolean { return this._values.get('bgInitComplete') as boolean; }
  public setBgInitComplete(value: boolean): void { this._setValue('bgInitComplete', value); }

  public getWeatherInitComplete(): boolean { return this._values.get('weatherInitComplete') as boolean; }
  public setWeatherInitComplete(value: boolean): void { this._setValue('weatherInitComplete', value); }

  public getUpdateInitComplete(): boolean { return this._values.get('updateInitComplete') as boolean; }
  public setUpdateInitComplete(value: boolean): void { this._setValue('updateInitComplete', value); }

  // ==================== 路径配置方法 ====================

  public getBackgroundRoute(): string { return this._values.get('backgroundRoute') as string; }
  public setBackgroundRoute(value: string): void { this._setValue('backgroundRoute', value); }

  public getVideoRoute(): string { return this._values.get('videoRoute') as string; }
  public setVideoRoute(value: string): void { this._setValue('videoRoute', value); }

  public getCusvideoRoute(): string { return this._values.get('cusvideoRoute') as string; }
  public setCusvideoRoute(value: string): void { this._setValue('cusvideoRoute', value); }

  public getCusaudioRoute(): string { return this._values.get('cusaudioRoute') as string; }
  public setCusaudioRoute(value: string): void { this._setValue('cusaudioRoute', value); }

  public getMapRoute(): string { return this._values.get('mapRoute') as string; }
  public setMapRoute(value: string): void { this._setValue('mapRoute', value); }

  // ==================== 视频配置方法 ====================

  public getVideoModel(): number { return this._values.get('videoModel') as number; }
  public setVideoModel(value: number): void { this._setValue('videoModel', value); }

  public getVideoVolume(): number { return this._values.get('videoVolume') as number; }
  public setVideoVolume(value: number): void { this._setValue('videoVolume', value); }

  public getVideoModelNow(): number { return this._values.get('videoModelNow') as number; }
  public setVideoModelNow(value: number): void { this._setValue('videoModelNow', value); }

  public getSelectvideo(): number { return this._values.get('selectvideo') as number; }
  public setSelectvideo(value: number): void { this._setValue('selectvideo', value); }

  // ==================== 图片API配置方法 ====================

  public getGalaxyapi(): number { return this._values.get('galaxyapi') as number; }
  public setGalaxyapi(value: number): void { this._setValue('galaxyapi', value); }

  public getChiyuanapi(): string { return this._values.get('chiyuanapi') as string; }
  public setChiyuanapi(value: string): void { this._setValue('chiyuanapi', value); }

  public getCustom(): string { return this._values.get('custom') as string; }
  public setCustom(value: string): void { this._setValue('custom', value); }

  // ==================== 图片背景位置和尺寸配置方法 ====================

  public getBgy(): string { return this._values.get('bgy') as string; }
  public setBgy(value: string): void { this._setValue('bgy', value); }

  public getBgx(): string { return this._values.get('bgx') as string; }
  public setBgx(value: string): void { this._setValue('bgx', value); }

  public getBgs(): string { return this._values.get('bgs') as string; }
  public setBgs(value: string): void { this._setValue('bgs', value); }

  public getBgxy(): string { return this._values.get('bgxy') as string; }
  public setBgxy(value: string): void { this._setValue('bgxy', value); }

  // ==================== 图片信息配置方法 ====================

  public getFristPicturesinfo(): boolean { return this._values.get('fristPicturesinfo') as boolean; }
  public setFristPicturesinfo(value: boolean): void { this._setValue('fristPicturesinfo', value); }

  public getPicturesInfoLanguage(): number { return this._values.get('picturesInfoLanguage') as number; }
  public setPicturesInfoLanguage(value: number): void { this._setValue('picturesInfoLanguage', value); }

  public getPicturesInfoShowRorL(): any { return this._values.get('picturesInfoShowRorL'); }
  public setPicturesInfoShowRorL(value: any): void { this._setValue('picturesInfoShowRorL', value); }

  public getPicturesInfoColor(): any { return this._values.get('picturesInfoColor'); }
  public setPicturesInfoColor(value: any): void { this._setValue('picturesInfoColor', value); }

  public getPicturesInfoBlurcolorShow(): any { return this._values.get('picturesInfoBlurcolorShow'); }
  public setPicturesInfoBlurcolorShow(value: any): void { this._setValue('picturesInfoBlurcolorShow', value); }

  public getPicturesInfoBlurcolor(): any { return this._values.get('picturesInfoBlurcolor'); }
  public setPicturesInfoBlurcolor(value: any): void { this._setValue('picturesInfoBlurcolor', value); }

  public getPicturesInfoYakeliShow(): any { return this._values.get('picturesInfoYakeliShow'); }
  public setPicturesInfoYakeliShow(value: any): void { this._setValue('picturesInfoYakeliShow', value); }

  public getPicturesInfoYakeli(): any { return this._values.get('picturesInfoYakeli'); }
  public setPicturesInfoYakeli(value: any): void { this._setValue('picturesInfoYakeli', value); }

  public getPicturesInfoYakelicColor(): any { return this._values.get('picturesInfoYakelicColor'); }
  public setPicturesInfoYakelicColor(value: any): void { this._setValue('picturesInfoYakelicColor', value); }

  public getPicturesInfoBluryakeli(): any { return this._values.get('picturesInfoBluryakeli'); }
  public setPicturesInfoBluryakeli(value: any): void { this._setValue('picturesInfoBluryakeli', value); }

  public getPicturesInfoShow(): any { return this._values.get('picturesInfoShow'); }
  public setPicturesInfoShow(value: any): void { this._setValue('picturesInfoShow', value); }

  public getPicturesUrl(): string { return this._values.get('picturesUrl') as string; }
  public setPicturesUrl(value: string): void { this._setValue('picturesUrl', value); }

  // ==================== 音频配置方法 ====================

  public getMusicModel(): number { return this._values.get('musicModel') as number; }
  public setMusicModel(value: number): void { this._setValue('musicModel', value); }

  public getMusicVolume(): number { return this._values.get('musicVolume') as number; }
  public setMusicVolume(value: number): void { this._setValue('musicVolume', value); }

  public getSelectmusic(): any { return this._values.get('selectmusic'); }
  public setSelectmusic(value: any): void { this._setValue('selectmusic', value); }

  // ==================== 音频可视化配置方法 ====================

  public getVisualAudioModel(): number { return this._values.get('visualAudioModel') as number; }
  public setVisualAudioModel(value: number): void { this._setValue('visualAudioModel', value); }

  public getPwCircleShowBool(): boolean { return this._values.get('pwCircleShowBool') as boolean; }
  public setPwCircleShowBool(value: boolean): void { this._setValue('pwCircleShowBool', value); }

  public getPwLineShowBool(): boolean { return this._values.get('pwLineShowBool') as boolean; }
  public setPwLineShowBool(value: boolean): void { this._setValue('pwLineShowBool', value); }

  // ==================== 圆圈可视化配置方法 ====================

  public getPwCircleStyle(): number { return this._values.get('pwCircleStyle') as number; }
  public setPwCircleStyle(value: number): void { this._setValue('pwCircleStyle', value); }

  public getPwCircleRadius(): number { return this._values.get('pwCircleRadius') as number; }
  public setPwCircleRadius(value: number): void { this._setValue('pwCircleRadius', value); }

  public getPwCircleRange(): number { return this._values.get('pwCircleRange') as number; }
  public setPwCircleRange(value: number): void { this._setValue('pwCircleRange', value); }

  public getPwCircleColor(): number[] { return this._values.get('pwCircleColor') as number[]; }
  public setPwCircleColor(value: number[]): void { this._setValue('pwCircleColor', value); }

  public getPwCircleBlurColor(): number[] { return this._values.get('pwCircleBlurColor') as number[]; }
  public setPwCircleBlurColor(value: number[]): void { this._setValue('pwCircleBlurColor', value); }

  public getPwCircleX(): number { return this._values.get('pwCircleX') as number; }
  public setPwCircleX(value: number): void { this._setValue('pwCircleX', value); }

  public getPwCircleY(): number { return this._values.get('pwCircleY') as number; }
  public setPwCircleY(value: number): void { this._setValue('pwCircleY', value); }

  public getPwCircleColorMode(): number { return this._values.get('pwCircleColorMode') as number; }
  public setPwCircleColorMode(value: number): void { this._setValue('pwCircleColorMode', value); }

  public getPwCircleSolidColorGradient(): boolean { return this._values.get('pwCircleSolidColorGradient') as boolean; }
  public setPwCircleSolidColorGradient(value: boolean): void { this._setValue('pwCircleSolidColorGradient', value); }

  public getPwCircleBlurColorGradient(): boolean { return this._values.get('pwCircleBlurColorGradient') as boolean; }
  public setPwCircleBlurColorGradient(value: boolean): void { this._setValue('pwCircleBlurColorGradient', value); }

  public getPwCircleColorRhythm(): boolean { return this._values.get('pwCircleColorRhythm') as boolean; }
  public setPwCircleColorRhythm(value: boolean): void { this._setValue('pwCircleColorRhythm', value); }

  public getPwCircleGradientRate(): number { return this._values.get('pwCircleGradientRate') as number; }
  public setPwCircleGradientRate(value: number): void { this._setValue('pwCircleGradientRate', value); }

  public getPwCircleLineWidth(): number { return this._values.get('pwCircleLineWidth') as number; }
  public setPwCircleLineWidth(value: number): void { this._setValue('pwCircleLineWidth', value); }

  public getPwCircleRotation(): number { return this._values.get('pwCircleRotation') as number; }
  public setPwCircleRotation(value: number): void { this._setValue('pwCircleRotation', value); }

  public getPwCircleDirection(): number { return this._values.get('pwCircleDirection') as number; }
  public setPwCircleDirection(value: number): void { this._setValue('pwCircleDirection', value); }

  public getPwCircleWavetransparency(): number { return this._values.get('pwCircleWavetransparency') as number; }
  public setPwCircleWavetransparency(value: number): void { this._setValue('pwCircleWavetransparency', value); }

  public getPwCircleShowSemiCircle(): boolean { return this._values.get('pwCircleShowSemiCircle') as boolean; }
  public setPwCircleShowSemiCircle(value: boolean): void { this._setValue('pwCircleShowSemiCircle', value); }

  public getPwCircleSemiCircledirection(): number { return this._values.get('pwCircleSemiCircledirection') as number; }
  public setPwCircleSemiCircledirection(value: number): void { this._setValue('pwCircleSemiCircledirection', value); }

  // ==================== 直线可视化配置方法 ====================

  public getPwLinePosition(): number { return this._values.get('pwLinePosition') as number; }
  public setPwLinePosition(value: number): void { this._setValue('pwLinePosition', value); }

  public getPwLineStyle(): number { return this._values.get('pwLineStyle') as number; }
  public setPwLineStyle(value: number): void { this._setValue('pwLineStyle', value); }

  public getPwLineDirection(): number { return this._values.get('pwLineDirection') as number; }
  public setPwLineDirection(value: number): void { this._setValue('pwLineDirection', value); }

  public getPwLineWidth(): number { return this._values.get('pwLineWidth') as number; }
  public setPwLineWidth(value: number): void { this._setValue('pwLineWidth', value); }

  public getPwLineSpacing(): number { return this._values.get('pwLineSpacing') as number; }
  public setPwLineSpacing(value: number): void { this._setValue('pwLineSpacing', value); }

  public getPwLineDensity(): number { return this._values.get('pwLineDensity') as number; }
  public setPwLineDensity(value: number): void { this._setValue('pwLineDensity', value); }

  public getPwLineRange(): number { return this._values.get('pwLineRange') as number; }
  public setPwLineRange(value: number): void { this._setValue('pwLineRange', value); }

  public getPwLineTransparency(): number { return this._values.get('pwLineTransparency') as number; }
  public setPwLineTransparency(value: number): void { this._setValue('pwLineTransparency', value); }

  public getPwLineColor(): number[] { return this._values.get('pwLineColor') as number[]; }
  public setPwLineColor(value: number[]): void { this._setValue('pwLineColor', value); }

  public getPwLineBlurColor(): number[] { return this._values.get('pwLineBlurColor') as number[]; }
  public setPwLineBlurColor(value: number[]): void { this._setValue('pwLineBlurColor', value); }

  public getPwLineX(): number { return this._values.get('pwLineX') as number; }
  public setPwLineX(value: number): void { this._setValue('pwLineX', value); }

  public getPwLineY(): number { return this._values.get('pwLineY') as number; }
  public setPwLineY(value: number): void { this._setValue('pwLineY', value); }

  public getPwLineMiddleLine(): boolean { return this._values.get('pwLineMiddleLine') as boolean; }
  public setPwLineMiddleLine(value: boolean): void { this._setValue('pwLineMiddleLine', value); }

  public getPwLineColorMode(): number { return this._values.get('pwLineColorMode') as number; }
  public setPwLineColorMode(value: number): void { this._setValue('pwLineColorMode', value); }

  public getPwLineSolidColorGradient(): boolean { return this._values.get('pwLineSolidColorGradient') as boolean; }
  public setPwLineSolidColorGradient(value: boolean): void { this._setValue('pwLineSolidColorGradient', value); }

  public getPwLineBlurColorGradient(): boolean { return this._values.get('pwLineBlurColorGradient') as boolean; }
  public setPwLineBlurColorGradient(value: boolean): void { this._setValue('pwLineBlurColorGradient', value); }

  public getPwLineColorRhythm(): boolean { return this._values.get('pwLineColorRhythm') as boolean; }
  public setPwLineColorRhythm(value: boolean): void { this._setValue('pwLineColorRhythm', value); }

  public getPwLineGradientRate(): number { return this._values.get('pwLineGradientRate') as number; }
  public setPwLineGradientRate(value: number): void { this._setValue('pwLineGradientRate', value); }

  // ==================== 音频可视化(wallpaper.audiovisualizer)配置方法 ====================

  public getAudioAmplitude(): number { return this._values.get('audioAmplitude') as number; }
  public setAudioAmplitude(value: number): void { this._setValue('audioAmplitude', value); }

  public getAudioDecline(): number { return this._values.get('audioDecline') as number; }
  public setAudioDecline(value: number): void { this._setValue('audioDecline', value); }

  public getAudioIsRing(): boolean { return this._values.get('audioIsRing') as boolean; }
  public setAudioIsRing(value: boolean): void { this._setValue('audioIsRing', value); }

  public getAudioIsStaticRing(): boolean { return this._values.get('audioIsStaticRing') as boolean; }
  public setAudioIsStaticRing(value: boolean): void { this._setValue('audioIsStaticRing', value); }

  public getAudioIsInnerRing(): boolean { return this._values.get('audioIsInnerRing') as boolean; }
  public setAudioIsInnerRing(value: boolean): void { this._setValue('audioIsInnerRing', value); }

  public getAudioIsOuterRing(): boolean { return this._values.get('audioIsOuterRing') as boolean; }
  public setAudioIsOuterRing(value: boolean): void { this._setValue('audioIsOuterRing', value); }

  public getAudioRadius(): number { return this._values.get('audioRadius') as number; }
  public setAudioRadius(value: number): void { this._setValue('audioRadius', value); }

  public getAudioRingRotation(): number { return this._values.get('audioRingRotation') as number; }
  public setAudioRingRotation(value: number): void { this._setValue('audioRingRotation', value); }

  public getAudioOpacity(): number { return this._values.get('audioOpacity') as number; }
  public setAudioOpacity(value: number): void { this._setValue('audioOpacity', value); }

  public getAudioColor(): number[] { return this._values.get('audioColor') as number[]; }
  public setAudioColor(value: number[]): void { this._setValue('audioColor', value); }

  public getAudioShadowColor(): number[] { return this._values.get('audioShadowColor') as number[]; }
  public setAudioShadowColor(value: number[]): void { this._setValue('audioShadowColor', value); }

  public getAudioShadowBlur(): number { return this._values.get('audioShadowBlur') as number; }
  public setAudioShadowBlur(value: number): void { this._setValue('audioShadowBlur', value); }

  public getAudioOffsetX(): number { return this._values.get('audioOffsetX') as number; }
  public setAudioOffsetX(value: number): void { this._setValue('audioOffsetX', value); }

  public getAudioOffsetY(): number { return this._values.get('audioOffsetY') as number; }
  public setAudioOffsetY(value: number): void { this._setValue('audioOffsetY', value); }

  public getAudioIsClickOffset(): boolean { return this._values.get('audioIsClickOffset') as boolean; }
  public setAudioIsClickOffset(value: boolean): void { this._setValue('audioIsClickOffset', value); }

  public getAudioIsLineTo(): boolean { return this._values.get('audioIsLineTo') as boolean; }
  public setAudioIsLineTo(value: boolean): void { this._setValue('audioIsLineTo', value); }

  public getAudioFirstPoint(): number { return this._values.get('audioFirstPoint') as number; }
  public setAudioFirstPoint(value: number): void { this._setValue('audioFirstPoint', value); }

  public getAudioSecondPoint(): number { return this._values.get('audioSecondPoint') as number; }
  public setAudioSecondPoint(value: number): void { this._setValue('audioSecondPoint', value); }

  public getAudioPointNum(): number { return this._values.get('audioPointNum') as number; }
  public setAudioPointNum(value: number): void { this._setValue('audioPointNum', value); }

  public getAudioDistance(): number { return this._values.get('audioDistance') as number; }
  public setAudioDistance(value: number): void { this._setValue('audioDistance', value); }

  public getAudioLineWidth(): number { return this._values.get('audioLineWidth') as number; }
  public setAudioLineWidth(value: number): void { this._setValue('audioLineWidth', value); }

  public getAudioIsBall(): boolean { return this._values.get('audioIsBall') as boolean; }
  public setAudioIsBall(value: boolean): void { this._setValue('audioIsBall', value); }

  public getAudioBallSpacer(): number { return this._values.get('audioBallSpacer') as number; }
  public setAudioBallSpacer(value: number): void { this._setValue('audioBallSpacer', value); }

  public getAudioBallSize(): number { return this._values.get('audioBallSize') as number; }
  public setAudioBallSize(value: number): void { this._setValue('audioBallSize', value); }

  public getAudioBallRotation(): number { return this._values.get('audioBallRotation') as number; }
  public setAudioBallRotation(value: number): void { this._setValue('audioBallRotation', value); }

  // ==================== 幻灯片配置方法 ====================

  public getSlideNow(): boolean { return this._values.get('slideNow') as boolean; }
  public setSlideNow(value: boolean): void { this._setValue('slideNow', value); }

  public getWallpaperMode(): number { return this._values.get('wallpaperMode') as number; }
  public setWallpaperMode(value: number): void { this._setValue('wallpaperMode', value); }

  public getTransitionMode(): number { return this._values.get('transitionMode') as number; }
  public setTransitionMode(value: number): void { this._setValue('transitionMode', value); }

  public getTransitionModeChoose_0(): number { return this._values.get('transitionModeChoose_0') as number; }
  public setTransitionModeChoose_0(value: number): void { this._setValue('transitionModeChoose_0', value); }

  public getTransitionModeChoose_1(): number { return this._values.get('transitionModeChoose_1') as number; }
  public setTransitionModeChoose_1(value: number): void { this._setValue('transitionModeChoose_1', value); }

  public getTransitionModeChoose_4(): string { return this._values.get('transitionModeChoose_4') as string; }
  public setTransitionModeChoose_4(value: string): void { this._setValue('transitionModeChoose_4', value); }

  public getRandom(): boolean { return this._values.get('random') as boolean; }
  public setRandom(value: boolean): void { this._setValue('random', value); }

  public getSpeed(): number { return this._values.get('speed') as number; }
  public setSpeed(value: number): void { this._setValue('speed', value); }

  public getBgStyle(): number { return this._values.get('bgStyle') as number; }
  public setBgStyle(value: number): void { this._setValue('bgStyle', value); }

  // ==================== 樱花配置方法 ====================

  public getShowSakura(): boolean { return this._values.get('showSakura') as boolean; }
  public setShowSakura(value: boolean): void { this._setValue('showSakura', value); }

  public getSakuraTransparency(): number { return this._values.get('sakuraTransparency') as number; }
  public setSakuraTransparency(value: number): void { this._setValue('sakuraTransparency', value); }

  public getSakuraBackground(): boolean { return this._values.get('sakuraBackground') as boolean; }
  public setSakuraBackground(value: boolean): void { this._setValue('sakuraBackground', value); }

  public getSakuraBackColor(): boolean { return this._values.get('sakuraBackColor') as boolean; }
  public setSakuraBackColor(value: boolean): void { this._setValue('sakuraBackColor', value); }

  public getSakuraReverse(): boolean { return this._values.get('sakuraReverse') as boolean; }
  public setSakuraReverse(value: boolean): void { this._setValue('sakuraReverse', value); }

  public getSakuraPointNumber(): number { return this._values.get('sakuraPointNumber') as number; }
  public setSakuraPointNumber(value: number): void { this._setValue('sakuraPointNumber', value); }

  public getSakuraBackLight(): number { return this._values.get('sakuraBackLight') as number; }
  public setSakuraBackLight(value: number): void { this._setValue('sakuraBackLight', value); }

  // ==================== 时间配置方法 ====================

  public getTimeTransparency(): number { return this._values.get('timeTransparency') as number; }
  public setTimeTransparency(value: number): void { this._setValue('timeTransparency', value); }

  public getTimeX(): number { return this._values.get('timeX') as number; }
  public setTimeX(value: number): void { this._setValue('timeX', value); }

  public getTimeY(): number { return this._values.get('timeY') as number; }
  public setTimeY(value: number): void { this._setValue('timeY', value); }

  // ==================== 日期格式配置方法 ====================

  public getDateFormat(): any { return this._values.get('dateFormat'); }
  public setDateFormat(value: any): void { this._setValue('dateFormat', value); }

  // ==================== 天气配置方法 ====================

  public getWeatherApiChoose(): number {
    return Number(this._values.get('weatherApiChoose')) || 0;
  }

  public setWeatherApiChoose(value: string): void { this._setValue('weatherApiChoose', value); }

  public getCityNumber(): string { return this._values.get('cityNumber') as string; }
  public setCityNumber(value: string): void { this._setValue('cityNumber', value); }

  public getWeatherUpdate(): number { return this._values.get('weatherUpdate') as number; }
  public setWeatherUpdate(value: number): void { this._setValue('weatherUpdate', value); }

  public getWeatherUnit(): string { return this._values.get('weatherUnit') as string; }
  public setWeatherUnit(value: string): void { this._setValue('weatherUnit', value); }

  public getWeatherLang(): string { return this._values.get('weatherLang') as string; }
  public setWeatherLang(value: string): void { this._setValue('weatherLang', value); }

  public getQweatherApiPaymode(): boolean { return this._values.get('qweatherApiPaymode') as boolean; }
  public setQweatherApiPaymode(value: boolean): void { this._setValue('qweatherApiPaymode', value); }

  public getCityKey(): string { return this._values.get('cityKey') as string; }
  public setCityKey(value: string): void { this._setValue('cityKey', value); }

  public getApiHost(): string { return this._values.get('apiHost') as string; }
  public setApiHost(value: string): void { this._setValue('apiHost', value); }

  public getVisualCrossingKey(): string { return this._values.get('visualCrossingKey') as string; }
  public setVisualCrossingKey(value: string): void { this._setValue('visualCrossingKey', value); }

  public getWeatherAppId(): string { return this._values.get('weatherAppId') as string; }
  public setWeatherAppId(value: string): void { this._setValue('weatherAppId', value); }

  public getWeatherAppSecret(): string { return this._values.get('weatherAppSecret') as string; }
  public setWeatherAppSecret(value: string): void { this._setValue('weatherAppSecret', value); }

  public getWeatherColor(): number[] { return this._values.get('weatherColor') as number[]; }
  public setWeatherColor(value: number[]): void { this._setValue('weatherColor', value); }

  public getWeatherBlurcolorShow(): boolean { return this._values.get('weatherBlurcolorShow') as boolean; }
  public setWeatherBlurcolorShow(value: boolean): void { this._setValue('weatherBlurcolorShow', value); }

  public getWeatherBlurcolor(): number[] { return this._values.get('weatherBlurcolor') as number[]; }
  public setWeatherBlurcolor(value: number[]): void { this._setValue('weatherBlurcolor', value); }

  public getWeatherYakeliShow(): boolean { return this._values.get('weatherYakeliShow') as boolean; }
  public setWeatherYakeliShow(value: boolean): void { this._setValue('weatherYakeliShow', value); }

  public getWeatherYakeli(): number { return this._values.get('weatherYakeli') as number; }
  public setWeatherYakeli(value: number): void { this._setValue('weatherYakeli', value); }

  public getWeatherYakelicColor(): number[] { return this._values.get('weatherYakelicColor') as number[]; }
  public setWeatherYakelicColor(value: number[]): void { this._setValue('weatherYakelicColor', value); }

  public getWeatherBluryakeli(): number { return this._values.get('weatherBluryakeli') as number; }
  public setWeatherBluryakeli(value: number): void { this._setValue('weatherBluryakeli', value); }

  // ==================== 一言配置方法 ====================

  public getHitokotoUpdate(): number { return this._values.get('hitokotoUpdate') as number; }
  public setHitokotoUpdate(value: number): void { this._setValue('hitokotoUpdate', value); }

  public getHitokotoInit(): boolean { return this._values.get('hitokotoInit') as boolean; }
  public setHitokotoInit(value: boolean): void { this._setValue('hitokotoInit', value); }

  public getHitoktoFormatTest(): number { return this._values.get('hitoktoFormatTest') as number; }
  public setHitoktoFormatTest(value: number): void { this._setValue('hitoktoFormatTest', value); }

  public getHitA(): string { return this._values.get('hitA') as string; }
  public setHitA(value: string): void { this._setValue('hitA', value); }

  public getHitB(): string { return this._values.get('hitB') as string; }
  public setHitB(value: string): void { this._setValue('hitB', value); }

  public getHitC(): string { return this._values.get('hitC') as string; }
  public setHitC(value: string): void { this._setValue('hitC', value); }

  public getHitD(): string { return this._values.get('hitD') as string; }
  public setHitD(value: string): void { this._setValue('hitD', value); }

  public getHitE(): string { return this._values.get('hitE') as string; }
  public setHitE(value: string): void { this._setValue('hitE', value); }

  public getHitF(): string { return this._values.get('hitF') as string; }
  public setHitF(value: string): void { this._setValue('hitF', value); }

  public getHitG(): string { return this._values.get('hitG') as string; }
  public setHitG(value: string): void { this._setValue('hitG', value); }

  public getHitH(): string { return this._values.get('hitH') as string; }
  public setHitH(value: string): void { this._setValue('hitH', value); }

  public getHitI(): string { return this._values.get('hitI') as string; }
  public setHitI(value: string): void { this._setValue('hitI', value); }

  public getHitJ(): string { return this._values.get('hitJ') as string; }
  public setHitJ(value: string): void { this._setValue('hitJ', value); }

  public getHitK(): string { return this._values.get('hitK') as string; }
  public setHitK(value: string): void { this._setValue('hitK', value); }

  public getHitL(): string { return this._values.get('hitL') as string; }
  public setHitL(value: string): void { this._setValue('hitL', value); }

  public getHitokotoColor(): number[] { return this._values.get('hitokotoColor') as number[]; }
  public setHitokotoColor(value: number[]): void { this._setValue('hitokotoColor', value); }

  public getHitokotoBlurcolorShow(): boolean { return this._values.get('hitokotoBlurcolorShow') as boolean; }
  public setHitokotoBlurcolorShow(value: boolean): void { this._setValue('hitokotoBlurcolorShow', value); }

  public getHitokotoBlurcolor(): number[] { return this._values.get('hitokotoBlurcolor') as number[]; }
  public setHitokotoBlurcolor(value: number[]): void { this._setValue('hitokotoBlurcolor', value); }

  public getHitokotoYakeliShow(): boolean { return this._values.get('hitokotoYakeliShow') as boolean; }
  public setHitokotoYakeliShow(value: boolean): void { this._setValue('hitokotoYakeliShow', value); }

  public getHitokotoYakeli(): number { return this._values.get('hitokotoYakeli') as number; }
  public setHitokotoYakeli(value: number): void { this._setValue('hitokotoYakeli', value); }

  public getHitokotoYakelicColor(): number[] { return this._values.get('hitokotoYakelicColor') as number[]; }
  public setHitokotoYakelicColor(value: number[]): void { this._setValue('hitokotoYakelicColor', value); }

  public getHitokotoBluryakeli(): number { return this._values.get('hitokotoBluryakeli') as number; }
  public setHitokotoBluryakeli(value: number): void { this._setValue('hitokotoBluryakeli', value); }

  public getHitokotoSizeXShow(): boolean { return this._values.get('hitokotoSizeXShow') as boolean; }
  public setHitokotoSizeXShow(value: boolean): void { this._setValue('hitokotoSizeXShow', value); }

  public getPlayerControlAutohide(): boolean { return this._values.get('playerControlAutohide') as boolean; }
  public setPlayerControlAutohide(value: boolean): void { this._setValue('playerControlAutohide', value); }

  // ==================== 播放器控制配置方法 ====================

  public getPlayerControlShow(): boolean { return this._values.get('playerControlShow') as boolean; }
  public setPlayerControlShow(value: boolean): void { this._setValue('playerControlShow', value); }

  public getPlayerControlScalefactor(): number { return this._values.get('playerControlScalefactor') as number; }
  public setPlayerControlScalefactor(value: number): void { this._setValue('playerControlScalefactor', value); }

  public getPlayerControlColor(): number[] { return this._values.get('playerControlColor') as number[]; }
  public setPlayerControlColor(value: number[]): void { this._setValue('playerControlColor', value); }

  public getPlayerControlBlurcolorShow(): boolean { return this._values.get('playerControlBlurcolorShow') as boolean; }
  public setPlayerControlBlurcolorShow(value: boolean): void { this._setValue('playerControlBlurcolorShow', value); }

  public getPlayerControlBlurcolor(): number[] { return this._values.get('playerControlBlurcolor') as number[]; }
  public setPlayerControlBlurcolor(value: number[]): void { this._setValue('playerControlBlurcolor', value); }

  public getPlayerControlYakeliShow(): boolean { return this._values.get('playerControlYakeliShow') as boolean; }
  public setPlayerControlYakeliShow(value: boolean): void { this._setValue('playerControlYakeliShow', value); }

  public getPlayerControlYakelicColor(): number[] { return this._values.get('playerControlYakelicColor') as number[]; }
  public setPlayerControlYakelicColor(value: number[]): void { this._setValue('playerControlYakelicColor', value); }

  public getPlayerControlYakeli(): number { return this._values.get('playerControlYakeli') as number; }
  public setPlayerControlYakeli(value: number): void { this._setValue('playerControlYakeli', value); }

  public getPlayerControlBluryakeli(): number { return this._values.get('playerControlBluryakeli') as number; }
  public setPlayerControlBluryakeli(value: number): void { this._setValue('playerControlBluryakeli', value); }

  public getPlayerControlThumbnailSize(): number { return this._values.get('playerControlThumbnailSize') as number; }
  public setPlayerControlThumbnailSize(value: number): void { this._setValue('playerControlThumbnailSize', value); }

  public getPlayerControlSizeValue(): number { return this._values.get('playerControlSizeValue') as number; }
  public setPlayerControlSizeValue(value: number): void { this._setValue('playerControlSizeValue', value); }

  public getPlayerControlThumbnailSizeValue(): number { return this._values.get('playerControlThumbnailSizeValue') as number; }
  public setPlayerControlThumbnailSizeValue(value: number): void { this._setValue('playerControlThumbnailSizeValue', value); }

  public getPlayerControlThumbnailRotation(): boolean { return this._values.get('playerControlThumbnailRotation') as boolean; }
  public setPlayerControlThumbnailRotation(value: boolean): void { this._setValue('playerControlThumbnailRotation', value); }

  public getPlayerControlThumbnailRotationSpeed(): number { return this._values.get('playerControlThumbnailRotationSpeed') as number; }
  public setPlayerControlThumbnailRotationSpeed(value: number): void { this._setValue('playerControlThumbnailRotationSpeed', value); }

  public getPlayerControlTimetransparency(): number { return this._values.get('playerControlTimetransparency') as number; }
  public setPlayerControlTimetransparency(value: number): void { this._setValue('playerControlTimetransparency', value); }

  public getPlayerControlShowwidth(): number { return this._values.get('playerControlShowwidth') as number; }
  public setPlayerControlShowwidth(value: number): void { this._setValue('playerControlShowwidth', value); }

  public getPlayerControlYakelibgusetb(): number { return this._values.get('playerControlYakelibgusetb') as number; }
  public setPlayerControlYakelibgusetb(value: number): void { this._setValue('playerControlYakelibgusetb', value); }

  public getPlayerControlFontusetb(): number { return this._values.get('playerControlFontusetb') as number; }
  public setPlayerControlFontusetb(value: number): void { this._setValue('playerControlFontusetb', value); }

  public getPlayerControlThumbnailrorl(): boolean { return this._values.get('playerControlThumbnailrorl') as boolean; }
  public setPlayerControlThumbnailrorl(value: boolean): void { this._setValue('playerControlThumbnailrorl', value); }

  public getPlayerControlSamealbumTitle(): boolean { return this._values.get('playerControlSamealbumTitle') as boolean; }
  public setPlayerControlSamealbumTitle(value: boolean): void { this._setValue('playerControlSamealbumTitle', value); }

  public getPlayerControlVisualaudiobar(): number { return this._values.get('playerControlVisualaudiobar') as number; }
  public setPlayerControlVisualaudiobar(value: number): void { this._setValue('playerControlVisualaudiobar', value); }

  public getPlayerControlBarline(): number { return this._values.get('playerControlBarline') as number; }
  public setPlayerControlBarline(value: number): void { this._setValue('playerControlBarline', value); }

  public getColorPickupMethod(): number { return this._values.get('colorPickupMethod') as number; }
  public setColorPickupMethod(value: number): void { this._setValue('colorPickupMethod', value); }

  public getPlayerControlHdong(): number { return this._values.get('playerControlHdong') as number; }
  public setPlayerControlHdong(value: number): void { this._setValue('playerControlHdong', value); }

  public getPlayerControlX(): number { return this._values.get('playerControlX') as number; }
  public setPlayerControlX(value: number): void { this._setValue('playerControlX', value); }

  public getPlayerControlY(): number { return this._values.get('playerControlY') as number; }
  public setPlayerControlY(value: number): void { this._setValue('playerControlY', value); }

  // ==================== 日期格式测试配置方法 ====================

  public getDateFormatTest(): number { return this._values.get('dateFormatTest') as number; }
  public setDateFormatTest(value: number): void { this._setValue('dateFormatTest', value); }

  // ==================== 时间显示配置方法 ====================

  public getTShowSencends(): boolean { return this._values.get('tShowSencends') as boolean; }
  public setTShowSencends(value: boolean): void { this._setValue('tShowSencends', value); }

  public getTimeColorRhythm(): boolean { return this._values.get('timeColorRhythm') as boolean; }
  public setTimeColorRhythm(value: boolean): void { this._setValue('timeColorRhythm', value); }

  public getTimeColor(): string { return this._values.get('timeColor') as string; }
  public setTimeColor(value: string): void { this._setValue('timeColor', value); }

  public getTimeBlurColor(): string { return this._values.get('timeBlurColor') as string; }
  public setTimeBlurColor(value: string): void { this._setValue('timeBlurColor', value); }

  // ==================== 日期透明度配置方法 ====================

  public getDateTransparency(): number { return this._values.get('dateTransparency') as number; }
  public setDateTransparency(value: number): void { this._setValue('dateTransparency', value); }

  // ==================== 日期位置配置方法 ====================

  public getDateX(): number { return this._values.get('dateX') as number; }
  public setDateX(value: number): void { this._setValue('dateX', value); }

  public getDateY(): number { return this._values.get('dateY') as number; }
  public setDateY(value: number): void { this._setValue('dateY', value); }

  // ==================== 日期颜色配置方法 ====================

  public getODateColor(): number[] { return this._values.get('oDateColor') as number[]; }
  public setODateColor(value: number[]): void { this._setValue('oDateColor', value); }

  public getODateBlurcolorShow(): boolean { return this._values.get('oDateBlurcolorShow') as boolean; }
  public setODateBlurcolorShow(value: boolean): void { this._setValue('oDateBlurcolorShow', value); }

  public getODateBlurcolor(): number[] { return this._values.get('oDateBlurcolor') as number[]; }
  public setODateBlurcolor(value: number[]): void { this._setValue('oDateBlurcolor', value); }

  public getODateYakeliShow(): boolean { return this._values.get('oDateYakeliShow') as boolean; }
  public setODateYakeliShow(value: boolean): void { this._setValue('oDateYakeliShow', value); }

  public getODateYakelicColor(): number[] { return this._values.get('oDateYakelicColor') as number[]; }
  public setODateYakelicColor(value: number[]): void { this._setValue('oDateYakelicColor', value); }

  public getODateYakeli(): number { return this._values.get('oDateYakeli') as number; }
  public setODateYakeli(value: number): void { this._setValue('oDateYakeli', value); }

  public getODateBluryakeli(): number { return this._values.get('oDateBluryakeli') as number; }
  public setODateBluryakeli(value: number): void { this._setValue('oDateBluryakeli', value); }

  // ==================== 时钟颜色配置方法 ====================

  public getOClockColor(): number[] { return this._values.get('oClockColor') as number[]; }
  public setOClockColor(value: number[]): void { this._setValue('oClockColor', value); }

  public getOClockBlurcolorShow(): boolean { return this._values.get('oClockBlurcolorShow') as boolean; }
  public setOClockBlurcolorShow(value: boolean): void { this._setValue('oClockBlurcolorShow', value); }

  public getOClockBlurcolor(): number[] { return this._values.get('oClockBlurcolor') as number[]; }
  public setOClockBlurcolor(value: number[]): void { this._setValue('oClockBlurcolor', value); }

  public getOClockYakeliShow(): boolean { return this._values.get('oClockYakeliShow') as boolean; }
  public setOClockYakeliShow(value: boolean): void { this._setValue('oClockYakeliShow', value); }

  public getOClockYakelicColor(): number[] { return this._values.get('oClockYakelicColor') as number[]; }
  public setOClockYakelicColor(value: number[]): void { this._setValue('oClockYakelicColor', value); }

  public getOClockYakeli(): number { return this._values.get('oClockYakeli') as number; }
  public setOClockYakeli(value: number): void { this._setValue('oClockYakeli', value); }

  public getOClockBluryakeli(): number { return this._values.get('oClockBluryakeli') as number; }
  public setOClockBluryakeli(value: number): void { this._setValue('oClockBluryakeli', value); }

  // ==================== RGB灯光效果配置方法 ====================

  public getBackgroundRGB(): boolean { return this._values.get('backgroundRGB') as boolean; }
  public setBackgroundRGB(value: boolean): void { this._setValue('backgroundRGB', value); }

  public getSakuraRGB(): boolean { return this._values.get('sakuraRGB') as boolean; }
  public setSakuraRGB(value: boolean): void { this._setValue('sakuraRGB', value); }

  public getParticlesRGB(): boolean { return this._values.get('particlesRGB') as boolean; }
  public setParticlesRGB(value: boolean): void { this._setValue('particlesRGB', value); }

  public getAudiobarRGB(): boolean { return this._values.get('audiobarRGB') as boolean; }
  public setAudiobarRGB(value: boolean): void { this._setValue('audiobarRGB', value); }

  public getRGBRefresh(): number | string { return this._values.get('RGBRefresh') as number | string; }
  public setRGBRefresh(value: number | string): void { this._setValue('RGBRefresh', value); }

  public getRGBShow(): boolean { return this._values.get('RGBShow') as boolean; }
  public setRGBShow(value: boolean): void { this._setValue('RGBShow', value); }

  public getNextphoto(): boolean { return this._values.get('nextphoto') as boolean; }
  public setNextphoto(value: boolean): void { this._setValue('nextphoto', value); }

  public getOpacitySaRGB(): number { return this._values.get('opacitySaRGB') as number; }
  public setOpacitySaRGB(value: number): void { this._setValue('opacitySaRGB', value); }

  public getAurgbcolor(): string { return this._values.get('aurgbcolor') as string; }
  public setAurgbcolor(value: string): void { this._setValue('aurgbcolor', value); }

  public getAurgbhigh(): number { return this._values.get('aurgbhigh') as number; }
  public setAurgbhigh(value: number): void { this._setValue('aurgbhigh', value); }

  public getAudiobarrainbowcolor(): boolean { return this._values.get('audiobarrainbowcolor') as boolean; }
  public setAudiobarrainbowcolor(value: boolean): void { this._setValue('audiobarrainbowcolor', value); }

  public getRainbowmove(): boolean { return this._values.get('rainbowmove') as boolean; }
  public setRainbowmove(value: boolean): void { this._setValue('rainbowmove', value); }

  public getRainbowmovespeed(): number { return this._values.get('rainbowmovespeed') as number; }
  public setRainbowmovespeed(value: number): void { this._setValue('rainbowmovespeed', value); }

  // ==================== 倒计时配置方法 ====================

  public getCountdownYear(): number { return this._values.get('countdownYear') as number; }
  public setCountdownYear(value: number): void { this._setValue('countdownYear', value); }

  public getCountdownMonth(): number { return this._values.get('countdownMonth') as number; }
  public setCountdownMonth(value: number): void { this._setValue('countdownMonth', value); }

  public getCountdownDay(): number { return this._values.get('countdownDay') as number; }
  public setCountdownDay(value: number): void { this._setValue('countdownDay', value); }

  public getCountdownColor(): number[] { return this._values.get('countdownColor') as number[]; }
  public setCountdownColor(value: number[]): void { this._setValue('countdownColor', value); }

  public getCountdownBlurcolorShow(): boolean { return this._values.get('countdownBlurcolorShow') as boolean; }
  public setCountdownBlurcolorShow(value: boolean): void { this._setValue('countdownBlurcolorShow', value); }

  public getCountdownBlurcolor(): number[] { return this._values.get('countdownBlurcolor') as number[]; }
  public setCountdownBlurcolor(value: number[]): void { this._setValue('countdownBlurcolor', value); }

  public getCountdownYakeliShow(): boolean { return this._values.get('countdownYakeliShow') as boolean; }
  public setCountdownYakeliShow(value: boolean): void { this._setValue('countdownYakeliShow', value); }

  public getCountdownYakeli(): number { return this._values.get('countdownYakeli') as number; }
  public setCountdownYakeli(value: number): void { this._setValue('countdownYakeli', value); }

  public getCountdownYakelicColor(): number[] { return this._values.get('countdownYakelicColor') as number[]; }
  public setCountdownYakelicColor(value: number[]): void { this._setValue('countdownYakelicColor', value); }

  public getCountdownBluryakeli(): number { return this._values.get('countdownBluryakeli') as number; }
  public setCountdownBluryakeli(value: number): void { this._setValue('countdownBluryakeli', value); }

  public getCountdownTxt(): string { return this._values.get('countdownTxt') as string; }
  public setCountdownTxt(value: string): void { this._setValue('countdownTxt', value); }

  public getCountdownTxt1(): string { return this._values.get('countdownTxt1') as string; }
  public setCountdownTxt1(value: string): void { this._setValue('countdownTxt1', value); }

  public getFirstLoadCountdown(): boolean { return this._values.get('firstLoadCountdown') as boolean; }
  public setFirstLoadCountdown(value: boolean): void { this._setValue('firstLoadCountdown', value); }

  // ==================== 运行时状态方法 ====================

  public getFiles(): Record<string, string[]> { return this.runtime.files; }
  public setFiles(files: Record<string, string[]>): void { this.runtime.files = files; }

  public getMyList(): string[] { return this.runtime.myList; }
  public setMyList(list: string[]): void { this.runtime.myList = list; }

  // ==================== 流体效果配置 ====================

  public getFluidEffectEnabled(): boolean { return this._values.get('fluidEffectEnabled') as boolean; }
  public setFluidEffectEnabled(value: boolean): void { this._setValue('fluidEffectEnabled', value); }

  public getFluidEffectEnabledFullscreen(): boolean { return this._values.get('fluidEffectEnabledFullscreen') as boolean; }
  public setFluidEffectEnabledFullscreen(value: boolean): void { this._setValue('fluidEffectEnabledFullscreen', value); }

  public getFluidEffectResolution(): number { return this._values.get('fluidEffectResolution') as number; }
  public setFluidEffectResolution(value: number): void { this._setValue('fluidEffectResolution', value); }

  public getFluidEffectBlurAmount(): number { return this._values.get('fluidEffectBlurAmount') as number; }
  public setFluidEffectBlurAmount(value: number): void { this._setValue('fluidEffectBlurAmount', value); }

  public getFluidEffectDisplacementScale(): number { return this._values.get('fluidEffectDisplacementScale') as number; }
  public setFluidEffectDisplacementScale(value: number): void { this._setValue('fluidEffectDisplacementScale', value); }

  public getFluidEffectTurbulenceOctaves(): number { return this._values.get('fluidEffectTurbulenceOctaves') as number; }
  public setFluidEffectTurbulenceOctaves(value: number): void { this._setValue('fluidEffectTurbulenceOctaves', value); }

  public getFluidEffectCanvasDisplacement(): number { return this._values.get('fluidEffectCanvasDisplacement') as number; }
  public setFluidEffectCanvasDisplacement(value: number): void { this._setValue('fluidEffectCanvasDisplacement', value); }

  public getFluidEffectDarkOverlayStrength(): number { return this._values.get('fluidEffectDarkOverlayStrength') as number; }
  public setFluidEffectDarkOverlayStrength(value: number): void { this._setValue('fluidEffectDarkOverlayStrength', value); }

  public getFluidEffectBackdropFilterStrength(): number { return this._values.get('fluidEffectBackdropFilterStrength') as number; }
  public setFluidEffectBackdropFilterStrength(value: number): void { this._setValue('fluidEffectBackdropFilterStrength', value); }

  // ==================== 内部方法 ====================

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

  // ==================== 通用配置方法 ====================

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

// ==================== 导出 ====================

// 直接导出 AppConfig 单例
const appConfig = AppConfig.getInstance();

// 导出配置代理，支持 config.xxx 访问
export const config = new Proxy({} as AppConfig, {
  get(_, prop: string) {
    // 方法调用转发到 appConfig
    if (typeof (appConfig as any)[prop] === 'function') {
      return (appConfig as any)[prop].bind(appConfig);
    }
    // 配置属性直接返回
    if (appConfig.has(prop)) {
      return appConfig.get(prop);
    }
    return undefined;
  },
  set(_, prop: string, value) {
    if (appConfig.has(prop)) {
      appConfig.set(prop, value);
      return true;
    }
    return false;
  }
});

// 保持向后兼容
export { appConfig };
export { AppConfig, DEFAULTS };
