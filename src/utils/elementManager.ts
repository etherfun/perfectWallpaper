// DOM 元素集合
const elements = {
    // 主体
    body: document.querySelector('body') as HTMLElement,

    // 樱花
    sakura: document.getElementById("sakura") as HTMLCanvasElement,
    sakurashow: document.getElementById("sakurashow") as HTMLCanvasElement,

    // 视频与音频
    myvideo: document.getElementById("myvideo") as HTMLVideoElement,
    myAudio: document.getElementById("myAudio") as HTMLAudioElement,

    // 时间
    clock: {
        container: document.querySelector("#clock") as HTMLElement,
        block: document.querySelector("#clock .clock-block") as HTMLElement,
        min: document.querySelector("#clock .clock-block .min") as HTMLElement,
        indicators: document.querySelector("#clock .clock-block .time-indicators") as HTMLElement,
        sec: document.querySelector("#clock .clock-block .time-indicators .sec") as HTMLElement,
        st: document.querySelector("#clock .clock-block .time-indicators .st") as HTMLElement,
    },

    // 日期
    date: {
        container: document.querySelector("#oDate"),
        webtext: document.querySelector("#oDate .text"),
    },

    // 一言
    hitokoto: {
        container: document.querySelector("#hitokoto") as HTMLElement,
        webtext: document.querySelector("#hitokoto .text") as HTMLElement,
    },

    // 倒计时
    countdown: {
        container: document.querySelector("#countdown") as HTMLElement,
        webtext: document.querySelector("#countdown .text") as HTMLElement,
    },

    // 幻灯片
    slide: {
        RGBuse: document.querySelector("#RGBuse") as HTMLElement,
        picture_info: document.querySelector("#picture_info") as HTMLElement,
        info: document.querySelector("#picture_info .info") as HTMLElement,
        title: document.querySelector("#picture_info .title") as HTMLElement,
        author: document.querySelector("#picture_info .author") as HTMLElement,
        location: document.querySelector("#picture_info .location") as HTMLElement,
        description: document.querySelector("#picture_info .description") as HTMLElement,
    },

    // 背景层
    background: {
        container: document.querySelector("#background-container") as HTMLElement,
        layer1: document.querySelector("#background-layer1") as HTMLElement,
        layer2: document.querySelector("#background-layer2") as HTMLElement,
        blurLayer1: document.querySelector("#background-blur-layer1") as HTMLElement,
        blurLayer2: document.querySelector("#background-blur-layer2") as HTMLElement,
    },

    // 天气
    weather: {
        weather: document.querySelector("#weather") as HTMLElement,
        container: document.querySelector("#weather .weather-container") as HTMLElement,
        leftContainer: document.querySelector('.weather-left') as HTMLElement | null,
        rightContainer: document.querySelector('.weather-right') as HTMLElement | null,
        // 左侧元素
        icon: document.getElementById('weatherIcon') as HTMLElement,
        temp: document.getElementById('weatherTemp') as HTMLElement,
        text: document.getElementById('weatherText') as HTMLElement,
        feels: document.getElementById('weatherFeels') as HTMLElement,
        city: document.getElementById('weatherCity') as HTMLElement,
        // 右侧主行
        tempRange: document.getElementById('weatherTempRange') as HTMLElement,
        humidity: document.getElementById('weatherHumidity') as HTMLElement,
        windDirection: document.getElementById('weatherWindDirection') as HTMLElement,
        windLevel: document.getElementById('weatherWindLevel') as HTMLElement,
        windSpeed: document.getElementById('weatherWindSpeed') as HTMLElement,
        visibility: document.getElementById('weatherVisibility') as HTMLElement,
        // 详情行
        detailRow: document.getElementById('weatherDetailRow') as HTMLElement,
        uvIndex: document.getElementById('weatherUvIndex') as HTMLElement,
        cloud: document.getElementById('weatherCloud') as HTMLElement,
        sunrise: document.getElementById('weatherSunrise') as HTMLElement,
        sunset: document.getElementById('weatherSunset') as HTMLElement,
        moonphase: document.getElementById('weatherMoonphase') as HTMLElement,
        // 空气质量行
        airRow: document.getElementById('weatherAirRow') as HTMLElement,
        airQuality: document.getElementById('weatherAirQuality') as HTMLElement,
        airValue: document.getElementById('weatherAirValue') as HTMLElement,
        alertContainer: document.getElementById('weatherAlertContainer') as HTMLElement,
        // 降水容器
        precipContainer: document.getElementById('weatherPrecipContainer') as HTMLElement,
        precipLabel: document.getElementById('weatherPrecipLabel') as HTMLElement,
        precipTimes: document.getElementById('weatherPrecipTimes') as HTMLElement,
        precipValues: document.getElementById('weatherPrecipValues') as HTMLElement,
        // 提示
        tip: document.getElementById('weatherTip') as HTMLElement,
    },

    // 音乐播放器
    player: {
        control: document.getElementById('player_control'),
        title: document.getElementById('player_title'),
        artist: document.getElementById('player_artist'),
        album: document.getElementById('player_album'),
        progress: document.getElementById('player_progress'),
        progressBar: document.getElementById('player_progress_bar'),
        currentTime: document.getElementById('player_current_time'),
        totalTime: document.getElementById('player_total_time'),
        playButton: document.getElementById('player_play_button'),
        pauseButton: document.getElementById('player_pause_button'),
        nextButton: document.getElementById('player_next_button'),
        prevButton: document.getElementById('player_prev_button'),
        thumbnail: document.getElementById('player_thumbnail'),
    },

    // 播放器控制 (player_control 内部元素)
    playerControl: {
        container: document.querySelector("#player_control") as HTMLElement,
        background: document.querySelector("#player_control .background") as HTMLElement,
        thumbnail: document.querySelector("#player_control .thumbnail") as HTMLImageElement,
        thumbnailWrap: document.querySelector("#player_control .thumbnail-wrap") as HTMLElement,
        info: document.querySelector("#player_control .info") as HTMLElement,
        title: document.querySelector("#player_control .title") as HTMLElement,
        artist: document.querySelector("#player_control .artist") as HTMLElement,
        albumTitle: document.querySelector("#player_control .albumTitle") as HTMLElement,
        timeline: document.querySelector("#player_control .progress-bar") as HTMLElement,
        aubar: document.querySelector("#player_control .aubar") as HTMLCanvasElement,
    },

    // 版本弹窗
    version: {
        modal: document.getElementById('version-modal'),
        linkNotificationContainer: document.getElementById('link-notification-container'),
        closeBtn: document.getElementById('modal-close'),
        understandBtn: document.getElementById('understand-btn'),
        dontShowBtn: document.getElementById('dont-show-btn'),
    },

    // 调试面板
    debug: {
        modal: document.getElementById('debug-log-modal'),
        textarea: document.getElementById('debug-log-textarea') as HTMLTextAreaElement,
    },

    // 页面标题
    pageTitle: document.getElementById('page-title'),
};

