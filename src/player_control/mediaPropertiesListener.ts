/**
 * WE MediaPropertiesEvent 回调：收到新歌曲标题/作�?专辑时，
 * 把数据同步到 appConfig.runtime.playerInfo 并更新显示�?
 *
 * 也是外部播放源激活的入口：一旦收到歌曲信息，
 * 就把内置播放器暂停、设�?externalMediaActive 标志位�?
 */
import { useConfigStore } from '@/stores/config';
import { config as appConfig } from '@/utils/config'; // runtime.playerInfo (Stage 3.5-B)

const config = useConfigStore();
import { debugLogger } from '@/utils/logger';
import { pauseBuiltInPlayer, setExternalMediaActive } from '@/video';

import { player_control, player_control_aubar } from './domRefs';
import { playertitle } from './titleDisplay';

export function wallpaperMediaPropertiesListener(event: MediaPropertiesEvent): void {
    if (event) {
        debugLogger.info(
            `[Player] 收到新歌曲信�? ${event.title || '未知'} - ${event.artist || '未知'}`
        );

        // 外部媒体源激活（收到歌曲信息�?
        if (!appConfig.runtime.playerInfo.externalMediaActive) {
            setExternalMediaActive(true);
            pauseBuiltInPlayer();
        }

        appConfig.runtime.playerInfo.singtitle = event.title || '';
        appConfig.runtime.playerInfo.singartist = event.artist || '';
        appConfig.runtime.playerInfo.singalbumTitle = event.albumTitle || '';
        appConfig.runtime.playerInfo.aubarstop = true;

        player_control_aubar.width = 0;
        player_control_aubar.height = 0;

        const playerControlShow = config.player_control_show;
        if (
            playerControlShow &&
            appConfig.runtime.playerInfo.singtitle &&
            appConfig.runtime.playerInfo.singtitle !== ''
        ) {
            player_control.style.display = 'flex';
        } else {
            player_control.style.display = 'none';
        }
    } else {
        // Wallpaper Engine 没有媒体信息（event 为空或无效）
        player_control.style.display = 'none';
    }

    const playerControlShow = config.player_control_show;
    if (
        !playerControlShow ||
        appConfig.runtime.playerInfo.singtitle === undefined ||
        appConfig.runtime.playerInfo.singtitle === ''
    ) {
        return;
    }

    playertitle(Boolean(config.player_control_visualaudiobar));
}
