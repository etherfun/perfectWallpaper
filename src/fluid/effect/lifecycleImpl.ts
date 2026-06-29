/**
 * 流体效果生命周期实现（context-based）
 *
 * 把 `FluidEffect` 的 init/destroy/update 方法主体抽到独立函数，
 * 通过 `LifecycleContext` 接口注入所需状态，便于阅读和单测。
 * 调用方（`FluidEffect` 的同名方法）只保留状态守卫和转发逻辑。
 */

import { useRuntimeStore } from '@/stores/runtime';
import { debugLogger } from '@/utils/logger';

const runtimeStore = useRuntimeStore();
import { hasPlaybackContent } from '@/utils/playback';

import type { FluidEffectState } from '../types';
import { FluidEffectState as FluidEffectStateEnum } from '../types';
import { FALLBACK_FULLSCREEN_IMAGE } from './constants';
import { FluidEffect2Renderer } from './FluidEffect2Renderer';
import {
    applyFallbackBackground,
    asyncLoadThumbnailIntoRenderer,
    clearNormalContainerStyle,
    clearWrapperBackground,
    getCurrentThumbnail,
    loadThumbnailIntoRenderer,
    queryFluidWrapper,
    queryNormalContainer,
    setNormalContainerStyle,
} from './lifecycle';
import { addPictureInfoHideStyle, removePictureInfoHideStyle } from './pictureInfo';

/** `FluidEffect` 暴露给 lifecycle 实现所需的最小状态/方法 */
export interface LifecycleContext {
    get _state(): FluidEffectState;
    set _state(value: FluidEffectState);

    get _normalEffect(): FluidEffect2Renderer | null;
    set _normalEffect(value: FluidEffect2Renderer | null);

    get _fullscreenEffect(): FluidEffect2Renderer | null;
    set _fullscreenEffect(value: FluidEffect2Renderer | null);

    resolution: number;
    blurAmount: number;
    displacementScale: number;
    turbulenceFrequency: number;
    turbulenceOctaves: number;
    canvasDisplacementAmplitude: number;
}

/** 普通模式渲染器构造时的选项快照（去除 `fullscreen` 字段） */
function snapshotRendererOptions(ctx: LifecycleContext) {
    return {
        resolution: ctx.resolution,
        blurAmount: ctx.blurAmount,
        displacementScale: ctx.displacementScale,
        turbulenceFrequency: ctx.turbulenceFrequency,
        turbulenceOctaves: ctx.turbulenceOctaves,
        canvasDisplacementAmplitude: ctx.canvasDisplacementAmplitude,
    };
}

/** 实现 `FluidEffect.initNormalEffect` 主体（状态守卫由调用方负责） */
export function performInitNormalEffect(ctx: LifecycleContext): void {
    if (ctx._state === FluidEffectStateEnum.FULLSCREEN) {
        return;
    }
    if (ctx._normalEffect) {
        return;
    }
    if (typeof hasPlaybackContent !== 'function' || !hasPlaybackContent()) {
        return;
    }

    const container = queryNormalContainer();
    if (!container) {
        return;
    }

    try {
        const effect = new FluidEffect2Renderer(container, snapshotRendererOptions(ctx));
        ctx._normalEffect = effect;

        const thumbnail = getCurrentThumbnail();
        if (thumbnail?.complete) {
            loadThumbnailIntoRenderer(effect, thumbnail);
        }

        effect.start();
        setNormalContainerStyle(container);
    } catch (_error) {
        return;
    }
}

/** 实现 `FluidEffect.destroyNormalEffect` 主体 */
export function performDestroyNormalEffect(ctx: LifecycleContext): void {
    if (!ctx._normalEffect) return;
    ctx._normalEffect.destroy();
    ctx._normalEffect = null;
    clearNormalContainerStyle();
}

/** 实现 `FluidEffect.initFullscreenEffect` 主体（状态守卫由调用方负责） */
export function performInitFullscreenEffect(ctx: LifecycleContext): void {
    if (ctx._state !== FluidEffectStateEnum.FULLSCREEN) {
        if (ctx._fullscreenEffect) {
            ctx._fullscreenEffect.destroy();
            ctx._fullscreenEffect = null;
        }
        return;
    }

    if (ctx._fullscreenEffect) {
        return;
    }
    if (typeof hasPlaybackContent === 'function' && !hasPlaybackContent()) {
        return;
    }

    runtimeStore.fullscreenFluidEnabled = true;
    addPictureInfoHideStyle();

    const container = document.body;

    try {
        const effect = new FluidEffect2Renderer(container, {
            ...snapshotRendererOptions(ctx),
            fullscreen: true,
        });
        ctx._fullscreenEffect = effect;
        effect.start();

        const thumbnail = getCurrentThumbnail();
        const imgSrc = thumbnail?.src;

        if (imgSrc && imgSrc !== '') {
            asyncLoadThumbnailIntoRenderer(effect, imgSrc, () => ctx._fullscreenEffect === effect);
        } else {
            const wrapper = queryFluidWrapper();
            if (wrapper) {
                applyFallbackBackground(wrapper, FALLBACK_FULLSCREEN_IMAGE);
            }
        }
    } catch (error) {
        debugLogger.error('Failed to initialize fullscreen fluid effect:', { msg: error });
    }
}

/** 实现 `FluidEffect.destroyFullscreenEffect` 主体 */
export function performDestroyFullscreenEffect(ctx: LifecycleContext): void {
    if (ctx._fullscreenEffect) {
        ctx._fullscreenEffect.destroy();
        ctx._fullscreenEffect = null;
    }
    runtimeStore.fullscreenFluidEnabled = false;
    removePictureInfoHideStyle();
    clearWrapperBackground();
}

/**
 * 实现 `FluidEffect.updateFullscreenSource` 主体
 * 必要时按需重新 init 全屏效果并异步加载最新 thumbnail。
 */
export function performUpdateFullscreenSource(ctx: LifecycleContext): void {
    if (ctx._state !== FluidEffectStateEnum.FULLSCREEN) {
        return;
    }

    if (!ctx._fullscreenEffect) {
        performInitFullscreenEffect(ctx);
    }

    const thumbnail = getCurrentThumbnail();
    if (!thumbnail?.src || thumbnail.src === '') {
        return;
    }

    const effect = ctx._fullscreenEffect;
    if (!effect) return;

    asyncLoadThumbnailIntoRenderer(effect, thumbnail.src, () => ctx._fullscreenEffect === effect);
}
