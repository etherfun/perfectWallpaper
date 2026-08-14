/**
 * 樱花效果模块级共享状态
 *
 * 所有 WebGL 渲染管线相关的可变状态集中在此。
 * 其他模块通过 import { gl, renderSpec, ... } 共享同一份状态。
 * animating 用 getter/setter 对以兼容 ES module 不可重赋 import 的限制。
 */

import { Matrix44, Vector3 } from '@/utils/webgl-math';

import type { RenderSpec, TimeInfo } from '../types';

/** WebGL 上下文（运行时由 sakuraLoad 初始化） */
export let gl: WebGLRenderingContext | null = null;
export function setGl(value: WebGLRenderingContext | null): void {
    gl = value;
}

/** 时间累计（由 animate() 每帧更新；毫秒时间戳，避免每帧分配 Date 对象） */
export const timeInfo: TimeInfo = {
    start: Date.now(),
    prev: Date.now(),
    delta: 0,
    elapsed: 0,
};

/** 渲染规格 + 帧缓冲（由 setViewports() 重新创建） */
export const renderSpec: RenderSpec = {
    width: 0,
    height: 0,
    aspect: 1,
    array: new Float32Array(3),
    halfWidth: 0,
    halfHeight: 0,
    halfArray: new Float32Array(3),
    pointSize: { min: 1, max: 1 },
    setSize: function (w: number, h: number): void {
        this.width = w;
        this.height = h;
        this.aspect = this.width / this.height;
        this.array[0] = this.width;
        this.array[1] = this.height;
        this.array[2] = this.aspect;

        this.halfWidth = Math.floor(w / 2);
        this.halfHeight = Math.floor(h / 2);
        this.halfArray[0] = this.halfWidth;
        this.halfArray[1] = this.halfHeight;
        this.halfArray[2] = this.halfWidth / this.halfHeight;
    },
};

/** 透视投影参数 */
export const projection = {
    angle: 60,
    nearfar: new Float32Array([0.1, 100.0]),
    matrix: Matrix44.createIdentity(),
};

/** 摄像机 */
export const camera = {
    position: Vector3.create(0, 0, 100),
    lookat: Vector3.create(0, 0, 0),
    up: Vector3.create(0, 1, 0),
    dof: Vector3.create(10.0, 4.0, 8.0),
    matrix: Matrix44.createIdentity(),
};

/** 场景是否就绪（createScene 完成后为 true） */
export let sceneStandBy = false;
export function setSceneStandBy(value: boolean): void {
    sceneStandBy = value;
}

/** 动画播放开关 —— 通过 getter/setter 暴露，禁止直接 import 变量后赋值 */
let animating = true;
export function getAnimating(): boolean {
    return animating;
}
let _rafRunning = false;

/** 查询 RAF 是否在运行 */
export function getRafRunning(): boolean {
    return _rafRunning;
}

/** 设置 RAF 运行状态 */
export function setRafRunning(value: boolean): void {
    _rafRunning = value;
}

export function setAnimating(value: boolean): void {
    animating = value;
    if (!value) {
        // 停止动画时同时释放 RAF 锁，允许 animate() 重新进入
        _rafRunning = false;
    }
}
