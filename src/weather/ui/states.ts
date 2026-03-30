/**
 * 天气 UI 状态函数
 * 职责：控制天气加载、错误等 UI 状态
 */

import { elements } from '../../utils/elementManager';
import { i18n } from '../../utils/i18n';

/**
 * 显示天气加载状态
 */
export function showWeatherLoading(): void {
    const leftContainer = elements.weather.leftContainer;
    const rightContainer = elements.weather.rightContainer;
    if (!leftContainer || !rightContainer) return;

    // 保存原始子元素
    const originalChildren = Array.from(leftContainer.children);

    leftContainer.style.flex = '1';
    leftContainer.style.minWidth = 'auto';
    leftContainer.style.textAlign = 'center';
    leftContainer.style.display = 'flex';
    leftContainer.style.flexDirection = 'column';
    leftContainer.style.justifyContent = 'center';
    leftContainer.style.alignItems = 'center';
    rightContainer.style.display = 'none';

    // 存储原始子元素用于恢复
    (leftContainer as any)._originalChildren = originalChildren;

    leftContainer.innerHTML = `<div class="weather-loading">${i18n('weather_loading')}</div>`;
}

/**
 * 隐藏天气加载状态，恢复原始子元素
 */
export function hideWeatherLoading(): void {
    const leftContainer = elements.weather.leftContainer;
    const rightContainer = elements.weather.rightContainer;
    if (!leftContainer || !rightContainer) return;

    // 恢复原始子元素
    const originalChildren = (leftContainer as any)._originalChildren as Element[] | undefined;
    if (originalChildren && originalChildren.length > 0) {
        leftContainer.innerHTML = '';
        originalChildren.forEach(child => leftContainer.appendChild(child));
    }

    leftContainer.style.flex = '';
    leftContainer.style.minWidth = '';
    leftContainer.style.textAlign = '';
    leftContainer.style.display = '';
    leftContainer.style.flexDirection = '';
    leftContainer.style.justifyContent = '';
    leftContainer.style.alignItems = '';
    rightContainer.style.display = '';
}

/**
 * 显示天气错误信息
 */
export function showWeatherError(message: string): void {
    const leftContainer = elements.weather.leftContainer;
    const rightContainer = elements.weather.rightContainer;
    if (!leftContainer || !rightContainer) return;

    leftContainer.style.flex = '1';
    leftContainer.style.minWidth = 'auto';
    leftContainer.style.textAlign = 'center';
    leftContainer.style.display = 'flex';
    leftContainer.style.flexDirection = 'column';
    leftContainer.style.justifyContent = 'center';
    leftContainer.style.alignItems = 'center';
    rightContainer.style.display = 'none';

    // 清除之前的内容
    leftContainer.innerHTML = '';
    const errorDiv = document.createElement('div');
    errorDiv.className = 'weather-error';
    errorDiv.style.color = '#ff6b6b';
    errorDiv.textContent = message;
    leftContainer.appendChild(errorDiv);
}
