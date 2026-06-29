/**
 * 图片加载通用工具
 * - transitionBackground：把图片应用为背景
 * - applyRgbForTransition：rgb 模式下同步把图片抓成画布
 * - onImageLoad/onImageError：统一的 onload/onerror 钩子
 *
 * Stage 3.5-A3: rgb_show 改读 Pinia；runtime.photo.* 保留 appConfig。
 */

import { useConfigStore } from '@/stores/config';
import { config as appConfig } from '../../utils/config';
import { background2canvas } from '../../RGB';
import { debugLogger } from '../../utils/logger';
import { transitionBackground } from '../transition';

export function onImageLoad(url: string): void {
    transitionBackground(url);
    const store = useConfigStore();
    if (store.rgb_show) {
        appConfig.runtime.photo.nextphoto = true;
        setTimeout(() => {
            background2canvas(url, false);
            appConfig.runtime.photo.nextphoto = false;
        }, 100);
    }
}

export function onImageError(label: string, url: string): void {
    debugLogger.error(`${label}图片加载失败: ${url}`);
}
