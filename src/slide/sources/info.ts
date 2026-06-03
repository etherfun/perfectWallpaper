/**
 * 图片信息显示
 */

import { config } from '../../utils/config';

/** Clear picture info */
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
}

/** Show picture info */
export function picturesinfo_showrl(
    title: string,
    author: string,
    where: string,
    text: string
): void {
    clearpicturesinfo();

    const text_w = document.querySelector('#picture_info .description');

    let title_w: Element | null, author_w: Element | null, where_w: Element | null;

    if (config.pictures_info_show_ror_l) {
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
}
