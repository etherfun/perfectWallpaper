/**
 * Card-mode DOM content updates for the System Monitor.
 *
 * Extracted from cardRenderer.ts (Card-mode renderer).
 */

import { globalT } from '@/utils/i18n';

import { formatBytes } from '../../api/formatters';
import type {
    CardPayload,
    CardRenderData,
    SparkChannel,
    SystemMonitorCardDomRefs,
} from '../../types';
import { createDiskCard } from './create';
import { routeSparkCanvas } from './sparks';

const CARD_CLASS = 'sysmon-card';

/**
 * Update all card DOM elements with the latest render data.
 * Draws sparklines via requestAnimationFrame.
 */
export function updateCards(
    refs: SystemMonitorCardDomRefs,
    data: CardRenderData,
    style?: { monitorColor?: string; monitorSize?: number }
): void {
    updateSingleCard(refs.cards.cpu, data.cpu, refs.canvases, style);
    updateSingleCard(refs.cards.gpu, data.gpu, refs.canvases, style);
    updateSingleCard(refs.cards.memory, data.memory, refs.canvases, style);
    updateSingleCard(refs.cards.network, data.network, refs.canvases, style);
    updateDiskCards(refs, data.disks, style);
}

function updateSingleCard(
    cardEl: HTMLElement | null,
    payload: CardPayload | null,
    canvases: Map<string, HTMLCanvasElement>,
    style?: { monitorColor?: string; monitorSize?: number }
): void {
    if (!cardEl) return;
    if (!payload) {
        cardEl.style.display = 'none';
        return;
    }
    cardEl.style.display = '';

    // Apply font color and size from config
    if (style?.monitorColor) cardEl.style.color = style.monitorColor;
    if (style?.monitorSize) cardEl.style.fontSize = `${style.monitorSize}px`;

    // Label
    const labelEl = cardEl.querySelector<HTMLElement>(`.${CARD_CLASS}__label`);
    if (labelEl) labelEl.textContent = payload.label;

    // Value + extra
    const valueEl = cardEl.querySelector<HTMLElement>(`.${CARD_CLASS}__value`);
    const extraEl = cardEl.querySelector<HTMLElement>(`.${CARD_CLASS}__extra`);
    if (valueEl) valueEl.textContent = payload.value;
    if (extraEl) extraEl.textContent = payload.extra ?? '';

    // Meta grid
    const metaEl = cardEl.querySelector<HTMLElement>(`.${CARD_CLASS}__meta`);
    if (metaEl) {
        metaEl.innerHTML = '';
        for (const entry of payload.meta) {
            const span = document.createElement('span');
            span.innerHTML = `${entry.label} <b>${entry.value}</b>`;
            metaEl.appendChild(span);
        }
    }

    // Sparks
    const sparksEl = cardEl.querySelector<HTMLElement>(`.${CARD_CLASS}__sparks`);
    if (!sparksEl) return;

    const metric = cardEl.dataset.metric ?? 'unknown';

    // Keep sysmon-card__sparks for CSS grid display + spark-cell for layout variants
    sparksEl.className = `sysmon-card__sparks spark-cell spark-cell--${payload.sparkLayout}`;
    sparksEl.innerHTML = '';

    for (let i = 0; i < payload.sparks.length; i++) {
        const ch = payload.sparks[i];
        if (!ch) continue;

        const pair = document.createElement('div');
        pair.className = 'spark-pair';

        // Head with label + current value
        const head = document.createElement('div');
        head.className = 'head';
        head.innerHTML = buildSparkHead(ch);
        pair.appendChild(head);

        // Canvas
        const canvas = document.createElement('canvas');
        canvas.className = 'spark';
        canvas.dataset.spark = metric;
        canvas.dataset.kind = ch.kind;
        // Give the canvas an initial fixed size so getBoundingClientRect
        // returns something meaningful even before the first layout pass.
        canvas.width = 180;
        canvas.height = 28;
        canvas.style.width = '100%';
        canvas.style.height = '28px';
        pair.appendChild(canvas);

        sparksEl.appendChild(pair);

        const key = `${metric}.${ch.kind}`;
        canvases.set(key, canvas);

        // Defer sparkline drawing to next frame so the canvas is laid out
        requestAnimationFrame(() => routeSparkCanvas(canvas, ch));
    }
}

