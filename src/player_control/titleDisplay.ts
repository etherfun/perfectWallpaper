/**
 * 标题/艺术家/专辑文本渲染，以及对外暴露的封面刷新接口。
 */
import { config } from '@/utils/config';
import { elements } from '@/utils/elementManager';

import { pc_aubar } from './audioBar';
import { extractColorsFromThumbnail } from './colorExtraction';
import { ITEM_ENTRANCE_DELAY_MS } from './constants';
import {
    player_control,
    player_control_albumTitle,
    player_control_artist,
    player_control_thumbnail,
    player_control_title,
} from './domRefs';
import { thumbnailsue } from './thumbnailColor';

/**
 * 把当前歌曲信息渲染到标题/艺术家/专辑 DOM 节点。
 * @param visualaudiobar 是否立即刷新底部音频可视化柱状图
 */
export function playertitle(visualaudiobar: boolean = false): void {
    let titleToShow = config.runtime.playerInfo.singtitle || '';
    let artistToShow = config.runtime.playerInfo.singartist || '';
    let albumToShow = config.runtime.playerInfo.singalbumTitle || '';
    const playerControlAutohide = config.player_control_autohide;
    const playerControlShow = config.player_control_show;
    const playerControlThumbnailrorl = config.player_control_thumbnailrorl;
    const playerControlSamealbumTitle = config.player_control_samealbum_title;

    if (
        (!titleToShow || titleToShow === 'loading...') &&
        !playerControlAutohide &&
        playerControlShow
    ) {
        titleToShow = '✧ପ(๑･ω･)੭';
        artistToShow = '少女祈祷中……';
        albumToShow = '';
    }

    let titleEl: Element, artistEl: Element, albumEl: Element;

    if (playerControlThumbnailrorl === false) {
        titleEl = player_control_title.querySelector('.left')!;
        artistEl = player_control_artist.querySelector('.left')!;
        albumEl = player_control_albumTitle.querySelector('.left')!;
        const rightElements = player_control.querySelectorAll('.right');
        for (let i = 0; i < rightElements.length; i++) {
            const el = rightElements[i];
            if (el) el.innerHTML = '';
        }
    } else {
        titleEl = player_control_title.querySelector('.right')!;
        artistEl = player_control_artist.querySelector('.right')!;
        albumEl = player_control_albumTitle.querySelector('.right')!;
        const leftElements = player_control.querySelectorAll('.left');
        for (let i = 0; i < leftElements.length; i++) {
            const el = leftElements[i];
            if (el) el.innerHTML = '';
        }
    }

    titleEl.innerHTML = `<span>${titleToShow}</span>`;
    artistEl.innerHTML = `<span>${artistToShow}</span>`;
    albumEl.innerHTML = `<span>${albumToShow}</span>`;

    if (albumToShow !== titleToShow || playerControlSamealbumTitle === true) {
        player_control_albumTitle.style.display = '';
    } else {
        player_control_albumTitle.style.display = 'none';
    }

    if (visualaudiobar) pc_aubar();
}

/**
 * 刷新播放器标题显示（供外部调用）
 */
export function refreshPlayerDisplay(): void {
    playertitle(true);
}

/**
 * 更新播放器封面及颜色（供外部调用）
 */
export function updatePlayerThumbnail(dataUrl: string | null): void {
    if (dataUrl) {
        player_control_thumbnail.src = dataUrl;

        const img = elements.playerControl.thumbnail;
        img.onload = async function () {
            await extractColorsFromThumbnail(null);
            setTimeout(() => thumbnailsue(), ITEM_ENTRANCE_DELAY_MS);
        };
    } else {
        player_control_thumbnail.src = '';
        config.runtime.playerInfo.colorGroup = null;
    }
}
