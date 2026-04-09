/**
 * Slide module type definitions
 */

import { elements } from '../utils/elementManager';

// DOM elements for picture info
export const pictures = {
    picture_info: elements.slide.picture_info,
    info: elements.slide.info,
    title: elements.slide.title,
    author: elements.slide.author,
    where: elements.slide.location,
    text: elements.slide.description,
};

// Background layers (DOM elements) - shared between modules
export const backgroundLayers = {
    container: elements.background.container,
    layer1: elements.background.layer1,
    layer2: elements.background.layer2,
    blurLayer1: elements.background.blurLayer1,
    blurLayer2: elements.background.blurLayer2,
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
