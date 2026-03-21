/**
 * Wallpaper Property Listener
 * 统一的入口点文件，处理 wallpaper engine 的所有属性监听
 */

import { WallpaperProperties } from './types';
import {
    handleDateProperties,
    DatePropertyHandlerResult,
    handleTimeProperties,
    TimePropertyHandlerResult,
    handleBackgroundProperties,
    BackgroundPropertyHandlerResult,
    handleWeatherProperties,
    WeatherPropertyHandlerResult,
    handleHitokotoProperties,
    HitokotoPropertyHandlerResult,
    handleCountdownProperties,
    CountdownPropertyHandlerResult,
    handlePlayerControlProperties,
    PlayerControlPropertyHandlerResult,
    handleRGBProperties,
    RGBPropertyHandlerResult,
    handleParticleProperties,
    ParticlePropertyHandlerResult,
    handleAudioVisualProperties,
    AudioVisualPropertyHandlerResult,
    handleSakuraProperties,
    SakuraPropertyHandlerResult,
    handleFluidEffectProperties,
    FluidEffectPropertyHandlerResult,
} from './index';
import { appConfig, config } from '../../utils/config';
import { debugLogger } from '../../utils/logger';
import { elements } from '../../utils/elementManager';
import { removesakura } from '../sakura';
import { updateFileList } from '../slide';
import { showDebugLogModal } from './debugModal';

// 导入 version 模块以确保 versionManager 已初始化
import '../../modules/version';
import { loadI18nData } from '../../utils/i18n';

/**
 * 所有 handler 结果的联合类型
 */
export interface WallpaperPropertyHandlerResults {
    date?: DatePropertyHandlerResult;
    time?: TimePropertyHandlerResult;
    background?: BackgroundPropertyHandlerResult;
    weather?: WeatherPropertyHandlerResult;
    hitokoto?: HitokotoPropertyHandlerResult;
    countdown?: CountdownPropertyHandlerResult;
    playerControl?: PlayerControlPropertyHandlerResult;
    rgb?: RGBPropertyHandlerResult;
    particles?: ParticlePropertyHandlerResult;
    audioVisual?: AudioVisualPropertyHandlerResult;
    sakura?: SakuraPropertyHandlerResult;
    fluidEffect?: FluidEffectPropertyHandlerResult;
}

/**
 * 创建壁纸属性监听器
 * 统一调用所有 property handlers 并整合结果
 * 
 * @param properties WallpaperProperties - 壁纸属性对象
 * @param FirstLoad boolean - 是否为首次加载
 * @returns WallpaperPropertyHandlerResults - 包含所有 handler 结果的对象
 */
export function createWallpaperPropertyListener(
    properties: WallpaperProperties,
    FirstLoad: boolean
): WallpaperPropertyHandlerResults {
    const results: WallpaperPropertyHandlerResults = {};

    // ========== 版本更新和调试相关处理 ==========
    // 注意: 这些处理不在其他 handler 中,以确保最早执行

    // 全局语言设置
    if (properties.global_settings_language) {
        config.language = properties.global_settings_language.value;
        loadI18nData();
    }

    // 版本更新检查
    if (properties.wallpaper_updata && FirstLoad !== true) {
        debugLogger.info('[版本窗口] 检测到版本更新请求');
        if (appConfig.runtime.versionManager) {
            appConfig.runtime.versionManager.showVersionInfo();
        } else {
            appConfig.runtime.debugLogger.warn('[版本窗口] versionManager 未初始化');
        }
    }

    // 版本更新弹窗显示设置
    if (properties.wallpaper_updata_open_on_update) {
        localStorage.setItem("perfectwall_version_show_update", String(properties.wallpaper_updata_open_on_update.value));
    }

    // 调试日志复制
    if (properties.debugger_copy && FirstLoad !== true) {
        showDebugLogModal();
    }

    // 如果是首次加载,标记更新初始化完成
    if (FirstLoad) {
        config.updateInitComplete = true;
    }

    try {
        // 处理日期相关属性
        results.date = handleDateProperties(properties, FirstLoad);
    } catch (e) {
    }

    try {
        // 处理时间相关属性
        results.time = handleTimeProperties(properties, FirstLoad);
    } catch (e) {
    }

    try {
        // 处理背景/壁纸相关属性
        results.background = handleBackgroundProperties(properties, FirstLoad);
    } catch (e) {
    }

    try {
        // 处理天气相关属性
        results.weather = handleWeatherProperties(properties, FirstLoad);
    } catch (e) {
    }

    try {
        // 处理一言相关属性
        results.hitokoto = handleHitokotoProperties(properties, FirstLoad);
    } catch (e) {
    }

    try {
        // 处理倒计时相关属性
        results.countdown = handleCountdownProperties(properties, FirstLoad);
    } catch (e) {
    }

    try {
        // 处理播放器控制相关属性
        results.playerControl = handlePlayerControlProperties(properties, FirstLoad);
    } catch (e) {
    }

    try {
        // 处理RGB灯光效果相关属性
        results.rgb = handleRGBProperties(properties, FirstLoad);
    } catch (e) {
    }

    try {
        // 处理粒子效果相关属性
        results.particles = handleParticleProperties(properties, FirstLoad);
    } catch (e) {
    }

    try {
        // 处理音频可视化相关属性
        results.audioVisual = handleAudioVisualProperties(properties, FirstLoad);
    } catch (e) {
    }

    try {
        // 处理樱花效果相关属性
        results.sakura = handleSakuraProperties(properties, FirstLoad);
    } catch (e) {
    }

    try {
        // 处理流体效果相关属性
        results.fluidEffect = handleFluidEffectProperties(properties, FirstLoad);
    } catch (e) {
    }

    // 如果是首次加载，在处理完所有属性后将其设置为 false
    if (FirstLoad) {
        config.firstLoad = false;
        config.updateInitComplete = true;
    }

    return results;
}

