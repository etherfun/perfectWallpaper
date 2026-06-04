/**
 * 樱花粒子渲染 (每帧调用)
 *
 * 单帧流程：
 *  1. update() 推进所有粒子位置/欧拉角
 *  2. 越界则 wrap 回场景区域（正反方向各有一套边界规则）
 *  3. 欧拉角取模到 [0, 2π)
 *  4. 计算 alpha（反向模式下按 z 深度衰减）和 zkey
 *  5. 按 zkey 排序，序列化到 Float32Array
 *  6. 上传缓冲，绑定 vertex attribute
 *  7. 9 次 drawArrays (4 角 * 2 z + main) 实现场景平铺
 */

import { config } from '@/utils/config';
import { Vector3 } from '@/utils/webgl-math';

import { unuseShader, useShader } from './glUtils';
import { pointFlower } from './particles';
import { camera, gl, projection, renderSpec, timeInfo } from './state';
import type { BlossomParticle } from './types';

export function renderPointFlowers(): void {
    if (!gl || !pointFlower.program) return;

    const PI2 = Math.PI * 2.0;
    const sakuraReverse = config.sakura_reverse;

    const repeatPos = function (prt: BlossomParticle, cmp: number, limitVal: number): void {
        const posCmp = prt.position[cmp] ?? 0;
        if (Math.abs(posCmp) - prt.size * 0.5 > limitVal) {
            if (posCmp > 0) {
                prt.position[cmp] = posCmp - limitVal * 2.0;
            } else {
                prt.position[cmp] = posCmp + limitVal * 2.0;
            }
        }
    };

    const repeatPoss = function (
        prt: BlossomParticle,
        cmp: number,
        limit1: number,
        limit2: number
    ): void {
        const posCmp = prt.position[cmp] ?? 0;
        if (posCmp + prt.size * 0.5 < limit1 || posCmp - prt.size * 0.5 > limit2) {
            if (posCmp - prt.size * 0.5 > limit1) {
                prt.position[cmp] = posCmp - (limit2 - limit1);
            } else {
                prt.position[cmp] = posCmp + (limit2 - limit1);
            }
        }
    };

    const repeatEuler = function (prt: BlossomParticle, cmp: number): void {
        const eulerCmp = prt.euler[cmp] ?? 0;
        const wrapped = eulerCmp % PI2;
        prt.euler[cmp] = wrapped < 0.0 ? wrapped + PI2 : wrapped;
    };

    for (let i = 0; i < pointFlower.numFlowers; i++) {
        const prtcl = pointFlower.particles[i]!;
        if (sakuraReverse) {
            prtcl.update(-timeInfo.delta, timeInfo.elapsed);
            repeatPoss(prtcl, 0, -pointFlower.area.x, pointFlower.area.x);
            repeatPoss(prtcl, 1, -pointFlower.area.y, pointFlower.area.y);
            repeatPoss(prtcl, 2, -2 * pointFlower.area.z + 10.0, 10.0);
        } else {
            prtcl.update(timeInfo.delta, timeInfo.elapsed);
            repeatPos(prtcl, 0, pointFlower.area.x);
            repeatPos(prtcl, 1, pointFlower.area.y);
            repeatPos(prtcl, 2, pointFlower.area.z);
        }

        repeatEuler(prtcl, 0);
        repeatEuler(prtcl, 1);
        repeatEuler(prtcl, 2);

        if (sakuraReverse) {
            prtcl.alpha = (pointFlower.area.z - prtcl.position[2]) * 0.5;
        } else {
            prtcl.alpha = 1.0;
        }
        prtcl.zkey =
            camera.matrix[2]! * prtcl.position[0] +
            camera.matrix[6]! * prtcl.position[1] +
            camera.matrix[10]! * prtcl.position[2] +
            camera.matrix[14]!;
    }

    pointFlower.particles.sort(function (p0: BlossomParticle, p1: BlossomParticle): number {
        return p0.zkey - p1.zkey;
    });

    let ipos = pointFlower.positionArrayOffset;
    let ieuler = pointFlower.eulerArrayOffset;
    let imisc = pointFlower.miscArrayOffset;
    for (let i = 0; i < pointFlower.numFlowers; i++) {
        const prtcl = pointFlower.particles[i]!;
        pointFlower.dataArray[ipos] = prtcl.position[0];
        pointFlower.dataArray[ipos + 1] = prtcl.position[1];
        pointFlower.dataArray[ipos + 2] = prtcl.position[2];
        ipos += 3;
        pointFlower.dataArray[ieuler] = prtcl.euler[0];
        pointFlower.dataArray[ieuler + 1] = prtcl.euler[1];
        pointFlower.dataArray[ieuler + 2] = prtcl.euler[2];
        ieuler += 3;
        pointFlower.dataArray[imisc] = prtcl.size;
        pointFlower.dataArray[imisc + 1] = prtcl.alpha;
        imisc += 2;
    }

    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    const prog = pointFlower.program;
    useShader(prog);

    gl.uniformMatrix4fv(prog.uniforms.uProjection!, false, projection.matrix);
    gl.uniformMatrix4fv(prog.uniforms.uModelview!, false, camera.matrix);
    gl.uniform3fv(prog.uniforms.uResolution!, renderSpec.array);
    gl.uniform3fv(prog.uniforms.uDOF!, Vector3.arrayForm(camera.dof));
    gl.uniform3fv(prog.uniforms.uFade!, Vector3.arrayForm(pointFlower.fader));

    gl.bindBuffer(gl.ARRAY_BUFFER, pointFlower.buffer);
    gl.bufferData(gl.ARRAY_BUFFER, pointFlower.dataArray, gl.DYNAMIC_DRAW);

    gl.vertexAttribPointer(
        prog.attributes.aPosition!,
        3,
        gl.FLOAT,
        false,
        0,
        pointFlower.positionArrayOffset * Float32Array.BYTES_PER_ELEMENT
    );
    gl.vertexAttribPointer(
        prog.attributes.aEuler!,
        3,
        gl.FLOAT,
        false,
        0,
        pointFlower.eulerArrayOffset * Float32Array.BYTES_PER_ELEMENT
    );
    gl.vertexAttribPointer(
        prog.attributes.aMisc!,
        2,
        gl.FLOAT,
        false,
        0,
        pointFlower.miscArrayOffset * Float32Array.BYTES_PER_ELEMENT
    );

    // doubler: 在 4 个角偏移位置再画一次，营造场景无限延展
    for (let i = 1; i < 2; i++) {
        const zpos = i * -2.0;
        pointFlower.offset[0] = pointFlower.area.x * -1.0;
        pointFlower.offset[1] = pointFlower.area.y * -1.0;
        pointFlower.offset[2] = pointFlower.area.z * zpos;
        gl.uniform3fv(prog.uniforms.uOffset!, pointFlower.offset);
        gl.drawArrays(gl.POINTS, 0, pointFlower.numFlowers);

        pointFlower.offset[0] = pointFlower.area.x * -1.0;
        pointFlower.offset[1] = pointFlower.area.y * 1.0;
        pointFlower.offset[2] = pointFlower.area.z * zpos;
        gl.uniform3fv(prog.uniforms.uOffset!, pointFlower.offset);
        gl.drawArrays(gl.POINTS, 0, pointFlower.numFlowers);

        pointFlower.offset[0] = pointFlower.area.x * 1.0;
        pointFlower.offset[1] = pointFlower.area.y * -1.0;
        pointFlower.offset[2] = pointFlower.area.z * zpos;
        gl.uniform3fv(prog.uniforms.uOffset!, pointFlower.offset);
        gl.drawArrays(gl.POINTS, 0, pointFlower.numFlowers);

        pointFlower.offset[0] = pointFlower.area.x * 1.0;
        pointFlower.offset[1] = pointFlower.area.y * 1.0;
        pointFlower.offset[2] = pointFlower.area.z * zpos;
        gl.uniform3fv(prog.uniforms.uOffset!, pointFlower.offset);
        gl.drawArrays(gl.POINTS, 0, pointFlower.numFlowers);
    }

    // main
    pointFlower.offset[0] = 0.0;
    pointFlower.offset[1] = 0.0;
    pointFlower.offset[2] = 0.0;
    gl.uniform3fv(prog.uniforms.uOffset!, pointFlower.offset);
    gl.drawArrays(gl.POINTS, 0, pointFlower.numFlowers);

    gl.bindBuffer(gl.ARRAY_BUFFER, null);
    unuseShader(prog);

    gl.enable(gl.DEPTH_TEST);
    gl.disable(gl.BLEND);
}
