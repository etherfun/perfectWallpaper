/**
 * 标题/艺术家/专辑文本渲染，以及对外暴露的封面刷新接口。
 *
 * 真 Vue 化：不再写 DOM 文本节点，改为写入 playerUiState 响应式状态，
 * 由 PlayerControl.vue 模板绑定渲染。
 */
import { useConfigStore } from '@/stores/config';
import { useRuntimeStore } from '@/stores/runtime';

const config = useConfigStore();
const runtimeStore = useRuntimeStore();
import { elements } from '@/utils/elementManager';

import { playerUiState } from '../state/uiState';
import { pc_aubar } from './audioBar';

/**
 * 把当前歌曲信息渲染到标题/艺术家/专辑（写入响应式状态）。
 * @param visualaudiobar 是否立即刷新底部音频可视化柱状图
 */
export function playertitle(visualaudiobar: boolean = false): void {
    const titleToShow = runtimeStore.playerInfo.singtitle || '';
    const artistToShow = runtimeStore.playerInfo.singartist || '';
    const albumToShow = runtimeStore.playerInfo.singalbumTitle || '';
    const playerControlThumbnailrorl = config.player_control_thumbnailrorl;
    const playerControlSamealbumTitle = config.player_control_samealbum_title;

    // 静默加载:没拿到真实媒体标题时不再写占位文字。
    // 容器本身由 mediaPropertiesListener 在收到真内容前保持隐藏，
    // 此处只需如实写入空文本即可。

    // thumbnailrorl 决定文本写在 .right 还是 .left span：
    //   false → 缩略图在左，文本写 .left；否则文本写 .right
    playerUiState.textOnRight = playerControlThumbnailrorl !== false;
    playerUiState.title = titleToShow;
    playerUiState.artist = artistToShow;
    playerUiState.albumTitle = albumToShow;

    // main 分支逻辑：samealbum_title 开启时永远显示专辑行（联动模式）；
    // 关闭时若 album 与 title 文本一致则隐藏，避免冗余。
    if (albumToShow !== titleToShow || playerControlSamealbumTitle === true) {
        playerUiState.albumVisible = true;
    } else {
        playerUiState.albumVisible = false;
    }

    if (visualaudiobar) {
        // 强制同步布局回流，确保 aubar.clientWidth 反映新标题宽度
        const aubar = elements.playerControl.aubar;
        if (aubar) void aubar.offsetHeight;
        pc_aubar();
    }
}

/**
 * 刷新播放器标题显示（供外部调用）
 */
export function refreshPlayerDisplay(): void {
    playertitle(true);
}

/**
 * 更新播放器封面及颜色（供外部调用）。
 * 封面加载完成后的颜色提取由 PlayerControl.vue 的 img @load 处理器完成。
 */
export function updatePlayerThumbnail(dataUrl: string | null): void {
    if (dataUrl) {
        playerUiState.thumbnailUrl = dataUrl;
        // 颜色提取：模板 <img @load> 时调用
        //   extractColorsFromThumbnail(null) + thumbnailsue()
        // （见 PlayerControl.vue onThumbnailLoad）
    } else {
        playerUiState.thumbnailUrl = '';
        runtimeStore.updatePlayerInfo({ colorGroup: null });
    }
}
