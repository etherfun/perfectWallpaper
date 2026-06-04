/**
 * Bing 每日壁纸源
 */

import { config } from '../../utils/config';
import { picturesinfo_showrl } from './info';
import { onImageError, onImageLoad } from './loader';
import type { BingResponse } from './types';

export function loadBing(): void {
    fetch('https://www.bing.com/HPImageArchive.aspx?format=js&idx=0&n=1&mkt=' + config.language)
        .then(response => response.json())
        .then((get: BingResponse) => {
            const image = get.images[0];
            if (!image) return;
            config.runtime.photo.infomation.title = image.title;
            config.runtime.photo.infomation.text = '';
            config.runtime.photo.infomation.copyright = '';
            config.runtime.photo.infomation.where = '';
            const match = image.copyright.match(/\(([^)]+)\)/);
            if (match?.[1]) {
                config.runtime.photo.infomation.copyright = match[1];
                config.runtime.photo.infomation.where = image.copyright
                    .replace(/\(([^)]+)\)/, '')
                    .trim();
            }

            picturesinfo_showrl(
                config.runtime.photo.infomation.title,
                config.runtime.photo.infomation.copyright,
                config.runtime.photo.infomation.where,
                config.runtime.photo.infomation.text
            );

            const bingurl = 'https://www.bing.com' + image.urlbase;
            const img = new Image();
            img.src = bingurl + '_UHD.jpg';

            img.onload = function () {
                onImageLoad(img.src);
            };
            img.onerror = function () {
                onImageError('Bing', bingurl + '_UHD.jpg');
            };
        });
}
