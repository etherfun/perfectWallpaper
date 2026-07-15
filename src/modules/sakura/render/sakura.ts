/**
 * 樱花效果主入口
 *
 * 对外暴露：
 *   sakuraReLoadEffect       重新编译效果库（亮度等参数变化时）
 *   sakuraResize             触发窗口尺寸重置
 *   sakuraLoad               初始化 WebGL 上下文并启动场景
 *   removesakura            手动把当前帧从 WebGL 画布拷贝到 2D 显示画布
 *   initSakura              注册 window load 事件（模块加载时自动执行一次）
 *   applySakuraTransparency 设置 #sakurashow 的 CSS opacity
 *
 * 模块加载时自动调用 initSakura()，bundle.ts 只需 import './sakura' 即可挂载。
 */

import { useConfigStore } from "@/stores/config";
import { debugLogger } from '@/utils/logger';

import { animate } from '../effect/animation';
import { createEffectLib } from '../effect/effects';
import { gl, setAnimating, setGl, timeInfo } from '../state/state';
import { makeCanvasFullScreen, makeCanvasHide } from './canvas';
import { createScene, initScene, onResize, setViewports } from './scene';

const config = useConfigStore();

/** 重新编译效果库（sakura_back_light 改变时） */
export function sakuraReLoadEffect(): void {
    setAnimating(false);
    createEffectLib();
    setAnimating(true);
}

/** 触发窗口尺寸重置（粒子数量变化时） */
export function sakuraResize(): void {
    setAnimating(false);
    onResize();
    setAnimating(true);
}

/** 初始化 WebGL 上下文并启动场景 */
export function sakuraLoad(): void {
    // Phase 7 保护：canvas 元素从 index.html 迁移至 Sakura.vue，
    // window.load / onMounted 都可能触发此函数。gl 非空表示已初始化，跳过。
    if (gl) return;

    const canvasshow = document.getElementById('sakurashow') as HTMLCanvasElement | null;
    const canvas = document.getElementById('sakura') as HTMLCanvasElement | null;

    if (!canvas || !canvasshow) {
        debugLogger.error('[Sakura] Canvas elements not found', {
            hasSakura: !!canvas,
            hasSakurashow: !!canvasshow,
        });
        return;
    }

    try {
        makeCanvasFullScreen(canvas, canvasshow);
        setGl(canvas.getContext('webgl'));
    } catch (e: unknown) {
        const errMsg = e instanceof Error ? e.message : String(e);
        alert('WebGL not supported.' + errMsg);
        debugLogger.error('[Sakura] WebGL context creation threw', { error: e });
        return;
    }

    if (!gl) {
        debugLogger.error('[Sakura] Failed to get WebGL context', null);
        return;
    }

    setViewports();
    createScene();
    initScene();

    timeInfo.start = new Date();
    timeInfo.prev = timeInfo.start;

    animate();
}

/** 把当前 WebGL 帧拷贝到 2D 显示画布（樱花切换为显示时由 propertyHandler 调用） */
export function removesakura(): void {
    const raw = document.getElementById('sakura') as HTMLCanvasElement | null;
    const showCanvas = document.getElementById('sakurashow') as HTMLCanvasElement | null;
    const ctx = showCanvas?.getContext('2d') ?? null;
    if (!ctx || !raw) return;

    if (raw.width > 0 && config.showSakura) {
        ctx.drawImage(
            raw,
            0,
            0,
            window.innerWidth,
            window.innerHeight,
            0,
            0,
            window.innerWidth,
            window.innerHeight
        );
    }
}

/** 注册 window load 事件；模块加载时即执行 */
export function initSakura(): void {
    window.addEventListener('load', sakuraLoad);
}

/** 把 #sakurashow 的 opacity 设为 config.sakura_transparency */
export function applySakuraTransparency(): void {
    const transparency = config.sakura_transparency;
    const ctx = (document.getElementById('sakurashow') as HTMLCanvasElement | null)?.getContext('2d') ?? null;
    if (ctx) {
        ctx.canvas.style.opacity = String(transparency);
    }
}

// 保留 canvas 显隐工具的对外可访问性（propertyHandler 也用得到）
export { makeCanvasFullScreen, makeCanvasHide };

// 模块加载即注册 load 监听器（与原文件底部 initSakura() 调用一致）
initSakura();
