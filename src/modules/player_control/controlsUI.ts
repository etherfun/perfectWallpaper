/**
 * #player_control 上的 prev / next / play-pause 控制按钮：
 *   - 鼠标 hover 在 aubar 区域时显示
 *   - 仅 server_mode = true 时启用（否则永久隐藏）
 *   - 用事件委托派发到 video.ts 的 TogglePlayPause / PlayNextTrack / PlayPrevTrack
 */
import { useConfigStore } from '@/stores/config';
import { registerDeferred } from '@/utils/deferredScheduler';

const config = useConfigStore();
import { debugLogger } from '@/utils/logger';
import { PlayNextTrack, PlayPrevTrack, TogglePlayPause } from '@/modules/core/video';

import { SERVER_MODE_PROBE_DELAY_MS } from './constants';
import { player_control } from './domRefs';

/** 惰性获取 aubar-wrapper 引用（Vue mount 后 player_control 才非 null） */
function getAubarWrapper(): HTMLElement | null {
    return player_control?.querySelector('.aubar-wrapper') as HTMLElement | null;
}

/** 惰性获取 aubar-controls 引用（Vue mount 后 player_control 才非 null） */
function getAubarControls(): HTMLElement | null {
    return player_control?.querySelector('.aubar-controls') as HTMLElement | null;
}

function showControls(): void {
    getAubarControls()?.classList.add('visible');
}

function hideControls(): void {
    getAubarControls()?.classList.remove('visible');
}

/**
 * 初始化播放控制按钮的事件监听（鼠标进入显示 + 点击委托）。
 * 服务端模式未开启时，按钮永远隐藏。
 *
 * DOM 操作通过 registerDeferred 延后到 Vue mount + refreshDomRefs 之后执行。
 */
export function initPlayerControls(): void {
    // server_mode 探针：只需 aubar-controls 元素存在即可，无需完整 DOM
    setTimeout(() => {
        const controls = getAubarControls();
        if (!controls) return;
        debugLogger.info('[PlayerControl] server_mode probe', {
            serverMode: config.server_mode,
        });
        // 用 CSS 变量控制 display：避免 !important 锁死后无法被 .visible 覆盖
        controls.style.setProperty(
            '--aubar-display',
            config.server_mode ? '' : 'none'
        );
    }, SERVER_MODE_PROBE_DELAY_MS);

    // 事件绑定依赖 #player_control DOM 存在，延迟到 Vue mount 后执行
    registerDeferred('player:controls-ui', () => {
        const wrapper = getAubarWrapper();
        const controls = getAubarControls();
        if (!wrapper || !controls) return;

        wrapper.addEventListener('mouseenter', showControls);
        wrapper.addEventListener('mouseleave', hideControls);

        controls.addEventListener('click', e => {
            const target = e.target as HTMLElement;
            if (target.closest('.prev')) {
                PlayPrevTrack();
            } else if (target.closest('.next')) {
                PlayNextTrack();
            } else if (target.closest('.play-pause')) {
                TogglePlayPause();
            }
        });

        debugLogger.info('[PlayerControl] 控制按钮事件绑定完成');
    });
}
