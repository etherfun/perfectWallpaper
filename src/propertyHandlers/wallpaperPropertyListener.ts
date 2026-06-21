import '../version';

import { useConfigStore } from '@/stores/config';
import { loadI18n } from '@/i18n';
// config runtime/wallpaper_settings sub-objects live outside Pinia (Stage 3.5-B)
import { config as appConfig } from '@/utils/config';

import { audioDataListener } from '../audioVisualizer';
import { showDebugLogModal } from '../debugModal';
import { background2canvas } from '../RGB';
import { removesakura } from '../sakura';
import { updateFileList } from '../slide';
import { elements } from '@/utils/elementManager';
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
 */
function savePropertiesToLocalStorage(properties: Record<string, any>): void {
    const existingConfigStr = localStorage.getItem('perfectwall_user_properties');
    const existingConfig: Record<string, any> = existingConfigStr
        ? JSON.parse(existingConfigStr)
        : {};

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
 * Stage 7-C (Phase 7 批次 2-C3):
 *   - Pinia 字段改用 useConfigStore() 读写。
 *   - runtime / wallpaper_settings 子对象保留 appConfig 单例访问（Stage 3.5-B 迁移）。
 *   - 旧 `config.xxx` 引用按 `config = store` 别名兼容（runtime 子属性走 appConfig）。
 */
export function createWallpaperPropertyListener(
    properties: WallpaperProperties,
    FirstLoad: boolean
): void {
    const store = useConfigStore();
    const config = store; // Pinia flat fields alias
    const runtime = appConfig.runtime; // runtime playerInfo / wallpaper / files etc.

    // 全局语言设置
    if (properties.global_settings_language) {
        const lang = properties.global_settings_language.value;
        store.$patch({
            language: lang,
            language_code: lang?.slice(0, 2) ?? config.language_code,
        });
        void loadI18n(lang);
    }

    // 版本更新检查
    if (properties.wallpaper_updata && FirstLoad !== true) {
        debugLogger.info('[版本窗口] 检测到版本更新请求');
        if (runtime.versionManager) {
            runtime.versionManager.showVersionInfo();
        } else {
            runtime.debugLogger?.warn('[版本窗口] versionManager 未初始化');
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

    // 启用插件
    if (properties.server_mode) {
        store.$patch({ server_mode: properties.server_mode.value });
    }

    // 自定义字体设置
    if (properties.fontSetting) {
        store.$patch({ font_setting: properties.fontSetting.value });
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

    if (FirstLoad) {
        store.$patch({ update_init_complete: true });
    }

    // 处理所有属性
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

    if (FirstLoad) {
        store.$patch({ first_load: false });
    }
}

/**
 * 设置壁纸引擎属性监听器
 * 将监听器绑定到 window.wallpaperPropertyListener
 */
export function setupWallpaperPropertyListener(): void {
    if (typeof window !== 'undefined') {
        const store = useConfigStore();
        const runtime = appConfig.runtime;

        let propertiesReceived = false;
        let restoredFromLocalStorage = false;

        window.wallpaperPropertyListener = {
            applyUserProperties: (properties: Record<string, any>) => {
                if (
                    Object.keys(properties).length == 0 ||
                    (store.first_load === false && Object.keys(properties).length > 10)
                )
                    return;

                propertiesReceived = true;
                const isFirstLoad = store.first_load;
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
                    store.$patch({ paused: true });
                    myvideo.pause();
                    myAudio.pause();
                } else {
                    store.$patch({ paused: false });
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
                    if (
                        runtime.playerInfo.playerState !== 2 &&
                        myAudio.src &&
                        !(
                            myAudio.paused &&
                            (myAudio.src.slice(-10) === 'twall/null' ||
                                myAudio.src.slice(-10) === 'index.html')
                        )
                    ) {
                        myAudio.play();
                    }
                    if (store.rgb_show === true) {
                        if (store.wallpaper_mode !== 3) {
                            const src = document.body.style.backgroundImage.replace(
                                /^url\("(.+?)"\)$/,
                                '$1'
                            );
                            background2canvas(src, false);
                        } else {
                            background2canvas(null, true);
                        }
                    }
                    if (store.showSakura === true) {
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
                    appConfig.wallpaper_settings.ledPlugin = true;
                    debugLogger.info('[RGB] LED 插件已加载');
                }
                if (name === 'cue') {
                    appConfig.wallpaper_settings.cuePlugin = true;
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
