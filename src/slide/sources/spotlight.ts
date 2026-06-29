/**
 * Windows 聚焦源
 *
 * Stage 3.5-A3: language 改读 Pinia；runtime.photo.* 保留 appConfig。
 */

import { useConfigStore } from '@/stores/config';
import { config as appConfig } from '../../utils/config';
import { picturesinfo_showrl } from './info';
import { onImageError, onImageLoad } from './loader';
import type { WindowsSpotlightItem, WindowsSpotlightResponse } from './types';

export function loadWindowsSpotlight(): void {
    const store = useConfigStore();
    const city = store.language.slice(3);

    fetch(
        `https://fd.api.iris.microsoft.com/v4/api/selection?&placement=88000820&bcnt=1&country=${city}&locale=${store.language}&fmt=json`
    )
        .then(response => response.json())
        .then((get: WindowsSpotlightResponse) => {
            const itemJson = get.batchrsp.items[0]?.item;
            if (!itemJson) return;
            const rawjson: WindowsSpotlightItem = JSON.parse(itemJson);

            const url = rawjson.ad.landscapeImage.asset;
            const img = new Image();
            img.src = url;

            appConfig.runtime.photo.infomation.title = rawjson.ad.title;
            appConfig.runtime.photo.infomation.text = rawjson.ad.description;
            appConfig.runtime.photo.infomation.copyright = rawjson.ad.copyright;
            appConfig.runtime.photo.infomation.where =
                rawjson.ad.iconHoverText.split(/\r?\n/)[0]?.trim() ?? '';
            picturesinfo_showrl(
                appConfig.runtime.photo.infomation.title,
                appConfig.runtime.photo.infomation.copyright,
                appConfig.runtime.photo.infomation.where,
                appConfig.runtime.photo.infomation.text
            );

            img.onload = function () {
                onImageLoad(img.src);
            };
            img.onerror = function () {
                onImageError('Windows聚焦', img.src);
            };
        });
}
