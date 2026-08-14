/**
 * WE MediaPropertiesEvent 回调：收到新歌曲标题/艺术家/专辑时，
 * 把数据同步到 appConfig.runtime.playerInfo 并更新显示。
 *
 * 也是外部播放源激活的入口：一旦收到歌曲信息，
 * 就把内置播放器暂停、设置 externalMediaActive 标志位。
 */
import { useConfigStore } from '@/stores/config';
import { useRuntimeStore } from '@/stores/runtime';

const appConfig = useConfigStore();
const runtimeStore = useRuntimeStore();
import { pauseBuiltInPlayer, setExternalMediaActive } from '@/modules/core/video';
import { debugLogger } from '@/utils/logger';

import { playerUiState } from '../state/uiState';
import { playertitle } from '../ui/titleDisplay';

export function wallpaperMediaPropertiesListener(event: MediaPropertiesEvent): void {
    if (event) {
        debugLogger.info(
            `[Player] 收到新歌曲信息 ${event.title || '未知'} - ${event.artist || '未知'}`
        );

        // 外部媒体源激活（收到歌曲信息）
        if (!runtimeStore.playerInfo.externalMediaActive) {
            setExternalMediaActive(true);
            pauseBuiltInPlayer();
        }

        runtimeStore.updatePlayerInfo({
            singtitle: event.title || '',
            singartist: event.artist || '',
            singalbumTitle: event.albumTitle || '',
            aubarstop: true,
        });

        // pc_aubar() 被 playertitle 调用时会重新计算 canvas 尺寸

        // 读 appConfig（旧 config 单例），与 usePlayerControlProperties 同步写入的源一致。
        // 不读 Pinia store，因为 store.$patch 在 handler 末尾才提交，
        // 同批次属性中 player_control_show 新值在 Pinia 中可能尚未可见。
        const playerControlShow = appConfig.player_control_show;
        if (
            playerControlShow &&
            runtimeStore.playerInfo.singtitle &&
            runtimeStore.playerInfo.singtitle !== ''
        ) {
            // 响应式状态：Vue mount 前后写入均安全，模板自动绑定
            playerUiState.visible = true;
        } else {
            playerUiState.visible = false;
        }
    } else {
        // Wallpaper Engine 没有媒体信息（event 为空或无效）
        playerUiState.visible = false;
    }

    const playerControlShow2 = appConfig.player_control_show;
    if (
        !playerControlShow2 ||
        runtimeStore.playerInfo.singtitle === undefined ||
        runtimeStore.playerInfo.singtitle === ''
    ) {
        return;
    }

    playertitle(Boolean(appConfig.player_control_visualaudiobar));
}
