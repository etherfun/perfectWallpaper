/**
 * 流体效果生命周期辅助
 *
 * 负责以下重复出现的子任务，供 `FluidEffect.initNormalEffect` /
 * `initFullscreenEffect` / `updateFullscreenSource` 调用：
 *   - 查找当前 thumbnail 元素
 *   - 加载 thumbnail 到渲染器
 *   - 给 `.fluid-effect-wrapper` 写背景图样式
 *   - 卸载渲染器时清理背景
 */

import { elements } from '@/utils/elementManager';

import { FULLSCREEN_BACKGROUND_STYLE } from './constants';
import type { FluidEffect2Renderer } from './FluidEffect2Renderer';
import { loadImageFromUrl } from './imageSource';

const WRAPPER_SELECTOR = '.fluid-effect-wrapper';
const NORMAL_CONTAINER_SELECTOR = '#player_control .background';

/** 返回当前播放器缩略图（已加载或未加载） */
export function getCurrentThumbnail(): HTMLImageElement | undefined {
    return elements.playerControl.thumbnail as HTMLImageElement | undefined;
}

/** 查找普通模式的容器；`#player_control .background` */
export function queryNormalContainer(): HTMLElement | null {
    return document.querySelector(NORMAL_CONTAINER_SELECTOR) as HTMLElement | null;
}

/** 查找流体效果外层 wrapper（可能为 null） */
export function queryFluidWrapper(): HTMLElement | null {
    return document.querySelector(WRAPPER_SELECTOR) as HTMLElement | null;
}

/** 把 wrapper 设为 `none` 背景，关闭流体效果后用于恢复默认 */
export function clearWrapperBackground(): void {
    const wrapper = queryFluidWrapper();
    if (wrapper) {
        wrapper.style.backgroundImage = 'none';
    }
}

/** 把 wrapper 的背景图设为 thumbnail；附带 cover/center/no-repeat 样式 */
export function applyThumbnailBackground(wrapper: HTMLElement, thumbnailSrc: string): void {
    wrapper.style.backgroundImage = `url('${thumbnailSrc}')`;
    wrapper.style.backgroundSize = FULLSCREEN_BACKGROUND_STYLE.size;
    wrapper.style.backgroundPosition = FULLSCREEN_BACKGROUND_STYLE.position;
    wrapper.style.backgroundRepeat = FULLSCREEN_BACKGROUND_STYLE.repeat;
}

/** 全屏模式无 thumbnail 时的回退背景 */
export function applyFallbackBackground(wrapper: HTMLElement, fallbackCssUrl: string): void {
    wrapper.style.backgroundImage = fallbackCssUrl;
    wrapper.style.backgroundSize = FULLSCREEN_BACKGROUND_STYLE.size;
    wrapper.style.backgroundPosition = FULLSCREEN_BACKGROUND_STYLE.position;
    wrapper.style.backgroundRepeat = FULLSCREEN_BACKGROUND_STYLE.repeat;
}

/**
 * 把 thumbnail 加载到指定渲染器，加载成功后再设置 wrapper 背景。
 * 用于普通模式（同步）。
 */
export function loadThumbnailIntoRenderer(
    effect: FluidEffect2Renderer,
    thumbnail: HTMLImageElement
): void {
    effect.setSourceFromImage(thumbnail);
    const wrapper = queryFluidWrapper();
    if (wrapper && thumbnail.src) {
        wrapper.style.backgroundImage = `url('${thumbnail.src}')`;
    }
}

/**
 * 异步把 thumbnail.src 加载到指定渲染器（全屏模式专用），
 * 加载完成后用 cover/center/no-repeat 模式把 wrapper 设为同一图作为背景层。
 * 加载过程中如果 `effect` 已被销毁，回调将 noop。
 */
export function asyncLoadThumbnailIntoRenderer(
    effect: FluidEffect2Renderer,
    thumbnailSrc: string,
    isEffectAlive: () => boolean
): void {
    loadImageFromUrl(thumbnailSrc, image => {
        if (!isEffectAlive()) return;
        effect.setSourceFromImage(image);
        const wrapper = queryFluidWrapper();
        if (wrapper) {
            applyThumbnailBackground(wrapper, thumbnailSrc);
        }
    });
}

/** 设置普通模式容器样式（无背景、隐藏溢出） */
export function setNormalContainerStyle(container: HTMLElement): void {
    container.style.background = 'none';
    container.style.overflow = 'hidden';
}

/** 清除普通模式容器样式（恢复默认背景） */
export function clearNormalContainerStyle(): void {
    const background = elements.playerControl.background;
    if (background) {
        background.style.background = '';
    }
}
