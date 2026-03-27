/**
 * Hitokoto Property Handler
 * 处理一言相关的属性监听
 */

import { WallpaperProperties } from './types';
import { config } from '../utils/config';
import { timerManager } from '../utils/timer';
import { elements } from '@/utils/elementManager';
import { autoHitokto } from '../hitokoto';

// 局部变量
let hitokotoInit = false;

// 获取一言元素
const hitokoto = elements.hitokoto.container as HTMLElement;

/**
 * 处理一言相关属性
 * @param properties 属性对象
 * @param FirstLoad 是否首次加载
 */
export function handleHitokotoProperties(
    properties: WallpaperProperties,
    FirstLoad: boolean
): void {

    // 一言更新时间
    if (properties.hitokoto_updata) {
        config.hitokotoUpdate = properties.hitokoto_updata.value;
    }

    // 一言格式
    if (properties.hitokoto_auth) {
        config.hitoktoFormatTest = properties.hitokoto_auth.value ? 1 : 2;
    }

    // 一言自定义
    if (properties.hitokoto_a) {
        config.hitA = properties.hitokoto_a.value ? "c=a&" : "";
    }
    if (properties.hitokoto_b) {
        config.hitB = properties.hitokoto_b.value ? "c=b&" : "";
    }
    if (properties.hitokoto_c) {
        config.hitC = properties.hitokoto_c.value ? "c=c&" : "";
    }
    if (properties.hitokoto_d) {
        config.hitD = properties.hitokoto_d.value ? "c=d&" : "";
    }
    if (properties.hitokoto_e) {
        config.hitE = properties.hitokoto_e.value ? "c=e&" : "";
    }
    if (properties.hitokoto_f) {
        config.hitF = properties.hitokoto_f.value ? "c=f&" : "";
    }
    if (properties.hitokoto_g) {
        config.hitG = properties.hitokoto_g.value ? "c=g&" : "";
    }
    if (properties.hitokoto_h) {
        config.hitH = properties.hitokoto_h.value ? "c=h&" : "";
    }
    if (properties.hitokoto_i) {
        config.hitI = properties.hitokoto_i.value ? "c=i&" : "";
    }
    if (properties.hitokoto_j) {
        config.hitJ = properties.hitokoto_j.value ? "c=j&" : "";
    }
    if (properties.hitokoto_k) {
        config.hitK = properties.hitokoto_k.value ? "c=k&" : "";
    }
    if (properties.hitokoto_l) {
        config.hitL = properties.hitokoto_l.value ? "c=l&" : "";
    }

    // 是否一言
    if (properties.hitokoto_show) {
        const hitokoto_show = properties.hitokoto_show.value;
        timerManager.remove('updataHitokto');
        elements.body.style.setProperty("--hitokoto-display", hitokoto_show ? 'flex' : 'none');
        elements.body.style.setProperty("--hitokoto-visibility", hitokoto_show ? 'visible' : 'hidden');
        if (hitokoto_show) {
            hitokotoInit = false;
            autoHitokto();
        }
    }

    // 一言外观
    if (properties.hitokoto_color) {
        const color = properties.hitokoto_color.value.split(' ').map((c: string) => Math.ceil(parseFloat(c) * 255));
        config.hitokotoColor = color;
        elements.body.style.setProperty("--hitokoto-color", color.join(', '));
    }

    if (properties.hitokoto_blurcolor) {
        const blurcolor = properties.hitokoto_blurcolor.value.split(' ').map((c: string) => Math.ceil(parseFloat(c) * 255));
        config.hitokotoBlurcolor = blurcolor;
        elements.body.style.setProperty("--hitokoto-blur-color", blurcolor.join(', '));
    }

    if (properties.hitokoto_yakelicolor) {
        const yakeliccolor = properties.hitokoto_yakelicolor.value.split(' ').map((c: string) => Math.ceil(parseFloat(c) * 255));
        config.hitokotoYakelicColor = yakeliccolor;
        elements.body.style.setProperty("--hitokoto-yakeli-color", yakeliccolor.join(', '));
    }

    if (properties.hitokoto_yakeli) {
        const yakeli = properties.hitokoto_yakeli.value / 100;
        config.hitokotoYakeli = yakeli;
        elements.body.style.setProperty("--hitokoto-yakeli", String(yakeli));
    }

    if (properties.hitokoto_bluryakeli) {
        const blur = properties.hitokoto_bluryakeli.value;
        config.hitokotoBluryakeli = blur;
        elements.body.style.setProperty("--hitokoto-blur-yakeli", `${blur}px`);
    }

    if (properties.hitokoto_blurcolor_show) {
        const show = properties.hitokoto_blurcolor_show.value;
        config.hitokotoBlurcolorShow = show;
        elements.body.style.setProperty("--hitokoto-blur-enabled", show ? '1' : '0');
    }

    if (properties.hitokoto_yakeli_show) {
        const show = properties.hitokoto_yakeli_show.value;
        config.hitokotoYakeliShow = show;
        elements.body.style.setProperty("--hitokoto-yakeli-enabled", show ? '1' : '0');
    }

    // 一言透明度
    if (properties.hitokoto_timetransparency) {
        const t = properties.hitokoto_timetransparency.value / 100;
        elements.body.style.setProperty("--hitokoto-opacity", String(t));
    }

    // 一言圆角
    if (properties.hitokoto_roundedcorners) {
        elements.body.style.setProperty("--hitokoto-roundedcorners", String(properties.hitokoto_roundedcorners.value));

        const updateHeight = () => {
            const height = hitokoto?.getBoundingClientRect().height;
            if (!height) return;
            elements.body.style.setProperty("--hitokoto-height", height + "px");
        };

        updateHeight();
        const observer = new ResizeObserver(updateHeight);
        if (hitokoto) observer.observe(hitokoto);
    }

    // 一言大小
    if (properties.hitokoto_size) {
        const s = properties.hitokoto_size.value;
        elements.body.style.setProperty("--hitokoto-font-size", Math.floor(config.screenHeight / 570 * s) + 'px');
        elements.body.style.setProperty("--hitokoto-line-height", Math.floor(config.screenHeight / 570 * s) + 'px');
    }

    if (properties.hitokoto_showwidth) {
        if (properties.hitokoto_showwidth.value === 0) {
            elements.body.style.setProperty("--hitokoto-show-width", 'auto');
        } else {
            const s = properties.hitokoto_showwidth.value / 100;
            elements.body.style.setProperty("--hitokoto-show-width", config.screenWidth * s + "px");
        }
    }

    // 一言位置
    if (properties.hitokotoX) {
        elements.body.style.setProperty("--hitokoto-left", `${properties.hitokotoX.value}%`);
    }

    if (properties.hitokotoY) {
        elements.body.style.setProperty("--hitokoto-top", `${properties.hitokotoY.value}%`);
    }
}
