/**
 * 流体效果控制模块
 * 统一管理播放器流体效果和全屏流体效果
 */

import { elements } from '../utils/elementManager';
import { appConfig, config } from '../utils/config';
import { FluidEffect2 } from './fluid_effect2';
import { hasPlaybackContent } from './player_control';
import { debugLogger } from '../utils/logger';
import { timerManager } from '../utils/timer';

// 使用 appConfig.runtime 存储流体效果实例
appConfig.runtime.fluidEffect = null;
appConfig.runtime.fullscreenFluidEffect = null;

// 内部状态标志
appConfig.runtime.fullscreenFluidEnabled = false;
appConfig.runtime.pictureInfoHideStyleAdded = false;

// fluidEffect 和 fullscreenFluidEffect 直接使用 appConfig.runtime 访问

// 直接在 appConfig.runtime 上定义 FluidEffectConfig（供外部模块访问）
appConfig.runtime.FluidEffectConfig = {
    enabled: true,
    resolution: 512,
    blurAmount: 5,
    displacementScale: 400,
    turbulenceFrequency: 0.005,
    turbulenceOctaves: 1,
    fullscreenEnabled: true,
    canvasDisplacementAmplitude: 20,

    init() {
        return this;
    },

    apply() {
        if (this.fullscreenEnabled) {
            this.enabled = false;
            destroyFluidEffect();
            if (typeof initFullscreenFluidEffect === 'function') {
                initFullscreenFluidEffect();
            }
        } else {
            if (typeof destroyFullscreenFluidEffect === 'function') {
                destroyFullscreenFluidEffect();
            }
            timerManager.resume('backgroundChange');
            if (this.enabled) {
                if (typeof initFluidEffect === 'function') {
                    initFluidEffect();
                }
            } else {
                if (typeof destroyFluidEffect === 'function') {
                    destroyFluidEffect();
                }
            }
        }

        if (appConfig.runtime.fluidEffect?.updateOptions) {
            appConfig.runtime.fluidEffect!.updateOptions({
                resolution: this.resolution,
                blurAmount: this.blurAmount,
                displacementScale: this.displacementScale,
                turbulenceFrequency: this.turbulenceFrequency,
                turbulenceOctaves: this.turbulenceOctaves
            });
        }

        if (appConfig.runtime.fullscreenFluidEffect) {
            appConfig.runtime.fullscreenFluidEffect!.updateOptions({
                resolution: this.resolution,
                blurAmount: this.blurAmount,
                displacementScale: this.displacementScale,
                turbulenceFrequency: this.turbulenceFrequency,
                turbulenceOctaves: this.turbulenceOctaves
            });
        }
        return this;
    },

    enable() {
        this.enabled = true;
        if (!this.fullscreenEnabled) {
            if (typeof initFluidEffect === 'function') {
                initFluidEffect();
            }
        }
        return this;
    },

    disable() {
        this.enabled = false;
        if (!this.fullscreenEnabled) {
            if (typeof destroyFluidEffect === 'function') {
                destroyFluidEffect();
            }
        }
        return this;
    },

    toggle() {
        if (this.fullscreenEnabled) {
            return this.enabled;
        }
        this.enabled = !this.enabled;
        if (this.enabled) {
            if (typeof initFluidEffect === 'function') {
                initFluidEffect();
            }
        } else {
            if (typeof destroyFluidEffect === 'function') {
                destroyFluidEffect();
            }
        }
        return this.enabled;
    },

    enableFullscreen() {
        this.fullscreenEnabled = true;
        document.querySelector('.fluid-effect-wrapper')?.remove();
        if (appConfig.runtime.fluidEffect) {
            appConfig.runtime.fluidEffect!.destroy();
            appConfig.runtime.fluidEffect = null;;
        }
        if (typeof initFullscreenFluidEffect === 'function') {
            initFullscreenFluidEffect();
        }
        return this;
    },

    disableFullscreen() {
        this.fullscreenEnabled = false;
        if (typeof destroyFullscreenFluidEffect === 'function') {
            destroyFullscreenFluidEffect();
        }
        if (this.enabled && typeof initFluidEffect === 'function') {
            initFluidEffect();
        }
        return this;
    },

    toggleFullscreen() {
        this.fullscreenEnabled = !this.fullscreenEnabled;
        if (this.fullscreenEnabled) {
            document.querySelector('.fluid-effect-wrapper')?.remove();
            if (typeof destroyFluidEffect === 'function') {
                destroyFluidEffect();
            }
            if (typeof initFullscreenFluidEffect === 'function') {
                initFullscreenFluidEffect();
            }
        } else {
            if (typeof destroyFullscreenFluidEffect === 'function') {
                destroyFullscreenFluidEffect();
            }
            if (this.enabled && typeof initFluidEffect === 'function') {
                initFluidEffect();
            }
        }
        return this.fullscreenEnabled;
    },

    set(key: string, value: unknown) {
        if (key in this && typeof (this as Record<string, unknown>)[key] !== 'function') {
            (this as Record<string, unknown>)[key] = value;

            if (key === 'fullscreenEnabled') {
                if (value) {
                    this.enableFullscreen();
                } else {
                    this.disableFullscreen();
                }
                return this;
            }

            if (key === 'enabled') {
                if (value) {
                    this.enable();
                } else {
                    this.disable();
                }
            }

            if (this.enabled && appConfig.runtime.fluidEffect?.updateOptions) {
                if (key === 'resolution') {
                    appConfig.runtime.fluidEffect!.updateOptions({ resolution: Number(value) });
                    const thumbnail = elements.playerControl.thumbnail;
                    if (thumbnail instanceof HTMLImageElement && thumbnail.complete) {
                        appConfig.runtime.fluidEffect!.setSourceFromImage(thumbnail);
                    }
                } else if (key === 'blurAmount') {
                    appConfig.runtime.fluidEffect!.updateOptions({ blurAmount: Number(value) });
                } else if (key === 'displacementScale') {
                    appConfig.runtime.fluidEffect!.updateOptions({ displacementScale: Number(value) });
                } else if (key === 'turbulenceFrequency') {
                    appConfig.runtime.fluidEffect!.updateOptions({ turbulenceFrequency: Number(value) });
                } else if (key === 'turbulenceOctaves') {
                    appConfig.runtime.fluidEffect!.updateOptions({ turbulenceOctaves: Number(value) });
                } else if (key === 'canvasDisplacementAmplitude') {
                    appConfig.runtime.fluidEffect!.updateOptions({ canvasDisplacementAmplitude: Number(value) });
                }
            }

            if (this.fullscreenEnabled && appConfig.runtime.fullscreenFluidEffect) {
                if (key === 'resolution') {
                    appConfig.runtime.fullscreenFluidEffect!.updateOptions({ resolution: Number(value) });
                } else if (key === 'blurAmount') {
                    appConfig.runtime.fullscreenFluidEffect!.updateOptions({ blurAmount: Number(value) });
                } else if (key === 'displacementScale') {
                    appConfig.runtime.fullscreenFluidEffect!.updateOptions({ displacementScale: Number(value) });
                } else if (key === 'turbulenceFrequency') {
                    appConfig.runtime.fullscreenFluidEffect!.updateOptions({ turbulenceFrequency: Number(value) });
                } else if (key === 'turbulenceOctaves') {
                    appConfig.runtime.fullscreenFluidEffect!.updateOptions({ turbulenceOctaves: Number(value) });
                } else if (key === 'canvasDisplacementAmplitude') {
                    appConfig.runtime.fullscreenFluidEffect!.updateOptions({ canvasDisplacementAmplitude: Number(value) });
                }
            }

            return true;
        }
        return false;
    }
};

