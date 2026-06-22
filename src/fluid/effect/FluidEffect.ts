/**
 * 流体效果统一类
 *
 * 合并配置状态管理与渲染逻辑，对外暴露 `enable/disable/enableFullscreen/...`
 * 状态机 API。状态机 + 配置分发在本类；init/destroy 主体委托给
 * `lifecycleImpl`，DOM 原子操作委托给 `lifecycle` / `pictureInfo`。
 */

import { timerManager } from '@/utils/timer';

import { FluidEffectState as FluidEffectStateEnum } from '../types';
import { DEFAULT_FLUID_EFFECT_CONFIG, type FluidEffectState } from '../types';
import { FluidEffect2Renderer } from './FluidEffect2Renderer';
import type { LifecycleContext } from './lifecycleImpl';
import {
    performDestroyFullscreenEffect,
    performDestroyNormalEffect,
    performInitFullscreenEffect,
    performInitNormalEffect,
    performUpdateFullscreenSource,
} from './lifecycleImpl';

export class FluidEffect {
    // 配置状态 - 使用状态机
    private _state: FluidEffectState = FluidEffectStateEnum.DISABLED;
    resolution: number = DEFAULT_FLUID_EFFECT_CONFIG.resolution;
    blurAmount: number = DEFAULT_FLUID_EFFECT_CONFIG.blurAmount;
    displacementScale: number = DEFAULT_FLUID_EFFECT_CONFIG.displacementScale;
    turbulenceFrequency: number = DEFAULT_FLUID_EFFECT_CONFIG.turbulenceFrequency;
    turbulenceOctaves: number = DEFAULT_FLUID_EFFECT_CONFIG.turbulenceOctaves;
    canvasDisplacementAmplitude: number = DEFAULT_FLUID_EFFECT_CONFIG.canvasDisplacementAmplitude;

    // 渲染器实例
    private _normalEffect: FluidEffect2Renderer | null = null;
    private _fullscreenEffect: FluidEffect2Renderer | null = null;

    // 状态访问器
    get state(): FluidEffectState {
        return this._state;
    }

    get enabled(): boolean {
        return this._state !== FluidEffectStateEnum.DISABLED;
    }

    get fullscreenEnabled(): boolean {
        return this._state === FluidEffectStateEnum.FULLSCREEN;
    }

    /**
     * 创建流体效果统一实例
     */
    static create(): FluidEffect {
        return new FluidEffect();
    }

    enable(): this {
        if (this._state === FluidEffectStateEnum.FULLSCREEN) {
            return this;
        }
        if (this._state === FluidEffectStateEnum.NORMAL) {
            return this;
        }
        this._state = FluidEffectStateEnum.NORMAL;
        this.initNormalEffect();
        return this;
    }

    disable(): this {
        if (this._state === FluidEffectStateEnum.DISABLED) {
            return this;
        }
        if (this._state === FluidEffectStateEnum.FULLSCREEN) {
            this.destroyFullscreenEffect();
            this._state = FluidEffectStateEnum.DISABLED;
            return this;
        } else if (this._state === FluidEffectStateEnum.NORMAL) {
            this.destroyNormalEffect();
            this._state = FluidEffectStateEnum.DISABLED;
        }
        return this;
    }

    enableFullscreen(): this {
        if (this._state === FluidEffectStateEnum.FULLSCREEN) {
            return this;
        }
        // 清理普通效果，确保状态干净
        if (this._state === FluidEffectStateEnum.NORMAL) {
            this.destroyNormalEffect();
        }
        // 强制清理任何残留的普通效果
        if (this._normalEffect) {
            this._normalEffect.destroy();
            this._normalEffect = null;
        }
        this._state = FluidEffectStateEnum.FULLSCREEN;
        this.initFullscreenEffect();
        return this;
    }

    disableFullscreen(): this {
        if (this._state !== FluidEffectStateEnum.FULLSCREEN) {
            return this;
        }
        this.destroyFullscreenEffect();
        // 切换到普通模式并初始化播放器效果
        this._state = FluidEffectStateEnum.NORMAL;
        this.initNormalEffect();
        return this;
    }

    toggle(): boolean {
        if (this._state === FluidEffectStateEnum.FULLSCREEN) {
            return this.enabled;
        }
        if (this._state === FluidEffectStateEnum.NORMAL) {
            this.disable();
        } else {
            this.enable();
        }
        return this.enabled;
    }

    toggleFullscreen(): boolean {
        if (this._state === FluidEffectStateEnum.FULLSCREEN) {
            this.disableFullscreen();
        } else {
            this.enableFullscreen();
        }
        return this.fullscreenEnabled;
    }

    /**
     * 设置配置属性
     */
    set(key: string, value: unknown): this {
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
            return this;
        }

        // 更新普通模式渲染器选项
        if (this._state === FluidEffectStateEnum.NORMAL && this._normalEffect) {
            this._updateEffectOptions(this._normalEffect, key, value);
        }

        // 更新全屏模式渲染器选项
        if (this._state === FluidEffectStateEnum.FULLSCREEN && this._fullscreenEffect) {
            this._updateEffectOptions(this._fullscreenEffect, key, value);
        }

        return this;
    }

    private _updateEffectOptions(effect: FluidEffect2Renderer, key: string, value: unknown): void {
        const numValue = Number(value);
        if (key === 'resolution') {
            effect.updateOptions({ resolution: numValue });
            const thumbnail = document.querySelector('#player_control .thumbnail') as HTMLImageElement | null;
            if (thumbnail instanceof HTMLImageElement && thumbnail.complete) {
                effect.setSourceFromImage(thumbnail);
            }
        } else if (key === 'blurAmount') {
            effect.updateOptions({ blurAmount: numValue });
        } else if (key === 'displacementScale') {
            effect.updateOptions({ displacementScale: numValue });
        } else if (key === 'turbulenceFrequency') {
            effect.updateOptions({ turbulenceFrequency: numValue });
        } else if (key === 'turbulenceOctaves') {
            effect.updateOptions({ turbulenceOctaves: numValue });
        } else if (key === 'canvasDisplacementAmplitude') {
            effect.updateOptions({ canvasDisplacementAmplitude: numValue });
        }
    }

    // ==================== 生命周期方法 ====================

    initNormalEffect(): void {
        performInitNormalEffect(this as unknown as LifecycleContext);
    }

    destroyNormalEffect(): void {
        performDestroyNormalEffect(this as unknown as LifecycleContext);
    }

    initFullscreenEffect(): void {
        performInitFullscreenEffect(this as unknown as LifecycleContext);
    }

    destroyFullscreenEffect(): void {
        if (this._fullscreenEffect) {
            timerManager.resume('backgroundChange');
        }
        performDestroyFullscreenEffect(this as unknown as LifecycleContext);
    }

    /**
     * 更新全屏流体效果图片源
     */
    updateFullscreenSource(): void {
        performUpdateFullscreenSource(this as unknown as LifecycleContext);
    }

    // 公开渲染器实例访问
    get normalEffect(): FluidEffect2Renderer | null {
        return this._normalEffect;
    }

    get fullscreenEffect(): FluidEffect2Renderer | null {
        return this._fullscreenEffect;
    }
}
