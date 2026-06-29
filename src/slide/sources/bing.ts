/**
 * Bing 每日壁纸源
 *
 * Stage 3.5-A3: 已迁移字段（language）从 Pinia 读；runtime.photo.* 保留 appConfig。
 */

import { useConfigStore } from '@/stores/config';
import { config as appConfig } from '../../utils/config';
import { picturesinfo_showrl } from './info';
import { onImageError, onImageLoad } from './loader';
import type { BingResponse } from './types';

export function loadBing(): void {
    const store = useConfigStore();
    fetch('https://www.bing.com/HPImageArchive.aspx?format=js&idx=0&n=1&mkt=' + store.language)
        .then(response => response.json())
        .then((get: BingResponse) => {
            const image = get.images[0];
            if (!image) return;
            appConfig.runtime.photo.infomation.title = image.title;
            appConfig.runtime.photo.infomation.text = '';
            appConfig.runtime.photo.infomation.copyright = '';
            appConfig.runtime.photo.infomation.where = '';
            const match = image.copyright.match(/\(([^)]+)\)/);
            if (match?.[1]) {
                appConfig.runtime.photo.infomation.copyright = match[1];
                appConfig.runtime.photo.infomation.where = image.copyright
                    .replace(/\(([^)]+)\)/, '')
                    .trim();
            }

            picturesinfo_showrl(
                appConfig.runtime.photo.infomation.title,
                appConfig.runtime.photo.infomation.copyright,
                appConfig.runtime.photo.infomation.where,
                appConfig.runtime.photo.infomation.text
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
