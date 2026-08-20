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

// 需要定时刷新的壁纸模式
const TIMED_MODES = new Set([2, 4, 5, 6, 7, 8, 9]);
const BING_INTERVAL = 10800000;

function ensureBgDom(): boolean {
    const cl = document.querySelector('#background-container');
    const ll = document.querySelector('#background-layer1');
    if (cl && ll) { bgRetryCount = 0; return true; }
    console.warn('[CB] bg DOM not ready yet, retrying in 2s');
    if (++bgRetryCount >= BG_MAX_RETRIES) {
        console.error('[CB] bg DOM not ready after max retries, giving up');
        return false;
    }
    setTimeout(changeBackground, 2000);
    return false;
}

function scheduleBackgroundChange(interval: number): void {
    timerManager.create(changeBackground, interval, 'backgroundChange');
    if (document.querySelector('.fluid-effect-wrapper:not(#player_control .fluid-effect-wrapper)')) {
        if (timerManager.has('backgroundChange')) timerManager.pause('backgroundChange');
    }
}

function handleMode(mode: number | undefined, interval: number): void {
    // wallpaper_mode 未就绪(==null)时按单壁纸兜底，避免 default 空分支黑屏
    const effectiveMode = mode ?? 1;
    const timed = TIMED_MODES.has(effectiveMode);
    const useInterval = effectiveMode === 4 ? BING_INTERVAL : interval;

    try {
        if (effectiveMode === 2) {
            if (runtimeStore.myList.length) nextImage(Boolean(config.random));
            else shouldShow();
        } else {
            shouldShow();
        }
        if (timed) scheduleBackgroundChange(useInterval);
    } catch (e) {
        console.error('[CB] switch crashed:', e, 'mode=' + mode);
        if (timed) scheduleBackgroundChange(useInterval);
    }
}

/** Change background based on mode */
export function changeBackground(): void {
    const mode = config.wallpaper_mode;
    const interval = getSwitchInterval();
    if (!ensureBgDom()) return;
    handleMode(mode, interval);
}

/** Switch to next image (sequential or random) */
export function nextImage(rands: boolean): void {
    const list = runtimeStore.myList;
    if (!list.length) { shouldShow(); return; }
    const photoInfo = runtimeStore.photo;
    const len = list.length;
    const cur = photoInfo.currentImg ? list.indexOf(photoInfo.currentImg) : -1;
    if (rands) {
        if (len === 1) { photoInfo.currentImg = list[0] ?? null; }
        else {
            let next = cur;
            // 单次随机，避免 while 在 len=1 时的潜在死循环
            do { next = Math.floor(Math.random() * len); } while (next === cur && len > 1);
            photoInfo.currentImg = list[next] ?? null;
        }
    } else {
        const next = cur === -1 || cur + 1 >= len ? 0 : cur + 1;
        photoInfo.currentImg = list[next] ?? null;
    }
    shouldShow();
}

// Initialize on load
applyBackgroundStyle();
TransitionSwith();
