import { useConfigStore } from '@/stores/config';
import { useRuntimeStore } from '@/stores/runtime';
import { loadI18n } from '@/utils/i18n';

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
 * 瀹夊叏鎵ц灞炴€у鐞嗗嚱鏁?鎹曡幏骞惰褰曢敊璇?
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
 * 灏嗗睘鎬у璞＄殑鍊兼彁鍙栧苟淇濆瓨鍒?localStorage
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
 * 鍒涘缓澹佺焊灞炴€х洃鍚櫒
 * 缁熶竴璋冪敤鎵€鏈?property handlers 骞舵暣鍚堢粨鏋?
 *
 * Stage 7-C (Phase 7 鎵规 2-C3):
 *   - Pinia 瀛楁鏀圭敤 useConfigStore() 璇诲啓銆?
 *   - runtime / wallpaper_settings 瀛愬璞′繚鐣?appConfig 鍗曚緥璁块棶锛圫tage 3.5-B 杩佺Щ锛夈€?
 *   - 鏃?`config.xxx` 寮曠敤鎸?`config = store` 鍒悕鍏煎锛坮untime 瀛愬睘鎬ц蛋 appConfig锛夈€?
 */
export function createWallpaperPropertyListener(
    properties: WallpaperProperties,
    FirstLoad: boolean
): void {
    const store = useConfigStore();
    const config = store; // Pinia flat fields alias
    const runtime = runtimeStore; // runtime playerInfo / wallpaper / files etc.

    // 鍏ㄥ眬璇█璁剧疆
    if (properties.global_settings_language) {
        const lang = properties.global_settings_language.value;
        store.$patch({
            language: lang,
            language_code: lang?.slice(0, 2) ?? config.language_code,
        });
        void loadI18n(lang);
    }

    // 鐗堟湰鏇存柊妫€鏌?
    // wallpaper_updata 鏄?鐐瑰嚮鎵撳紑鏇存柊鏃ュ織"鎸夐挳锛坱ype bool锛岄粯璁?false锛夈€?
    // 鐢ㄦ埛鐐瑰嚮鏃?WE 鎺ㄩ€?{ wallpaper_updata: { value: true } }銆?
    // 鐢?!FirstLoad 闃叉棣栨鍔犺浇鏃舵帹閫佺殑 { value: false } 璇Е銆?
    if (!FirstLoad) {
        const prop = properties.wallpaper_updata;
        const isClicked = prop != null && prop.value === true;
        if (isClicked) {
            debugLogger.info('[鐗堟湰绐楀彛] 妫€娴嬪埌鐗堟湰鏇存柊璇锋眰');
            if (runtime.versionManager) {
                void (runtime.versionManager as any).showVersionInfo();
            } else {
                (runtime.debugLogger as any)?.warn('[鐗堟湰绐楀彛] versionManager 鏈垵濮嬪寲');
            }
        }
    }

    // 鐗堟湰鏇存柊寮圭獥鏄剧ず璁剧疆
    if (properties.wallpaper_updata_open_on_update) {
        localStorage.setItem(
            'perfectwall_version_show_update',
            String(properties.wallpaper_updata_open_on_update.value)
        );
    }

    // 璋冭瘯鏃ュ織澶嶅埗
    if (properties.debugger_copy && FirstLoad !== true) {
        showDebugLogModal();
    }

    // 鍚敤鎻掍欢
    if (properties.server_mode) {
        store.$patch({ server_mode: properties.server_mode.value });
    }

    // 鑷畾涔夊瓧浣撹缃?
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

    // 澶勭悊鎵€鏈夊睘鎬?
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
 * 璁剧疆澹佺焊寮曟搸灞炴€х洃鍚櫒
 * 灏嗙洃鍚櫒缁戝畾鍒?window.wallpaperPropertyListener
 */
export function setupWallpaperPropertyListener(): void {
    if (typeof window !== 'undefined') {
        const store = useConfigStore();
        const runtime = runtimeStore;

        window.wallpaperPropertyListener = {
            applyUserProperties: (properties: Record<string, any>) => {
                if (Object.keys(properties).length == 0) return;

                // Pinia 批量同步 — 合并自 useWallpaperProperties.ts
                try {
                    store.applyUserProperties(properties);
                } catch (err) {
                    console.warn('[WE] Pinia sync failed', err);
                }

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

        // 娉ㄥ唽 Wallpaper Engine 闊抽鐩戝惉鍣?
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
