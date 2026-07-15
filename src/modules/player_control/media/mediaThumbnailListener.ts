/**
 * WE MediaThumbnailEvent 回调：收到新封面时更新 img.src，
 * 等待加载完成后提取颜色并触发样式刷新。
 */
import { useConfigStore } from '@/stores/config';
const appConfig = useConfigStore();
import { elements } from '@/utils/elementManager';

import { extractColorsFromThumbnail } from '../color/colorExtraction';
import { thumbnailsue } from '../color/thumbnailColor';
import { ITEM_ENTRANCE_DELAY_MS } from '../constants';
import { player_control_thumbnail } from '../domRefs';

export async function wallpaperMediaThumbnailListener(event: MediaThumbnailEvent): Promise<void> {
    // 读 appConfig（旧 config 单例）而非 Pinia，确保与 usePlayerControlProperties
    // 同步写入的源一致（Pinia $patch 在 handler 末尾才生效）。
    if (event && appConfig.player_control_show) {
        player_control_thumbnail.src = event.thumbnail;

        const img = elements.playerControl.thumbnail;
        img.onload = async function () {
            await extractColorsFromThumbnail(event);
            setTimeout(() => thumbnailsue(), ITEM_ENTRANCE_DELAY_MS);
        };
    }
}
