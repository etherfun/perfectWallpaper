/**
 * usePWParticles — Vue 3 composable wrapper for src/PWParticles.ts
 *
 * Stage 5-C1 (particle audio visualizer): wraps the imperative Canvas 2D
 * particle system into a reactive composable that:
 *   - Owns the resize listener — adds on mount, removes on unmount.
 *   - Exposes `resize / start / stop / createPoint / drawPoint / connect`
 *     passthroughs that internally delegate to legacy exports.
 *   - Auto-resizes on mount (replaces the top-level wResize() side effect
 *     in PWParticles.ts that ran during module load).
 *
 * Drawing logic stays in src/PWParticles.ts. The composable only bridges
 * lifecycle hooks.
 */

import { onBeforeUnmount, onMounted } from 'vue';

import {
    connect as pwParticlesConnect,
    drawPoint as pwParticlesDrawPoint,
    PWParcreatePoint as pwParticlesCreatePointFn,
    startAuto as pwParticlesStart,
    stopAuto as pwParticlesStop,
    wResize as pwParticlesResize,
} from '@/PWParticles';

export interface UsePWParticlesApi {
    /** Re-resolve #canvas-particles context + size (call on mount and resize). */
    resize: () => void;
    /** Begin the RAF particle loop. */
    start: () => void;
    /** Stop the RAF loop and cancel pending frame. */
    stop: () => void;
    /** Write point array from current audio data. */
    createPoint: () => void;
    /** Draw + move all particles for this frame. */
    draw: () => void;
    /** Connect nearby particles with lines (calls connect() in module). */
    connect: () => void;
}

export function usePWParticles(): UsePWParticlesApi {
    const handleResize = (): void => {
        pwParticlesResize();
    };

    onMounted(() => {
        window.addEventListener('resize', handleResize);
        handleResize();
    });

    onBeforeUnmount(() => {
        window.removeEventListener('resize', handleResize);
        // Stop the RAF loop on unmount to prevent orphaned frames.
        pwParticlesStop();
    });

    return {
        resize: handleResize,
        start: () => pwParticlesStart(),
        stop: () => pwParticlesStop(),
        createPoint: () => pwParticlesCreatePointFn(),
        draw: () => pwParticlesDrawPoint(),
        connect: () => pwParticlesConnect(),
    };
}
