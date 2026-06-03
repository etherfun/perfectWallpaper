/**
 * Tests for src/utils/webgl-math.ts
 *
 * Covers the WebGL math utilities used by the sakura particle system.
 * Pure math with no DOM/WebGL context dependency, so safe to test in node.
 */

import { describe, expect, test } from 'vitest';

import type { Vec3 } from '@/utils/webgl-math';
import { Matrix44, Vector3 } from '@/utils/webgl-math';

const EPS = 1e-6;
const close = (a: number, b: number, eps: number = EPS) => Math.abs(a - b) < eps;

describe('Vector3', () => {
    describe('create', () => {
        test('returns object with x/y/z set', () => {
            const v = Vector3.create(1, 2, 3);
            expect(v).toEqual({ x: 1, y: 2, z: 3 });
        });

        test('returned object has no array property by default', () => {
            const v = Vector3.create(0, 0, 0);
            expect(v.array).toBeUndefined();
        });
    });

    describe('dot', () => {
        test('computes dot product of two unit vectors', () => {
            const a: Vec3 = { x: 1, y: 0, z: 0 };
            const b: Vec3 = { x: 0, y: 1, z: 0 };
            expect(Vector3.dot(a, b)).toBe(0);
        });

        test('returns 1 for parallel unit vectors', () => {
            const a: Vec3 = { x: 1, y: 0, z: 0 };
            expect(Vector3.dot(a, a)).toBe(1);
        });

        test('returns -1 for anti-parallel vectors', () => {
            const a: Vec3 = { x: 1, y: 0, z: 0 };
            const b: Vec3 = { x: -1, y: 0, z: 0 };
            expect(Vector3.dot(a, b)).toBe(-1);
        });

        test('handles general 3D vectors', () => {
            const a: Vec3 = { x: 1, y: 2, z: 3 };
            const b: Vec3 = { x: 4, y: 5, z: 6 };
            // 1*4 + 2*5 + 3*6 = 4 + 10 + 18 = 32
            expect(Vector3.dot(a, b)).toBe(32);
        });
    });

    describe('cross', () => {
        test('cross of X and Y axes = Z axis', () => {
            const v: Vec3 = { x: 0, y: 0, z: 0 };
            Vector3.cross(v, { x: 1, y: 0, z: 0 }, { x: 0, y: 1, z: 0 });
            expect(v).toEqual({ x: 0, y: 0, z: 1 });
        });

        test('cross of Y and Z axes = X axis', () => {
            const v: Vec3 = { x: 0, y: 0, z: 0 };
            Vector3.cross(v, { x: 0, y: 1, z: 0 }, { x: 0, y: 0, z: 1 });
            expect(v).toEqual({ x: 1, y: 0, z: 0 });
        });

        test('cross of a vector with itself = zero', () => {
            const v: Vec3 = { x: 0, y: 0, z: 0 };
            const a: Vec3 = { x: 2, y: 3, z: 4 };
            Vector3.cross(v, a, a);
            expect(v).toEqual({ x: 0, y: 0, z: 0 });
        });

        test('mutates the first argument in place', () => {
            const v: Vec3 = { x: 99, y: 99, z: 99 };
            Vector3.cross(v, { x: 1, y: 0, z: 0 }, { x: 0, y: 1, z: 0 });
            // First arg should have been overwritten
            expect(v.x).toBe(0);
            expect(v.y).toBe(0);
            expect(v.z).toBe(1);
        });
    });

    describe('normalize', () => {
        test('produces a unit vector', () => {
            const v: Vec3 = { x: 3, y: 4, z: 0 };
            Vector3.normalize(v);
            const len = Math.sqrt(v.x * v.x + v.y * v.y + v.z * v.z);
            expect(close(len, 1)).toBe(true);
        });

        test('normalizes (1, 2, 2) to (1/3, 2/3, 2/3)', () => {
            const v: Vec3 = { x: 1, y: 2, z: 2 };
            Vector3.normalize(v);
            expect(close(v.x, 1 / 3)).toBe(true);
            expect(close(v.y, 2 / 3)).toBe(true);
            expect(close(v.z, 2 / 3)).toBe(true);
        });

        test('leaves zero vector unchanged (avoids divide by zero)', () => {
            const v: Vec3 = { x: 0, y: 0, z: 0 };
            Vector3.normalize(v);
            expect(v).toEqual({ x: 0, y: 0, z: 0 });
        });

        test('leaves vector below epsilon threshold unchanged', () => {
            // Magnitude squared < 0.00001 → not normalized
            const v: Vec3 = { x: 0.001, y: 0, z: 0 };
            Vector3.normalize(v);
            expect(v.x).toBe(0.001);
        });
    });

    describe('arrayForm', () => {
        test('creates a Float32Array on first call', () => {
            const v = Vector3.create(1, 2, 3);
            const arr = Vector3.arrayForm(v);
            expect(arr).toBeInstanceOf(Float32Array);
            expect(Array.from(arr)).toEqual([1, 2, 3]);
        });

        test('reuses existing array on subsequent calls', () => {
            const v = Vector3.create(1, 2, 3);
            const first = Vector3.arrayForm(v);
            const second = Vector3.arrayForm(v);
            expect(first).toBe(second); // Same reference
        });

        test('updates existing array with current x/y/z', () => {
            const v = Vector3.create(1, 2, 3);
            const arr = Vector3.arrayForm(v);
            v.x = 10;
            v.y = 20;
            v.z = 30;
            Vector3.arrayForm(v);
            expect(Array.from(arr)).toEqual([10, 20, 30]);
        });
    });
});

