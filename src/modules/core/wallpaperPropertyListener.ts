import '../version';

import { loadI18n } from '@/i18n';
import { useConfigStore } from '@/stores/config';
import { useRuntimeStore } from '@/stores/runtime';

const runtimeStore = useRuntimeStore();
import { useAudioVisualProperties } from '@/modules/audio-visualizer/useAudioVisualProperties';
import { useParticleProperties } from '@/modules/audio-visualizer/useParticleProperties';
import { useTimeProperties } from '@/modules/clock/useTimeProperties';
import { useCountdownProperties } from '@/modules/countdown/useCountdownProperties';
import { useDateProperties } from '@/modules/date/useDateProperties';
import { useDockBarProperties } from '@/modules/dockbar/useDockBarProperties';
import { useFluidEffectProperties } from '@/modules/fluid/useFluidEffectProperties';
import { useLyricsProperties } from '@/modules/fullscreenLyrics/useLyricsProperties';
import { useHitokotoProperties } from '@/modules/hitokoto/useHitokotoProperties';
import { usePlayerControlProperties } from '@/modules/player_control/usePlayerControlProperties';
import { useRGBProperties } from '@/modules/rgb-effect/useRGBProperties';
import { useSakuraProperties } from '@/modules/sakura/useSakuraProperties';
import { useBackgroundProperties } from '@/modules/slide/useBackgroundProperties';
import { useSystemMonitorProperties } from '@/modules/systemMonitor/useSystemMonitorProperties';
import { useWeatherProperties } from '@/modules/weather/useWeatherProperties';
import { elements } from '@/utils/elementManager';

import { WallpaperProperties } from '../../types/types';
import { debugLogger } from '../../utils/logger';
import { audioDataListener } from '../audio-visualizer/audioVisualizer';
import { showDebugLogModal } from '../debug/debugModal';
import { background2canvas } from '../rgb-effect/RGB';
import { removesakura } from '../sakura';
import { updateFileList } from '../slide';

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
    const runtime = runtimeStore; // runtime playerInfo / wallpaper / files etc.

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
    // wallpaper_updata 是"点击打开更新日志"按钮（type bool，默认 false）。
    // 用户点击时 WE 推送 { wallpaper_updata: { value: true } }。
    // 用 !FirstLoad 防止首次加载时推送的 { value: false } 误触。
    if (!FirstLoad) {
        const prop = properties.wallpaper_updata;
        const isClicked = prop != null && prop.value === true;
        if (isClicked) {
            debugLogger.info('[版本窗口] 检测到版本更新请求');
            if (runtime.versionManager) {
                void (runtime.versionManager as any).showVersionInfo();
            } else {
                (runtime.debugLogger as any)?.warn('[版本窗口] versionManager 未初始化');
            }
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
            .map((font: string) => {
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
    safeHandle(useDateProperties, properties, FirstLoad, 'useDateProperties');
    safeHandle(useTimeProperties, properties, FirstLoad, 'useTimeProperties');
    safeHandle(useBackgroundProperties, properties, FirstLoad, 'useBackgroundProperties');
    safeHandle(useWeatherProperties, properties, FirstLoad, 'useWeatherProperties');
    safeHandle(useHitokotoProperties, properties, FirstLoad, 'useHitokotoProperties');
    safeHandle(useCountdownProperties, properties, FirstLoad, 'useCountdownProperties');
    safeHandle(
        usePlayerControlProperties,
        properties,
        FirstLoad,
        'usePlayerControlProperties'
    );
    safeHandle(useRGBProperties, properties, FirstLoad, 'useRGBProperties');
    safeHandle(useParticleProperties, properties, FirstLoad, 'useParticleProperties');
    safeHandle(useAudioVisualProperties, properties, FirstLoad, 'useAudioVisualProperties');
    safeHandle(useSakuraProperties, properties, FirstLoad, 'useSakuraProperties');
    safeHandle(useFluidEffectProperties, properties, FirstLoad, 'useFluidEffectProperties');
    safeHandle(useLyricsProperties, properties, FirstLoad, 'useLyricsProperties');
    safeHandle(
        useSystemMonitorProperties,
        properties,
        FirstLoad,
        'useSystemMonitorProperties'
    );
    safeHandle(useDockBarProperties, properties, FirstLoad, 'useDockBarProperties');

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
        const runtime = runtimeStore;

        window.wallpaperPropertyListener = {
            applyUserProperties: (properties: Record<string, any>) => {
                // 跳过空推送
                if (Object.keys(properties).length == 0) return;

                const isFirstLoad = store.first_load;
                savePropertiesToLocalStorage(properties);
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
                    store.wallpaper_settings!.ledPlugin = true;
                    debugLogger.info('[RGB] LED 插件已加载');
                }
                if (name === 'cue') {
                    store.wallpaper_settings!.cuePlugin = true;
                    debugLogger.info('[RGB] CUE 插件已加载');
                }
            },
        };
    }
}
