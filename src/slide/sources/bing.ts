/**
 * Bing 每日壁纸源
 *
 * Stage 3.5-A3: 已迁移字段（language）从 Pinia 读；runtime.photo.* 保留 appConfig。
 */

import { useConfigStore } from '@/stores/config';
import { useRuntimeStore } from '@/stores/runtime';
import { picturesinfo_showrl } from './info';
import { onImageError, onImageLoad } from './loader';
import type { BingResponse } from './types';

const runtimeStore = useRuntimeStore();

export function loadBing(): void {
    const store = useConfigStore();
    fetch('https://www.bing.com/HPImageArchive.aspx?format=js&idx=0&n=1&mkt=' + store.language)
        .then(response => response.json())
        .then((get: BingResponse) => {
            const image = get.images[0];
            if (!image) return;
            runtimeStore.photo.infomation.title = image.title;
            runtimeStore.photo.infomation.text = '';
            runtimeStore.photo.infomation.copyright = '';
            runtimeStore.photo.infomation.where = '';
            const match = image.copyright.match(/\(([^)]+)\)/);
            if (match?.[1]) {
                runtimeStore.photo.infomation.copyright = match[1];
                runtimeStore.photo.infomation.where = image.copyright
                    .replace(/\(([^)]+)\)/, '')
                    .trim();
            }

            picturesinfo_showrl(
                runtimeStore.photo.infomation.title,
                runtimeStore.photo.infomation.copyright,
                runtimeStore.photo.infomation.where,
                runtimeStore.photo.infomation.text
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
