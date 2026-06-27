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

// pinia 已在 `./piniaInit` 中创建并 setActivePinia（bundle.ts 的第一个 import）。
// 这里复用同一个实例，避免双 pinia 导致 store 状态分裂。
import { pinia } from './piniaInit';

import { createApp } from 'vue';

import './audioVisualizer';
import './fullscreenLyrics';

import App from '@/components/App.vue';
import { useProjectJsonDefaults } from '@/composables/useProjectJsonDefaults';
import { useStandalonePersistence } from '@/composables/useStandalonePersistence';
import { armStandaloneFallback } from '@/composables/useStandaloneProperties';
import { useStoredProperties } from '@/composables/useStoredProperties';
import { useWallpaperProperties } from '@/composables/useWallpaperProperties';
import { i18n } from '@/i18n';
import { installConfigStoreBridge } from '@/stores/configBridge';

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
    //    pinia 由 `./piniaInit` 创建并 setActivePinia，这里复用同一个实例。
    const app = createApp(App);
    app.use(pinia);
    app.use(i18n);

    // 2. 三层回退顺序合并到 Pinia store
    //    第 3 层 project.json：保底
    await useProjectJsonDefaults();
    //    第 2 层 localStorage：上次运行时
    await useStoredProperties();
    //    第 1 层 WE：注册包装 listener（push 时自动 patch store）
    useWallpaperProperties();

    // 3. 安装 config → store 桥接（plan-ex.md R10 解决）
    //    让旧 .ts 的 `config.xxx = y` 写入自动镜像到 Pinia，
    //    保证 Vue 组件与命令式模块状态同步
    installConfigStoreBridge();

    // 4. mount 到 <div id="app-root">
    const root = document.getElementById('app-root');
    if (!root) {
        console.error('[main.ts] #app-root not found in index.html');
        return;
    }
    app.mount(root);

    // 5. 独立模式增强（阶段 1.x）：
    //    - 5 秒内 WE 没注入 → armStandaloneFallback 兜底推一次完整 properties，
    //      让 14 个旧 handler 触发薄壳组件 DOM 创建
    //    - store → localStorage 持久化（仅独立模式需要 — WE 模式由 propertyListener
    //      内 savePropertiesToLocalStorage 处理；这里写也只是覆盖但不会冲突）
    armStandaloneFallback();
    useStandalonePersistence();
}

bootstrap().catch(err => {
    console.error('[main.ts] bootstrap failed', err);
});

debugLogger.info('[App] PerfectWall 壁纸引擎初始化完成');
