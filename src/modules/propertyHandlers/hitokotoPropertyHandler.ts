/**
 * Hitokoto Property Handler
 * 处理一言相关的属性监听
 */

import { WallpaperProperties } from './types';
import { appConfig } from '../../utils/config';
import { timerManager } from '../../utils/timer';

declare let hitokotoInit: boolean;
declare let hitokoto_updata: number;
declare let HitoktoFormatTest: number;
declare let hit_a: string;
declare let hit_b: string;
declare let hit_c: string;
declare let hit_d: string;
declare let hit_e: string;
declare let hit_f: string;
declare let hit_g: string;
declare let hit_h: string;
declare let hit_i: string;
declare let hit_j: string;
declare let hit_k: string;
declare let hit_l: string;
declare let hitokoto_color: number[];
declare let hitokoto_blurcolor_show: boolean;
declare let hitokoto_blurcolor: number[];
declare let hitokoto_yakeli_show: boolean;
declare let hitokoto_yakeli: number;
declare let hitokoto_yakelicolor: number[];
declare let hitokoto_bluryakeli: number;
declare let hitokoto_sizeX_show: boolean;
declare let hitokoto: HTMLElement;
declare let bodyElement: HTMLElement;
declare let h: number;
declare let w: number;
declare let autoHitokto: () => void;

export interface HitokotoPropertyHandlerResult {
    // empty for now
}

/**
 * 处理一言相关属性
 * @param properties 属性对象
 * @param FirstLoad 是否首次加载
 * @returns 处理结果
 */
