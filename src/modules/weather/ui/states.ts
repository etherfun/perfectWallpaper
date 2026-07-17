/**
 * 澶╂皵 UI 鐘舵€佸嚱鏁?
 * 鑱岃矗锛氭帶鍒跺ぉ姘斿姞杞姐€侀敊璇瓑 UI 鐘舵€?
 */

import { globalT } from '@/utils/i18n';

import { elements } from '../../../utils/elementManager';

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
 * 鏄剧ず澶╂皵鍔犺浇鐘舵€?
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
 * 闅愯棌澶╂皵鍔犺浇鐘舵€侊紝鎭㈠鍘熷瀛愬厓绱?
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
 * 鏄剧ず澶╂皵閿欒淇℃伅
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
