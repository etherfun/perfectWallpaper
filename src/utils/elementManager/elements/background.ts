/**
 * 背景/幻灯片相关 DOM 元素
 */
export const backgroundElements = {
    slide: {
        RGBuse: document.querySelector('#RGBuse') as HTMLElement,
        picture_info: document.querySelector('#picture_info') as HTMLElement,
        info: document.querySelector('#picture_info .info') as HTMLElement,
        title: document.querySelector('#picture_info .title') as HTMLElement,
        author: document.querySelector('#picture_info .author') as HTMLElement,
        location: document.querySelector('#picture_info .location') as HTMLElement,
        description: document.querySelector('#picture_info .description') as HTMLElement,
    },
    background: {
        container: document.querySelector('#background-container') as HTMLElement,
        layer1: document.querySelector('#background-layer1') as HTMLElement,
        layer2: document.querySelector('#background-layer2') as HTMLElement,
        blurLayer1: document.querySelector('#background-blur-layer1') as HTMLElement,
        blurLayer2: document.querySelector('#background-blur-layer2') as HTMLElement,
    },
} as const;
