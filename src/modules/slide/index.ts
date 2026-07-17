/**
 * Slide module - Background switching and image carousel
 */

// Re-export functions used by other modules
export { shouldShow } from './sources';
export { applyBackgroundStyle, TransitionSwith } from './styles';
export { updateFileList } from './transition';

import { useConfigStore } from '@/stores/config';
import { useRuntimeStore } from '@/stores/runtime';
import { timerManager } from '@/utils/timer';

import { shouldShow } from './sources';
import { applyBackgroundStyle, getSwitchInterval, TransitionSwith } from './styles';

const config = useConfigStore();
const runtimeStore = useRuntimeStore();

let bgRetryCount = 0;
const BG_MAX_RETRIES = 10;

/** Change background based on mode */
export function changeBackground(): void {
    const mode = config.wallpaper_mode;
    const speed = config.speed;
    const interval = getSwitchInterval();

    try { if (!(window as any).__bg) (window as any).__bg = 0; (window as any).__bg++; } catch { /* noop */ }
    
    // 验证 DOM 是否就绪
    const cl = document.querySelector('#background-container');
    const ll = document.querySelector('#background-layer1');
    if (!cl || !ll) {
        console.warn('[CB] bg DOM not ready yet, retrying in 2s');
        bgRetryCount++;
        if (bgRetryCount >= BG_MAX_RETRIES) {
            console.error('[CB] bg DOM not ready after max retries, giving up');
            return;
        }
        setTimeout(changeBackground, 2000);
        return;
    }
    bgRetryCount = 0;
    
    try {
        switch (mode) {
            case 1: // Single wallpaper mode
                shouldShow();
                break;
            case 2: // Random mode
                if (runtimeStore.myList.length) {
                    if (config.random) {
                        nextImage(true);
                    } else {
                        nextImage(false);
                    }
                } else {
                    shouldShow();
                }
                timerManager.create(changeBackground, interval, 'backgroundChange');
                break;
            case 3: // Video mode
                shouldShow();
                break;
            case 4: // Bing wallpaper
                shouldShow();
                timerManager.create(changeBackground, 10800000, 'backgroundChange');
                break;
            case 5: // Lorem Picsum
                shouldShow();
                timerManager.create(changeBackground, interval, 'backgroundChange');
                break;
            case 6: // NASA
                shouldShow();
                timerManager.create(changeBackground, interval, 'backgroundChange');
                break;
            case 7: // 次元api
                shouldShow();
                timerManager.create(changeBackground, interval, 'backgroundChange');
                break;
            case 8: // Windows聚焦
                shouldShow();
                timerManager.create(changeBackground, interval, 'backgroundChange');
                break;
            case 9: // Custom
                shouldShow();
                timerManager.create(changeBackground, interval, 'backgroundChange');
                break;
            default:
        }
    } catch (e) {
        console.error('[CB] switch crashed:', e, 'mode=' + mode);
        // 继续创建计时器（即使 shouldShow 失败，定时器仍可工作）
        if (mode === 2 || mode! >= 4) {
            timerManager.create(changeBackground, interval, 'backgroundChange');
        }
    }

    if (
        document.querySelector('.fluid-effect-wrapper:not(#player_control .fluid-effect-wrapper)')
    ) {
        // 只在定时器存在时才尝试暂停
        if (timerManager.has('backgroundChange')) {
            timerManager.pause('backgroundChange');
        }
    }
}

/** Switch to next image (sequential or random) */
export function nextImage(rands: boolean): void {
    const photoInfo = runtimeStore.photo;
    let index = -1;
    let indexNow = -1;

    // First is empty
    if (photoInfo.currentImg) {
        indexNow = runtimeStore.myList.indexOf(photoInfo.currentImg);
        index = indexNow;
    }

    // Random or sequential
    if (rands) {
        while (index == indexNow) {
            index = Math.floor(Math.random() * runtimeStore.myList.length);
        }
        photoInfo.currentImg = runtimeStore.myList[index] ?? null;
    } else {
        if (index + 1 == runtimeStore.myList.length) {
            photoInfo.currentImg = runtimeStore.myList[0] ?? null;
        } else {
            photoInfo.currentImg = runtimeStore.myList[index + 1] ?? null;
        }
    }
    shouldShow();
}

// Initialize on load
applyBackgroundStyle();
TransitionSwith();
