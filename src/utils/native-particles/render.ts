/**
 * 粒子绘制逻辑：形状绘制、粒子绘制、连线绘制。
 *
 * 从 `src/utils/NativeParticles.ts` 类中拆出的私有方法，
 * 原 `this` 字段改为显式参数传入（行为与拆分前完全一致）。
 */

import { getDist } from './motion';
import type { Particle } from './types';

export function drawShape(
    ctx: CanvasRenderingContext2D,
    startX: number,
    startY: number,
    sideLength: number,
    sideCountNumerator: number,
    sideCountDenominator: number
): void {
    const sideCount = sideCountNumerator * sideCountDenominator;
    const decimalSides = sideCountNumerator / sideCountDenominator;
    const interiorAngleDegrees = (180 * (decimalSides - 2)) / decimalSides;
    const interiorAngle = Math.PI - (Math.PI * interiorAngleDegrees) / 180;
    ctx.translate(startX, startY);
    ctx.moveTo(0, 0);
    for (let i = 0; i < sideCount; i++) {
        ctx.lineTo(sideLength, 0);
        ctx.translate(sideLength, 0);
        ctx.rotate(interiorAngle);
    }
}

export function drawParticles(
    ctx: CanvasRenderingContext2D,
    currantCanvas: HTMLCanvasElement,
    particles: Particle
): void {
    ctx.save();
    ctx.fillStyle = `rgb(${particles.color})`;
    ctx.shadowColor = `rgb(${particles.shadowColor})`;
    ctx.shadowBlur = particles.shadowBlur;
    ctx.globalAlpha = particles.opacity;
    ctx.beginPath();

    switch (particles.shapeType) {
        case 'circle':
            ctx.arc(particles.x, particles.y, particles.radius, 0, Math.PI * 2, false);
            break;
        case 'edge':
            ctx.rect(
                particles.x - particles.radius,
                particles.y - particles.radius,
                particles.radius * 2,
                particles.radius * 2
            );
            break;
        case 'triangle':
            drawShape(
                ctx,
                particles.x - particles.radius,
                particles.y + particles.radius / 1.66,
                particles.radius * 2,
                3,
                2
            );
            break;
        case 'star':
            drawShape(
                ctx,
                particles.x - (particles.radius * 2) / (5 / 4),
                particles.y - particles.radius / ((2 * 2.66) / 3.5),
                (particles.radius * 2 * 2.66) / (5 / 3),
                5,
                2
            );
            break;
        case 'image':
            if (
                currantCanvas.width > particles.radius * 10 ||
                currantCanvas.height > particles.radius * 10
            ) {
                let scaling: number;
                let width: number, height: number;
                if (currantCanvas.width > currantCanvas.height) {
                    scaling = (particles.radius * 10) / currantCanvas.width;
                } else {
                    scaling = (particles.radius * 10) / currantCanvas.height;
                }
                width = currantCanvas.width * scaling;
                height = currantCanvas.height * scaling;
                ctx.drawImage(currantCanvas, particles.x, particles.y, width, height);
            }
            break;
    }

    ctx.closePath();
    ctx.fill();
    ctx.restore();
}

export function drawLine(
    ctx: CanvasRenderingContext2D,
    particlesArray: Particle[],
    index: number,
    linkDistance: number,
    linkWidth: number,
    linkColor: string,
    linkOpacity: number
): void {
    for (let i = 0; i < particlesArray.length; i++) {
        if (i === index) continue;
        const p1 = particlesArray[index]!;
        const p2 = particlesArray[i]!;
        const dist = getDist(p1.x, p1.y, p2.x, p2.y);
        if (dist <= linkDistance) {
            const d = (linkDistance - dist) / linkDistance;
            ctx.save();
            ctx.lineWidth = d * linkWidth;
            ctx.strokeStyle = `rgba(${linkColor}, ${Math.min(d, linkOpacity)})`;
            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.closePath();
            ctx.stroke();
            ctx.restore();
        }
    }
}