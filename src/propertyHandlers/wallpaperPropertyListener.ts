import '../version';

import { loadI18n } from '@/i18n';

import { audioDataListener } from '../audioVisualizer';
import { showDebugLogModal } from '../debugModal';
import { background2canvas } from '../RGB';
import { removesakura } from '../sakura';
import { updateFileList } from '../slide';
import { config } from '../utils/config';
import { elements } from '../utils/elementManager';
import { debugLogger } from '../utils/logger';
import { handleAudioVisualProperties } from './audioVisualPropertyHandler';
import { handleBackgroundProperties } from './backgroundPropertyHandler';
import { handleCountdownProperties } from './countdownPropertyHandler';
import { handleDateProperties } from './datePropertyHandler';
import { handleDockBarProperties } from './dockbarPropertyHandler';
import { handleFluidEffectProperties } from './fluidEffectPropertyHandler';
import { handleHitokotoProperties } from './hitokotoPropertyHandler';
import { handleLyricsProperties } from './lyricsPropertyHandler';
import { handleParticleProperties } from './particlePropertyHandler';
import { handlePlayerControlProperties } from './playerControlPropertyHandler';
import { handleRGBProperties } from './rgbPropertyHandler';
import { handleSakuraProperties } from './sakuraPropertyHandler';
import { handleSystemMonitorProperties } from './systemMonitorPropertyHandler';
import { handleTimeProperties } from './timePropertyHandler';
import { WallpaperProperties } from './types';
import { handleWeatherProperties } from './weatherPropertyHandler';

/**
 * 安全执行属性处理函数,捕获并记录错误
 */
function safeHandle(
    handler: (properties: WallpaperProperties, firstLoad: boolean) => void,
    properties: WallpaperProperties,
    firstLoad: boolean,
    name: string
): void {
    try {
        handler(properties, firstLoad);
    } catch (e) {
        debugLogger.error(`[PropertyHandler] ${name} failed`, e);
    }
}

/**
 * 将属性对象的值提取并保存到 localStorage
 * 保留 value 嵌套结构，去除 condition, index, order, text, type 等元数据
 * 合并已有配置，支持完整初始化和单个配置更新
 */
