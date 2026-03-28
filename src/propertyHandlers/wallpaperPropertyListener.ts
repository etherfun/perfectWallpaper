import { WallpaperProperties } from './types';
import { handleDateProperties } from './datePropertyHandler';
import { handleTimeProperties } from './timePropertyHandler';
import { handleBackgroundProperties } from './backgroundPropertyHandler';
import { handleWeatherProperties } from './weatherPropertyHandler';
import { handleHitokotoProperties } from './hitokotoPropertyHandler';
import { handleCountdownProperties } from './countdownPropertyHandler';
import { handlePlayerControlProperties } from './playerControlPropertyHandler';
import { handleRGBProperties } from './rgbPropertyHandler';
import { handleParticleProperties } from './particlePropertyHandler';
import { handleAudioVisualProperties } from './audioVisualPropertyHandler';
import { handleSakuraProperties } from './sakuraPropertyHandler';
import { handleFluidEffectProperties } from './fluidEffectPropertyHandler';
import { handleLyricsProperties } from './lyricsPropertyHandler';
import { handleSystemMonitorProperties } from './systemMonitorPropertyHandler';
import { config } from '../utils/config';
import { debugLogger } from '../utils/logger';
import { elements } from '../utils/elementManager';
import { removesakura } from '../sakura';
import { updateFileList } from '../slide';
import { showDebugLogModal } from '../debugModal';
import '../version';
import { loadI18nData } from '../utils/i18n';
import { background2canvas } from '../RGB';
import { audioDataListener } from '../audioVisualizer';

/**
 * 安全执行属性处理函数,捕获并记录错误
 */
function safeHandle<T extends (...args: any[]) => void>(handler: T, properties: WallpaperProperties, firstLoad: boolean, name: string): void {
    try {
        handler(properties, firstLoad);
    } catch (e) {
        debugLogger.error(`[PropertyHandler] ${name} failed`, e);
    }
}

/**
 * 创建壁纸属性监听器
 * 统一调用所有 property handlers 并整合结果
 *
 * @param properties WallpaperProperties - 壁纸属性对象
 * @param FirstLoad boolean - 是否为首次加载
 */
export function createWallpaperPropertyListener(
    properties: WallpaperProperties,
    FirstLoad: boolean
): void {

    // 全局语言设置
    if (properties.global_settings_language) {
        config.language = properties.global_settings_language.value;
        loadI18nData();
    }

    // 版本更新检查
    if (properties.wallpaper_updata && FirstLoad !== true) {
        debugLogger.info('[版本窗口] 检测到版本更新请求');
        if (config.runtime.versionManager) {
            config.runtime.versionManager.showVersionInfo();
        } else {
            config.runtime.debugLogger.warn('[版本窗口] versionManager 未初始化');
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

    // 处理所有属性(使用safeHandle捕获错误)
    safeHandle(handleDateProperties, properties, FirstLoad, 'handleDateProperties');
    safeHandle(handleTimeProperties, properties, FirstLoad, 'handleTimeProperties');
    safeHandle(handleBackgroundProperties, properties, FirstLoad, 'handleBackgroundProperties');
    safeHandle(handleWeatherProperties, properties, FirstLoad, 'handleWeatherProperties');
    safeHandle(handleHitokotoProperties, properties, FirstLoad, 'handleHitokotoProperties');
    safeHandle(handleCountdownProperties, properties, FirstLoad, 'handleCountdownProperties');
    safeHandle(handlePlayerControlProperties, properties, FirstLoad, 'handlePlayerControlProperties');
    safeHandle(handleRGBProperties, properties, FirstLoad, 'handleRGBProperties');
    safeHandle(handleParticleProperties, properties, FirstLoad, 'handleParticleProperties');
    safeHandle(handleAudioVisualProperties, properties, FirstLoad, 'handleAudioVisualProperties');
    safeHandle(handleSakuraProperties, properties, FirstLoad, 'handleSakuraProperties');
    safeHandle(handleFluidEffectProperties, properties, FirstLoad, 'handleFluidEffectProperties');
    safeHandle(handleLyricsProperties, properties, FirstLoad, 'handleLyricsProperties');
    safeHandle(handleSystemMonitorProperties, properties, FirstLoad, 'handleSystemMonitorProperties');

    // 如果是首次加载，在处理完所有属性后将其设置为 false
    if (FirstLoad) {
        config.firstLoad = false;
    }
}

/**
 * 设置壁纸引擎属性监听器
 * 将监听器绑定到 window.wallpaperPropertyListener
 */
export function setupWallpaperPropertyListener(): void {
    // 确保 window 对象存在
    if (typeof window !== 'undefined') {
        const runtime = config.runtime;
        window.wallpaperPropertyListener = {
            applyUserProperties: (properties: Record<string, any>) => {
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
                const removedSet = new Set(removedFiles);
                runtime.files[propertyName] = runtime.files[propertyName].filter(file => !removedSet.has(file));
                runtime.myList = runtime.myList.filter(file => !removedSet.has(file));
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

        // 注册 Wallpaper Engine 音频监听器
        window.wallpaperRegisterAudioListener?.(audioDataListener);
    }
}
