/**
 * 樱花粒子系统初始化
 *
 * BlossomParticle 类（与 setXxx/update 方法）在 types.ts 中定义。
 * pointFlower/effectLib 状态因为与创建/初始化紧耦合，集中在模块顶层。
 * createPointFlowers / initPointFlowers 负责分配缓冲和随机播种。
 */

import { useConfigStore } from '@/stores/config';

const config = useConfigStore();
import { Vector3 } from '@/utils/webgl-math';

import { gl, renderSpec } from '../state/state';
import { BlossomParticle, type EffectLib, type PointFlower } from '../types';
import { createShader, unuseShader, useShader } from './glUtils';

// 重新导出 BlossomParticle 以便其他文件统一从 particles.ts 引用
export { BlossomParticle };

/** 粒子系统状态（被 renderPointFlowers 读写） */
export const pointFlower: PointFlower = {} as PointFlower;

/** 后期效果库状态（被 effects.ts 的 createEffectLib/renderPostProcess 读写） */
export const effectLib: EffectLib = {
    sceneBg: null,
    mkBrightBuf: null,
    dirBlur: null,
    finalComp: null,
};

/**
 * 读取 <script id="sakura_point_vsh">/<script id="sakura_point_fsh">，
 * 编译粒子 shader、分配 GPU 缓冲、创建 BlossomParticle 实例。
 * 必须在 gl 初始化之后调用。
 */
export function createPointFlowers(): void {
    if (!gl) return;

    const prm = gl.getParameter(gl.ALIASED_POINT_SIZE_RANGE);
    renderSpec.pointSize = { min: prm[0], max: prm[1] };

    const vtxsrcEl = document.getElementById('sakura_point_vsh') as HTMLScriptElement | null;
    const frgsrcEl = document.getElementById('sakura_point_fsh') as HTMLScriptElement | null;
    const vtxsrc = vtxsrcEl?.textContent || '';
    const frgsrc = frgsrcEl?.textContent || '';

    pointFlower.program = createShader(
        vtxsrc,
        frgsrc,
        ['uProjection', 'uModelview', 'uResolution', 'uOffset', 'uDOF', 'uFade'],
        ['aPosition', 'aEuler', 'aMisc']
    )!;

    useShader(pointFlower.program);
    pointFlower.offset = new Float32Array([0.0, 0.0, 0.0]);
    pointFlower.fader = Vector3.create(0.0, 10.0, 0.0);

    pointFlower.numFlowers = config.sakura_point_number ?? 0;
    pointFlower.particles = new Array(pointFlower.numFlowers);
    pointFlower.dataArray = new Float32Array(pointFlower.numFlowers * (3 + 3 + 2));
    pointFlower.positionArrayOffset = 0;
    pointFlower.eulerArrayOffset = pointFlower.numFlowers * 3;
    pointFlower.miscArrayOffset = pointFlower.numFlowers * 6;

    pointFlower.buffer = gl.createBuffer()!;
    gl.bindBuffer(gl.ARRAY_BUFFER, pointFlower.buffer);
    gl.bufferData(gl.ARRAY_BUFFER, pointFlower.dataArray, gl.DYNAMIC_DRAW);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);

    unuseShader(pointFlower.program);

    for (let i = 0; i < pointFlower.numFlowers; i++) {
        pointFlower.particles[i] = new BlossomParticle();
    }
}

/**
 * 随机初始化所有粒子的位置/速度/旋转/大小。
 * 窗口 resize 后会重新调用一次，让粒子分布重新匹配新窗口比例。
 */
export function initPointFlowers(): void {
    if (!pointFlower.numFlowers) return;

    pointFlower.area = Vector3.create(20.0, 20.0, 20.0);
    pointFlower.area.x = pointFlower.area.y * renderSpec.aspect;

    pointFlower.fader.x = 10.0;
    pointFlower.fader.y = pointFlower.area.z;
    pointFlower.fader.z = 0.1;

    const PI2 = Math.PI * 2.0;
    const tmpv3 = Vector3.create(0, 0, 0);
    let tmpv: number;
    const symmetryrand = function (): number {
        return Math.random() * 2.0 - 1.0;
    };

    for (let i = 0; i < pointFlower.numFlowers; i++) {
        const tmpprtcl: BlossomParticle = pointFlower.particles[i]!;

        tmpv3.x = symmetryrand() * 0.3 + 0.8;
        tmpv3.y = symmetryrand() * 0.2 - 1.0;
        tmpv3.z = symmetryrand() * 0.3 + 0.5;
        Vector3.normalize(tmpv3);
        tmpv = 2.0 + Math.random() * 1.0;
        tmpprtcl.setVelocity(tmpv3.x * tmpv, tmpv3.y * tmpv, tmpv3.z * tmpv);

        tmpprtcl.setRotation(
            symmetryrand() * PI2 * 0.5,
            symmetryrand() * PI2 * 0.5,
            symmetryrand() * PI2 * 0.5
        );

        tmpprtcl.setPosition(
            symmetryrand() * pointFlower.area.x,
            symmetryrand() * pointFlower.area.y,
            symmetryrand() * pointFlower.area.z
        );

        tmpprtcl.setEulerAngles(
            Math.random() * Math.PI * 2.0,
            Math.random() * Math.PI * 2.0,
            Math.random() * Math.PI * 2.0
        );

        tmpprtcl.setSize(0.9 + Math.random() * 0.1);
    }
}
