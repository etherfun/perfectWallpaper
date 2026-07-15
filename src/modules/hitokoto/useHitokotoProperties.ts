/**
 * useHitokotoProperties — Vue 3 composable 包装 hitokoto 属性处理
 *
 * Stage 3-1 (Phase 7 批次 3-1): 把 src/propertyHandlers/hitokotoPropertyHandler.ts
 * 的全部逻辑迁移到 composable。保持原 handler 的所有副作用（CSS 变量 /
 * Pinia patch / timerManager），不引入行为变更。
 */
import { useConfigStore } from '@/stores/config';
import { registerDeferred } from '@/utils/deferredScheduler';
import { elements } from '@/utils/elementManager';

import { WallpaperProperties } from '../../types/types';
import { timerManager } from '../../utils/timer';
import { logInitComplete } from '../core/propertyHandlers/_helpers';

/**
 * 处理一言相关属性
 *
 * Stage 7-B (Phase 7 批次 2-B):
 *   - config.xxx = ... 改为 useConfigStore().$patch({...})，解除对 utils/config 单例的依赖。
 *   - src/hitokoto.ts 已删除；autoHitokto 由 Hitokoto.vue watch(config.hitokoto_show)
 *     自动触发 fetchHitokoto + 启停 interval。
 */
export function useHitokotoProperties(
    properties: WallpaperProperties,
    FirstLoad: boolean
): void {
    const store = useConfigStore();
    const patch: Record<string, unknown> = {};

    if (properties.hitokoto_updata) {
        patch.hitokoto_update = properties.hitokoto_updata.value;
    }

    if (properties.hitokoto_auth) {
        patch.hitokoto_format_test = properties.hitokoto_auth.value ? 1 : 2;
    }

    // 一言自定义 (hit_a..hit_l → c=a& 等)
    if (properties.hitokoto_a) {
        patch.hit_a = properties.hitokoto_a.value ? 'c=a&' : '';
    }
    if (properties.hitokoto_b) {
        patch.hit_b = properties.hitokoto_b.value ? 'c=b&' : '';
    }
    if (properties.hitokoto_c) {
        patch.hit_c = properties.hitokoto_c.value ? 'c=c&' : '';
    }
    if (properties.hitokoto_d) {
        patch.hit_d = properties.hitokoto_d.value ? 'c=d&' : '';
    }
    if (properties.hitokoto_e) {
        patch.hit_e = properties.hitokoto_e.value ? 'c=e&' : '';
    }
    if (properties.hitokoto_f) {
        patch.hit_f = properties.hitokoto_f.value ? 'c=f&' : '';
    }
    if (properties.hitokoto_g) {
        patch.hit_g = properties.hitokoto_g.value ? 'c=g&' : '';
    }
    if (properties.hitokoto_h) {
        patch.hit_h = properties.hitokoto_h.value ? 'c=h&' : '';
    }
    if (properties.hitokoto_i) {
        patch.hit_i = properties.hitokoto_i.value ? 'c=i&' : '';
    }
    if (properties.hitokoto_j) {
        patch.hit_j = properties.hitokoto_j.value ? 'c=j&' : '';
    }
    if (properties.hitokoto_k) {
        patch.hit_k = properties.hitokoto_k.value ? 'c=k&' : '';
    }
    if (properties.hitokoto_l) {
        patch.hit_l = properties.hitokoto_l.value ? 'c=l&' : '';
    }

    if (properties.hitokoto_show) {
        const hitokoto_show = properties.hitokoto_show.value;
        patch.hitokoto_show = hitokoto_show;
        timerManager.remove('updataHitokto');
        elements.body.style.setProperty('--hitokoto-display', hitokoto_show ? 'flex' : 'none');
        elements.body.style.setProperty(
            '--hitokoto-visibility',
            hitokoto_show ? 'visible' : 'hidden'
        );
        // Hitokoto.vue watch(hitokoto_show) 自动 fetch + restart interval
    }

    if (properties.hitokoto_color) {
        const color = properties.hitokoto_color.value
            .split(' ')
            .map((c: string) => Math.ceil(parseFloat(c) * 255));
        patch.hitokoto_color = color;
        elements.body.style.setProperty('--hitokoto-color', color.join(', '));
    }

    if (properties.hitokoto_blurcolor) {
        const blurcolor = properties.hitokoto_blurcolor.value
            .split(' ')
            .map((c: string) => Math.ceil(parseFloat(c) * 255));
        patch.hitokoto_blurcolor = blurcolor;
        elements.body.style.setProperty('--hitokoto-blur-color', blurcolor.join(', '));
    }

    if (properties.hitokoto_yakelicolor) {
        const yakeliccolor = properties.hitokoto_yakelicolor.value
            .split(' ')
            .map((c: string) => Math.ceil(parseFloat(c) * 255));
        patch.hitokoto_yakelic_color = yakeliccolor;
        elements.body.style.setProperty('--hitokoto-yakeli-color', yakeliccolor.join(', '));
    }

    if (properties.hitokoto_yakeli) {
        const yakeli = properties.hitokoto_yakeli.value / 100;
        patch.hitokoto_yakeli = yakeli;
        elements.body.style.setProperty('--hitokoto-yakeli', String(yakeli));
    }

    if (properties.hitokoto_bluryakeli) {
        const blur = properties.hitokoto_bluryakeli.value;
        patch.hitokoto_bluryakeli = blur;
        elements.body.style.setProperty('--hitokoto-blur-yakeli', `${blur}px`);
    }

    if (properties.hitokoto_blurcolor_show) {
        const show = properties.hitokoto_blurcolor_show.value;
        patch.hitokoto_blurcolor_show = show;
        elements.body.style.setProperty('--hitokoto-blur-enabled', show ? '1' : '0');
    }

    if (properties.hitokoto_yakeli_show) {
        const show = properties.hitokoto_yakeli_show.value;
        patch.hitokoto_yakeli_show = show;
        elements.body.style.setProperty('--hitokoto-yakeli-enabled', show ? '1' : '0');
    }

    if (properties.hitokoto_timetransparency) {
        const t = properties.hitokoto_timetransparency.value / 100;
        patch.hitokoto_timetransparency = properties.hitokoto_timetransparency.value;
        elements.body.style.setProperty('--hitokoto-opacity', String(t));
    }

    if (properties.hitokoto_roundedcorners) {
        patch.hitokoto_roundedcorners = properties.hitokoto_roundedcorners.value;
        elements.body.style.setProperty(
            '--hitokoto-roundedcorners',
            String(properties.hitokoto_roundedcorners.value)
        );

        // 监听一言容器尺寸变化，同步 --hitokoto-height CSS 变量。
        // hitokoto 容器由 Vue mount 后才存在，通过 deferredScheduler 延后挂载 observer。
        registerDeferred('hitokoto:height-observer', () => {
            const hitokoto = elements.hitokoto.container;
            if (!hitokoto) return;

            const updateHeight = (): void => {
                const height = hitokoto.getBoundingClientRect().height;
                if (!height) return;
                elements.body.style.setProperty('--hitokoto-height', height + 'px');
            };

            updateHeight();
            const observer = new ResizeObserver(updateHeight);
            observer.observe(hitokoto);
            return () => observer.disconnect();
        });
    }

    if (properties.hitokoto_size) {
        const s = properties.hitokoto_size.value;
        patch.hitokoto_size = s;
        elements.body.style.setProperty(
            '--hitokoto-font-size',
            Math.floor((window.innerHeight / 570) * s) + 'px'
        );
        elements.body.style.setProperty(
            '--hitokoto-line-height',
            Math.floor((window.innerHeight / 570) * s) + 'px'
        );
    }

    if (properties.hitokoto_showwidth) {
        patch.hitokoto_showwidth = properties.hitokoto_showwidth.value;
        if (properties.hitokoto_showwidth.value === 0) {
            elements.body.style.setProperty('--hitokoto-show-width', 'auto');
        } else {
            const s = properties.hitokoto_showwidth.value / 100;
            elements.body.style.setProperty('--hitokoto-show-width', window.innerWidth * s + 'px');
        }
    }

    if (properties.hitokotoX) {
        patch.hitokoto_x = properties.hitokotoX.value;
        elements.body.style.setProperty('--hitokoto-left', `${properties.hitokotoX.value}%`);
    }

    if (properties.hitokotoY) {
        patch.hitokoto_y = properties.hitokotoY.value;
        elements.body.style.setProperty('--hitokoto-top', `${properties.hitokotoY.value}%`);
    }

    if (Object.keys(patch).length > 0) {
        store.$patch(patch);
    }

    if (FirstLoad) {
        logInitComplete('[Hitokoto]', '一言', FirstLoad);
    }
}
