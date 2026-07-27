import { getDockBar, initDockBar } from '@/modules/dockbar';
import { useConfigStore } from '@/stores/config';
import { elements } from '@/utils/elementManager';

import { WallpaperProperties } from '../../types/types';
import { logInitComplete } from '../../utils/helpers';

/**
 * 澶勭悊Dock鏍忓睘鎬?
 * @param properties 灞炴€у璞?
 * @param FirstLoad 鏄惁棣栨鍔犺浇
 */
export function useDockBarProperties(properties: WallpaperProperties, FirstLoad: boolean): void {
    if (FirstLoad) {
        initDockBar();
    }

    const dockbar = getDockBar();
    if (!dockbar) return;

    // 濡傛灉涔嬪墠 initDockBar() 鏃?DOM 灏氭湭灏辩华锛坬ueryDomElements 杩斿洖 null锛夛紝
    // 姝ゆ椂灏濊瘯閲嶆柊鍒濆鍖栥€侱ockBar.vue 鐨?onMounted 涔熶細璋冪敤 ensureInitialized锛?
    // 杩欓噷浣滀负棰濆淇濋殰锛岀‘淇?WE 鎺ㄩ€佸睘鎬ф椂 dockbar 鍙敤銆?
    dockbar.ensureInitialized();

    // 鍚敤/绂佺敤
    if (properties.dockbar_enabled !== undefined) {
        const v = properties.dockbar_enabled.value;
        dockbar.setEnabled(v);
        // 鍚屾鍒?store 淇濊瘉 Vue 鍝嶅簲寮?
        useConfigStore().$patch({ dockbar_enabled: v });
    }

    // 浣嶇疆
    if (properties.dockbar_position) {
        const positions: Array<'bottom' | 'top' | 'left' | 'right'> = [
            'bottom',
            'top',
            'left',
            'right',
        ];
        const position = positions[properties.dockbar_position.value] || 'bottom';
        dockbar.updateConfig({ position });
    }

    // 鍥炬爣澶у皬
    if (properties.dockbar_icon_size) {
        dockbar.updateConfig({ iconSize: properties.dockbar_icon_size.value });
    }

    // 闂磋窛
    if (properties.dockbar_spacing) {
        dockbar.updateConfig({ spacing: properties.dockbar_spacing.value });
    }

    // 浜氬厠鍔涙晥鏋滃惎鐢?
    if (properties.dockbar_yakeli_show) {
        dockbar.updateConfig({ yakeliEnabled: properties.dockbar_yakeli_show.value });
        elements.body.style.setProperty(
            '--dockbar-yakeli-enabled',
            properties.dockbar_yakeli_show.value ? '1' : '0'
        );
    }

    // 浜氬厠鍔涘己搴?
    if (properties.dockbar_yakeli) {
        const intensity = properties.dockbar_yakeli.value / 100;
        dockbar.updateConfig({ yakeliIntensity: intensity });
        elements.body.style.setProperty('--dockbar-yakeli', String(intensity));
    }

    // 妯＄硦寮哄害
    if (properties.dockbar_bluryakeli) {
        dockbar.updateConfig({ blurIntensity: properties.dockbar_bluryakeli.value });
        elements.body.style.setProperty(
            '--dockbar-blur-yakeli',
            `${properties.dockbar_bluryakeli.value}px`
        );
    }

    // 浜氬厠鍔涢鑹?
    if (properties.dockbar_yakelicolor) {
        const colorProp = properties.dockbar_yakelicolor;
        const c = colorProp.value.split(' ').map((v: string) => Math.ceil(parseFloat(v) * 255));
        dockbar.updateConfig({
            yakeliColorR: c[0] || 255,
            yakeliColorG: c[1] || 255,
            yakeliColorB: c[2] || 255,
        });
        elements.body.style.setProperty('--dockbar-yakeli-color', c.join(', '));
    }

    // 鍦嗚
    if (properties.dockbar_roundedcorners) {
        dockbar.updateConfig({ roundedCorners: properties.dockbar_roundedcorners.value });
        elements.body.style.setProperty(
            '--dockbar-roundedcorners',
            String(properties.dockbar_roundedcorners.value)
        );
    }

    // X杞翠綅缃?
    if (properties.dockbar_x !== undefined) {
        dockbar.updateConfig({ positionX: properties.dockbar_x.value });
    }

    // Y杞翠綅缃?
    if (properties.dockbar_y !== undefined) {
        dockbar.updateConfig({ positionY: properties.dockbar_y.value });
    }

    // 鏄剧ず/闅愯棌娣诲姞鎸夐挳
    if (properties.dockbar_show_add_btn !== undefined) {
        dockbar.updateConfig({ showAddButton: properties.dockbar_show_add_btn.value });
    }

    if (FirstLoad) {
        logInitComplete('[DockBar]', 'Dock栏', FirstLoad);
    }
}
