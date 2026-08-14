/**
 * Card-mode DOM construction for the System Monitor.
 *
 * Extracted from cardRenderer.ts (Card-mode renderer).
 */

import type { SystemMonitorCardDomRefs } from '../../types';

/** 卡片元素类名前缀（update.ts 也复用） */
export const CARD_CLASS = 'sysmon-card';
/** 卡片容器类名 */
export const CONTAINER_CLASS = 'sysmon-cards';

/** 卡片内部结构模板（label / value / extra / meta / sparks） */
function cardInnerHTML(): string {
    return `
        <div class="${CARD_CLASS}__label-row">
            <span class="${CARD_CLASS}__label"></span>
        </div>
        <div class="${CARD_CLASS}__value-row">
            <span class="${CARD_CLASS}__value"></span>
            <span class="${CARD_CLASS}__extra"></span>
            <div class="${CARD_CLASS}__meta"></div>
        </div>
        <div class="${CARD_CLASS}__sparks"></div>
    `;
}

/**
 * Build the card-mode DOM inside the system-monitor parent element.
 * Returns references to all card elements.
 */
export function buildCards(parent: HTMLElement): SystemMonitorCardDomRefs {
    const existing = parent.querySelector<HTMLElement>(`.${CONTAINER_CLASS}`);
    if (existing) existing.remove();

    const container = document.createElement('div');
    container.className = CONTAINER_CLASS;

    const cards = {
        cpu: createCard('cpu'),
        gpu: createCard('gpu'),
        memory: createCard('memory'),
        network: createCard('network'),
        disks: [] as HTMLElement[],
    };

    container.appendChild(cards.cpu);
    container.appendChild(cards.gpu);
    container.appendChild(cards.memory);
    container.appendChild(cards.network);
    parent.appendChild(container);

    return { container, cards, canvases: new Map() };
}

/** Create an empty card element for a known metric. */
function createCard(metric: string): HTMLElement {
    const card = document.createElement('div');
    card.className = `${CARD_CLASS} ${CARD_CLASS}--${metric}`;
    card.dataset.metric = metric;
    card.innerHTML = cardInnerHTML();
    return card;
}

/** Create a disk card element. */
export function createDiskCard(index: number): HTMLElement {
    const card = document.createElement('div');
    card.className = `${CARD_CLASS} ${CARD_CLASS}--disk`;
    card.dataset.metric = `disk${index}`;
    card.dataset.diskIndex = String(index);
    card.innerHTML = cardInnerHTML();
    return card;
}

/**
 * Remove the card-mode DOM from the parent element.
 */
export function destroyCards(parent: HTMLElement): void {
    const container = parent.querySelector<HTMLElement>(`.${CONTAINER_CLASS}`);
    if (container) container.remove();
}
