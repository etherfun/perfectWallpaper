/**
 * NativeParticles 类型与默认配置
 *
 * 从 `src/utils/NativeParticles.ts` 拆分出的类型/常量定义。
 */

export type Direction =
    | 'none'
    | 'top'
    | 'top-right'
    | 'right'
    | 'bottom-right'
    | 'bottom'
    | 'bottom-left'
    | 'left'
    | 'top-left';
export type MoveOutMode = 'out' | 'bounce';
export type ShapeType = 'circle' | 'edge' | 'triangle' | 'star' | 'image';

export interface Particle {
    opacity: number;
    color: string;
    shadowColor: string;
    shadowBlur: number;
    shapeType: ShapeType;
    radius: number;
    x: number;
    y: number;
    speed: number;
    vx: number;
    vy: number;
}

export interface ParticlesOptions {
    number: number;
    opacity: number;
    opacityRandom: boolean;
    color: string;
    shadowColor: string;
    shadowBlur: number;
    shapeType: ShapeType;
    sizeValue: number;
    sizeRandom: boolean;
    linkEnable: boolean;
    linkDistance: number;
    linkWidth: number;
    linkColor: string;
    linkOpacity: number;
    isMove: boolean;
    speed: number;
    speedRandom: boolean;
    direction: Direction;
    isStraight: boolean;
    isBounce: boolean;
    moveOutMode: MoveOutMode;
}

export const DEFAULTS: ParticlesOptions = {
    number: 100,
    opacity: 0.75,
    opacityRandom: false,
    color: '255,255,255',
    shadowColor: '255,255,255',
    shadowBlur: 0,
    shapeType: 'circle',
    sizeValue: 5,
    sizeRandom: true,
    linkEnable: false,
    linkDistance: 100,
    linkWidth: 2,
    linkColor: '255,255,255',
    linkOpacity: 0.75,
    isMove: true,
    speed: 2,
    speedRandom: true,
    direction: 'bottom',
    isStraight: false,
    isBounce: false,
    moveOutMode: 'out',
};