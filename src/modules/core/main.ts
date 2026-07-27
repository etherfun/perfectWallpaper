/**
 * Vue 应用入口 — WE only mode (2026-06-30)
 *
 * 移除了独立模式三层回退（useProjectJsonDefaults / useStoredProperties /
 * useStandaloneProperties / useStandalonePersistence），只保留 WE 模式。
 *
 * 流程：
 *   1. 注册 WE listener 包装器（Pinia 同步）
 *   2. 加载 i18n 翻译字典
 *   3. 注册 WE property listener 包装（push 时自动 patch store）
 *   4. Vue mount
 */

// pinia 已在 `./piniaInit` 中创建并 setActivePinia（bundle.ts 的第一个 import）。
// 这里复用同一个实例，避免双 pinia 导致 store 状态分裂。
import '../audio-visualizer/audioVisualizer';
import '../fullscreenLyrics';

import { createApp, watch } from 'vue';

import App from '@/modules/core/App.vue';
import { useWallpaperProperties } from '@/modules/core/useWallpaperProperties';
import { useConfigStore } from '@/stores/config';
import { useRuntimeStore } from '@/stores/runtime';
import { i18n, loadI18n } from '@/utils/i18n';

import { markDeferredReady } from '../../utils/deferredScheduler';
import { debugLogger } from '../../utils/logger';
import { resize as pwCircleResize } from '../audio-visualizer/circle/PWCircle';
import { PWLineInit } from '../audio-visualizer/line/PWLine';
import { pinia } from './piniaInit';
import { WallpaperEffectController } from './WallpaperEffectController';
import { setupWallpaperPropertyListener } from './wallpaperPropertyListener';



const _runtimeStore = useRuntimeStore();
_runtimeStore.wallpaper = new WallpaperEffectController(document.body);

setupWallpaperPropertyListener();
pwCircleResize();
PWLineInit();



async function bootstrap(): Promise<void> {
    // 1. 创建 app + 安装 pinia + 安装 vue-i18n
    //    pinia 由 `./piniaInit` 创建并 setActivePinia，这里复用同一个实例。
    const app = createApp(App);
    app.use(pinia);
    app.use(i18n);

    // 1.5 立即加载 i18n 翻译字典
    const configStore = useConfigStore();
    await loadI18n(configStore.language);

    // 2. 注册 WE listener 包装（push 时自动 patch store）
    useWallpaperProperties();

    // 3. mount 到 <div id="app-root">
    const root = document.getElementById('app-root');
    if (!root) {
        console.error('[main.ts] #app-root not found in index.html');
        return;
    }
    app.mount(root);

    // 3.4 刷新 #player_control 模块层 DOM 引用
    const { refreshDomRefs } = await import('@/modules/player_control/domRefs');
    const { refreshPlayerControlRefs } = await import(
        '@/modules/player_control/usePlayerControlProperties'
    );
    refreshDomRefs();
    refreshPlayerControlRefs();

    // 3.4.1 Vue mount 后重新触发背景相关初始化
    const { applyBackgroundStyle, TransitionSwith } = await import('@/modules/slide');
    applyBackgroundStyle();
    TransitionSwith();

    // 3.5 通知 deferredScheduler：Vue 已挂载完成
    markDeferredReady();

    // 4. 等待 WE 首次配置推送完成，然后移除加载动画
    //    configStore.first_load 初始为 true，在 createWallpaperPropertyListener
    //    的 FirstLoad 块末尾被设为 false，表示所有配置项已应用。
    //    加 2 秒最小展示时间，避免闪一下就消失。
    const loadingEl = document.getElementById('app-loading');
    if (loadingEl) {
        const hideLoading = (): void => {
            loadingEl.classList.add('app-loading--hidden');
            loadingEl.addEventListener('transitionend', () => loadingEl.remove(), {
                once: true,
            });
            // 回退：transition 未触发时也确保移除
            setTimeout(() => loadingEl?.remove(), 350);
        };

        const minTimer = new Promise<void>(resolve => setTimeout(resolve, 2000));

        const waitConfig = new Promise<void>(resolve => {
            if (!configStore.first_load) {
                resolve();
            } else {
                watch(
                    () => configStore.first_load,
                    (val) => {
                        if (!val) resolve();
                    }
                );
            }
        });

        void Promise.all([minTimer, waitConfig]).then(hideLoading);
    }
}

bootstrap().catch(err => {
    console.error('[main.ts] bootstrap failed', err);
});

debugLogger.info('[App] PerfectWall 壁纸引擎初始化完成');
