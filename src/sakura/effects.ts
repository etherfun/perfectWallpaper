/**
 * 樱花后期效果 (Post-processing)
 *
 * 4 个效果程序：
 *   sceneBg      - 场景背景（夜空颜色）
 *   mkBrightBuf  - 提亮缓冲（生成 bloom 源）
 *   dirBlur      - 方向模糊（横向 + 纵向各 2 次叠加）
 *   finalComp    - 最终合成（亮区 + 原图）
 * 流程：提亮 -> 两次方向模糊 -> 最终合成输出到主画布。
 */

import { config } from '@/utils/config';

import { createShader, unuseShader, useShader } from './glUtils';
import { effectLib } from './particles';
import { ppFinalFsh } from './shaders';
import { gl, renderSpec, timeInfo } from './state';
import type { EffectProgram, RenderTarget, ShaderProgram } from './types';

/** 用 vsh + fsh + 通用 attribute buffer 创建一个效果程序 */
export function createEffectProgram(
    vtxsrc: string,
    frgsrc: string,
    exunifs?: string[],
    exattrs?: string[]
): EffectProgram | null {
    if (!gl) return null;

    const unifs = ['uResolution', 'uSrc', 'uDelta'].concat(exunifs || []);
    const attrs = ['aPosition'].concat(exattrs || []);

    const prog: ShaderProgram | null = createShader(vtxsrc, frgsrc, unifs, attrs);
    if (!prog) return null;

    useShader(prog);

    const dataArray = new Float32Array([-1.0, -1.0, 1.0, -1.0, -1.0, 1.0, 1.0, 1.0]);
    const buffer = gl.createBuffer()!;
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, dataArray, gl.STATIC_DRAW);

    gl.bindBuffer(gl.ARRAY_BUFFER, null);
    unuseShader(prog);

    return { program: prog, buffer };
}

// WebGL uniform 查找（prog.uniforms[name]）返回 WebGLUniformLocation | undefined，
// 但 WebGL API（gl.uniform*f）只接受 WebGLUniformLocation | null。
// 用 `?? null` 收敛到 API 期望的 null 形态；这与"该 uniform 真的未找到"无法在类型层区分，
// 故下方所有 effect 调用点统一走 `?? null` 而不是更显式的三元表达式。
/** 绑定 effect program + 设置 uResolution/uDelta + 绑定源纹理到 TEXTURE0 */
export function useEffect(fxobj: EffectProgram, srctex: RenderTarget | null | undefined): void {
    if (!gl || !fxobj || !fxobj.program) return;
    const prog = fxobj.program;
    useShader(prog);
    gl.uniform3fv(prog.uniforms.uResolution ?? null, renderSpec.array);

    if (srctex != null) {
        gl.uniform2fv(prog.uniforms.uDelta ?? null, srctex.dtxArray);
        gl.uniform1i(prog.uniforms.uSrc ?? null, 0);
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, srctex.texture);
    }
}

/** 全屏 TRIANGLE_STRIP 绘制（4 顶点） */
export function drawEffect(fxobj: EffectProgram): void {
    if (!gl || !fxobj || !fxobj.buffer) return;
    gl.bindBuffer(gl.ARRAY_BUFFER, fxobj.buffer);
    gl.vertexAttribPointer(fxobj.program.attributes.aPosition!, 2, gl.FLOAT, false, 0, 0);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
}

/** 关闭 program 绑定 */
export function unuseEffect(fxobj: EffectProgram): void {
    if (!fxobj || !fxobj.program) return;
    unuseShader(fxobj.program);
}

