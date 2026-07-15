/**
 * 图片信息显示
 *
 * Stage 3.5-A3: pictures_info_show_ror_l / pictures_info_show 改读 Pinia。
 */

import { useConfigStore } from '@/stores/config';

/** Clear picture info and hide the container */
export function clearpicturesinfo(): void {
    const titleLeft = document.querySelector('#picture_info .title .left');
    const titleRight = document.querySelector('#picture_info .title .right');
    const authorLeft = document.querySelector('#picture_info .author .left');
    const authorRight = document.querySelector('#picture_info .author .right');
    const locationLeft = document.querySelector('#picture_info .location .left');
    const locationRight = document.querySelector('#picture_info .location .right');
    const description = document.querySelector('#picture_info .description');

    if (titleLeft) titleLeft.innerHTML = '';
    if (titleRight) titleRight.innerHTML = '';
    if (authorLeft) authorLeft.innerHTML = '';
    if (authorRight) authorRight.innerHTML = '';
    if (locationLeft) locationLeft.innerHTML = '';
    if (locationRight) locationRight.innerHTML = '';
    if (description) description.innerHTML = '';

    // 静默加载: 没有真实数据时容器保持隐藏,
    // 由 picturesinfo_showrl() 在写完数据后恢复显示。
    const container = document.querySelector('#picture_info') as HTMLElement | null;
    if (container) {
        container.style.display = 'none';
        container.style.visibility = 'hidden';
    }
}

/** Show picture info */
export function picturesinfo_showrl(
    title: string,
    author: string,
    where: string,
    text: string
): void {
    clearpicturesinfo();

    const store = useConfigStore();
    const text_w = document.querySelector('#picture_info .description');

    let title_w: Element | null, author_w: Element | null, where_w: Element | null;

    if (store.pictures_info_show_ror_l) {
        title_w = document.querySelector('#picture_info .title .right');
        author_w = document.querySelector('#picture_info .author .right');
        where_w = document.querySelector('#picture_info .location .right');
    } else {
        title_w = document.querySelector('#picture_info .title .left');
        author_w = document.querySelector('#picture_info .author .left');
        where_w = document.querySelector('#picture_info .location .left');
    }

    if (title_w) title_w.innerHTML = title;
    if (author_w) author_w.innerHTML = author;
    if (where_w) where_w.innerHTML = where;
    if (text_w) text_w.innerHTML = text;

    // 静默加载: loader 拿到真实版权/标题后才显示容器,
    // 避免 fetch 期间的空框架被用户看到。
    if (store.pictures_info_show === true) {
        const container = document.querySelector('#picture_info') as HTMLElement | null;
        if (container) {
            container.style.display = 'flex';
            container.style.visibility = 'visible';
        }
    }
}
