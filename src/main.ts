/**
 * Vue 应用入口 — Phase 6 (2026-06-21)
 *
 * 三层回退启动顺序（plan-ex.md R8）：
 *   1. project.json defaults    (useProjectJsonDefaults)  — 兜底
 *   2. localStorage persisted   (useStoredProperties)     — 上次运行时
 *   3. Wallpaper Engine push    (useWallpaperProperties)  — 最高优先级
 *   4. 14 个 propertyHandler 仍按旧路径运行（不改写）
 *
 * 流程：
 *   1. 注册 WE listener 包装器（Pinia 同步）
 *   2. 加载 project.json defaults + localStorage（顺序合并）
 *   3. 启动 audio / visualizer / fullscreen lyrics
 *   4. 启动 setupWallpaperPropertyListener（旧链路）
 *   5. PWCircle / PWLine 初始化
 *   6. Vue mount
 */

import './audioVisualizer';
import './fullscreenLyrics';

import { createApp } from 'vue';
import { createPinia } from 'pinia';

import App from '@/components/App.vue';
import { useProjectJsonDefaults } from '@/composables/useProjectJsonDefaults';
import { useStoredProperties } from '@/composables/useStoredProperties';
import { useWallpaperProperties } from '@/composables/useWallpaperProperties';
import { i18n } from '@/i18n';
import { setupWallpaperPropertyListener } from './propertyHandlers/wallpaperPropertyListener';
import { resize as pwCircleResize } from './PWCircle';
import { PWLineInit } from './PWLine';
import { config } from './utils/config';
import { debugLogger } from './utils/logger';
import { WallpaperEffectController } from './WallpaperEffectController';

// ===== 顶层副作用（保持 Phase 1 的兼容层） =====

config.runtime.wallpaper = new WallpaperEffectController(document.body);

setupWallpaperPropertyListener();
pwCircleResize();
PWLineInit();

// ===== Vue 应用启动 =====

async function bootstrap(): Promise<void> {
    // 1. 创建 app + 安装 pinia + 安装 vue-i18n
    const app = createApp(App);
    const pinia = createPinia();
    app.use(pinia);
    app.use(i18n);

    // 2. 三层回退顺序合并到 Pinia store
    //    第 3 层 project.json：保底
    await useProjectJsonDefaults();
    //    第 2 层 localStorage：上次运行时
    await useStoredProperties();
    //    第 1 层 WE：注册包装 listener（push 时自动 patch store）
    useWallpaperProperties();

    // 3. mount 到 <div id="app-root">
    const root = document.getElementById('app-root');
    if (!root) {
        console.error('[main.ts] #app-root not found in index.html');
        return;
    }
    app.mount(root);
}

bootstrap().catch(err => {
    console.error('[main.ts] bootstrap failed', err);
});

debugLogger.info('[App] PerfectWall 壁纸引擎初始化完成');
