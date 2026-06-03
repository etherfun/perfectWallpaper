/**
 * 核心 DOM 元素 - 主体、视频、音频、页面标题
 */
export const coreElements = {
    body: document.querySelector('body') as HTMLElement,
    myvideo: document.getElementById('myvideo') as HTMLVideoElement,
    myAudio: document.getElementById('myAudio') as HTMLAudioElement,
    pageTitle: document.getElementById('page-title'),
} as const;
