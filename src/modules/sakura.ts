/**
 * 樱花效果模块
 * WebGL实现的樱花飘落效果
 */

import { config } from '../utils/config';
import { elements } from '../utils/elementManager';

// 片段着色器
let pp_final_fsh = '#ifdef GL_ES\nprecision highp float;\n#endif\nuniform sampler2D uSrc;    uniform sampler2D uBloom;    uniform vec2 uDelta;    varying vec2 texCoord;    varying vec2 screenCoord;    void main(void) {        vec4 srccol = texture2D(uSrc, texCoord) * 2.0;        vec4 bloomcol = texture2D(uBloom, texCoord);        vec4 col;        col = srccol + bloomcol * (vec4(1.0) + srccol);        col *= smoothstep(1.0, 0.0, pow(length((texCoord - vec2(0.5)) * 2.0), 1.2) * 0.5);        col = pow(col, vec4(0.45454545454545));         ';

// ==================== Math Utilities ====================

interface Vec3 {
    x: number;
    y: number;
    z: number;
    array?: Float32Array;
}

const Vector3 = {
    create: function (x: number, y: number, z: number): Vec3 {
        return { 'x': x, 'y': y, 'z': z };
    },

    dot: function (v0: Vec3, v1: Vec3): number {
        return v0.x * v1.x + v0.y * v1.y + v0.z * v1.z;
    },

    cross: function (v: Vec3, v0: Vec3, v1: Vec3): void {
        v.x = v0.y * v1.z - v0.z * v1.y;
        v.y = v0.z * v1.x - v0.x * v1.z;
        v.z = v0.x * v1.y - v0.y * v1.x;
    },

    normalize: function (v: Vec3): void {
        const l = v.x * v.x + v.y * v.y + v.z * v.z;
        if (l > 0.00001) {
            const invL = 1.0 / Math.sqrt(l);
            v.x *= invL;
            v.y *= invL;
            v.z *= invL;
        }
    },

    arrayForm: function (v: Vec3): Float32Array {
        if (v.array) {
            v.array[0] = v.x;
            v.array[1] = v.y;
            v.array[2] = v.z;
        } else {
            v.array = new Float32Array([v.x, v.y, v.z]);
        }
        return v.array;
    }
};

// 4x4矩阵工具
const Matrix44 = {
    createIdentity: function (): Float32Array {
        return new Float32Array([
            1.0, 0.0, 0.0, 0.0,
            0.0, 1.0, 0.0, 0.0,
            0.0, 0.0, 1.0, 0.0,
            0.0, 0.0, 0.0, 1.0
        ]);
    },

    loadProjection: function (m: Float32Array, aspect: number, vdeg: number, near: number, far: number): void {
        const h = near * Math.tan(vdeg * Math.PI / 180.0 * 0.5) * 2.0;
        const w = h * aspect;

        m[0] = 2.0 * near / w; m[1] = 0.0; m[2] = 0.0; m[3] = 0.0;
        m[4] = 0.0; m[5] = 2.0 * near / h; m[6] = 0.0; m[7] = 0.0;
        m[8] = 0.0; m[9] = 0.0; m[10] = -(far + near) / (far - near); m[11] = -1.0;
        m[12] = 0.0; m[13] = 0.0; m[14] = -2.0 * far * near / (far - near); m[15] = 0.0;
    },

    loadLookAt: function (m: Float32Array, vpos: Vec3, vlook: Vec3, vup: Vec3): void {
        const frontv = Vector3.create(vpos.x - vlook.x, vpos.y - vlook.y, vpos.z - vlook.z);
        Vector3.normalize(frontv);
        const sidev = Vector3.create(1.0, 0.0, 0.0);
        Vector3.cross(sidev, vup, frontv);
        Vector3.normalize(sidev);
        const topv = Vector3.create(1.0, 0.0, 0.0);
        Vector3.cross(topv, frontv, sidev);
        Vector3.normalize(topv);

        m[0] = sidev.x; m[1] = topv.x; m[2] = frontv.x; m[3] = 0.0;
        m[4] = sidev.y; m[5] = topv.y; m[6] = frontv.y; m[7] = 0.0;
        m[8] = sidev.z; m[9] = topv.z; m[10] = frontv.z; m[11] = 0.0;
        m[12] = -(vpos.x * m[0] + vpos.y * m[4] + vpos.z * m[8]);
        m[13] = -(vpos.x * m[1] + vpos.y * m[5] + vpos.z * m[9]);
        m[14] = -(vpos.x * m[2] + vpos.y * m[6] + vpos.z * m[10]);
        m[15] = 1.0;
    }
};

