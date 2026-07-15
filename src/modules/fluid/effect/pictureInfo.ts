/**
 * 全屏流体效果下图片信息元素的隐藏/恢复
 *
 * 全屏流体效果激活时，给 `.picture_info` 加 `fluid-hidden` 类
 * （CSS 中定义为透明 + 不可交互），关闭时移除该类。
 */

import { useRuntimeStore } from '@/stores/runtime';

const runtimeStore = useRuntimeStore();
const HIDDEN_CLASS = 'fluid-hidden';
const PICTURE_INFO_SELECTOR = '#picture_info';

/** 全屏流体效果进入时调用：隐藏图片信息元素并标记运行时状态 */
export function addPictureInfoHideStyle(): void {
    const pictureInfo = document.querySelector(PICTURE_INFO_SELECTOR) as HTMLElement | null;
    if (pictureInfo) {
        pictureInfo.classList.add(HIDDEN_CLASS);
    }
    runtimeStore.pictureInfoHideStyleAdded = true;
}

/** 全屏流体效果退出时调用：恢复图片信息元素可见并清除标记 */
export function removePictureInfoHideStyle(): void {
    const pictureInfo = document.querySelector(PICTURE_INFO_SELECTOR) as HTMLElement | null;
    if (pictureInfo) {
        pictureInfo.classList.remove(HIDDEN_CLASS);
    }
    runtimeStore.pictureInfoHideStyleAdded = false;
}
