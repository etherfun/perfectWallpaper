import { getDockBar, initDockBar } from '@/dockbar';
import { elements } from '@/utils/elementManager';
import { debugLogger } from '@/utils/logger';

import { WallpaperProperties } from './types';

/**
 * 处理Dock栏属性
 * @param properties 属性对象
 * @param FirstLoad 是否首次加载
 */
export function handleDockBarProperties(
    properties: WallpaperProperties,
    FirstLoad: boolean
): void {
    if (FirstLoad) {
        initDockBar();
    }

    const dockbar = getDockBar();
    if (!dockbar) return;

    // 启用/禁用
    if (properties.dockbar_enabled !== undefined) {
        dockbar.setEnabled(properties.dockbar_enabled.value);
    }

    // 位置
    if (properties.dockbar_position) {
        const positions: Array<'bottom' | 'top' | 'left' | 'right'> = ['bottom', 'top', 'left', 'right'];
        const position = positions[properties.dockbar_position.value] || 'bottom';
        dockbar.updateConfig({ position });
    }

    // 图标大小
    if (properties.dockbar_icon_size) {
        dockbar.updateConfig({ iconSize: properties.dockbar_icon_size.value });
    }

    // 间距
    if (properties.dockbar_spacing) {
        dockbar.updateConfig({ spacing: properties.dockbar_spacing.value });
    }

    // 亚克力效果启用
    if (properties.dockbar_yakeli_show) {
        dockbar.updateConfig({ yakeliEnabled: properties.dockbar_yakeli_show.value });
        elements.body.style.setProperty("--dockbar-yakeli-enabled", properties.dockbar_yakeli_show.value ? '1' : '0');
    }

    // 亚克力强度
    if (properties.dockbar_yakeli) {
        const intensity = properties.dockbar_yakeli.value / 100;
        dockbar.updateConfig({ yakeliIntensity: intensity });
        elements.body.style.setProperty("--dockbar-yakeli", String(intensity));
    }

    // 模糊强度
    if (properties.dockbar_bluryakeli) {
        dockbar.updateConfig({ blurIntensity: properties.dockbar_bluryakeli.value });
        elements.body.style.setProperty("--dockbar-blur-yakeli", `${properties.dockbar_bluryakeli.value}px`);
    }

    // 亚克力颜色
    if (properties.dockbar_yakelicolor) {
        const colorProp = properties.dockbar_yakelicolor;
        const c = colorProp.value.split(' ').map((v: string) => Math.ceil(parseFloat(v) * 255));
        dockbar.updateConfig({
            yakeliColorR: c[0] || 255,
            yakeliColorG: c[1] || 255,
            yakeliColorB: c[2] || 255
        });
        elements.body.style.setProperty("--dockbar-yakeli-color", c.join(', '));
    }

    // 圆角
    if (properties.dockbar_roundedcorners) {
        dockbar.updateConfig({ roundedCorners: properties.dockbar_roundedcorners.value });
        elements.body.style.setProperty("--dockbar-roundedcorners", String(properties.dockbar_roundedcorners.value));
    }

    // X轴位置
    if (properties.dockbar_x !== undefined) {
        dockbar.updateConfig({ positionX: properties.dockbar_x.value });
    }

    // Y轴位置
    if (properties.dockbar_y !== undefined) {
        dockbar.updateConfig({ positionY: properties.dockbar_y.value });
    }

    // 显示/隐藏添加按钮
    if (properties.dockbar_show_add_btn !== undefined) {
        dockbar.updateConfig({ showAddButton: properties.dockbar_show_add_btn.value });
    }

    if (FirstLoad) {
        debugLogger.info('[DockBar] Dock栏参数初始化完成');
    }
}