function savePropertiesToLocalStorage(properties: Record<string, any>): void {
    // 获取已有配置
    const existingConfigStr = localStorage.getItem('perfectwall_user_properties');
    const existingConfig: Record<string, any> = existingConfigStr
        ? JSON.parse(existingConfigStr)
        : {};

    // 提取新属性的 { value } 结构并合并
    for (const [key, prop] of Object.entries(properties)) {
        if (prop && typeof prop === 'object' && 'value' in prop) {
            existingConfig[key] = { value: prop.value };
        }
    }

    localStorage.setItem('perfectwall_user_properties', JSON.stringify(existingConfig));
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
        config.language_code =
            properties.global_settings_language.value?.slice(0, 2) ?? config.language_code;
        void loadI18n(config.language);
    }

    // 版本更新检查
    if (properties.wallpaper_updata && FirstLoad !== true) {
        debugLogger.info('[版本窗口] 检测到版本更新请求');
        if (config.runtime.versionManager) {
            config.runtime.versionManager.showVersionInfo();
        } else {
            config.runtime.debugLogger?.warn('[版本窗口] versionManager 未初始化');
        }
    }

    // 版本更新弹窗显示设置
    if (properties.wallpaper_updata_open_on_update) {
        localStorage.setItem(
            'perfectwall_version_show_update',
            String(properties.wallpaper_updata_open_on_update.value)
        );
    }

    // 调试日志复制
    if (properties.debugger_copy && FirstLoad !== true) {
        showDebugLogModal();
    }

    //启用插件
    if (properties.server_mode) {
        config.server_mode = properties.server_mode.value;
    }

    // 自定义字体设置
    if (properties.fontSetting) {
        config.font_setting = properties.fontSetting.value;
        const fontSetting = properties.fontSetting.value.trim();
        const fontGroup = fontSetting
            .split(';')
            .map(font => {
                const trimmedFont = font.trim();
                if (
                    trimmedFont.includes(' ') &&
                    !trimmedFont.startsWith('"') &&
                    !trimmedFont.startsWith("'")
                ) {
                    return `"${trimmedFont}"`;
                }
                return trimmedFont;
            })
            .filter(font => font !== '')
            .join(', ');
        if (fontGroup) {
            document.body.style.fontFamily = fontGroup;
        }
    }

    // 如果是首次加载,标记更新初始化完成
    if (FirstLoad) {
        config.update_init_complete = true;
    }

    // 处理所有属性(使用safeHandle捕获错误)
    safeHandle(handleDateProperties, properties, FirstLoad, 'handleDateProperties');
    safeHandle(handleTimeProperties, properties, FirstLoad, 'handleTimeProperties');
    safeHandle(handleBackgroundProperties, properties, FirstLoad, 'handleBackgroundProperties');
    safeHandle(handleWeatherProperties, properties, FirstLoad, 'handleWeatherProperties');
    safeHandle(handleHitokotoProperties, properties, FirstLoad, 'handleHitokotoProperties');
    safeHandle(handleCountdownProperties, properties, FirstLoad, 'handleCountdownProperties');
    safeHandle(
        handlePlayerControlProperties,
        properties,
        FirstLoad,
        'handlePlayerControlProperties'
    );
    safeHandle(handleRGBProperties, properties, FirstLoad, 'handleRGBProperties');
    safeHandle(handleParticleProperties, properties, FirstLoad, 'handleParticleProperties');
    safeHandle(handleAudioVisualProperties, properties, FirstLoad, 'handleAudioVisualProperties');
    safeHandle(handleSakuraProperties, properties, FirstLoad, 'handleSakuraProperties');
    safeHandle(handleFluidEffectProperties, properties, FirstLoad, 'handleFluidEffectProperties');
    safeHandle(handleLyricsProperties, properties, FirstLoad, 'handleLyricsProperties');
    safeHandle(
        handleSystemMonitorProperties,
        properties,
        FirstLoad,
        'handleSystemMonitorProperties'
    );
    safeHandle(handleDockBarProperties, properties, FirstLoad, 'handleDockBarProperties');

    // 如果是首次加载，在处理完所有属性后将其设置为 false
    if (FirstLoad) {
        config.first_load = false;
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

        let propertiesReceived = false;
        let restoredFromLocalStorage = false;

        window.wallpaperPropertyListener = {
            applyUserProperties: (properties: Record<string, any>) => {
                if (
                    Object.keys(properties).length == 0 ||
                    (config.first_load === false && Object.keys(properties).length > 10)
                )
                    return;

                propertiesReceived = true;
                const isFirstLoad = config.first_load;
                if (!restoredFromLocalStorage) {
                    savePropertiesToLocalStorage(properties);
                }
                restoredFromLocalStorage = false;
                createWallpaperPropertyListener(properties as WallpaperProperties, isFirstLoad);
            },
            applyGeneralProperties: (_properties: Record<string, any>) => {
                // General properties are handled by wallpaper engine directly
            },
            userDirectoryFilesAddedOrChanged: (propertyName: string, changedFiles: string[]) => {
                const existing = runtime.files[propertyName];
                if (
                    !Object.prototype.hasOwnProperty.call(runtime.files, propertyName) ||
                    !existing
                ) {
                    runtime.files[propertyName] = changedFiles;
                } else {
                    runtime.files[propertyName] = existing.concat(changedFiles);
                }
                updateFileList(runtime.files[propertyName]);
            },
            userDirectoryFilesRemoved: (propertyName: string, removedFiles: string[]) => {
                const removedSet = new Set(removedFiles);
                const existing = runtime.files[propertyName] ?? [];
                runtime.files[propertyName] = existing.filter(file => !removedSet.has(file));
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
                    if (
                        myvideo.src &&
                        !(
                            myvideo.paused &&
                            (myvideo.src.slice(-10) === 'twall/null' ||
                                myvideo.src.slice(-10) === 'index.html')
                        )
                    ) {
                        myvideo.play();
                    }
                    // 只有当用户没有手动暂停时才恢复音频
                    if (
                        config.runtime.playerInfo.playerState !== 2 &&
                        myAudio.src &&
                        !(
                            myAudio.paused &&
                            (myAudio.src.slice(-10) === 'twall/null' ||
                                myAudio.src.slice(-10) === 'index.html')
                        )
                    ) {
                        myAudio.play();
                    }
                    if (config.rgb_show === true) {
                        if (config.wallpaper_mode !== 3) {
                            const src = document.body.style.backgroundImage.replace(
                                /^url\("(.+?)"\)$/,
                                '$1'
                            );
                            background2canvas(src, false);
                        } else {
                            background2canvas(null, true);
                        }
                    }
                    if (config.show_sakura === true) {
                        removesakura();
                    }
                }
            },
        };

        // 注册 Wallpaper Engine 音频监听器
        window.wallpaperRegisterAudioListener?.(audioDataListener);

        // 注册壁纸插件监听器
        window.wallpaperPluginListener = {
            onPluginLoaded: (name: string, _version: string) => {
                if (name === 'led') {
                    config.wallpaper_settings.ledPlugin = true;
                    debugLogger.info('[RGB] LED 插件已加载');
                }
                if (name === 'cue') {
                    config.wallpaper_settings.cuePlugin = true;
                    debugLogger.info('[RGB] CUE 插件已加载');
                }
            },
        };

        // 5秒超时：如果 Wallpaper Engine 没有在5秒内发送配置，则使用 localStorage 的配置初始化
        setTimeout(() => {
            if (!propertiesReceived) {
                debugLogger.warn(
                    '[PropertyHandler] Wallpaper Engine 未在5秒内发送配置，使用 localStorage 配置初始化'
                );
                const savedConfigStr = localStorage.getItem('perfectwall_user_properties');
                if (savedConfigStr) {
                    restoredFromLocalStorage = true;
                    const savedConfig = JSON.parse(savedConfigStr);
                    createWallpaperPropertyListener(savedConfig as WallpaperProperties, true);
                } else {
                    createWallpaperPropertyListener({} as WallpaperProperties, true);
                }
            }
        }, 5000);
    }
}