// 元素路径映射表
type ElementPath =
    | 'body'
    | 'sakura' | 'sakurashow'
    | 'myvideo' | 'myAudio'
    | 'clock.container' | 'clock.block' | 'clock.min' | 'clock.indicators' | 'clock.sec' | 'clock.st'
    | 'date.container' | 'date.webtext'
    | 'hitokoto.container' | 'hitokoto.webtext'
    | 'countdown.container' | 'countdown.webtext'
    | 'slide.RGBuse' | 'slide.picture_info' | 'slide.info' | 'slide.title' | 'slide.author' | 'slide.location' | 'slide.description'
    | 'background.container' | 'background.layer1' | 'background.layer2' | 'background.blurLayer1' | 'background.blurLayer2'
    | 'weather.container' | 'weather.leftContainer' | 'weather.rightContainer'
    | 'weather.icon' | 'weather.temp' | 'weather.text' | 'weather.feels' | 'weather.city'
    | 'weather.tempRange' | 'weather.humidity' | 'weather.windDirection' | 'weather.windLevel'
    | 'weather.windSpeed' | 'weather.visibility' | 'weather.detailRow'
    | 'weather.uvIndex' | 'weather.cloud' | 'weather.sunrise' | 'weather.sunset' | 'weather.moonphase'
    | 'weather.airRow' | 'weather.airQuality' | 'weather.airValue' | 'weather.alertContainer'
    | 'weather.precipContainer' | 'weather.precipLabel' | 'weather.precipTimes' | 'weather.precipValues'
    | 'weather.tip'
    | 'player.control' | 'player.title' | 'player.artist' | 'player.album' | 'player.progress' | 'player.progressBar'
    | 'player.currentTime' | 'player.totalTime' | 'player.playButton' | 'player.pauseButton'
    | 'player.nextButton' | 'player.prevButton' | 'player.thumbnail'
    | 'playerControl.container' | 'playerControl.background' | 'playerControl.thumbnail' | 'playerControl.thumbnailWrap'
    | 'playerControl.info' | 'playerControl.title' | 'playerControl.artist' | 'playerControl.albumTitle'
    | 'playerControl.timeline' | 'playerControl.aubar'
    | 'version.modal' | 'version.linkNotificationContainer' | 'version.closeBtn' | 'version.understandBtn' | 'version.dontShowBtn'
    | 'debug.modal' | 'debug.textarea'
    | 'pageTitle';

/**
 * 通过路径字符串获取元素
 * @param path 元素路径，如 'clock.container', 'slide.title'
 */
