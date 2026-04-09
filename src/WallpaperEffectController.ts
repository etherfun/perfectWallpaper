/**
 * WallpaperController - Unified controller replacing jQuery plugin chain
 * Provides the same interface as: ($('body').particles({}).audiovisualizer({}))
 */

import { stopAuto as stopPWParticlesAuto } from './PWParticles';
import { NativeAudioVisualizer } from './utils/NativeAudioVisualizer';
import { NativeParticles } from './utils/NativeParticles';

export class WallpaperEffectController {
    private _particles: NativeParticles;
    private _audiovisualizer: NativeAudioVisualizer;

    constructor(container: HTMLElement) {
        // Initialize both systems
        this._particles = new NativeParticles(container);
        this._audiovisualizer = new NativeAudioVisualizer(container);
    }

    /**
     * Call particle methods: wallpaper.particles('startParticles')
     * or chain: wallpaper.particles('clearCanvas').particles('stopParticles')
     */
    particles(method: string, ...args: unknown[]): WallpaperEffectController {
        switch (method) {
            case 'startParticles':
                // Stop PWParticles animation to avoid conflicts
                stopPWParticlesAuto();
                this._particles.startParticles();
                break;
            case 'stopParticles':
                this._particles.stopParticles();
                break;
            case 'clearCanvas':
                this._particles.clearCanvas();
                break;
            case 'addParticles':
                if (args[0] !== undefined) {
                    this._particles.addParticles(args[0] as number);
                }
                break;
            case 'particlesImage':
                this._particles.particlesImage(args[0] as string, args[1] as string | undefined);
                break;
            case 'set':
                if (args[0] !== undefined && args[1] !== undefined) {
                    this._particles.set(args[0] as string, args[1]);
                }
                break;
        }
        return this;
    }

    /**
     * Call audiovisualizer methods: wallpaper.audiovisualizer('drawCanvas', audioData)
     * or chain: wallpaper.audiovisualizer('clearCanvas')
     */
    audiovisualizer(method: string, ...args: unknown[]): WallpaperEffectController {
        switch (method) {
            case 'clearCanvas':
                this._audiovisualizer.clearCanvas();
                break;
            case 'drawCanvas':
                if (args[0] !== undefined) {
                    this._audiovisualizer.drawCanvas(args[0] as number[]);
                }
                break;
            case 'set':
                if (args[0] !== undefined && args[1] !== undefined) {
                    this._audiovisualizer.set(args[0] as string, args[1]);
                }
                break;
            case 'destroy':
                this._audiovisualizer.destroy();
                break;
        }
        return this;
    }

    // Direct access to underlying instances if needed
    getParticles(): NativeParticles {
        return this._particles;
    }

    getAudioVisualizer(): NativeAudioVisualizer {
        return this._audiovisualizer;
    }
}