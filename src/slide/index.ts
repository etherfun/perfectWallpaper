/**
 * Slide module - Background switching and image carousel
 */

// Re-export functions used by other modules
export { shouldShow } from './sources';
export { applyBackgroundStyle, TransitionSwith } from './styles';
export { updateFileList } from './transition';

import { config } from "../utils/config";
import { timerManager } from "@/utils/timer";
import { shouldShow } from "./sources";
import { applyBackgroundStyle, calculate, TransitionSwith } from "./styles";

/** Change background based on mode */
export function changeBackground(): void {
    switch (config.wallpaper_mode) {
        case 1: // Single wallpaper mode
            shouldShow();
            break;
        case 2: // Random mode
            if (config.runtime.myList.length) {
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
    const photoInfo = config.runtime.photo;
    let index = -1;
    let indexNow = -1;

    // First is empty
    if (photoInfo.currentImg) {
        indexNow = config.runtime.myList.indexOf(photoInfo.currentImg);
        index = indexNow;
    }

    // Random or sequential
    if (rands) {
        while (index == indexNow) {
            index = Math.floor(Math.random() * (config.runtime.myList.length));
        }
        photoInfo.currentImg = config.runtime.myList[index];
    } else {
        if (index + 1 == config.runtime.myList.length) {
            photoInfo.currentImg = config.runtime.myList[0];
        } else {
            photoInfo.currentImg = config.runtime.myList[index + 1];
        }
    }
    shouldShow();
}

// Initialize on load
applyBackgroundStyle();
TransitionSwith();
