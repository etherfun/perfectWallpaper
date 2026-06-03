/**
 * Windows 聚焦源
 */

import { config } from '../../utils/config';
import { picturesinfo_showrl } from './info';
import { onImageError, onImageLoad } from './loader';
import type { WindowsSpotlightItem, WindowsSpotlightResponse } from './types';

export function loadWindowsSpotlight(): void {
    const city = config.language.slice(3);

    fetch(
        `https://fd.api.iris.microsoft.com/v4/api/selection?&placement=88000820&bcnt=1&country=${city}&locale=${config.language}&fmt=json`
    )
        .then(response => response.json())
        .then((get: WindowsSpotlightResponse) => {
            const rawjson: WindowsSpotlightItem = JSON.parse(get.batchrsp.items[0].item);

            const url = rawjson.ad.landscapeImage.asset;
            const img = new Image();
            img.src = url;

            config.runtime.photo.infomation.title = rawjson.ad.title;
            config.runtime.photo.infomation.text = rawjson.ad.description;
            config.runtime.photo.infomation.copyright = rawjson.ad.copyright;
            config.runtime.photo.infomation.where = rawjson.ad.iconHoverText
                .split(/\r?\n/)[0]
                .trim();
            picturesinfo_showrl(
                config.runtime.photo.infomation.title,
                config.runtime.photo.infomation.copyright,
                config.runtime.photo.infomation.where,
                config.runtime.photo.infomation.text
            );

            img.onload = function () {
                onImageLoad(img.src);
            };
            img.onerror = function () {
                onImageError('Windows聚焦', img.src);
            };
        });
}
