

import { onBeforeUnmount, onMounted } from 'vue';

import {
    connect as pwParticlesConnect,
    drawPoint as pwParticlesDrawPoint,
    PWParcreatePoint as pwParticlesCreatePointFn,
    startAuto as pwParticlesStart,
    stopAuto as pwParticlesStop,
    wResize as pwParticlesResize,
} from './PWParticles';

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