/** 编译并初始化 4 个效果程序；ppFinalFsh 在此处拼接 sakuraBackLight 透明度 */
export function createEffectLib(): void {
    const cmnvtxsrc =
        (document.getElementById('fx_common_vsh') as HTMLScriptElement).textContent || '';

    // background
    let frgsrc = (document.getElementById('bg_fsh') as HTMLScriptElement).textContent || '';
    effectLib.sceneBg = createEffectProgram(cmnvtxsrc, frgsrc, ['uTimes'], undefined);

    // make brightpixels buffer
    frgsrc = (document.getElementById('fx_brightbuf_fsh') as HTMLScriptElement).textContent || '';
    effectLib.mkBrightBuf = createEffectProgram(cmnvtxsrc, frgsrc, undefined, undefined);

    // direction blur
    frgsrc = (document.getElementById('fx_dirblur_r4_fsh') as HTMLScriptElement).textContent || '';
    effectLib.dirBlur = createEffectProgram(cmnvtxsrc, frgsrc, ['uBlurDir'], undefined);

    // final composite
    const vtxsrc = (document.getElementById('pp_final_vsh') as HTMLScriptElement).textContent || '';
    const sakuraBackLight = config.sakura_back_light;
    frgsrc =
        ppFinalFsh +
        'gl_FragColor = vec4(col.rgb, ' +
        (1.1 - sakuraBackLight).toFixed(2) +
        ');        gl_FragColor.a = ' +
        (1.1 - sakuraBackLight).toFixed(2) +
        ';    }';
    effectLib.finalComp = createEffectProgram(vtxsrc, frgsrc, ['uBloom'], undefined);
}

/** 渲染背景层；sakura_background 关闭时整段跳过 */
export function renderBackground(): void {
    if (!gl || !config.sakura_background || !effectLib.sceneBg) return;

    gl.disable(gl.DEPTH_TEST);
    useEffect(effectLib.sceneBg, null);
    gl.uniform2f(
        effectLib.sceneBg.program.uniforms.uTimes ?? null,
        timeInfo.elapsed,
        timeInfo.delta
    );
    drawEffect(effectLib.sceneBg);
    unuseEffect(effectLib.sceneBg);
    gl.enable(gl.DEPTH_TEST);
}

/**
 * 后处理：mainRT -> mkBrightBuf -> dirBlur*2 -> finalComp 到主画布。
 * 任一 effect 未初始化时整段跳过。
 */
export function renderPostProcess(): void {
    if (!gl) return;

    if (!effectLib.mkBrightBuf || !effectLib.dirBlur || !effectLib.finalComp) {
        return;
    }

    gl.disable(gl.DEPTH_TEST);

    const bindRT = function (rt: RenderTarget, isclear: boolean): void {
        gl!.bindFramebuffer(gl!.FRAMEBUFFER, rt.frameBuffer);
        gl!.viewport(0, 0, rt.width, rt.height);
        if (isclear) {
            gl!.clearColor(0, 0, 0, 0);
            gl!.clear(gl!.COLOR_BUFFER_BIT | gl!.DEPTH_BUFFER_BIT);
        }
    };

    // make bright buff
    bindRT(renderSpec.wHalfRT0!, true);
    useEffect(effectLib.mkBrightBuf, renderSpec.mainRT);
    drawEffect(effectLib.mkBrightBuf);
    unuseEffect(effectLib.mkBrightBuf);

    // make bloom
    for (let i = 0; i < 2; i++) {
        const p = 1.5 + 1 * i;
        const s = 2.0 + 1 * i;
        bindRT(renderSpec.wHalfRT1!, true);
        useEffect(effectLib.dirBlur, renderSpec.wHalfRT0);
        if (effectLib.dirBlur.program) {
            gl.uniform4f(effectLib.dirBlur.program.uniforms.uBlurDir ?? null, p, 0.0, s, 0.0);
        }
        drawEffect(effectLib.dirBlur);
        unuseEffect(effectLib.dirBlur);

        bindRT(renderSpec.wHalfRT0!, true);
        useEffect(effectLib.dirBlur, renderSpec.wHalfRT1);
        if (effectLib.dirBlur.program) {
            gl.uniform4f(effectLib.dirBlur.program.uniforms.uBlurDir ?? null, 0.0, p, 0.0, s);
        }
        drawEffect(effectLib.dirBlur);
        unuseEffect(effectLib.dirBlur);
    }

    // display
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.viewport(0, 0, renderSpec.width, renderSpec.height);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    useEffect(effectLib.finalComp, renderSpec.mainRT);
    if (effectLib.finalComp.program) {
        gl.uniform1i(effectLib.finalComp.program.uniforms.uBloom ?? null, 1);
    }
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, renderSpec.wHalfRT0!.texture);
    drawEffect(effectLib.finalComp);
    unuseEffect(effectLib.finalComp);

    gl.enable(gl.DEPTH_TEST);
}