// 模块内部也通过 appConfig.runtime.FluidEffectConfig 访问
const FluidEffectConfig = appConfig.runtime.FluidEffectConfig;

export function toggleFluidEffect(enable?: boolean): boolean {
    if (enable === undefined) {
        enable = !FluidEffectConfig.enabled;
    }
    if (enable) {
        FluidEffectConfig.enabled = true;
        if (typeof initFluidEffect === 'function') {
            initFluidEffect();
        }
    } else {
        FluidEffectConfig.enabled = false;
        if (typeof destroyFluidEffect === 'function') {
            destroyFluidEffect();
        }
    }
    return enable;
}

export function updateFluidResolution(resolution: number): void {
    FluidEffectConfig.set('resolution', resolution);
}

export function initFullscreenFluidEffect(): void {
    if (!FluidEffectConfig.fullscreenEnabled) {
        if (appConfig.runtime.fullscreenFluidEffect) {
            appConfig.runtime.fullscreenFluidEffect!.destroy();
            appConfig.runtime.fullscreenFluidEffect = null;;
        }
        return;
    }

    if (appConfig.runtime.fullscreenFluidEffect) {
        return;
    }

    if (typeof hasPlaybackContent === 'function' && !hasPlaybackContent()) {
        return;
    }

    let isPaused = false;
    const playbackState = config.playbackState;
    if (playbackState === 2) {
        isPaused = true;
    }

    appConfig.runtime.fullscreenFluidEnabled = true;
    addPictureInfoHideStyle();

    const container = document.body;

    try {
        const newFullscreenFluidEffect = new FluidEffect2(container, {
            resolution: FluidEffectConfig.resolution,
            blurAmount: FluidEffectConfig.blurAmount,
            displacementScale: FluidEffectConfig.displacementScale,
            turbulenceFrequency: FluidEffectConfig.turbulenceFrequency,
            turbulenceOctaves: FluidEffectConfig.turbulenceOctaves,
            canvasDisplacementAmplitude: FluidEffectConfig.canvasDisplacementAmplitude
        });
        appConfig.runtime.fullscreenFluidEffect = newFullscreenFluidEffect;;
        appConfig.runtime.fullscreenFluidEffect!.start();

        if (isPaused) {
            appConfig.runtime.fullscreenFluidEffect!.setPlayState(false);
        }

        const thumbnail = elements.playerControl.thumbnail as HTMLImageElement | undefined;
        const imgSrc = thumbnail?.src;

        if (imgSrc && imgSrc !== '') {
            const img = new Image();
            img.crossOrigin = 'Anonymous';
            img.onload = () => {
                if (appConfig.runtime.fullscreenFluidEffect) {
                    appConfig.runtime.fullscreenFluidEffect!.setSourceFromImage(img);
                    const wrapper = document.querySelector('.fluid-effect-wrapper') as HTMLElement | null;
                    if (wrapper) {
                        wrapper.style.backgroundImage = `url('${imgSrc}')`;
                        wrapper.style.backgroundSize = 'cover';
                        wrapper.style.backgroundPosition = 'center';
                        wrapper.style.backgroundRepeat = 'no-repeat';
                    }
                }
            };
            img.src = imgSrc;
        } else {
            const wrapper = document.querySelector('.fluid-effect-wrapper') as HTMLElement | null;
            if (wrapper) {
                wrapper.style.backgroundImage = "url('imgs/1.jpg')";
                wrapper.style.backgroundSize = 'cover';
                wrapper.style.backgroundPosition = 'center';
                wrapper.style.backgroundRepeat = 'no-repeat';
            }
        }
    } catch (error) {
        debugLogger.error('Failed to initialize fullscreen fluid effect:', { msg: error });
    }
}

