/**
 * 把颜色应用到 #player_control 的背景、文字、进度条、图标上。
 */
import { useConfigStore } from '@/stores/config';
import { useRuntimeStore } from '@/stores/runtime';

const config = useConfigStore();
const runtimeStore = useRuntimeStore();
import { elements } from '@/utils/elementManager';

import { TIMELINE_BG_ALPHA_OFFSET } from '../constants';
import { player_control_info, player_control_timeline } from '../domRefs';
import type { RgbTuple } from '../types';

/**
 * 根据当前 colorGroup + 配置，刷新所有颜色与进度条样式。
 * 外部模块按需触发。
 */
export function thumbnailsue(): void {
    if (!runtimeStore.playerInfo.colorGroup) return;

    const colorPickupMethod = config.color_pickup_method ?? 1;
    const playerControlYakelibgusetb = config.player_control_yakelibgusetb ?? 1;
    const playerControlFontusetb = config.player_control_fontusetb ?? 1;
    const playerControlYakeli = config.player_control_yakeli ?? 0.8;
    const playerControlYakelicColor = config.player_control_yakelic_color;
    const playerControlColor = config.player_control_color;

    const methodGroup = runtimeStore.playerInfo.colorGroup[colorPickupMethod - 1];
    const thumbnailcolor =
        playerControlYakelibgusetb !== 5
            ? (methodGroup?.[playerControlYakelibgusetb - 1] ?? null)
            : playerControlYakelicColor ?? null;

    runtimeStore.updatePlayerInfo({
        fontcolor:
            playerControlFontusetb !== 5
                ? (methodGroup?.[playerControlFontusetb - 1] ?? null)
                : playerControlColor ?? null,
    });

    if (thumbnailcolor) {
        // 通过 body 级 CSS 变量更新背景色，SCSS 的 rgba(var(--player-yakeli-color), ...) 自动响应
        // 设置到 body 以确保所有子元素都能继承，且不受 Vue mount 时序影响。
        elements.body.style.setProperty('--player-yakeli-color', String(thumbnailcolor));
    } else {
        // 颜色未就绪时，移除 body 级的 CSS 变量，回退到用户配置值
        elements.body.style.removeProperty('--player-yakeli-color');
    }
    player_control_info.style.color = 'rgb(' + runtimeStore.playerInfo.fontcolor + ')';
    applyIconColor(runtimeStore.playerInfo.fontcolor);
    player_control_timeline.style.backgroundColor =
        'rgb(' + runtimeStore.playerInfo.fontcolor + ')';

    const timelineEl = elements.playerControl.timeline?.parentElement;
    if (timelineEl) {
        timelineEl.style.backgroundColor =
            'rgba(' +
            [255, 255, 255] +
            ',' +
            (playerControlYakeli + TIMELINE_BG_ALPHA_OFFSET) +
            ')';
    }
}

/**
 * 通过超大偏移 drop-shadow 给 SVG 图标染色（保留原 hack 写法以兼容）。
 */
function applyIconColor(rgb: RgbTuple | string | null): void {
    const titleicon = elements.playerControl.title?.querySelector('.titleicon');
    const artisticon = elements.playerControl.artist?.querySelector('.artisticon');
    const albumTitleicon = elements.playerControl.albumTitle?.querySelector('.albumTitleicon');

    const filter = 'drop-shadow(0 10240px ' + 'rgb(' + rgb + '))';
    if (titleicon) (titleicon as HTMLElement).style.filter = filter;
    if (artisticon) (artisticon as HTMLElement).style.filter = filter;
    if (albumTitleicon) (albumTitleicon as HTMLElement).style.filter = filter;
}
