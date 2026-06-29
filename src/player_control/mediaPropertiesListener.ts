/**
 * WE MediaPropertiesEvent 回调：收到新歌曲标题/作�?专辑时，
 * 把数据同步到 appConfig.runtime.playerInfo 并更新显示�?
 *
 * 也是外部播放源激活的入口：一旦收到歌曲信息，
 * 就把内置播放器暂停、设�?externalMediaActive 标志位�?
 */
import { useConfigStore } from '@/stores/config';
import { useRuntimeStore } from '@/stores/runtime';

const appConfig = useConfigStore();
const runtimeStore = useRuntimeStore();
import { debugLogger } from '@/utils/logger';
import { pauseBuiltInPlayer, setExternalMediaActive } from '@/video';

import { player_control, setPendingMediaEvent } from './domRefs';
import { playertitle } from './titleDisplay';

export function wallpaperMediaPropertiesListener(event: MediaPropertiesEvent): void {
    if (event) {
        debugLogger.info(
            `[Player] 收到新歌曲信息 ${event.title || '未知'} - ${event.artist || '未知'}`
        );

        // 外部媒体源激活（收到歌曲信息�?
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
            if (player_control) {
                player_control.style.display = 'flex';
            } else {
                // Vue 尚未 mount → 暂存媒体事件，refreshPlayerControlRefs 时重放
                setPendingMediaEvent(runtimeStore.playerInfo.singtitle);
            }
        } else {
            if (player_control) player_control.style.display = 'none';
        }
    } else {
        // Wallpaper Engine 没有媒体信息（event 为空或无效）
        if (player_control) player_control.style.display = 'none';
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
