/**
 * 粒子运动逻辑：距离计算、方向向量、移动/弹跳/边界检查、重叠检测。
 *
 * 从 `src/utils/NativeParticles.ts` 类中拆出的私有方法，
 * 原 `this` 字段改为显式参数传入，行为与拆分前完全一致。
 */

import type { Direction, MoveOutMode, Particle, ParticlesOptions, ShapeType } from './types';

export function getDist(x1: number, y1: number, x2: number, y2: number): number {
    const dx = x1 - x2;
    const dy = y1 - y2;
    return Math.sqrt(dx * dx + dy * dy);
}

export function directionVector(direction: Direction): { x: number; y: number } {
    switch (direction) {
        case 'none':
            return { x: 0, y: 0 };
        case 'top':
            return { x: 0, y: -1 };
        case 'top-right':
            return { x: 0.5, y: -0.5 };
        case 'right':
            return { x: 1, y: 0 };
        case 'bottom-right':
            return { x: 0.5, y: 0.5 };
        case 'bottom':
            return { x: 0, y: 1 };
        case 'bottom-left':
            return { x: -0.5, y: 1 };
        case 'left':
            return { x: -1, y: 0 };
        case 'top-left':
            return { x: -0.5, y: -0.5 };
        default:
            return { x: 0, y: 0 };
    }
}

export function moveStraight(particles: Particle, direction: Direction, isStraight: boolean): void {
    const dir = directionVector(direction);
    if (isStraight) {
        particles.vx = dir.x;
        particles.vy = dir.y;
    } else {
        particles.vx = dir.x + Math.random() - 0.5;
        particles.vy = dir.y + Math.random() - 0.5;
    }
}

export function moveParticles(particles: Particle, isMove: boolean): void {
    if (isMove) {
        particles.x += particles.vx * particles.speed;
        particles.y += particles.vy * particles.speed;
    }
}

export function bounceParticles(
    particlesArray: Particle[],
    index: number,
    isBounce: boolean
): void {
    if (!isBounce) return;
    for (let i = 0; i < particlesArray.length; i++) {
        if (i === index) continue;
        const p1 = particlesArray[index]!;
        const p2 = particlesArray[i]!;
        const dist = getDist(p1.x, p1.y, p2.x, p2.y);
        const distP = p1.radius + p2.radius;
        if (dist <= distP) {
            p1.vx = -p1.vx;
            p1.vy = -p1.vy;
            p2.vx = -p2.vx;
            p2.vy = -p2.vy;
        }
    }
}

export function marginalCheck(
    particles: Particle,
    moveOutMode: MoveOutMode,
    canvasWidth: number,
    canvasHeight: number
): void {
    let newPos: { x_left: number; x_right: number; y_top: number; y_bottom: number };

    if (moveOutMode === 'bounce') {
        newPos = {
            x_left: particles.radius,
            x_right: canvasWidth,
            y_top: particles.radius,
            y_bottom: canvasHeight,
        };
    } else {
        newPos = {
            x_left: -particles.radius,
            x_right: canvasWidth + particles.radius,
            y_top: -particles.radius,
            y_bottom: canvasHeight + particles.radius,
        };
    }

    // Check bounds and reposition
    if (particles.x - particles.radius > canvasWidth) {
        particles.x = newPos.x_left;
        particles.y = Math.random() * canvasHeight;
    } else if (particles.x + particles.radius < 0) {
        particles.x = newPos.x_right;
        particles.y = Math.random() * canvasHeight;
    }

    if (particles.y - particles.radius > canvasHeight) {
        particles.y = newPos.y_top;
        particles.x = Math.random() * canvasWidth;
    } else if (particles.y + particles.radius < 0) {
        particles.y = newPos.y_bottom;
        particles.x = Math.random() * canvasWidth;
    }

    // Bounce direction
    if (moveOutMode === 'bounce') {
        if (particles.x + particles.radius > canvasWidth) particles.vx = -particles.vx;
        else if (particles.x - particles.radius < 0) particles.vx = -particles.vx;
        if (particles.y + particles.radius > canvasHeight) particles.vy = -particles.vy;
        else if (particles.y - particles.radius < 0) particles.vy = -particles.vy;
    }
}

export function checkOverlap(
    particlesArray: Particle[],
    index: number,
    canvasWidth: number,
    canvasHeight: number
): void {
    for (let i = 0; i < particlesArray.length; i++) {
        if (i === index) continue;
        const p1 = particlesArray[index]!;
        const p2 = particlesArray[i]!;
        const dist = getDist(p1.x, p1.y, p2.x, p2.y);
        if (dist <= p1.radius + p2.radius) {
            p1.x = Math.random() * canvasWidth;
            p1.y = Math.random() * canvasHeight;
            checkOverlap(particlesArray, index, canvasWidth, canvasHeight);
        }
    }
}

/**
 * 初始化粒子数组（原类私有方法 initParticlesArray）
 */
