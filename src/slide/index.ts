/**
 * Slide module - Background switching and image carousel
 * Re-exports all slide-related functionality
 */

// Re-export transition functions
export { transitionBackground, updateFileList } from './transition';

// Re-export source functions
export { shouldShow, clearpicturesinfo, picturesinfo_showrl } from './sources';

// Re-export style functions
export { calculate, TransitionSwith, applyBackgroundStyle } from './styles';

// Re-export types and backgroundLayers
export { backgroundLayers, pictures, WALLPAPER_MODE } from './types';

import { appConfig, config } from "../utils/config";
import { timerManager } from "@/utils/timer";
import { shouldShow, clearpicturesinfo } from "./sources";
import { calculate, TransitionSwith, applyBackgroundStyle } from "./styles";
import { transitionBackground } from "./transition";

/** Change background based on mode */
export function changeBackground(): void {
    switch (config.wallpaperMode) {
        case 1: // Single wallpaper mode
            shouldShow();
            break;
        case 2: // Random mode
            if (appConfig.runtime.myList.length) {
                if (config.random) {
                    nextImage(true);
                } else {
                    nextImage(false);
                }
            } else {
                shouldShow();
            }
            timerManager.remove('backgroundChange');
            timerManager.create(changeBackground, calculate(config.speed), 'backgroundChange');
            break;
        case 3: // Video mode
            shouldShow();
            break;
        case 4: // Bing wallpaper
            shouldShow();
            timerManager.remove('backgroundChange');
            timerManager.create(changeBackground, 10800000, 'backgroundChange');
            break;
        case 5: // Lorem Picsum
            shouldShow();
            timerManager.remove('backgroundChange');
            timerManager.create(changeBackground, calculate(config.speed), 'backgroundChange');
            break;
        case 6: // NASA
            shouldShow();
            timerManager.remove('backgroundChange');
            timerManager.create(changeBackground, calculate(config.speed), 'backgroundChange');
            break;
        case 7: // 次元api
            shouldShow();
            timerManager.remove('backgroundChange');
            timerManager.create(changeBackground, calculate(config.speed), 'backgroundChange');
            break;
        case 8: // Windows聚焦
            shouldShow();
            timerManager.remove('backgroundChange');
            timerManager.create(changeBackground, calculate(config.speed), 'backgroundChange');
            break;
        case 9: // Custom
            shouldShow();
            timerManager.remove('backgroundChange');
            timerManager.create(changeBackground, calculate(config.speed), 'backgroundChange');
            break;
        default:
    }

    if (document.querySelector(".fluid-effect-wrapper:not(#player_control .fluid-effect-wrapper)")) {
        timerManager.pause('backgroundChange');
    }
}

/** Switch to next image (sequential or random) */
export function nextImage(rands: boolean): void {
    const photoInfo = appConfig.runtime.photo;
    let index = -1;
    let indexNow = -1;

    // First is empty
    if (photoInfo.currentImg) {
        indexNow = appConfig.runtime.myList.indexOf(photoInfo.currentImg);
        index = indexNow;
    }

    // Random or sequential
    if (rands) {
        while (index == indexNow) {
            index = Math.floor(Math.random() * (appConfig.runtime.myList.length));
        }
        photoInfo.currentImg = appConfig.runtime.myList[index];
    } else {
        if (index + 1 == appConfig.runtime.myList.length) {
            photoInfo.currentImg = appConfig.runtime.myList[0];
        } else {
            photoInfo.currentImg = appConfig.runtime.myList[index + 1];
        }
    }
    shouldShow();
}

// Initialize on load
applyBackgroundStyle();
TransitionSwith();
