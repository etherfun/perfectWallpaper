/**
 * 核心 DOM 元素 - 主体、视频、音频、页面标题
 *
 * myvideo / myAudio 使用直接查询（它们在 index.html 中，始终存在）。
 * pageTitle 使用惰性 getter（兼容动态渲染）。
 */
import { makeLazyIdMap } from '../lazyMap';

const lazyIds = makeLazyIdMap({
    pageTitle: 'page-title',
});

export const coreElements = {
    body: document.querySelector('body') as HTMLElement,
    myvideo: document.getElementById('myvideo') as HTMLVideoElement,
    myAudio: document.getElementById('myAudio') as HTMLAudioElement,
    pageTitle: lazyIds.pageTitle as HTMLElement,
};
