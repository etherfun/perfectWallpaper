/**
 * 图片加载通用工具
 * - transitionBackground：把图片应用为背景
 * - applyRgbForTransition：rgb 模式下同步把图片抓成画布
 * - onImageLoad/onImageError：统一的 onload/onerror 钩子
 *
 * Stage 3.5-A3: rgb_show 改读 Pinia；runtime.photo.* 保留 appConfig。
 */

import { useConfigStore } from '@/stores/config';
import { useRuntimeStore } from '@/stores/runtime';
import { background2canvas } from '../../RGB';
import { debugLogger } from '../../utils/logger';
import { transitionBackground } from '../transition';

const runtimeStore = useRuntimeStore();

export function onImageLoad(url: string): void {
    // 同步当前图片到 store（兜底，与 transition.ts 冗余但安全）
    runtimeStore.photo.currentImg = url;

    transitionBackground(url);
    const store = useConfigStore();
    if (store.rgb_show) {
        runtimeStore.photo.nextphoto = true;
        setTimeout(() => {
            background2canvas(url, false);
            runtimeStore.photo.nextphoto = false;
        }, 100);
    }
}

export function onImageError(label: string, url: string): void {
    debugLogger.error(`${label}图片加载失败: ${url}`);
}