export function handleHitokotoProperties(
    properties: WallpaperProperties,
    FirstLoad: boolean
): HitokotoPropertyHandlerResult {
    const result: HitokotoPropertyHandlerResult = {};

    // 一言更新时间
    if (properties.hitokoto_updata) {
        appConfig.setHitokotoUpdate(properties.hitokoto_updata.value);
    }

    // 一言格式
    if (properties.hitokoto_auth) {
        appConfig.setHitoktoFormatTest(properties.hitokoto_auth.value ? 1 : 2);
    }

    // 一言自定义
    if (properties.hitokoto_a) {
        appConfig.setHitA(properties.hitokoto_a.value ? "c=a&" : "");
    }
    if (properties.hitokoto_b) {
        appConfig.setHitB(properties.hitokoto_b.value ? "c=b&" : "");
    }
    if (properties.hitokoto_c) {
        appConfig.setHitC(properties.hitokoto_c.value ? "c=c&" : "");
    }
    if (properties.hitokoto_d) {
        appConfig.setHitD(properties.hitokoto_d.value ? "c=d&" : "");
    }
    if (properties.hitokoto_e) {
        appConfig.setHitE(properties.hitokoto_e.value ? "c=e&" : "");
    }
    if (properties.hitokoto_f) {
        appConfig.setHitF(properties.hitokoto_f.value ? "c=f&" : "");
    }
    if (properties.hitokoto_g) {
        appConfig.setHitG(properties.hitokoto_g.value ? "c=g&" : "");
    }
    if (properties.hitokoto_h) {
        appConfig.setHitH(properties.hitokoto_h.value ? "c=h&" : "");
    }
    if (properties.hitokoto_i) {
        appConfig.setHitI(properties.hitokoto_i.value ? "c=i&" : "");
    }
    if (properties.hitokoto_j) {
        appConfig.setHitJ(properties.hitokoto_j.value ? "c=j&" : "");
    }
    if (properties.hitokoto_k) {
        appConfig.setHitK(properties.hitokoto_k.value ? "c=k&" : "");
    }
    if (properties.hitokoto_l) {
        appConfig.setHitL(properties.hitokoto_l.value ? "c=l&" : "");
    }

    // 是否一言
    if (properties.hitokoto_show) {
        const hitokoto_show = properties.hitokoto_show.value;
        timerManager.remove('updataHitokto');
        bodyElement.style.setProperty("--hitokoto-display", hitokoto_show ? 'flex' : 'none');
        bodyElement.style.setProperty("--hitokoto-visibility", hitokoto_show ? 'visible' : 'hidden');
        if (hitokoto_show) {
            hitokotoInit = false;
            autoHitokto();
        }
    }

    // 一言外观
    if (properties.hitokoto_color) {
        const color = properties.hitokoto_color.value.split(' ').map((c) => Math.ceil(parseFloat(c) * 255));
        appConfig.setHitokotoColor(color);
        bodyElement.style.setProperty("--hitokoto-color", color.join(', '));
    }

    if (properties.hitokoto_blurcolor) {
        const blurcolor = properties.hitokoto_blurcolor.value.split(' ').map((c) => Math.ceil(parseFloat(c) * 255));
        appConfig.setHitokotoBlurcolor(blurcolor);
        bodyElement.style.setProperty("--hitokoto-blur-color", blurcolor.join(', '));
    }

    if (properties.hitokoto_yakelicolor) {
        const yakeliccolor = properties.hitokoto_yakelicolor.value.split(' ').map((c) => Math.ceil(parseFloat(c) * 255));
        appConfig.setHitokotoYakelicColor(yakeliccolor);
        bodyElement.style.setProperty("--hitokoto-yakeli-color", yakeliccolor.join(', '));
    }

    if (properties.hitokoto_yakeli) {
        const yakeli = properties.hitokoto_yakeli.value / 100;
        appConfig.setHitokotoYakeli(yakeli);
        bodyElement.style.setProperty("--hitokoto-yakeli", String(yakeli));
    }

    if (properties.hitokoto_bluryakeli) {
        hitokoto_bluryakeli = properties.hitokoto_bluryakeli.value;
        bodyElement.style.setProperty("--hitokoto-blur-yakeli", `${hitokoto_bluryakeli}px`);
    }

    if (properties.hitokoto_blurcolor_show) {
        hitokoto_blurcolor_show = properties.hitokoto_blurcolor_show.value;
        bodyElement.style.setProperty("--hitokoto-blur-enabled", hitokoto_blurcolor_show ? '1' : '0');
    }

    if (properties.hitokoto_yakeli_show) {
        hitokoto_yakeli_show = properties.hitokoto_yakeli_show.value;
        bodyElement.style.setProperty("--hitokoto-yakeli-enabled", hitokoto_yakeli_show ? '1' : '0');
    }

    // 一言透明度
    if (properties.hitokoto_timetransparency) {
        const t = properties.hitokoto_timetransparency.value / 100;
        bodyElement.style.setProperty("--hitokoto-opacity", String(t));
    }

    // 一言圆角
    if (properties.hitokoto_roundedcorners) {
        bodyElement.style.setProperty("--hitokoto-roundedcorners", String(properties.hitokoto_roundedcorners.value));

        const updateHeight = () => {
            const height = hitokoto.getBoundingClientRect().height;
            if (!height) return;
            bodyElement.style.setProperty("--hitokoto-height", height + "px");
        };

        updateHeight();
        const observer = new ResizeObserver(updateHeight);
        observer.observe(hitokoto);
    }

    // 一言大小
    if (properties.hitokoto_size) {
        const s = properties.hitokoto_size.value;
        bodyElement.style.setProperty("--hitokoto-font-size", Math.floor(h / 570 * s) + 'px');
        bodyElement.style.setProperty("--hitokoto-line-height", Math.floor(h / 570 * s) + 'px');
    }

    if (properties.hitokoto_showwidth) {
        if (properties.hitokoto_showwidth.value === 0) {
            bodyElement.style.setProperty("--hitokoto-show-width", 'auto');
        } else {
            const s = properties.hitokoto_showwidth.value / 100;
            bodyElement.style.setProperty("--hitokoto-show-width", w * s + "px");
        }
    }

    // 一言位置
    if (properties.hitokotoX) {
        bodyElement.style.setProperty("--hitokoto-left", `${properties.hitokotoX.value}%`);
    }

    if (properties.hitokotoY) {
        bodyElement.style.setProperty("--hitokoto-top", `${properties.hitokotoY.value}%`);
    }

    return result;
}
