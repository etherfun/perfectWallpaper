/**
 * 流体效果控制模块
 * 统一管理播放器流体效果和全屏流体效果
 */

import { elements } from '../utils/elementManager';
import { appConfig, config } from '../utils/config';
import { FluidEffect2 } from './fluid_effect2';
import { hasPlaybackContent } from './player_control';
import { debugLogger } from '../utils/logger';
import { timerManager, waitAndExecute } from '../utils/timer';

// 使用 appConfig.runtime 存储流体效果实例
appConfig.runtime.fluidEffect = null;
appConfig.runtime.fullscreenFluidEffect = null;

// 内部状态标志
appConfig.runtime.fullscreenFluidEnabled = false;
appConfig.runtime.pictureInfoHideStyleAdded = false;

// fluidEffect 和 fullscreenFluidEffect 直接使用 appConfig.runtime 访问

// FluidEffectConfig 类定义
export class FluidEffectConfig {
    enabled: boolean = true;
    resolution: number = 512;
    blurAmount: number = 5;
    displacementScale: number = 400;
    turbulenceFrequency: number = 0.005;
    turbulenceOctaves: number = 1;
    fullscreenEnabled: boolean = true;
    canvasDisplacementAmplitude: number = 20;

    /** 标记属性是否已处理（避免 apply() 在属性处理前被调用时产生副作用） */
    private _propertiesApplied: boolean = false;

    /** 标记是否正在执行 set() 操作（避免 set() 后重复调用 apply()） */
    private _inSetOperation: boolean = false;

    init() {
        return this;
    }

    /** 标记属性已处理完成 */
    markPropertiesApplied(): void {
        this._propertiesApplied = true;
        // 如果正在执行 set() 操作，apply() 已在 set() 中调用，这里不再调用
        if (this._inSetOperation) {
            return;
        }
        // 属性处理完成后立即应用配置并初始化
        this.apply();
    }

    apply() {
        // 在属性处理前，apply() 只更新选项，不执行销毁/初始化等副作用
        if (!this._propertiesApplied) {
            return this;
        }

        this._applyFullscreenMode();
        return this;
    }

    /** 根据当前配置应用全屏/普通模式 */
    private _applyFullscreenMode(): void {
        if (this.fullscreenEnabled) {
            // 如果 enabled 为 false，不初始化任何效果
            if (!this.enabled) {
                destroyFluidEffect();
                return;
            }
            // 只在全屏模式下销毁普通流体效果，不改变 enabled 状态
            destroyFluidEffect();
            // 初始化全屏流体效果
            initFullscreenFluidEffect();
        } else {
            if (typeof destroyFullscreenFluidEffect === 'function') {
                destroyFullscreenFluidEffect();
            }
            timerManager.resume('backgroundChange');
            if (!this.enabled) {
                if (typeof destroyFluidEffect === 'function') {
                    destroyFluidEffect();
                }
            } else {
                // enabled = true 且 fullscreenEnabled = false，初始化播放器流体效果
                initFluidEffect();
            }
        }
    }

    enable() {
        this.enabled = true;
        return this;
    }

    disable() {
        this.enabled = false;
        if (this.fullscreenEnabled) {
            destroyFullscreenFluidEffect();
        } else {
            destroyFluidEffect();
        }
        return this;
    }

    toggle() {
        if (this.fullscreenEnabled) {
            return this.enabled;
        }
        this.enabled = !this.enabled;
        if (!this.enabled) {
            if (typeof destroyFluidEffect === 'function') {
                destroyFluidEffect();
            }
        }
        return this.enabled;
    }

    enableFullscreen() {
        this.fullscreenEnabled = true;
        document.querySelector('.fluid-effect-wrapper')?.remove();
        if (appConfig.runtime.fluidEffect) {
            appConfig.runtime.fluidEffect!.destroy();
            appConfig.runtime.fluidEffect = null;;
        }
        return this;
    }

    disableFullscreen() {
        this.fullscreenEnabled = false;
        if (typeof destroyFullscreenFluidEffect === 'function') {
            destroyFullscreenFluidEffect();
        }
        return this;
    }

    toggleFullscreen() {
        this.fullscreenEnabled = !this.fullscreenEnabled;
        if (this.fullscreenEnabled) {
            document.querySelector('.fluid-effect-wrapper')?.remove();
            if (typeof destroyFluidEffect === 'function') {
                destroyFluidEffect();
            }
        } else {
            if (typeof destroyFullscreenFluidEffect === 'function') {
                destroyFullscreenFluidEffect();
            }
        }
        return this.fullscreenEnabled;
    }

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
                this._inSetOperation = true;
                if (value) {
                    this.enable();
                } else {
                    this.disable();
                }
                this._inSetOperation = false;
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
}

export function initFullscreenFluidEffect(): void {
    if (!appConfig.runtime.FluidEffectConfig.fullscreenEnabled) {
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
            resolution: appConfig.runtime.FluidEffectConfig.resolution,
            blurAmount: appConfig.runtime.FluidEffectConfig.blurAmount,
            displacementScale: appConfig.runtime.FluidEffectConfig.displacementScale,
            turbulenceFrequency: appConfig.runtime.FluidEffectConfig.turbulenceFrequency,
            turbulenceOctaves: appConfig.runtime.FluidEffectConfig.turbulenceOctaves,
            canvasDisplacementAmplitude: appConfig.runtime.FluidEffectConfig.canvasDisplacementAmplitude
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
    if (!appConfig.runtime.FluidEffectConfig.fullscreenEnabled) {
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
    if (!appConfig.runtime.FluidEffectConfig) {
        return;
    }

    if (appConfig.runtime.FluidEffectConfig.fullscreenEnabled) {
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

    try {
        const newFluidEffect = new FluidEffect2(container, {
            resolution: appConfig.runtime.FluidEffectConfig.resolution,
            blurAmount: appConfig.runtime.FluidEffectConfig.blurAmount,
            displacementScale: appConfig.runtime.FluidEffectConfig.displacementScale,
            turbulenceFrequency: appConfig.runtime.FluidEffectConfig.turbulenceFrequency,
            turbulenceOctaves: appConfig.runtime.FluidEffectConfig.turbulenceOctaves,
            canvasDisplacementAmplitude: appConfig.runtime.FluidEffectConfig.canvasDisplacementAmplitude
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
}

export function destroyFluidEffect(): void {
    const cfg = appConfig.runtime.FluidEffectConfig;
    if (cfg?.fullscreenEnabled) {
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
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initPictureInfoControl);
} else {
    initPictureInfoControl();
}

// 等待配置初始化完成后标记为就绪（实际初始化在 markPropertiesApplied 中进行）
waitAndExecute(
    () => config.fluidEffectInitComplete === true,
    () => {
        // 实际初始化在 handleFluidEffectProperties 的 markPropertiesApplied() 中进行
        appConfig.runtime.FluidEffectConfig.markPropertiesApplied();
    },
    500,
    15000
);