/**
 * 设置壁纸引擎属性监听器
 * 将监听器绑定到 window.wallpaperPropertyListener
 */
export function setupWallpaperPropertyListener(): void {
    // 确保 window 对象存在
    if (typeof window !== 'undefined') {
        const runtime = appConfig.runtime;
        window.wallpaperPropertyListener = {
            applyUserProperties: (properties: Record<string, any>) => {
                // 从 appConfig 获取 FirstLoad 状态
                const isFirstLoad = config.firstLoad;
                createWallpaperPropertyListener(properties as WallpaperProperties, isFirstLoad);
            },
            applyGeneralProperties: (_properties: Record<string, any>) => {
                // General properties are handled by wallpaper engine directly
            },
            userDirectoryFilesAddedOrChanged: (propertyName: string, changedFiles: string[]) => {
                if (!runtime.files.hasOwnProperty(propertyName)) {
                    runtime.files[propertyName] = changedFiles;
                } else {
                    runtime.files[propertyName] = runtime.files[propertyName].concat(changedFiles);
                }
                updateFileList(runtime.files[propertyName]);
            },
            userDirectoryFilesRemoved: (propertyName: string, removedFiles: string[]) => {
                for (let i = 0; i < removedFiles.length; i++) {
                    const index = runtime.files[propertyName].indexOf(removedFiles[i]);
                    const myindex = runtime.myList.indexOf(removedFiles[i]);
                    if (index >= 0) {
                        runtime.files[propertyName].splice(index, 1);
                    }
                    if (myindex >= 0) {
                        runtime.myList.splice(myindex, 1);
                    }
                }
                updateFileList(runtime.files[propertyName]);
            },
            setPaused: (isPaused: boolean) => {
                const myvideo = elements.myvideo;
                const myAudio = elements.myAudio;
                if (isPaused) {
                    config.paused = true;
                    myvideo.pause();
                    myAudio.pause();
                } else {
                    config.paused = false;
                    if (!(myvideo.paused && (myvideo.src.slice(-10) === 'twall/null' || myvideo.src.slice(-10) === 'index.html'))) {
                        myvideo.play();
                    }
                    if (!(myAudio.paused && (myAudio.src.slice(-10) === 'twall/null' || myAudio.src.slice(-10) === 'index.html'))) {
                        myAudio.play();
                    }
                    if (config.rGBShow === true) {
                        if (config.wallpaperMode !== 3) {
                            const src = document.body.style.backgroundImage.replace(/^url\("(.+?)"\)$/, '$1');
                            background2canvas(src, false);
                        } else {
                            background2canvas(null, true);
                        }
                    }
                    if (config.showSakura === true) {
                        removesakura();
                    }
                }
            }
        };
    }
}
