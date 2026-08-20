/**
 * Tooltip 定位辅助（纯函数）
 * 跟随鼠标移动定位，超出视口时翻转到另一侧并保证不贴边。
 */

import { TOOLTIP_EDGE_OFFSET } from './constants';

export function tooltipPosition(
    e: MouseEvent,
    el: HTMLElement | null
): { left: string; top: string } {
    const w = el?.offsetWidth ?? 0;
    const h = el?.offsetHeight ?? 0;

    let left = e.clientX + TOOLTIP_EDGE_OFFSET;
    let top = e.clientY + TOOLTIP_EDGE_OFFSET;

    if (left + w > window.innerWidth - TOOLTIP_EDGE_OFFSET) {
        left = e.clientX - w - TOOLTIP_EDGE_OFFSET;
    }
    if (top + h > window.innerHeight - TOOLTIP_EDGE_OFFSET) {
        top = e.clientY - h - TOOLTIP_EDGE_OFFSET;
    }
    if (left < TOOLTIP_EDGE_OFFSET) left = TOOLTIP_EDGE_OFFSET;
    if (top < TOOLTIP_EDGE_OFFSET) top = TOOLTIP_EDGE_OFFSET;

    return { left: `${left}px`, top: `${top}px` };
}
