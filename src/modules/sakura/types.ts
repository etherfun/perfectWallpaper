/**
 * 樱花效果类型定义
 */

import type { Vec3 } from '@/utils/webgl-math';

export interface TimeInfo {
    /** 起始时间戳（Date.now() 毫秒） */
    start: number;
    /** 上一帧时间戳（Date.now() 毫秒） */
    prev: number;
    delta: number;
    elapsed: number;
}

export interface RenderTarget {
    width: number;
    height: number;
    sizeArray: Float32Array;
    dtxArray: Float32Array;
    frameBuffer: WebGLFramebuffer;
    renderBuffer: WebGLRenderbuffer;
    texture: WebGLTexture;
}

export interface RenderSpec {
    width: number;
    height: number;
    aspect: number;
    array: Float32Array;
    halfWidth: number;
    halfHeight: number;
    halfArray: Float32Array;
    pointSize: { min: number; max: number };
    setSize: (w: number, h: number) => void;
    mainRT?: RenderTarget;
    wFullRT0?: RenderTarget;
    wFullRT1?: RenderTarget;
    wHalfRT0?: RenderTarget;
    wHalfRT1?: RenderTarget;
}

export interface ShaderProgram {
    program: WebGLProgram;
    uniforms: Record<string, WebGLUniformLocation>;
    attributes: Record<string, number>;
}

/**
 * 单朵樱花粒子。
 * 声明为 class（保留原文件中方法的实现），
 * 以便 pointFlower.particles: BlossomParticle[] 的元素能直接调用 update/setXxx。
 */
export class BlossomParticle {
    public velocity: [number, number, number] = [0, 0, 0];
    public rotation: [number, number, number] = [0, 0, 0];
    public position: [number, number, number] = [0, 0, 0];
    public euler: [number, number, number] = [0, 0, 0];
    public size: number = 1.0;
    public alpha: number = 1.0;
    public zkey: number = 0.0;

    public setVelocity(vx: number, vy: number, vz: number): void {
        this.velocity[0] = vx;
        this.velocity[1] = vy;
        this.velocity[2] = vz;
    }

    public setRotation(rx: number, ry: number, rz: number): void {
        this.rotation[0] = rx;
        this.rotation[1] = ry;
        this.rotation[2] = rz;
    }

    public setPosition(nx: number, ny: number, nz: number): void {
        this.position[0] = nx;
        this.position[1] = ny;
        this.position[2] = nz;
    }

    public setEulerAngles(rx: number, ry: number, rz: number): void {
        this.euler[0] = rx;
        this.euler[1] = ry;
        this.euler[2] = rz;
    }

    public setSize(s: number): void {
        this.size = s;
    }

    public update(dt: number, _et: number): void {
        this.position[0] += this.velocity[0] * dt;
        this.position[1] += this.velocity[1] * dt;
        this.position[2] += this.velocity[2] * dt;
        this.euler[0] += this.rotation[0] * dt;
        this.euler[1] += this.rotation[1] * dt;
        this.euler[2] += this.rotation[2] * dt;
    }
}

export interface PointFlower {
    program: ShaderProgram;
    numFlowers: number;
    particles: BlossomParticle[];
    dataArray: Float32Array;
    positionArrayOffset: number;
    eulerArrayOffset: number;
    miscArrayOffset: number;
    buffer: WebGLBuffer;
    offset: Float32Array;
    fader: Vec3;
    area: Vec3;
}

export interface EffectProgram {
    program: ShaderProgram;
    buffer: WebGLBuffer;
}

export interface EffectLib {
    sceneBg: EffectProgram | null;
    mkBrightBuf: EffectProgram | null;
    dirBlur: EffectProgram | null;
    finalComp: EffectProgram | null;
}
