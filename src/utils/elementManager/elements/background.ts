/**
 * 背景/幻灯片相关 DOM 元素
 *
 * lazy getter：背景容器由 Background.vue 渲染，
 * 在 Vue mount 后才存在于 DOM 中。
 */
import { makeLazyMap } from '../lazyMap';

const slideSelectors = {
    RGBuse: '#RGBuse',
    picture_info: '#picture_info',
    info: '#picture_info .info',
    title: '#picture_info .title',
    author: '#picture_info .author',
    location: '#picture_info .location',
    description: '#picture_info .description',
} as const;

type SlideMap = {
    RGBuse: HTMLElement;
    picture_info: HTMLElement;
    info: HTMLElement;
    title: HTMLElement;
    author: HTMLElement;
    location: HTMLElement;
    description: HTMLElement;
};

const bgSelectors = {
    container: '#background-container',
    layer1: '#background-layer1',
    layer2: '#background-layer2',
    blurLayer1: '#background-blur-layer1',
    blurLayer2: '#background-blur-layer2',
} as const;

type BackgroundMap = {
    container: HTMLElement;
    layer1: HTMLElement;
    layer2: HTMLElement;
    blurLayer1: HTMLElement;
    blurLayer2: HTMLElement;
};

export const backgroundElements = {
    slide: makeLazyMap<keyof typeof slideSelectors>(slideSelectors) as unknown as SlideMap,
    background: makeLazyMap<keyof typeof bgSelectors>(bgSelectors) as unknown as BackgroundMap,
};
