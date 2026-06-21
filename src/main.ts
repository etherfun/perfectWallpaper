/**
 * Vue 应用入口 — Phase 1 (2026-06-21)
 *
 * 流程：
 *   1. 创建 Vue app + 安装 pinia + 安装 vue-i18n
 *   2. 异步加载 project.json defaults（最高保底优先级）
 *   3. 加载 vue-i18n 字典
 *   4. 启动旧的 audio / visualizer / fullscreen lyrics（Phase 3/4 才迁移）
 *   5. mount 到 <div id="app-root">
 *
 * 注：
 *   - propertyHandlers / WallpaperEffectController / PWCircle / PWLine 暂保留旧启动，
 *     Phase 3/6 迁移到 Vue 后移除。
 *   - 4 个叶子组件 (time/date/countdown/hitokoto) 的旧 .ts 入口已被 bundle.ts 注释，
 *     避免双重渲染。
 */

import './audioVisualizer';
import './fullscreenLyrics';

import { createApp } from 'vue';
import { createPinia } from 'pinia';

import App from '@/components/App.vue';
import { useProjectJsonDefaults } from '@/composables/useProjectJsonDefaults';
import { i18n } from '@/i18n';
import { setupWallpaperPropertyListener } from './propertyHandlers/wallpaperPropertyListener';
import { resize as pwCircleResize } from './PWCircle';
import { PWLineInit } from './PWLine';
import { config } from './utils/config';
import { debugLogger } from './utils/logger';
import { WallpaperEffectController } from './WallpaperEffectController';

config.runtime.wallpaper = new WallpaperEffectController(document.body);

setupWallpaperPropertyListener();
pwCircleResize();
PWLineInit();

async function bootstrap(): Promise<void> {
    const app = createApp(App);
    const pinia = createPinia();
    app.use(pinia);
    app.use(i18n);

    // 三层回退第 3 层：project.json 默认值
    await useProjectJsonDefaults();

    // mount 到 index.html 中的 <div id="app-root">
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
