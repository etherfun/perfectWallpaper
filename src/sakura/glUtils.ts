/**
 * WebGL 工具函数
 *
 * 帧缓冲 (RenderTarget) 创建/销毁、ShaderProgram 编译/链接/绑定。
 * 所有函数通过 import { gl } 共享 state.ts 的 WebGL 上下文。
 */

import { debugLogger } from '@/utils/logger';

import { gl } from './state';
import type { RenderTarget, ShaderProgram } from './types';

/** 删除一个帧缓冲对象释放 GPU 资源 */
export function deleteRenderTarget(rt: RenderTarget): void {
    if (!gl) return;
    gl.deleteFramebuffer(rt.frameBuffer);
    gl.deleteRenderbuffer(rt.renderBuffer);
    gl.deleteTexture(rt.texture);
}

/** 创建一个 RGBA8 + Depth16 帧缓冲对象 */
export function createRenderTarget(w: number, h: number): RenderTarget {
    if (!gl) throw new Error('WebGL not initialized');

    const ret: RenderTarget = {
        width: w,
        height: h,
        sizeArray: new Float32Array([w, h, w / h]),
        dtxArray: new Float32Array([1.0 / w, 1.0 / h]),
        frameBuffer: gl.createFramebuffer()!,
        renderBuffer: gl.createRenderbuffer()!,
        texture: gl.createTexture()!,
    };

    gl.bindTexture(gl.TEXTURE_2D, ret.texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, w, h, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);

    gl.bindFramebuffer(gl.FRAMEBUFFER, ret.frameBuffer);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, ret.texture, 0);

    gl.bindRenderbuffer(gl.RENDERBUFFER, ret.renderBuffer);
    gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, w, h);
    gl.framebufferRenderbuffer(
        gl.FRAMEBUFFER,
        gl.DEPTH_ATTACHMENT,
        gl.RENDERBUFFER,
        ret.renderBuffer
    );

    gl.bindTexture(gl.TEXTURE_2D, null);
    gl.bindRenderbuffer(gl.RENDERBUFFER, null);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);

    return ret;
}

/** 编译单个 shader；失败时通过 debugLogger 记录并返回 null */
export function compileShader(shtype: number, shsrc: string): WebGLShader | null {
    if (!gl) return null;

    const retsh = gl.createShader(shtype);
    if (!retsh) return null;

    gl.shaderSource(retsh, shsrc);
    gl.compileShader(retsh);

    if (!gl.getShaderParameter(retsh, gl.COMPILE_STATUS)) {
        const errlog = gl.getShaderInfoLog(retsh);
        gl.deleteShader(retsh);
        debugLogger.error('[Sakura] Shader compile failed', { errlog });
        return null;
    }
    return retsh;
}

/** 链接顶点+片段 shader 为 ShaderProgram，收集 uniforms/attributes */
export function createShader(
    vtxsrc: string,
    frgsrc: string,
    uniformlist: string[],
    attrlist: string[]
): ShaderProgram | null {
    if (!gl) return null;

    const vsh = compileShader(gl.VERTEX_SHADER, vtxsrc);
    const fsh = compileShader(gl.FRAGMENT_SHADER, frgsrc);

    if (vsh == null || fsh == null) return null;

    const prog = gl.createProgram()!;
    gl.attachShader(prog, vsh);
    gl.attachShader(prog, fsh);

    gl.deleteShader(vsh);
    gl.deleteShader(fsh);

    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
        const errlog = gl.getProgramInfoLog(prog);
        debugLogger.error('[Sakura] Program link failed', { errlog });
        return null;
    }

    const result: ShaderProgram = {
        program: prog,
        uniforms: {},
        attributes: {},
    };

    for (let i = 0; i < uniformlist.length; i++) {
        result.uniforms[uniformlist[i]] = gl!.getUniformLocation(prog, uniformlist[i])!;
    }

    for (let i = 0; i < attrlist.length; i++) {
        result.attributes[attrlist[i]] = gl!.getAttribLocation(prog, attrlist[i]);
    }

    return result;
}

/** 启用 program 及全部 vertex attribute */
export function useShader(prog: ShaderProgram): void {
    if (!gl) return;
    gl.useProgram(prog.program);
    for (const attr in prog.attributes) {
        gl.enableVertexAttribArray(prog.attributes[attr]);
    }
}

/** 关闭 program 的全部 vertex attribute 并解绑 program */
export function unuseShader(prog: ShaderProgram): void {
    if (!gl) return;
    for (const attr in prog.attributes) {
        gl.disableVertexAttribArray(prog.attributes[attr]);
    }
    gl.useProgram(null);
}