// ==================== Render Spec ====================

interface TimeInfo {
    start: Date;
    prev: Date;
    delta: number;
    elapsed: number;
}

interface RenderSpec {
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

interface RenderTarget {
    width: number;
    height: number;
    sizeArray: Float32Array;
    dtxArray: Float32Array;
    frameBuffer: WebGLFramebuffer;
    renderBuffer: WebGLRenderbuffer;
    texture: WebGLTexture;
}

const timeInfo: TimeInfo = {
    start: new Date(),
    prev: new Date(),
    delta: 0,
    elapsed: 0
};

const renderSpec: RenderSpec = {
    width: 0,
    height: 0,
    aspect: 1,
    array: new Float32Array(3),
    halfWidth: 0,
    halfHeight: 0,
    halfArray: new Float32Array(3),
    pointSize: { min: 1, max: 1 },
    setSize: function (w: number, h: number) {
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
    }
};

// ==================== WebGL Utilities ====================

let gl: WebGLRenderingContext | null = null;

function deleteRenderTarget(rt: RenderTarget): void {
    if (!gl) return;
    gl.deleteFramebuffer(rt.frameBuffer);
    gl.deleteRenderbuffer(rt.renderBuffer);
    gl.deleteTexture(rt.texture);
}

function createRenderTarget(w: number, h: number): RenderTarget {
    if (!gl) throw new Error('WebGL not initialized');

    const ret: RenderTarget = {
        width: w,
        height: h,
        sizeArray: new Float32Array([w, h, w / h]),
        dtxArray: new Float32Array([1.0 / w, 1.0 / h]),
        frameBuffer: gl.createFramebuffer()!,
        renderBuffer: gl.createRenderbuffer()!,
        texture: gl.createTexture()!
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
    gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, ret.renderBuffer);

    gl.bindTexture(gl.TEXTURE_2D, null);
    gl.bindRenderbuffer(gl.RENDERBUFFER, null);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);

    return ret;
}

function compileShader(shtype: number, shsrc: string): WebGLShader | null {
    if (!gl) return null;

    const retsh = gl.createShader(shtype);
    if (!retsh) return null;

    gl.shaderSource(retsh, shsrc);
    gl.compileShader(retsh);

    if (!gl.getShaderParameter(retsh, gl.COMPILE_STATUS)) {
        const errlog = gl.getShaderInfoLog(retsh);
        gl.deleteShader(retsh);
        console.error(errlog);
        return null;
    }
    return retsh;
}

interface ShaderProgram {
    program: WebGLProgram;
    uniforms: Record<string, WebGLUniformLocation>;
    attributes: Record<string, number>;
}

function createShader(vtxsrc: string, frgsrc: string, uniformlist: string[], attrlist: string[]): ShaderProgram | null {
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
        console.error(errlog);
        return null;
    }

    const result: ShaderProgram = {
        program: prog,
        uniforms: {},
        attributes: {}
    };

    for (let i = 0; i < uniformlist.length; i++) {
        result.uniforms[uniformlist[i]] = gl!.getUniformLocation(prog, uniformlist[i])!;
    }

    for (let i = 0; i < attrlist.length; i++) {
        result.attributes[attrlist[i]] = gl!.getAttribLocation(prog, attrlist[i]);
    }

    return result;
}

function useShader(prog: ShaderProgram): void {
    if (!gl) return;
    gl.useProgram(prog.program);
    for (const attr in prog.attributes) {
        gl.enableVertexAttribArray(prog.attributes[attr]);
    }
}

function unuseShader(prog: ShaderProgram): void {
    if (!gl) return;
    for (const attr in prog.attributes) {
        gl.disableVertexAttribArray(prog.attributes[attr]);
    }
    gl.useProgram(null);
}

