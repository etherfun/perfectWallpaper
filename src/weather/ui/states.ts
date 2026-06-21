/**
 * 天气 UI 状态函数
 * 职责：控制天气加载、错误等 UI 状态
 */

import { globalT } from '@/i18n';

import { elements } from '../../utils/elementManager';

const weatherChildrenStore = new WeakMap<HTMLElement, Element[]>();

function saveOriginalChildren(container: HTMLElement): void {
    if (!weatherChildrenStore.has(container)) {
        weatherChildrenStore.set(container, Array.from(container.children));
    }
}

function getOriginalChildren(container: HTMLElement): Element[] | undefined {
    return weatherChildrenStore.get(container);
}

/**
 * 显示天气加载状态
 */
export function showWeatherLoading(): void {
    const leftContainer = elements.weather.leftContainer;
    const rightContainer = elements.weather.rightContainer;
    if (!leftContainer || !rightContainer) return;

    saveOriginalChildren(leftContainer);

    leftContainer.style.flex = '1';
    leftContainer.style.minWidth = 'auto';
    leftContainer.style.textAlign = 'center';
    leftContainer.style.display = 'flex';
    leftContainer.style.flexDirection = 'column';
    leftContainer.style.justifyContent = 'center';
    leftContainer.style.alignItems = 'center';
    rightContainer.classList.add('hidden');

    leftContainer.innerHTML = `<div class="weather-loading">${globalT('weather_loading')}</div>`;
}

/**
 * 隐藏天气加载状态，恢复原始子元素
 */
export function hideWeatherLoading(): void {
    const leftContainer = elements.weather.leftContainer;
    const rightContainer = elements.weather.rightContainer;
    if (!leftContainer || !rightContainer) return;

    const originalChildren = getOriginalChildren(leftContainer);
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
    rightContainer.classList.remove('hidden');
}

/**
 * 显示天气错误信息
 */
export function showWeatherError(message: string): void {
    const leftContainer = elements.weather.leftContainer;
    const rightContainer = elements.weather.rightContainer;
    if (!leftContainer || !rightContainer) return;

    saveOriginalChildren(leftContainer);

    leftContainer.style.flex = '1';
    leftContainer.style.minWidth = 'auto';
    leftContainer.style.textAlign = 'center';
    leftContainer.style.display = 'flex';
    leftContainer.style.flexDirection = 'column';
    leftContainer.style.justifyContent = 'center';
    leftContainer.style.alignItems = 'center';
    rightContainer.classList.add('hidden');

    leftContainer.innerHTML = '';
    const errorDiv = document.createElement('div');
    errorDiv.className = 'weather-error';
    errorDiv.style.color = '#ff6b6b';
    errorDiv.textContent = message;
    leftContainer.appendChild(errorDiv);
}
