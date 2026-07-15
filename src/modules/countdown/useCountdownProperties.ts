/**
 * useCountdownProperties — Vue 3 composable 包装 countdown 属性处理
 *
 * Stage 3-1 (Phase 7 批次 3-1): 把 src/propertyHandlers/countdownPropertyHandler.ts
 * 的全部逻辑迁移到 composable。保持原 handler 的所有副作用（CSS 变量 /
 * Pinia patch / ResizeObserver / timerManager），不引入行为变更。
 */
import { elements } from '@/utils/elementManager';
import { registerDeferred } from '@/utils/deferredScheduler';
import { useConfigStore } from '@/stores/config';

import { timerManager } from '../utils/timer';
import { logInitComplete } from '../propertyHandlers/_helpers';
import { WallpaperProperties } from '../propertyHandlers/types';

const bodyElement = elements.body;

/**
 * 处理倒计时相关属性
 *
 * Stage 7-B (Phase 7 批次 2-B):
 *   - config.xxx = ... 改为 useConfigStore().$patch({...})，解除对 utils/config 单例的依赖。
 *   - src/countdown.ts 已删除；setcountdown_a 由 Countdown.vue useUpdateInterval 自动触发。
 */
export function useCountdownProperties(
    properties: WallpaperProperties,
    FirstLoad: boolean
): void {
    const store = useConfigStore();
    const patch: Record<string, unknown> = {};

    if (properties.countdownY) {
        patch.countdown_y = properties.countdownY.value;
        bodyElement.style.setProperty('--countdown-top', `${properties.countdownY.value}%`);
    }

    if (properties.countdownX) {
        patch.countdown_x = properties.countdownX.value;
        bodyElement.style.setProperty('--countdown-left', `${properties.countdownX.value}%`);
    }

    if (properties.countdown_size) {
        patch.countdown_size = properties.countdown_size.value;
        const s = properties.countdown_size.value;
        bodyElement.style.setProperty(
            '--countdown-font-size',
            Math.floor((window.innerHeight / 300) * s) + 'px'
        );
    }

    if (properties.countdown_txt) {
        patch.countdown_txt = properties.countdown_txt.value;
    }

    if (properties.countdown_txt1) {
        patch.countdown_txt1 = properties.countdown_txt1.value;
    }

    if (properties.countdown_show) {
        patch.countdown_show = properties.countdown_show.value;
        timerManager.remove('updataCountdown');
        bodyElement.style.setProperty(
            '--countdown-display',
            properties.countdown_show.value ? 'flex' : 'none'
        );
        bodyElement.style.setProperty(
            '--countdown-visibility',
            properties.countdown_show.value ? 'visible' : 'hidden'
        );
    }

    if (properties.countdown_year) {
        patch.countdown_year = properties.countdown_year.value;
    }

    if (properties.countdown_month) {
        patch.countdown_month = properties.countdown_month.value;
    }

    if (properties.countdown_day) {
        patch.countdown_day = properties.countdown_day.value;
    }

    if (properties.countdown_color) {
        const color = properties.countdown_color.value
            .split(' ')
            .map(c => Math.ceil(parseFloat(c) * 255));
        patch.countdown_color = color;
        bodyElement.style.setProperty('--countdown-color', color.join(', '));
    }

    if (properties.countdown_blurcolor_show) {
        patch.countdown_blurcolor_show = properties.countdown_blurcolor_show.value;
        bodyElement.style.setProperty(
            '--countdown-blur-enabled',
            properties.countdown_blurcolor_show.value ? '1' : '0'
        );
    }

    if (properties.countdown_blurcolor) {
        const color = properties.countdown_blurcolor.value
            .split(' ')
            .map(c => Math.ceil(parseFloat(c) * 255));
        patch.countdown_blurcolor = color;
        bodyElement.style.setProperty('--countdown-blur-color', color.join(', '));
    }

    if (properties.countdown_yakeli_show) {
        patch.countdown_yakeli_show = properties.countdown_yakeli_show.value;
        bodyElement.style.setProperty(
            '--countdown-yakeli-enabled',
            properties.countdown_yakeli_show.value ? '1' : '0'
        );
    }

    if (properties.countdown_yakelicolor) {
        const color = properties.countdown_yakelicolor.value
            .split(' ')
            .map(c => Math.ceil(parseFloat(c) * 255));
        patch.countdown_yakelic_color = color;
        bodyElement.style.setProperty('--countdown-yakeli-color', color.join(', '));
    }

    if (properties.countdown_yakeli) {
        const value = properties.countdown_yakeli.value / 100;
        patch.countdown_yakeli = value;
        bodyElement.style.setProperty('--countdown-yakeli', String(value));
    }

    if (properties.countdown_bluryakeli) {
        patch.countdown_bluryakeli = properties.countdown_bluryakeli.value;
        patch.first_load_countdown = false;
        bodyElement.style.setProperty(
            '--countdown-blur-yakeli',
            String(properties.countdown_bluryakeli.value) + 'px'
        );
    }

    if (properties.countdown_timetransparency) {
        patch.countdown_timetransparency = properties.countdown_timetransparency.value;
        const t = properties.countdown_timetransparency.value / 100;
        bodyElement.style.setProperty('--countdown-opacity', String(t));
    }

    if (properties.countdown_roundedcorners) {
        patch.countdown_roundedcorners = properties.countdown_roundedcorners.value;
        bodyElement.style.setProperty(
            '--countdown-roundedcorners',
            String(properties.countdown_roundedcorners.value)
        );

        // 监听倒计时容器尺寸变化，同步 --countdown-height CSS 变量。
        // countdown 容器由 Vue mount 后才存在，通过 deferredScheduler 延后挂载 observer。
        registerDeferred('countdown:height-observer', () => {
            const countdown = elements.countdown.container;
            if (!countdown) return;

            const updateHeight = (): void => {
                const height = countdown.getBoundingClientRect().height;
                if (!height) return;
                bodyElement.style.setProperty('--countdown-height', height + 'px');
            };

            updateHeight();
            const observer = new ResizeObserver(updateHeight);
            observer.observe(countdown);
            return () => observer.disconnect();
        });
    }

    if (properties.countdown_showwidth) {
        if (properties.countdown_showwidth.value === 0) {
            bodyElement.style.setProperty('--countdown-show-width', 'auto');
        } else {
            const s = properties.countdown_showwidth.value / 100;
            bodyElement.style.setProperty('--countdown-show-width', window.innerWidth * s + 'px');
        }
    }

    if (Object.keys(patch).length > 0) {
        store.$patch(patch);
    }

    if (FirstLoad) {
        logInitComplete('[Countdown]', '倒计时', FirstLoad);
    }
}
