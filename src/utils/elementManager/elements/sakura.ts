/**
 * 樱花相关 DOM 元素
 *
 * lazy getter：#sakura / #sakurashow 由 Sakura.vue 渲染，
 * 在 Vue mount 后才存在于 DOM 中。
 */
import { makeLazyIdMap } from '../lazyMap';

const lazyElements = makeLazyIdMap({
    sakura: 'sakura',
    sakurashow: 'sakurashow',
});

export const sakuraElements = {
    sakura: lazyElements.sakura as HTMLCanvasElement,
    sakurashow: lazyElements.sakurashow as HTMLCanvasElement,
};
