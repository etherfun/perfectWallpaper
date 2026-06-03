/**
 * 全屏流体效果下图片信息元素的隐藏/恢复
 *
 * 全屏流体效果激活时，给 `.picture_info` 加 `fluid-hidden` 类
 * （CSS 中定义为透明 + 不可交互），关闭时移除该类。
 */

import { config } from '@/utils/config';
import { elements } from '@/utils/elementManager';

const HIDDEN_CLASS = 'fluid-hidden';

/** 全屏流体效果进入时调用：隐藏图片信息元素并标记运行时状态 */
export function addPictureInfoHideStyle(): void {
    const pictureInfo = elements.slide.picture_info;
    if (pictureInfo) {
        pictureInfo.classList.add(HIDDEN_CLASS);
    }
    config.runtime.pictureInfoHideStyleAdded = true;
}

/** 全屏流体效果退出时调用：恢复图片信息元素可见并清除标记 */
export function removePictureInfoHideStyle(): void {
    const pictureInfo = elements.slide.picture_info;
    if (pictureInfo) {
        pictureInfo.classList.remove(HIDDEN_CLASS);
    }
    config.runtime.pictureInfoHideStyleAdded = false;
}