export function initParticlesArray(
    count: number,
    canvasWidth: number,
    canvasHeight: number,
    options: ParticlesOptions
): Particle[] {
    const particlesArray: Particle[] = [];
    for (let i = 0; i < count; i++) {
        const x = Math.floor(0.5 + Math.random() * canvasWidth);
        const y = Math.floor(0.5 + Math.random() * canvasHeight);
        particlesArray.push({
            opacity: options.opacity,
            color: options.color,
            shadowColor: options.shadowColor,
            shadowBlur: options.shadowBlur,
            shapeType: options.shapeType,
            radius: options.sizeValue,
            x,
            y,
            speed: 0,
            vx: 0,
            vy: 0,
        });
    }

    for (let i = 0; i < particlesArray.length; i++) {
        const p = particlesArray[i]!;
        p.opacity = options.opacityRandom
            ? Math.min(Math.random(), options.opacity)
            : options.opacity;
        p.radius = (options.sizeRandom ? Math.random() : 1) * options.sizeValue;
        p.speed = Math.max(1, (options.speedRandom ? Math.random() : 1) * options.speed);
        moveStraight(p, options.direction, options.isStraight);
        checkOverlap(particlesArray, i, canvasWidth, canvasHeight);
    }

    return particlesArray;
}

/**
 * 增减粒子数量（原类私有方法 addParticlesInternal）
 */
export function addParticlesInternal(
    particlesArray: Particle[],
    num: number,
    old: number,
    canvasWidth: number,
    canvasHeight: number,
    options: ParticlesOptions
): void {
    if (num > old) {
        const n = num - old;
        for (let i = 0; i < n; i++) {
            const x = Math.floor(0.5 + Math.random() * canvasWidth);
            const y = Math.floor(0.5 + Math.random() * canvasHeight);
            particlesArray.push({
                opacity: options.opacity,
                color: options.color,
                shadowColor: options.shadowColor,
                shadowBlur: options.shadowBlur,
                shapeType: options.shapeType,
                radius: options.sizeValue,
                x,
                y,
                speed: 0,
                vx: 0,
                vy: 0,
            });
        }
        for (let i = 0; i < particlesArray.length; i++) {
            const p = particlesArray[i]!;
            p.opacity = options.opacityRandom ? Math.random() : options.opacity;
            p.radius = (options.sizeRandom ? Math.random() : 1) * options.sizeValue;
            p.speed = (options.speedRandom ? Math.random() : 1) * options.speed;
            moveStraight(p, options.direction, options.isStraight);
        }
        for (let i = 0; i < particlesArray.length; i++) {
            checkOverlap(particlesArray, i, canvasWidth, canvasHeight);
        }
    } else if (num >= 0 && num < old) {
        const n = old - num;
        for (let i = 0; i < n; i++) {
            particlesArray.pop();
        }
    }
}

/**
 * 更新粒子全局外观（原类私有方法 setParticlesGlobalValue）
 */
export function setParticlesGlobalValue(
    particlesArray: Particle[],
    opacity: number,
    opacityRandom: boolean,
    color: string,
    shadowColor: string,
    shadowBlur: number
): void {
    for (const p of particlesArray) {
        p.opacity = opacityRandom ? Math.min(Math.random(), opacity) : opacity;
        p.color = color;
        p.shadowColor = shadowColor;
        p.shadowBlur = shadowBlur;
    }
}

/**
 * 更新粒子形状与尺寸（原类私有方法 setParticlesSizeValue）
 */
export function setParticlesSizeValue(
    particlesArray: Particle[],
    shapeType: ShapeType,
    sizeValue: number,
    sizeRandom: boolean
): void {
    for (const p of particlesArray) {
        p.shapeType = shapeType;
        p.radius = (sizeRandom ? Math.random() : 1) * sizeValue;
    }
}

/**
 * 更新粒子移动参数（原类私有方法 setParticlesMoveValue）
 */
export function setParticlesMoveValue(
    particlesArray: Particle[],
    speed: number,
    speedRandom: boolean,
    direction: Direction,
    isStraight: boolean
): void {
    for (const p of particlesArray) {
        p.speed = Math.max(1, (speedRandom ? Math.random() : 1) * speed);
        moveStraight(p, direction, isStraight);
    }
}

/**
 * 更新全部粒子的位置（原类私有方法 updateParticlesArray）
 */
export function updateParticlesArray(
    particlesArray: Particle[],
    isMove: boolean,
    isBounce: boolean,
    moveOutMode: MoveOutMode,
    canvasWidth: number,
    canvasHeight: number
): void {
    for (let i = 0; i < particlesArray.length; i++) {
        moveParticles(particlesArray[i]!, isMove);
        bounceParticles(particlesArray, i, isBounce);
        marginalCheck(particlesArray[i]!, moveOutMode, canvasWidth, canvasHeight);
    }
}