function getElement(path: ElementPath): HTMLElement | null {
    const pathParts = path.split('.');
    let current: any = elements;
    
    for (const part of pathParts) {
        if (current === null || current === undefined) {
            return null;
        }
        current = current[part];
    }
    
    return current as HTMLElement | null;
}

/**
 * 通过路径获取元素，非空断言
 */
function getElementAs(path: ElementPath): HTMLElement {
    const el = getElement(path);
    if (el === null) {
        throw new Error(`Element not found: ${path}`);
    }
    return el;
}

/**
 * 检查元素是否存在
 */
function hasElement(path: ElementPath): boolean {
    return getElement(path) !== null;
}

/**
 * 重置所有元素（重新查询 DOM）
 */
function resetElements(): void {
    elements.body = document.querySelector('body') as HTMLElement;
    elements.sakura = document.getElementById("sakura") as HTMLCanvasElement;
    elements.sakurashow = document.getElementById("sakurashow") as HTMLCanvasElement;
    elements.myvideo = document.getElementById("myvideo") as HTMLVideoElement;
    elements.myAudio = document.getElementById("myAudio") as HTMLAudioElement;
    
    elements.clock.container = document.querySelector("#clock") as HTMLElement;
    elements.clock.block = document.querySelector("#clock .clock-block") as HTMLElement;
    elements.clock.min = document.querySelector("#clock .clock-block .min") as HTMLElement;
    elements.clock.indicators = document.querySelector("#clock .clock-block .time-indicators") as HTMLElement;
    elements.clock.sec = document.querySelector("#clock .clock-block .time-indicators .sec") as HTMLElement;
    elements.clock.st = document.querySelector("#clock .clock-block .time-indicators .st") as HTMLElement;
    
    elements.date.container = document.querySelector("#oDate");
    elements.date.webtext = document.querySelector("#oDate .text");
    
    elements.hitokoto.container = document.querySelector("#hitokoto") as HTMLElement;
    elements.hitokoto.webtext = document.querySelector("#hitokoto .text") as HTMLElement;
    
    elements.countdown.container = document.querySelector("#countdown") as HTMLElement;
    elements.countdown.webtext = document.querySelector("#countdown .text") as HTMLElement;
    
    elements.slide.RGBuse = document.querySelector("#RGBuse") as HTMLElement;
    elements.slide.picture_info = document.querySelector("#picture_info") as HTMLElement;
    elements.slide.info = document.querySelector("#picture_info .info") as HTMLElement;
    elements.slide.title = document.querySelector("#picture_info .title") as HTMLElement;
    elements.slide.author = document.querySelector("#picture_info .author") as HTMLElement;
    elements.slide.location = document.querySelector("#picture_info .location") as HTMLElement;
    elements.slide.description = document.querySelector("#picture_info .description") as HTMLElement;
    
    elements.background.container = document.querySelector("#background-container") as HTMLElement;
    elements.background.layer1 = document.querySelector("#background-layer1") as HTMLElement;
    elements.background.layer2 = document.querySelector("#background-layer2") as HTMLElement;
    elements.background.blurLayer1 = document.querySelector("#background-blur-layer1") as HTMLElement;
    elements.background.blurLayer2 = document.querySelector("#background-blur-layer2") as HTMLElement;
    
    elements.weather.weather = document.querySelector("#weather") as HTMLElement;
    elements.weather.container = document.querySelector("#weather .weather-container") as HTMLElement;
    elements.weather.leftContainer = document.querySelector('.weather-left') as HTMLElement | null;
    elements.weather.rightContainer = document.querySelector('.weather-right') as HTMLElement | null;
    elements.weather.icon = document.getElementById('weatherIcon') as HTMLElement;
    elements.weather.temp = document.getElementById('weatherTemp') as HTMLElement;
    elements.weather.text = document.getElementById('weatherText') as HTMLElement;
    elements.weather.feels = document.getElementById('weatherFeels') as HTMLElement;
    elements.weather.city = document.getElementById('weatherCity') as HTMLElement;
    elements.weather.tempRange = document.getElementById('weatherTempRange') as HTMLElement;
    elements.weather.humidity = document.getElementById('weatherHumidity') as HTMLElement;
    elements.weather.windDirection = document.getElementById('weatherWindDirection') as HTMLElement;
    elements.weather.windLevel = document.getElementById('weatherWindLevel') as HTMLElement;
    elements.weather.windSpeed = document.getElementById('weatherWindSpeed') as HTMLElement;
    elements.weather.visibility = document.getElementById('weatherVisibility') as HTMLElement;
    elements.weather.detailRow = document.getElementById('weatherDetailRow') as HTMLElement;
    elements.weather.uvIndex = document.getElementById('weatherUvIndex') as HTMLElement;
    elements.weather.cloud = document.getElementById('weatherCloud') as HTMLElement;
    elements.weather.sunrise = document.getElementById('weatherSunrise') as HTMLElement;
    elements.weather.sunset = document.getElementById('weatherSunset') as HTMLElement;
    elements.weather.moonphase = document.getElementById('weatherMoonphase') as HTMLElement;
    elements.weather.airRow = document.getElementById('weatherAirRow') as HTMLElement;
    elements.weather.airQuality = document.getElementById('weatherAirQuality') as HTMLElement;
    elements.weather.airValue = document.getElementById('weatherAirValue') as HTMLElement;
    elements.weather.alertContainer = document.getElementById('weatherAlertContainer') as HTMLElement;
    elements.weather.precipContainer = document.getElementById('weatherPrecipContainer') as HTMLElement;
    elements.weather.precipLabel = document.getElementById('weatherPrecipLabel') as HTMLElement;
    elements.weather.precipTimes = document.getElementById('weatherPrecipTimes') as HTMLElement;
    elements.weather.precipValues = document.getElementById('weatherPrecipValues') as HTMLElement;
    elements.weather.tip = document.getElementById('weatherTip') as HTMLElement;
    
    elements.player.control = document.getElementById('player_control');
    elements.player.title = document.getElementById('player_title');
    elements.player.artist = document.getElementById('player_artist');
    elements.player.album = document.getElementById('player_album');
    elements.player.progress = document.getElementById('player_progress');
    elements.player.progressBar = document.getElementById('player_progress_bar');
    elements.player.currentTime = document.getElementById('player_current_time');
    elements.player.totalTime = document.getElementById('player_total_time');
    elements.player.playButton = document.getElementById('player_play_button');
    elements.player.pauseButton = document.getElementById('player_pause_button');
    elements.player.nextButton = document.getElementById('player_next_button');
    elements.player.prevButton = document.getElementById('player_prev_button');
    elements.player.thumbnail = document.getElementById('player_thumbnail');

    elements.playerControl.container = document.querySelector("#player_control") as HTMLElement;
    elements.playerControl.background = document.querySelector("#player_control .background") as HTMLElement;
    elements.playerControl.thumbnail = document.querySelector("#player_control .thumbnail") as HTMLImageElement;
    elements.playerControl.thumbnailWrap = document.querySelector("#player_control .thumbnail-wrap") as HTMLElement;
    elements.playerControl.info = document.querySelector("#player_control .info") as HTMLElement;
    elements.playerControl.title = document.querySelector("#player_control .title") as HTMLElement;
    elements.playerControl.artist = document.querySelector("#player_control .artist") as HTMLElement;
    elements.playerControl.albumTitle = document.querySelector("#player_control .albumTitle") as HTMLElement;
    elements.playerControl.timeline = document.querySelector("#player_control .progress-bar") as HTMLElement;
    elements.playerControl.aubar = document.querySelector("#player_control .aubar") as HTMLCanvasElement;

    elements.version.modal = document.getElementById('version-modal');
    elements.version.linkNotificationContainer = document.getElementById('link-notification-container');
    elements.version.closeBtn = document.getElementById('modal-close');
    elements.version.understandBtn = document.getElementById('understand-btn');
    elements.version.dontShowBtn = document.getElementById('dont-show-btn');
    
    elements.debug.modal = document.getElementById('debug-log-modal');
    elements.debug.textarea = document.getElementById('debug-log-textarea') as HTMLTextAreaElement;
    
    elements.pageTitle = document.getElementById('page-title');
}

/**
 * 等待元素出现
 * @param path 元素路径
 * @param timeout 超时时间（毫秒），默认 5000
 * @param interval 轮询间隔（毫秒），默认 100
 */
function waitForElement(path: ElementPath, timeout: number = 5000, interval: number = 100): Promise<HTMLElement> {
    return new Promise((resolve, reject) => {
        const startTime = Date.now();
        
        const check = () => {
            const el = getElement(path);
            if (el !== null) {
                resolve(el);
            } else if (Date.now() - startTime >= timeout) {
                reject(new Error(`Timeout waiting for element: ${path}`));
            } else {
                setTimeout(check, interval);
            }
        };
        
        check();
    });
}

/**
 * 等待元素出现（带回调）
 * @param path 元素路径
 * @param callback 元素出现后的回调
 * @param timeout 超时时间（毫秒），默认 5000
 */
function waitForElementCallback(path: ElementPath, callback: (el: HTMLElement) => void, timeout: number = 5000): void {
    waitForElement(path, timeout)
        .then(callback)
        .catch((err) => console.warn(err.message));
}

// 导出元素管理器及工具函数
export { elements, getElement, getElementAs, hasElement, resetElements, waitForElement, waitForElementCallback };
export type { ElementPath };