// ==================== Camera & Projection ====================

const projection = {
    angle: 60,
    nearfar: new Float32Array([0.1, 100.0]),
    matrix: Matrix44.createIdentity()
};

const camera = {
    position: Vector3.create(0, 0, 100),
    lookat: Vector3.create(0, 0, 0),
    up: Vector3.create(0, 1, 0),
    dof: Vector3.create(10.0, 4.0, 8.0),
    matrix: Matrix44.createIdentity()
};

// ==================== Point Flower (Particle System) ====================

interface PointFlower {
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

class BlossomParticle {
    velocity: number[];
    rotation: number[];
    position: number[];
    euler: number[];
    size: number;
    alpha: number;
    zkey: number;

    constructor() {
        this.velocity = new Array(3);
        this.rotation = new Array(3);
        this.position = new Array(3);
        this.euler = new Array(3);
        this.size = 1.0;
        this.alpha = 1.0;
        this.zkey = 0.0;
    }

    setVelocity(vx: number, vy: number, vz: number): void {
        this.velocity[0] = vx; this.velocity[1] = vy; this.velocity[2] = vz;
    }

    setRotation(rx: number, ry: number, rz: number): void {
        this.rotation[0] = rx; this.rotation[1] = ry; this.rotation[2] = rz;
    }

    setPosition(nx: number, ny: number, nz: number): void {
        this.position[0] = nx; this.position[1] = ny; this.position[2] = nz;
    }

    setEulerAngles(rx: number, ry: number, rz: number): void {
        this.euler[0] = rx; this.euler[1] = ry; this.euler[2] = rz;
    }

    setSize(s: number): void {
        this.size = s;
    }

    update(dt: number, _et: number): void {
        this.position[0] += this.velocity[0] * dt;
        this.position[1] += this.velocity[1] * dt;
        this.position[2] += this.velocity[2] * dt;
        this.euler[0] += this.rotation[0] * dt;
        this.euler[1] += this.rotation[1] * dt;
        this.euler[2] += this.rotation[2] * dt;
    }
}

let pointFlower: PointFlower = {} as PointFlower;
let sceneStandBy = false;

// ==================== Effect Library ====================

interface EffectLib {
    sceneBg: any;
    mkBrightBuf: any;
    dirBlur: any;
    finalComp: any;
}

let effectLib: EffectLib = { sceneBg: null, mkBrightBuf: null, dirBlur: null, finalComp: null } as any;

function createEffectProgram(vtxsrc: string, frgsrc: string, exunifs?: string[], exattrs?: string[]) {
    if (!gl) return null;

    const unifs = ['uResolution', 'uSrc', 'uDelta'].concat(exunifs || []);
    const attrs = ['aPosition'].concat(exattrs || []);

    const prog = createShader(vtxsrc, frgsrc, unifs, attrs);
    if (!prog) return null;

    useShader(prog);

    const dataArray = new Float32Array([
        -1.0, -1.0, 1.0, -1.0, -1.0, 1.0, 1.0, 1.0
    ]);
    const buffer = gl.createBuffer()!;
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, dataArray, gl.STATIC_DRAW);

    gl.bindBuffer(gl.ARRAY_BUFFER, null);
    unuseShader(prog);

    return { program: prog, buffer };
}

function useEffect(fxobj: any, srctex: any): void {
    if (!gl || !fxobj || !fxobj.program) return;
    const prog = fxobj.program;
    useShader(prog);
    gl.uniform3fv(prog.uniforms.uResolution, renderSpec.array);

    if (srctex != null) {
        gl.uniform2fv(prog.uniforms.uDelta, srctex.dtxArray);
        gl.uniform1i(prog.uniforms.uSrc, 0);
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, srctex.texture);
    }
}

function drawEffect(fxobj: any): void {
    if (!gl || !fxobj || !fxobj.buffer) return;
    gl.bindBuffer(gl.ARRAY_BUFFER, fxobj.buffer);
    gl.vertexAttribPointer(fxobj.program.attributes.aPosition, 2, gl.FLOAT, false, 0, 0);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
}

function unuseEffect(fxobj: any): void {
    if (!fxobj || !fxobj.program) return;
    unuseShader(fxobj.program);
}

