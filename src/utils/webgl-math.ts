/**
 * WebGL Math Utilities
 * Shared Vector3 and Matrix44 utilities for WebGL rendering
 */

export interface Vec3 {
    x: number;
    y: number;
    z: number;
    array?: Float32Array;
}

export const Vector3 = {
    create: function (x: number, y: number, z: number): Vec3 {
        return { x: x, y: y, z: z };
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
    },
};

export const Matrix44 = {
    createIdentity: function (): Float32Array {
        return new Float32Array([
            1.0, 0.0, 0.0, 0.0, 0.0, 1.0, 0.0, 0.0, 0.0, 0.0, 1.0, 0.0, 0.0, 0.0, 0.0, 1.0,
        ]);
    },

    loadProjection: function (
        m: Float32Array,
        aspect: number,
        vdeg: number,
        near: number,
        far: number
    ): void {
        const h = near * Math.tan(((vdeg * Math.PI) / 180.0) * 0.5) * 2.0;
        const w = h * aspect;

        m[0] = (2.0 * near) / w;
        m[1] = 0.0;
        m[2] = 0.0;
        m[3] = 0.0;
        m[4] = 0.0;
        m[5] = (2.0 * near) / h;
        m[6] = 0.0;
        m[7] = 0.0;
        m[8] = 0.0;
        m[9] = 0.0;
        m[10] = -(far + near) / (far - near);
        m[11] = -1.0;
        m[12] = 0.0;
        m[13] = 0.0;
        m[14] = (-2.0 * far * near) / (far - near);
        m[15] = 0.0;
    },

    // 模块级复用向量，避免每帧 loadLookAt 创建 3 个 Vec3 对象（60Hz 热点）
    _frontv: { x: 0, y: 0, z: 0 } as Vec3,
    _sidev: { x: 0, y: 0, z: 0 } as Vec3,
    _topv: { x: 0, y: 0, z: 0 } as Vec3,

    loadLookAt: function (m: Float32Array, vpos: Vec3, vlook: Vec3, vup: Vec3): void {
        const frontv = this._frontv as Vec3;
        frontv.x = vpos.x - vlook.x;
        frontv.y = vpos.y - vlook.y;
        frontv.z = vpos.z - vlook.z;
        Vector3.normalize(frontv);
        const sidev = this._sidev as Vec3;
        sidev.x = 1; sidev.y = 0; sidev.z = 0;
        Vector3.cross(sidev, vup, frontv);
        Vector3.normalize(sidev);
        const topv = this._topv as Vec3;
        topv.x = 1; topv.y = 0; topv.z = 0;
        Vector3.cross(topv, frontv, sidev);
        Vector3.normalize(topv);

        m[0] = sidev.x;
        m[1] = topv.x;
        m[2] = frontv.x;
        m[3] = 0.0;
        m[4] = sidev.y;
        m[5] = topv.y;
        m[6] = frontv.y;
        m[7] = 0.0;
        m[8] = sidev.z;
        m[9] = topv.z;
        m[10] = frontv.z;
        m[11] = 0.0;
        m[12] = -(vpos.x * m[0] + vpos.y * m[4] + vpos.z * m[8]);
        m[13] = -(vpos.x * m[1] + vpos.y * m[5] + vpos.z * m[9]);
        m[14] = -(vpos.x * m[2] + vpos.y * m[6] + vpos.z * m[10]);
        m[15] = 1.0;
    },
};
