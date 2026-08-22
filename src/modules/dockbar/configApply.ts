import { applyGlass } from '@/tokens/glass.tokens';

import type { DockBarConfig } from './types';

export function applyConfig(
    container: HTMLElement,
    background: HTMLElement,
    addButton: HTMLElement | null,
    config: DockBarConfig
): void {
    applyPosition(container, config);
    applyCssVariables(config);
    applyBackgroundStyle(background, config);
    applyAddButtonVisibility(addButton, config);
}

function applyPosition(container: HTMLElement, config: DockBarConfig): void {
    container.style.left = `${config.positionX}%`;
    container.style.right = 'auto';

    switch (config.position) {
        case 'top':
            container.style.top = `${config.positionY}%`;
            container.style.bottom = 'auto';
            break;
        case 'bottom':
            container.style.top = 'auto';
            container.style.bottom = `${100 - config.positionY}%`;
            break;
        case 'left':
            container.style.top = `${config.positionY}%`;
            container.style.bottom = 'auto';
            break;
        case 'right':
            container.style.top = `${config.positionY}%`;
            container.style.bottom = 'auto';
            break;
    }

    container.style.transform =
        config.position === 'left' || config.position === 'right'
            ? 'translateY(-50%)'
            : 'translateX(-50%)';
}

function applyCssVariables(config: DockBarConfig): void {
    // 亚克力相关变量经 applyGlass 写入：全局亚克力覆盖启用时由全局值接管
    applyGlass('dockbar', {
        yakeliEnabled: config.yakeliEnabled,
        yakeli: config.yakeliIntensity,
        blurYakeli: `${config.blurIntensity}px`,
        yakeliColor: [config.yakeliColorR, config.yakeliColorG, config.yakeliColorB],
        roundedCorners: config.roundedCorners,
    });
    document.body.style.setProperty('--dockbar-icon-size', `${config.iconSize}px`);
    document.body.style.setProperty('--dockbar-spacing', `${config.spacing}px`);
}

function applyBackgroundStyle(background: HTMLElement, config: DockBarConfig): void {
    background.style.backgroundColor = `rgba(${config.yakeliColorR}, ${config.yakeliColorG}, ${config.yakeliColorB}, ${config.yakeliEnabled ? config.yakeliIntensity : 0})`;
    background.style.backdropFilter = config.yakeliEnabled
        ? `blur(${config.blurIntensity}px)`
        : 'none';

    const borderRadius = (config.iconSize / 2) * (config.roundedCorners / 100);
    background.style.borderRadius = `${borderRadius}px`;
}

function applyAddButtonVisibility(addButton: HTMLElement | null, config: DockBarConfig): void {
    if (addButton) {
        addButton.style.display = config.showAddButton ? '' : 'none';
    }
}
