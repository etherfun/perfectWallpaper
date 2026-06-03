/**
 * WE MediaPropertiesEvent 回调：收到新歌曲标题/作者/专辑时，
 * 把数据同步到 config.runtime.playerInfo 并更新显示。
 *
 * 也是外部播放源激活的入口：一旦收到歌曲信息，
 * 就把内置播放器暂停、设置 externalMediaActive 标志位。
 */
import { config } from '@/utils/config';
import { debugLogger } from '@/utils/logger';
import { pauseBuiltInPlayer, setExternalMediaActive } from '@/video';

import { player_control, player_control_aubar } from './domRefs';
import { playertitle } from './titleDisplay';

export function wallpaperMediaPropertiesListener(event: MediaPropertiesEvent): void {
    if (event) {
        debugLogger.info(
            `[Player] 收到新歌曲信息: ${event.title || '未知'} - ${event.artist || '未知'}`
        );

        // 外部媒体源激活（收到歌曲信息）
        if (!config.runtime.playerInfo.externalMediaActive) {
            setExternalMediaActive(true);
            pauseBuiltInPlayer();
        }

        config.runtime.playerInfo.singtitle = event.title || '';
        config.runtime.playerInfo.singartist = event.artist || '';
        config.runtime.playerInfo.singalbumTitle = event.albumTitle || '';
        config.runtime.playerInfo.aubarstop = true;

        player_control_aubar.width = 0;
        player_control_aubar.height = 0;

        const playerControlShow = config.player_control_show;
        if (
            playerControlShow &&
            config.runtime.playerInfo.singtitle &&
            config.runtime.playerInfo.singtitle !== ''
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
        config.runtime.playerInfo.singtitle === undefined ||
        config.runtime.playerInfo.singtitle === ''
    ) {
        return;
    }

    playertitle(Boolean(config.player_control_visualaudiobar));
}
