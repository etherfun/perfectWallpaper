/**
 * Tooltip 共享定位 / 隐藏逻辑（alert.ts 与 sevenHourly.ts 共用）
 */

import { TOOLTIP_EDGE_OFFSET } from '../constants';

/**
 * 跟随鼠标移动定位 tooltip：默认显示在鼠标右下 20px，
 * 超出视口时翻转到另一侧，并保证不贴边。
 */
export function positionTooltip(tooltip: HTMLElement, mouseEvent: MouseEvent): void {
    const tipWidth = tooltip.offsetWidth;
    const tipHeight = tooltip.offsetHeight;

    let left = mouseEvent.clientX + TOOLTIP_EDGE_OFFSET;
    let top = mouseEvent.clientY + TOOLTIP_EDGE_OFFSET;

    if (left + tipWidth > window.innerWidth - TOOLTIP_EDGE_OFFSET) {
        left = mouseEvent.clientX - tipWidth - TOOLTIP_EDGE_OFFSET;
    }
    if (top + tipHeight > window.innerHeight - TOOLTIP_EDGE_OFFSET) {
        top = mouseEvent.clientY - tipHeight - TOOLTIP_EDGE_OFFSET;
    }

    if (left < TOOLTIP_EDGE_OFFSET) left = TOOLTIP_EDGE_OFFSET;
    if (top < TOOLTIP_EDGE_OFFSET) top = TOOLTIP_EDGE_OFFSET;

    tooltip.style.left = `${left}px`;
    tooltip.style.top = `${top}px`;
}

/**
 * 延迟隐藏 tooltip：等待 delayMs 后若仍未重新显示（show class 已移除）则
 * 隐藏 DOM，避免鼠标短暂离开再移回时闪烁。onHidden 在真正隐藏时回调。
 */
export function hideTooltipAfter(
    tooltip: HTMLElement,
    delayMs: number,
    onHidden?: () => void
): void {
    setTimeout(() => {
        if (!tooltip.classList.contains('show')) {
            tooltip.style.display = 'none';
            onHidden?.();
        }
    }, delayMs);
}
