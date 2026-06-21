/**
 * WE MediaThumbnailEvent 回调：收到新封面时更新 img.src，
 * 等待加载完成后提取颜色并触发样式刷新。
 */
import { useConfigStore } from '@/stores/config';
import { config as appConfig } from '@/utils/config'; // runtime.* (Stage 3.5-B)

const config = useConfigStore();
import { elements } from '@/utils/elementManager';

import { extractColorsFromThumbnail } from './colorExtraction';
import { ITEM_ENTRANCE_DELAY_MS } from './constants';
import { player_control_thumbnail } from './domRefs';
import { thumbnailsue } from './thumbnailColor';

export async function wallpaperMediaThumbnailListener(event: MediaThumbnailEvent): Promise<void> {
    if (event && config.player_control_show) {
        player_control_thumbnail.src = event.thumbnail;

        const img = elements.playerControl.thumbnail;
        img.onload = async function () {
            await extractColorsFromThumbnail(event);
            setTimeout(() => thumbnailsue(), ITEM_ENTRANCE_DELAY_MS);
        };
    }
}