function buildSparkHead(ch: SparkChannel): string {
    const { kind, displayValue, tag, range } = ch;
    const display = displayValue ?? '--';

    switch (kind) {
        case 'util':
            return `<span>${globalT('sysmon_card_util')} <b>${display}</b>${tag ? tagHtml(tag) : ''}</span><span class="axis">${globalT('sysmon_card_axis_util')}</span>`;
        case 'temp': {
            const rangeStr = range ? `${range.lo}–${range.hi}°C` : '';
            return `<span>${globalT('sysmon_card_temp')} <b>${display}</b>${tag ? tagHtml(tag) : ''}</span><span class="axis">${rangeStr}</span>`;
        }
        case 'power':
            return `<span>${globalT('sysmon_card_power')} <b>${display}</b>${tag ? tagHtml(tag) : ''}</span><span class="axis">${globalT('sysmon_card_axis_power')}</span>`;
        case 'vram':
            return `<span>${globalT('sysmon_card_vram')} <b>${display}</b></span><span class="axis">${globalT('sysmon_card_axis_util')}</span>`;
        case 'read': {
            const rangeStr = range ? `0–${formatBytes(range.hi)}/s` : '';
            return `<span>${globalT('sysmon_card_read')} <b>${display}</b></span><span class="axis">${rangeStr}</span>`;
        }
        case 'write': {
            const rangeStr = range ? `0–${formatBytes(range.hi)}/s` : '';
            return `<span>${globalT('sysmon_card_write')} <b>${display}</b></span><span class="axis">${rangeStr}</span>`;
        }
        case 'activity':
            return `<span>${globalT('sysmon_card_activity')} <b>${display}</b>${tag ? tagHtml(tag) : ''}</span><span class="axis">${globalT('sysmon_card_axis_activity')}</span>`;
        case 'rx':
            return `<span class="dir-rx">${globalT('sysmon_card_rx')} <b>${display}</b></span>`;
        case 'tx':
            return `<span class="dir-tx">${globalT('sysmon_card_tx')} <b>${display}</b></span>`;
        case 'rx-tx':
            return `<span><span class="dir-rx">${globalT('sysmon_card_rx')} <b>${display}</b></span> &nbsp; <span class="dir-tx">${globalT('sysmon_card_tx')} <b>${ch.dirTxDisplay ?? display}</b></span></span><span class="axis">${globalT('sysmon_card_axis_last_2_min')}</span>`;
        default:
            return `<span>${kind} <b>${display}</b></span>`;
    }
}

function tagHtml(text: string): string {
    return ` <span class="tag">${escapeHtml(text)}</span>`;
}

function escapeHtml(s: string): string {
    return s
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

function updateDiskCards(
    refs: SystemMonitorCardDomRefs,
    disks: CardPayload[],
    style?: { monitorColor?: string; monitorSize?: number }
): void {
    // Remove old disk cards
    for (const card of refs.cards.disks) {
        card.remove();
    }
    refs.cards.disks = [];

    // Create + update new disk cards (appended after network card)
    const anchor = refs.cards.network;
    for (let i = 0; i < disks.length; i++) {
        const disk = disks[i];
        if (!disk) continue;
        const cardEl = createDiskCard(i);
        if (anchor?.nextSibling) {
            refs.container.insertBefore(cardEl, anchor.nextSibling);
        } else {
            refs.container.appendChild(cardEl);
        }
        refs.cards.disks.push(cardEl);
        updateSingleCard(cardEl, disk, refs.canvases, style);
    }
}
