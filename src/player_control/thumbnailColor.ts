/**
 * 把颜色应用到 #player_control 的背景、文字、进度条、图标上。
 */
import { config } from '@/utils/config';
import { elements } from '@/utils/elementManager';

import { TIMELINE_BG_ALPHA_OFFSET } from './constants';
import {
    player_control_background,
    player_control_info,
    player_control_timeline,
} from './domRefs';
import type { RgbTuple } from './types';

/**
 * 根据当前 colorGroup + 配置，刷新所有颜色与进度条样式。
 * 外部模块按需触发。
 */
export function thumbnailsue(): void {
    if (!config.runtime.playerInfo.colorGroup) return;

    const colorPickupMethod = config.color_pickup_method;
    const playerControlYakelibgusetb = config.player_control_yakelibgusetb;
    const playerControlFontusetb = config.player_control_fontusetb;
    const playerControlYakeli = config.player_control_yakeli;
    const playerControlYakelicColor = config.player_control_yakelic_color;
    const playerControlColor = config.player_control_color;

    const methodGroup = config.runtime.playerInfo.colorGroup[colorPickupMethod - 1];
    const thumbnailcolor =
        playerControlYakelibgusetb !== 5
            ? (methodGroup?.[playerControlYakelibgusetb - 1] ?? null)
            : playerControlYakelicColor;

    config.runtime.playerInfo.fontcolor =
        playerControlFontusetb !== 5
            ? (methodGroup?.[playerControlFontusetb - 1] ?? null)
            : playerControlColor;

    player_control_background.style.background =
        'rgba(' + thumbnailcolor + ',' + playerControlYakeli + ')';
    player_control_info.style.color = 'rgb(' + config.runtime.playerInfo.fontcolor + ')';
    applyIconColor(config.runtime.playerInfo.fontcolor);
    player_control_timeline.style.backgroundColor =
        'rgb(' + config.runtime.playerInfo.fontcolor + ')';

    const timelineEl = elements.playerControl.timeline?.parentElement;
    if (timelineEl) {
        timelineEl.style.backgroundColor =
            'rgba(' + [255, 255, 255] + ',' + (playerControlYakeli + TIMELINE_BG_ALPHA_OFFSET) + ')';
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
