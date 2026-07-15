/**
 * 场景编排：创建/初始化/渲染/视口
 *
 * createScene 触发 effectLib 创建 + particle 缓冲分配
 * initScene  重算相机投影和粒子区域（窗口比例变化时）
 * renderScene 单帧入口：lookAt -> clear -> background -> particles -> post-process
 * setViewports 重新分配 5 个 RenderTarget；onResize 包装为窗口尺寸变化入口
 */

import { useConfigStore } from '@/stores/config';

const config = useConfigStore();
import { Matrix44 } from '@/utils/webgl-math';

import { createEffectLib, renderBackground, renderPostProcess } from '../effect/effects';
import { camera, gl, projection, renderSpec, sceneStandBy, setSceneStandBy } from '../state/state';
import type { RenderTarget } from '../types';
import { makeCanvasFullScreen } from './canvas';
import { createRenderTarget, deleteRenderTarget } from './glUtils';
import { createPointFlowers, initPointFlowers, pointFlower } from './particles';
import { renderPointFlowers } from './pointFlowersRender';

/** 创建效果库 + 粒子系统，标记 sceneStandBy = true */
export function createScene(): void {
    createEffectLib();
    createPointFlowers();
    setSceneStandBy(true);
}

/** 重新计算相机投影 + 粒子播种（窗口 resize 时调用） */
export function initScene(): void {
    initPointFlowers();

    camera.position.z = pointFlower.area.z + (projection.nearfar[0] ?? 0);
    projection.angle =
        ((Math.atan2(pointFlower.area.y, camera.position.z + pointFlower.area.z) * 180.0) /
            Math.PI) *
        2.0;
    Matrix44.loadProjection(
        projection.matrix,
        renderSpec.aspect,
        projection.angle,
        projection.nearfar[0] ?? 0,
        projection.nearfar[1] ?? 0
    );
}

/** 单帧：lookAt、清屏、背景、粒子、后期 */
export function renderScene(): void {
    if (!gl || !sceneStandBy) return;

    Matrix44.loadLookAt(camera.matrix, camera.position, camera.lookat, camera.up);

    gl.enable(gl.DEPTH_TEST);

    gl.bindFramebuffer(gl.FRAMEBUFFER, renderSpec.mainRT!.frameBuffer);
    gl.viewport(0, 0, renderSpec.mainRT!.width, renderSpec.mainRT!.height);
    if (config.sakura_back_color) {
        gl.clearColor(0.005, 0, 0.05, 0);
    } else {
        gl.clearColor(0, 0, 0, 0);
    }
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    renderBackground();
    renderPointFlowers();
    renderPostProcess();
}

/** 重新分配 5 个 RenderTarget（mainRT + 2 full + 2 half） */
export function setViewports(): void {
    if (!gl) return;

    renderSpec.setSize(gl.canvas.width, gl.canvas.height);

    gl.clearColor(0.2, 0.2, 0.5, 1.0);
    gl.viewport(0, 0, renderSpec.width, renderSpec.height);

    const rtfunc = function (rtname: keyof typeof renderSpec, rtw: number, rth: number): void {
        const rt = renderSpec[rtname];
        if (rt && typeof rt === 'object' && 'frameBuffer' in rt) {
            deleteRenderTarget(rt as RenderTarget);
        }
        (renderSpec as unknown as Record<string, RenderTarget>)[rtname] = createRenderTarget(
            rtw,
            rth
        );
    };

    rtfunc('mainRT', renderSpec.width, renderSpec.height);
    rtfunc('wFullRT0', renderSpec.width, renderSpec.height);
    rtfunc('wFullRT1', renderSpec.width, renderSpec.height);
    rtfunc('wHalfRT0', renderSpec.halfWidth, renderSpec.halfHeight);
    rtfunc('wHalfRT1', renderSpec.halfWidth, renderSpec.halfHeight);
}

/** 窗口尺寸变化：canvas 重置 + 视口重建 + 场景重播种 */
export function onResize(): void {
    const canvas = document.getElementById('sakura') as HTMLCanvasElement | null;
    const canvasshow = document.getElementById('sakurashow') as HTMLCanvasElement | null;

    if (canvas && canvasshow) {
        makeCanvasFullScreen(canvas, canvasshow);
    }
    setViewports();
    if (sceneStandBy) {
        initScene();
    }
}
