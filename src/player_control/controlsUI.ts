/**
 * #player_control 上的 prev / next / play-pause 控制按钮：
 *   - 鼠标 hover 在 aubar 区域时显示
 *   - 仅 server_mode = true 时启用（否则永久隐藏）
 *   - 用事件委托派发到 video.ts 的 TogglePlayPause / PlayNextTrack / PlayPrevTrack
 */
import { config } from '@/utils/config';
import { debugLogger } from '@/utils/logger';
import { PlayNextTrack, PlayPrevTrack, TogglePlayPause } from '@/video';

import { SERVER_MODE_PROBE_DELAY_MS } from './constants';
import { player_control } from './domRefs';

const player_control_aubarWrapper = player_control?.querySelector(
    '.aubar-wrapper'
) as HTMLElement | null;
const player_control_aubarControls = player_control?.querySelector(
    '.aubar-controls'
) as HTMLElement | null;

function showControls(): void {
    player_control_aubarControls?.classList.add('visible');
}

function hideControls(): void {
    player_control_aubarControls?.classList.remove('visible');
}

/**
 * 初始化播放控制按钮的事件监听（鼠标进入显示 + 点击委托）。
 * 服务端模式未开启时，按钮永远隐藏。
 */
export function initPlayerControls(): void {
    setTimeout(() => {
        debugLogger.info('[PlayerControl] server_mode probe', {
            serverMode: config.server_mode,
        });
        if (!config.server_mode) {
            player_control_aubarControls?.style.setProperty('display', 'none', 'important');
            return;
        }
    }, SERVER_MODE_PROBE_DELAY_MS);

    if (!player_control_aubarWrapper || !player_control_aubarControls) return;

    player_control_aubarWrapper.addEventListener('mouseenter', showControls);
    player_control_aubarWrapper.addEventListener('mouseleave', hideControls);

    player_control_aubarControls.addEventListener('click', e => {
        const target = e.target as HTMLElement;
        if (target.closest('.prev')) {
            PlayPrevTrack();
        } else if (target.closest('.next')) {
            PlayNextTrack();
        } else if (target.closest('.play-pause')) {
            TogglePlayPause();
        }
    });
}
