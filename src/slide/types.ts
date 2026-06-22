/**
 * Slide module type definitions
 */

// DOM elements for picture info (queried lazily, not at module-load time)
export const pictures = {
    get picture_info(): HTMLElement {
        return document.querySelector('#picture_info') as HTMLElement;
    },
    get info(): HTMLElement {
        return document.querySelector('#picture_info .info') as HTMLElement;
    },
    get title(): HTMLElement {
        return document.querySelector('#picture_info .title') as HTMLElement;
    },
    get author(): HTMLElement {
        return document.querySelector('#picture_info .author') as HTMLElement;
    },
    get where(): HTMLElement {
        return document.querySelector('#picture_info .location') as HTMLElement;
    },
    get text(): HTMLElement {
        return document.querySelector('#picture_info .description') as HTMLElement;
    },
};

// Background layers (DOM elements) - shared between modules
export const backgroundLayers = {
    get container(): HTMLElement {
        return document.querySelector('#background-container') as HTMLElement;
    },
    get layer1(): HTMLElement {
        return document.querySelector('#background-layer1') as HTMLElement;
    },
    get layer2(): HTMLElement {
        return document.querySelector('#background-layer2') as HTMLElement;
    },
    get blurLayer1(): HTMLElement {
        return document.querySelector('#background-blur-layer1') as HTMLElement;
    },
    get blurLayer2(): HTMLElement {
        return document.querySelector('#background-blur-layer2') as HTMLElement;
    },
    currentActive: 1 as 1 | 2,
    blurCurrentActive: 1 as 1 | 2,
    isTransitioning: false,
};

// Background layers interface
export interface BackgroundLayers {
    container: HTMLElement;
    layer1: HTMLElement;
    layer2: HTMLElement;
    blurLayer1: HTMLElement;
    blurLayer2: HTMLElement;
    currentActive: 1 | 2;
    blurCurrentActive: 1 | 2;
    isTransitioning: boolean;
}

// Photo info structure
export interface PhotoInfo {
    title: string;
    copyright: string;
    where: string;
    text: string;
}

// Wallpaper mode constants
export const WALLPAPER_MODE = {
    SINGLE: 1,
    RANDOM: 2,
    VIDEO: 3,
    BING: 4,
    LOREM_PICSUM: 5,
    NASA: 6,
    CIYUAN: 7,
    WINDOWS: 8,
    CUSTOM: 9,
} as const;