describe('Matrix44', () => {
    describe('createIdentity', () => {
        test('returns 4x4 identity matrix in column-major Float32Array', () => {
            const m = Matrix44.createIdentity();
            expect(m).toBeInstanceOf(Float32Array);
            expect(m.length).toBe(16);
            // Column-major: m[0..3] = column 0, m[4..7] = column 1, etc.
            expect(m[0]).toBe(1.0); // (0,0)
            expect(m[5]).toBe(1.0); // (1,1)
            expect(m[10]).toBe(1.0); // (2,2)
            expect(m[15]).toBe(1.0); // (3,3)
            // Off-diagonal elements all 0
            for (let i = 0; i < 16; i++) {
                if (i !== 0 && i !== 5 && i !== 10 && i !== 15) {
                    expect(m[i]).toBe(0.0);
                }
            }
        });

        test('returns a new array each call (no shared state)', () => {
            const a = Matrix44.createIdentity();
            const b = Matrix44.createIdentity();
            expect(a).not.toBe(b);
        });
    });

    describe('loadProjection', () => {
        test('produces a 16-element Float32Array', () => {
            const m = new Float32Array(16);
            Matrix44.loadProjection(m, 16 / 9, 60, 0.1, 100);
            expect(m.length).toBe(16);
        });

        test('produces symmetric matrix for aspect=1 (square viewport)', () => {
            const m = new Float32Array(16);
            Matrix44.loadProjection(m, 1.0, 90, 0.1, 100);
            // m[0] = 2*near/w, m[5] = 2*near/h. With aspect=1, w=h, so m[0] === m[5].
            expect(close(m[0], m[5])).toBe(true);
        });

        test('perspective m[11] = -1 (OpenGL convention)', () => {
            const m = new Float32Array(16);
            Matrix44.loadProjection(m, 1.0, 90, 0.1, 100);
            expect(m[11]).toBe(-1);
        });

        test('m[15] is 0 (perspective divide marker)', () => {
            const m = new Float32Array(16);
            Matrix44.loadProjection(m, 1.0, 90, 0.1, 100);
            expect(m[15]).toBe(0);
        });
    });

    describe('loadLookAt', () => {
        test('produces a 16-element Float32Array', () => {
            const m = new Float32Array(16);
            Matrix44.loadLookAt(
                m,
                { x: 0, y: 0, z: 5 },
                { x: 0, y: 0, z: 0 },
                { x: 0, y: 1, z: 0 }
            );
            expect(m.length).toBe(16);
        });

        test('translation column (m[12..14]) reflects eye position negation', () => {
            // Looking from (0,0,5) toward origin, with up=(0,1,0).
            // After orthonormalization in loadLookAt:
            //   frontv = normalize(vpos - vlook) = normalize((0,0,5)) = (0,0,1)
            //   sidev  = vup × frontv             = (0,1,0) × (0,0,1) = (1,0,0)
            //   topv   = frontv × sidev            = (0,0,1) × (1,0,0) = (0,1,0)
            // So rotation columns: m[0..2]=(1,0,0), m[4..6]=(0,1,0), m[8..10]=(0,0,1).
            // Translation row uses neg-eye · rotation:
            //   m[12] = -(0*1 + 0*0 + 5*0) = 0
            //   m[13] = -(0*0 + 0*1 + 5*0) = 0
            //   m[14] = -(0*0 + 0*0 + 5*1) = -5
            const m = new Float32Array(16);
            Matrix44.loadLookAt(
                m,
                { x: 0, y: 0, z: 5 },
                { x: 0, y: 0, z: 0 },
                { x: 0, y: 1, z: 0 }
            );
            expect(close(m[12], 0)).toBe(true);
            expect(close(m[13], 0)).toBe(true);
            expect(close(m[14], -5)).toBe(true);
        });

        test('m[15] = 1 (homogeneous coordinate)', () => {
            const m = new Float32Array(16);
            Matrix44.loadLookAt(
                m,
                { x: 0, y: 0, z: 5 },
                { x: 0, y: 0, z: 0 },
                { x: 0, y: 1, z: 0 }
            );
            expect(m[15]).toBe(1.0);
        });
    });
});
