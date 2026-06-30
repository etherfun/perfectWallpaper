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
import { pinia } from './piniaInit';

import { createApp } from 'vue';

import './audioVisualizer';
import './fullscreenLyrics';

import App from '@/components/App.vue';
import { useWallpaperProperties } from '@/composables/useWallpaperProperties';
import { i18n, loadI18n } from '@/i18n';
import { useConfigStore } from '@/stores/config';
import { useRuntimeStore } from '@/stores/runtime';

import { setupWallpaperPropertyListener } from './propertyHandlers/wallpaperPropertyListener';
import { resize as pwCircleResize } from './PWCircle';
import { PWLineInit } from './PWLine';
import { markDeferredReady } from './utils/deferredScheduler';
import { debugLogger } from './utils/logger';
import { WallpaperEffectController } from './WallpaperEffectController';

// ===== 顶层副作用（保持 Phase 1 的兼容层） =====

const _runtimeStore = useRuntimeStore();
_runtimeStore.wallpaper = new WallpaperEffectController(document.body);

setupWallpaperPropertyListener();
pwCircleResize();
PWLineInit();

// ===== Vue 应用启动 =====

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
    const { refreshDomRefs } = await import('@/player_control/domRefs');
    const { refreshPlayerControlRefs } = await import(
        '@/composables/usePlayerControlProperties'
    );
    refreshDomRefs();
    refreshPlayerControlRefs();

    // 3.4.1 Vue mount 后重新触发背景相关初始化
    const { applyBackgroundStyle, TransitionSwith } = await import('@/slide');
    applyBackgroundStyle();
    TransitionSwith();

    // 3.5 通知 deferredScheduler：Vue 已挂载完成
    markDeferredReady();
}

bootstrap().catch(err => {
    console.error('[main.ts] bootstrap failed', err);
});

debugLogger.info('[App] PerfectWall 壁纸引擎初始化完成');
