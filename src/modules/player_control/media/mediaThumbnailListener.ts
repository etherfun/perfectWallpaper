/**
 * WE MediaThumbnailEvent 回调：收到新封面时写入响应式 thumbnailUrl，
 * 图片加载完成后由 PlayerControl.vue 的 img @load 提取颜色。
 */
import { useConfigStore } from '@/stores/config';
const appConfig = useConfigStore();

import { playerUiState, setPendingThumbnailEvent } from '../state/uiState';

export async function wallpaperMediaThumbnailListener(event: MediaThumbnailEvent): Promise<void> {
    // 读 appConfig（旧 config 单例）而非 Pinia，确保与 usePlayerControlProperties
    // 同步写入的源一致（Pinia $patch 在 handler 末尾才生效）。
    if (event && appConfig.player_control_show) {
        playerUiState.thumbnailUrl = event.thumbnail;
        // 暂存完整事件，供 PlayerControl.vue img @load 时提取颜色
        setPendingThumbnailEvent(event);
    }
}
