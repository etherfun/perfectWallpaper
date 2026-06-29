/**
 * 标题/艺术家/专辑文本渲染，以及对外暴露的封面刷新接口。
 */
import { useConfigStore } from '@/stores/config';
import { config as appConfig } from '@/utils/config'; // runtime.* (Stage 3.5-B)

const config = useConfigStore();
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
    let titleToShow = appConfig.runtime.playerInfo.singtitle || '';
    let artistToShow = appConfig.runtime.playerInfo.singartist || '';
    let albumToShow = appConfig.runtime.playerInfo.singalbumTitle || '';
    const playerControlThumbnailrorl = config.player_control_thumbnailrorl;
    const playerControlSamealbumTitle = config.player_control_samealbum_title;

    // 静默加载:没拿到真实媒体标题时不再写占位文字。
    // 容器本身由 mediaPropertiesListener 在收到真内容前保持 display:none,
    // 此处只需如实渲染空文本即可。

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

    // main 分支逻辑：samealbum_title 开启时永远显示专辑行（联动模式）；
    // 关闭时若 album 与 title 文本一致则隐藏，避免冗余。
    // aubar-wrapper 的高度波动由之前的 grid 布局 + canvas flex-grow 自然吸收，
    // 此处的 display 切换是 main 分支经过验证的行为。
    if (albumToShow !== titleToShow || playerControlSamealbumTitle === true) {
        player_control_albumTitle.style.display = '';
    } else {
        player_control_albumTitle.style.display = 'none';
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
        appConfig.runtime.playerInfo.colorGroup = null;
    }
}