export function destroyFullscreenFluidEffect(): void {
    if (appConfig.runtime.fullscreenFluidEffect) {
        appConfig.runtime.fullscreenFluidEffect!.destroy();
        appConfig.runtime.fullscreenFluidEffect = null;;
        timerManager.resume('backgroundChange');
    }

    appConfig.runtime.fullscreenFluidEnabled = false;
    removePictureInfoHideStyle();

    const fluidWrapper = document.querySelector('.fluid-effect-wrapper') as HTMLElement | null;
    if (fluidWrapper) {
        fluidWrapper.style.backgroundImage = 'none';
    }
}

export function updateFullscreenFluidSource(): void {
    if (!FluidEffectConfig.fullscreenEnabled) {
        return;
    }

    if (!appConfig.runtime.fullscreenFluidEffect) {
        initFullscreenFluidEffect();
        return;
    }

    const thumbnail = elements.playerControl.thumbnail as HTMLImageElement | undefined;
    if (!thumbnail?.src || thumbnail.src === '') {
        return;
    }

    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.onload = () => {
        if (appConfig.runtime.fullscreenFluidEffect?.setSourceFromImage) {
            appConfig.runtime.fullscreenFluidEffect!.setSourceFromImage(img);
            const fluidWrapper = document.querySelector('.fluid-effect-wrapper') as HTMLElement | null;
            if (fluidWrapper) {
                fluidWrapper.style.backgroundImage = `url('${thumbnail.src}')`;
                fluidWrapper.style.backgroundSize = 'cover';
                fluidWrapper.style.backgroundPosition = 'center';
                fluidWrapper.style.backgroundRepeat = 'no-repeat';
            }
        }
    };
    img.src = thumbnail.src;
}