// ==================== Scene Functions ====================

function createPointFlowers(): void {
    if (!gl) return;

    const prm = gl.getParameter(gl.ALIASED_POINT_SIZE_RANGE);
    renderSpec.pointSize = { min: prm[0], max: prm[1] };

    const vtxsrc = (document.getElementById("sakura_point_vsh") as HTMLScriptElement).textContent || '';
    const frgsrc = (document.getElementById("sakura_point_fsh") as HTMLScriptElement).textContent || '';

    pointFlower.program = createShader(
        vtxsrc, frgsrc,
        ['uProjection', 'uModelview', 'uResolution', 'uOffset', 'uDOF', 'uFade'],
        ['aPosition', 'aEuler', 'aMisc']
    )!;

    useShader(pointFlower.program);
    pointFlower.offset = new Float32Array([0.0, 0.0, 0.0]);
    pointFlower.fader = Vector3.create(0.0, 10.0, 0.0);

    pointFlower.numFlowers = config.sakuraPointNumber;
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

function initPointFlowers(): void {
    if (!pointFlower.numFlowers) return;

    pointFlower.area = Vector3.create(20.0, 20.0, 20.0);
    pointFlower.area.x = pointFlower.area.y * renderSpec.aspect;

    pointFlower.fader.x = 10.0;
    pointFlower.fader.y = pointFlower.area.z;
    pointFlower.fader.z = 0.1;

    const PI2 = Math.PI * 2.0;
    const tmpv3 = Vector3.create(0, 0, 0);
    let tmpv = 0;
    const symmetryrand = function () { return (Math.random() * 2.0 - 1.0); };

    for (let i = 0; i < pointFlower.numFlowers; i++) {
        const tmpprtcl = pointFlower.particles[i];

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

function renderPointFlowers(): void {
    if (!gl || !pointFlower.program) return;

    const PI2 = Math.PI * 2.0;
    const sakuraReverse = config.sakuraReverse;

    const repeatPos = function (prt: BlossomParticle, cmp: number, limitVal: number) {
        if (Math.abs(prt.position[cmp]) - prt.size * 0.5 > limitVal) {
            if (prt.position[cmp] > 0) {
                prt.position[cmp] -= limitVal * 2.0;
            } else {
                prt.position[cmp] += limitVal * 2.0;
            }
        }
    };

    const repeatPoss = function (prt: BlossomParticle, cmp: number, limit1: number, limit2: number) {
        if (prt.position[cmp] + prt.size * 0.5 < limit1 || prt.position[cmp] - prt.size * 0.5 > limit2) {
            if (prt.position[cmp] - prt.size * 0.5 > limit1) {
                prt.position[cmp] -= (limit2 - limit1);
            } else {
                prt.position[cmp] += (limit2 - limit1);
            }
        }
    };

    const repeatEuler = function (prt: BlossomParticle, cmp: number) {
        prt.euler[cmp] = prt.euler[cmp] % PI2;
        if (prt.euler[cmp] < 0.0) {
            prt.euler[cmp] += PI2;
        }
    };

    for (let i = 0; i < pointFlower.numFlowers; i++) {
        const prtcl = pointFlower.particles[i];
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
        prtcl.zkey = (camera.matrix[2] * prtcl.position[0]
            + camera.matrix[6] * prtcl.position[1]
            + camera.matrix[10] * prtcl.position[2]
            + camera.matrix[14]);
    }

    pointFlower.particles.sort(function (p0, p1) { return p0.zkey - p1.zkey; });

    let ipos = pointFlower.positionArrayOffset;
    let ieuler = pointFlower.eulerArrayOffset;
    let imisc = pointFlower.miscArrayOffset;
    for (let i = 0; i < pointFlower.numFlowers; i++) {
        const prtcl = pointFlower.particles[i];
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

    gl.uniformMatrix4fv(prog.uniforms.uProjection, false, projection.matrix);
    gl.uniformMatrix4fv(prog.uniforms.uModelview, false, camera.matrix);
    gl.uniform3fv(prog.uniforms.uResolution, renderSpec.array);
    gl.uniform3fv(prog.uniforms.uDOF, Vector3.arrayForm(camera.dof));
    gl.uniform3fv(prog.uniforms.uFade, Vector3.arrayForm(pointFlower.fader));

    gl.bindBuffer(gl.ARRAY_BUFFER, pointFlower.buffer);
    gl.bufferData(gl.ARRAY_BUFFER, pointFlower.dataArray, gl.DYNAMIC_DRAW);

    gl.vertexAttribPointer(prog.attributes.aPosition, 3, gl.FLOAT, false, 0, pointFlower.positionArrayOffset * Float32Array.BYTES_PER_ELEMENT);
    gl.vertexAttribPointer(prog.attributes.aEuler, 3, gl.FLOAT, false, 0, pointFlower.eulerArrayOffset * Float32Array.BYTES_PER_ELEMENT);
    gl.vertexAttribPointer(prog.attributes.aMisc, 2, gl.FLOAT, false, 0, pointFlower.miscArrayOffset * Float32Array.BYTES_PER_ELEMENT);

    // doubler
    for (let i = 1; i < 2; i++) {
        const zpos = i * -2.0;
        pointFlower.offset[0] = pointFlower.area.x * -1.0;
        pointFlower.offset[1] = pointFlower.area.y * -1.0;
        pointFlower.offset[2] = pointFlower.area.z * zpos;
        gl.uniform3fv(prog.uniforms.uOffset, pointFlower.offset);
        gl.drawArrays(gl.POINTS, 0, pointFlower.numFlowers);

        pointFlower.offset[0] = pointFlower.area.x * -1.0;
        pointFlower.offset[1] = pointFlower.area.y * 1.0;
        pointFlower.offset[2] = pointFlower.area.z * zpos;
        gl.uniform3fv(prog.uniforms.uOffset, pointFlower.offset);
        gl.drawArrays(gl.POINTS, 0, pointFlower.numFlowers);

        pointFlower.offset[0] = pointFlower.area.x * 1.0;
        pointFlower.offset[1] = pointFlower.area.y * -1.0;
        pointFlower.offset[2] = pointFlower.area.z * zpos;
        gl.uniform3fv(prog.uniforms.uOffset, pointFlower.offset);
        gl.drawArrays(gl.POINTS, 0, pointFlower.numFlowers);

        pointFlower.offset[0] = pointFlower.area.x * 1.0;
        pointFlower.offset[1] = pointFlower.area.y * 1.0;
        pointFlower.offset[2] = pointFlower.area.z * zpos;
        gl.uniform3fv(prog.uniforms.uOffset, pointFlower.offset);
        gl.drawArrays(gl.POINTS, 0, pointFlower.numFlowers);
    }

    // main
    pointFlower.offset[0] = 0.0;
    pointFlower.offset[1] = 0.0;
    pointFlower.offset[2] = 0.0;
    gl.uniform3fv(prog.uniforms.uOffset, pointFlower.offset);
    gl.drawArrays(gl.POINTS, 0, pointFlower.numFlowers);

    gl.bindBuffer(gl.ARRAY_BUFFER, null);
    unuseShader(prog);

    gl.enable(gl.DEPTH_TEST);
    gl.disable(gl.BLEND);
}

function createEffectLib(): void {
    const cmnvtxsrc = (document.getElementById("fx_common_vsh") as HTMLScriptElement).textContent || '';

    // background
    let frgsrc = (document.getElementById("bg_fsh") as HTMLScriptElement).textContent || '';
    effectLib.sceneBg = createEffectProgram(cmnvtxsrc, frgsrc, ['uTimes'], undefined);

    // make brightpixels buffer
    frgsrc = (document.getElementById("fx_brightbuf_fsh") as HTMLScriptElement).textContent || '';
    effectLib.mkBrightBuf = createEffectProgram(cmnvtxsrc, frgsrc, undefined, undefined);

    // direction blur
    frgsrc = (document.getElementById("fx_dirblur_r4_fsh") as HTMLScriptElement).textContent || '';
    effectLib.dirBlur = createEffectProgram(cmnvtxsrc, frgsrc, ['uBlurDir'], undefined);

    // final composite
    const vtxsrc = (document.getElementById("pp_final_vsh") as HTMLScriptElement).textContent || '';
    const sakuraBackLight = config.sakuraBackLight;
    frgsrc = pp_final_fsh + 'gl_FragColor = vec4(col.rgb, ' + (1.1 - sakuraBackLight).toFixed(2) + ');        gl_FragColor.a = ' + (1.1 - sakuraBackLight).toFixed(2) + ';    }';
    effectLib.finalComp = createEffectProgram(vtxsrc, frgsrc, ['uBloom'], undefined);
}

function renderBackground(): void {
    if (!gl || !config.sakuraBackground || !effectLib.sceneBg) return;

    gl.disable(gl.DEPTH_TEST);
    useEffect(effectLib.sceneBg, null);
    gl.uniform2f(effectLib.sceneBg.program.uniforms.uTimes, timeInfo.elapsed, timeInfo.delta);
    drawEffect(effectLib.sceneBg);
    unuseEffect(effectLib.sceneBg);
    gl.enable(gl.DEPTH_TEST);
}

function renderPostProcess(): void {
    if (!gl) return;

    // Check if all required effects are initialized
    if (!effectLib.mkBrightBuf || !effectLib.dirBlur || !effectLib.finalComp) {
        return;
    }

    gl.disable(gl.DEPTH_TEST);

    const bindRT = function (rt: RenderTarget, isclear: boolean) {
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
            gl.uniform4f(effectLib.dirBlur.program.uniforms.uBlurDir, p, 0.0, s, 0.0);
        }
        drawEffect(effectLib.dirBlur);
        unuseEffect(effectLib.dirBlur);

        bindRT(renderSpec.wHalfRT0!, true);
        useEffect(effectLib.dirBlur, renderSpec.wHalfRT1);
        if (effectLib.dirBlur.program) {
            gl.uniform4f(effectLib.dirBlur.program.uniforms.uBlurDir, 0.0, p, 0.0, s);
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
        gl.uniform1i(effectLib.finalComp.program.uniforms.uBloom, 1);
    }
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, renderSpec.wHalfRT0!.texture);
    drawEffect(effectLib.finalComp);
    unuseEffect(effectLib.finalComp);

    gl.enable(gl.DEPTH_TEST);
}

// ==================== Main Scene Functions ====================

function createScene(): void {
    createEffectLib();
    createPointFlowers();
    sceneStandBy = true;
}

function initScene(): void {
    initPointFlowers();

    camera.position.z = pointFlower.area.z + projection.nearfar[0];
    projection.angle = Math.atan2(pointFlower.area.y, camera.position.z + pointFlower.area.z) * 180.0 / Math.PI * 2.0;
    Matrix44.loadProjection(projection.matrix, renderSpec.aspect, projection.angle, projection.nearfar[0], projection.nearfar[1]);
}

function renderScene(): void {
    if (!gl || !sceneStandBy) return;

    Matrix44.loadLookAt(camera.matrix, camera.position, camera.lookat, camera.up);

    gl.enable(gl.DEPTH_TEST);

    gl.bindFramebuffer(gl.FRAMEBUFFER, renderSpec.mainRT!.frameBuffer);
    gl.viewport(0, 0, renderSpec.mainRT!.width, renderSpec.mainRT!.height);
    if (config.sakuraBackColor) {
        gl.clearColor(0.005, 0, 0.05, 0);
    } else {
        gl.clearColor(0, 0, 0, 0);
    }
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    renderBackground();
    renderPointFlowers();
    renderPostProcess();
}

// ==================== Viewport & Resize ====================

function setViewports(): void {
    if (!gl) return;

    renderSpec.setSize(gl.canvas.width, gl.canvas.height);

    gl.clearColor(0.2, 0.2, 0.5, 1.0);
    gl.viewport(0, 0, renderSpec.width, renderSpec.height);

    const rtfunc = function (rtname: keyof RenderSpec, rtw: number, rth: number) {
        const rt = renderSpec[rtname] as RenderTarget | undefined;
        if (rt) deleteRenderTarget(rt);
        (renderSpec as any)[rtname] = createRenderTarget(rtw, rth);
    };

    rtfunc('mainRT', renderSpec.width, renderSpec.height);
    rtfunc('wFullRT0', renderSpec.width, renderSpec.height);
    rtfunc('wFullRT1', renderSpec.width, renderSpec.height);
    rtfunc('wHalfRT0', renderSpec.halfWidth, renderSpec.halfHeight);
    rtfunc('wHalfRT1', renderSpec.halfWidth, renderSpec.halfHeight);
}

function onResize(): void {
    const canvas = elements.sakura;
    const canvasshow = elements.sakurashow;

    if (canvas && canvasshow) {
        makeCanvasFullScreen(canvas, canvasshow);
    }
    setViewports();
    if (sceneStandBy) {
        initScene();
    }
}

// ==================== Animation Control ====================

let animating = true;

function render(): void {
    renderScene();
}

export function stepAnimation(): void {
    if (!animating) animate();
}

export function animate(): void {
    const curdate = new Date();
    timeInfo.elapsed = (curdate.getTime() - timeInfo.start.getTime()) / 1000.0;
    timeInfo.delta = (curdate.getTime() - timeInfo.prev.getTime()) / 1000.0;
    timeInfo.prev = curdate;

    if (animating) requestAnimationFrame(animate);
    render();
}

// Export animating state management
export function getAnimating(): boolean {
    return animating;
}

export function setAnimating(value: boolean): void {
    animating = value;
}

// ==================== Canvas Control ====================

export function makeCanvasFullScreen(canvas: HTMLCanvasElement, canvasshow: HTMLCanvasElement): void {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    canvasshow.width = window.innerWidth;
    canvasshow.height = window.innerHeight;
}

export function makeCanvasHide(canvas: HTMLCanvasElement, canvasshow: HTMLCanvasElement): void {
    canvas.width = 0;
    canvas.height = 0;
    canvasshow.width = 0;
    canvasshow.height = 0;
}

// ==================== Sakura Effect Control ====================

export function sakuraReLoadEffect(): void {
    animating = false;
    createEffectLib();
    animating = true;
}

export function sakuraResize(): void {
    animating = false;
    onResize();
    animating = true;
}

// ==================== Main Load Function ====================

export function sakuraLoad(): void {
    const canvasshow = elements.sakurashow;
    const canvas = elements.sakura;

    if (!canvas || !canvasshow) {
        console.error('Sakura canvas elements not found');
        return;
    }

    try {
        makeCanvasFullScreen(canvas, canvasshow);
        gl = canvas.getContext('webgl');
    } catch (e) {
        alert("WebGL not supported." + e);
        console.error(e);
        return;
    }

    if (!gl) {
        console.error('Failed to get WebGL context');
        return;
    }

    setViewports();
    createScene();
    initScene();

    timeInfo.start = new Date();
    timeInfo.prev = timeInfo.start;

    animate();

    removesakura();
}

// ==================== Remove Sakura (Copy to 2D Canvas) ====================

export function removesakura(): void {
    const raw = elements.sakura;
    const ctx = elements.sakurashow.getContext('2d');
    if (!ctx || !raw) return;

    const width = window.innerWidth;
    const height = window.innerHeight;
    const nowCtx = ctx;

    function draw() {
        if (raw.width > 0 && config.showSakura) {
            nowCtx.drawImage(raw, 0, 0, width, height, 0, 0, width, height);
            requestAnimationFrame(draw);
        }
    }

    if (config.showSakura) {
        requestAnimationFrame(draw);
    }
}

// ==================== Toggle Animation ====================

export function toggleAnimation(elm?: HTMLElement): void {
    animating = !animating;
    if (animating) animate();
    if (elm) {
        elm.innerHTML = animating ? "Stop" : "Start";
    }
}

// ==================== Window Load Handler ====================

export function initSakura(): void {
    window.addEventListener('load', sakuraLoad);
}

// ==================== Apply Transparency ====================

export function applySakuraTransparency(): void {
    const transparency = config.sakuraTransparency;
    const ctx = elements.sakurashow.getContext('2d');
    if (ctx) {
        ctx.canvas.style.opacity = String(transparency);
    }
}

// ==================== Export ====================

export { Vector3, Matrix44 };

// ==================== Initialize ====================

// Register the load event listener when module loads
initSakura();