function addPictureInfoHideStyle(): void {
    const pictureInfo = elements.slide.picture_info;
    if (pictureInfo) {
        pictureInfo.classList.add('fluid-hidden');
    }
    appConfig.runtime.pictureInfoHideStyleAdded = true;
}

function removePictureInfoHideStyle(): void {
    const pictureInfo = elements.slide.picture_info;
    if (pictureInfo) {
        pictureInfo.classList.remove('fluid-hidden');
    }
    appConfig.runtime.pictureInfoHideStyleAdded = false;
}

function initPictureInfoControl(): void {
    if (appConfig.runtime.fullscreenFluidEnabled) {
        addPictureInfoHideStyle();
    }
}

export function initFluidEffect(): void {
    if (!FluidEffectConfig) {
        return;
    }

    if (FluidEffectConfig.fullscreenEnabled) {
        return;
    }

    if (typeof hasPlaybackContent !== 'function' || !hasPlaybackContent()) {
        return;
    }

    if (appConfig.runtime.fluidEffect) {
        appConfig.runtime.fluidEffect.destroy();
        appConfig.runtime.fluidEffect = null;
    }

    const container = document.querySelector('#player_control .background') as HTMLElement | null;
    if (!container) {
        return;
    }

    debugLogger.info('[FluidControl] 正在初始化播放器流体效果...');
    try {
        const newFluidEffect = new FluidEffect2(container, {
            resolution: FluidEffectConfig.resolution,
            blurAmount: FluidEffectConfig.blurAmount,
            displacementScale: FluidEffectConfig.displacementScale,
            turbulenceFrequency: FluidEffectConfig.turbulenceFrequency,
            turbulenceOctaves: FluidEffectConfig.turbulenceOctaves,
            canvasDisplacementAmplitude: FluidEffectConfig.canvasDisplacementAmplitude
        });
        appConfig.runtime.fluidEffect = newFluidEffect;;
    } catch (error) {
        return;
    }

    const thumbnail = elements.playerControl.thumbnail as HTMLImageElement | undefined;
    if (thumbnail?.complete && appConfig.runtime.fluidEffect?.setSourceFromImage) {
        appConfig.runtime.fluidEffect!.setSourceFromImage(thumbnail);
        const wrapper = document.querySelector('.fluid-effect-wrapper') as HTMLElement | null;
        if (wrapper && thumbnail.src) {
            wrapper.style.backgroundImage = `url('${thumbnail.src}')`;
        }
    }

    if (appConfig.runtime.fluidEffect?.start) {
        appConfig.runtime.fluidEffect!.start();
    }

    const currentPlaybackState = config.playbackState;
    if (currentPlaybackState === 2) {
        if (appConfig.runtime.fluidEffect?.setPlayState) {
            appConfig.runtime.fluidEffect!.setPlayState(false);
        }
    } else if (currentPlaybackState === 1) {
        if (appConfig.runtime.fluidEffect?.setPlayState) {
            appConfig.runtime.fluidEffect!.setPlayState(true);
        }
    }

    container.style.background = 'none';
    container.style.overflow = 'hidden';
    debugLogger.info('[FluidControl] 播放器流体效果初始化完成');
}

export function destroyFluidEffect(): void {
    debugLogger.info('[FluidControl] 正在销毁播放器流体效果');
    if (FluidEffectConfig?.fullscreenEnabled) {
        return;
    }

    if (appConfig.runtime.fluidEffect) {
        appConfig.runtime.fluidEffect!.destroy();
        appConfig.runtime.fluidEffect = null;;

        const background = elements.playerControl.background;
        if (background) {
            background.style.background = '';
        }
    }
    debugLogger.info('[FluidControl] 播放器流体效果已销毁');
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initPictureInfoControl);
} else {
    initPictureInfoControl();
}

FluidEffectConfig.init();
FluidEffectConfig.apply();
