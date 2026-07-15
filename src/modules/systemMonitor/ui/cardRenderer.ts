/**
 * Card-mode renderer for the System Monitor.
 *
 * When `displayStyle === 'cards'`, the existing compact rows are replaced
 * with rich cards that show a large primary value, a meta info grid, and
 * multiple sparkline canvases.
 *
 * Architecture mirror: sysmon-card-preview.html (Style D — Stacked List)
 *
 * Each card is a `.sysmon-card` element with the structure:
 *   .sysmon-card
 *     .sysmon-card__label-row  → metric label (e.g. "CPU · AMD Ryzen 9 7845HX")
 *     .sysmon-card__value-row  → value + extra (e.g. "13%" "(89°C)")
 *     .sysmon-card__meta       → info grid (e.g. "Freq 5065 MHz")
 *     .sysmon-card__sparks     → sparkline area (spark-pair × N)
 *       .spark-pair
 *         .head                → label + current value + axis
 *         canvas.spark         → the sparkline canvas
 */

import { globalT } from '@/i18n';

import { formatBytes, getColorForValue } from '../api/formatters';
import { MAX_HISTORY_LENGTH } from '../constants';
import type {
    CardPayload,
    CardRenderData,
    SparkChannel,
    SystemMonitorCardDomRefs,
    TempRange,
} from '../types';

// ─── Color palette ────────────────────────────────────────────────
const RX_RGB = '110,168,255';
const TX_RGB = '255,167,38';

const TEMP_GREEN = '76,175,80';
const TEMP_AMBER = '255,193,7';
const TEMP_RED = '244,67,54';

function tempColor(celsius: number, range: TempRange): string {
    const ratio = (celsius - range.lo) / (range.hi - range.lo);
    if (ratio < 0.5) return `rgba(${TEMP_GREEN},0.95)`;
    if (ratio < 0.75) return `rgba(${TEMP_AMBER},0.95)`;
    return `rgba(${TEMP_RED},0.95)`;
}

/**
 * Convert a value to a threshold-based color using the same
 * green/yellow/red scale as getColorForValue.
 */
function valueToColor(value: number, alpha = 1): string {
    return getColorForValue(value, alpha);
}

/**
 * Compute per-segment colors from a history array.
 * Each segment runs from history[i] to history[i+1]; the color
 * is determined by the END value of the segment (history[i+1]).
 * Returns history.length - 1 colors.
 */
function toSegmentColors(history: number[], getColor: (v: number) => string): string[] {
    const colors: string[] = [];
    for (let i = 0; i < history.length - 1; i++) {
        colors.push(getColor(history[i + 1]!));
    }
    return colors;
}

/**
 * Draw a smooth overdraw stroke: a thick low-opacity base line followed
 * by the normal-width line on top. Creates a natural gradient-like blend
 * at segment boundaries without hard color jumps.
 */
function drawSmoothStroke(
    ctx: CanvasRenderingContext2D,
    pts: [number, number][],
    getColor: (i: number) => string,
    lineWidth = 1.5,
    baseWidth = 4
): void {
    // Soft base — wide, low-opacity, screen blend for smooth transitions
    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    for (let i = 0; i < pts.length - 1; i++) {
        const [x0, y0] = pts[i]!;
        const [x1, y1] = pts[i + 1]!;
        ctx.beginPath();
        ctx.moveTo(x0, y0);
        ctx.lineTo(x1, y1);
        ctx.lineWidth = baseWidth;
        ctx.strokeStyle = getColor(i + 1);
        ctx.globalAlpha = 0.18;
        ctx.stroke();
    }
    ctx.restore();

    // Main crisp line on top
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    for (let i = 0; i < pts.length - 1; i++) {
        const [x0, y0] = pts[i]!;
        const [x1, y1] = pts[i + 1]!;
        ctx.beginPath();
        ctx.moveTo(x0, y0);
        ctx.lineTo(x1, y1);
        ctx.lineWidth = lineWidth;
        ctx.strokeStyle = getColor(i + 1);
        ctx.stroke();
    }
}

// ─── Canvas helpers ───────────────────────────────────────────────

function setupCanvas(canvas: HTMLCanvasElement): CanvasRenderingContext2D | null {
    const dpr = (typeof window !== 'undefined' && window.devicePixelRatio) || 1;
    const rect = canvas.getBoundingClientRect();
    const w = Math.max(1, Math.round(rect.width));
    const h = Math.max(1, Math.round(rect.height));
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, w, h);
    return ctx;
}

function canvasSize(canvas: HTMLCanvasElement): { w: number; h: number } {
    const rect = canvas.getBoundingClientRect();
    return {
        w: Math.max(1, Math.round(rect.width)),
        h: Math.max(1, Math.round(rect.height)),
    };
}

function sparkStep(w: number): number {
    return w / (MAX_HISTORY_LENGTH - 1);
}

function sparkStartX(w: number, len: number): number {
    return w - (len - 1) * sparkStep(w);
}

function drawBaseline(ctx: CanvasRenderingContext2D, w: number, h: number): void {
    ctx.save();
    ctx.strokeStyle = 'rgba(255,255,255,0.18)';
    ctx.lineWidth = 1;
    ctx.setLineDash([2, 2]);
    ctx.beginPath();
    ctx.moveTo(0, h - 0.5);
    ctx.lineTo(w, h - 0.5);
    ctx.stroke();
    ctx.restore();
}

// ─── Sparkline drawing functions ──────────────────────────────────

/**
 * Standard 0-100% sparkline with area fill and end dot.
 * Mirrors renderer.ts drawCurveInto.
 */
function drawUtilSpark(canvas: HTMLCanvasElement, history: number[]): void {
    if (history.length < 2) return;
    const ctx = setupCanvas(canvas);
    if (!ctx) return;
    const { w, h } = canvasSize(canvas);

    const lastValue = history[history.length - 1] ?? 0;
    const fillColor = getColorForValue(lastValue, 0.3);
    const segmentColors = toSegmentColors(history, v => getColorForValue(v, 0.95));

    drawBaseline(ctx, w, h);
    drawCurvePath(ctx, history, w, h, fillColor, segmentColors);
}

/**
 * Temperature sparkline. History values are in degrees Celsius,
 * mapped to the canvas Y axis via [lo, hi]. A critical threshold
 * line is drawn in dashed red.
 */
function drawTempSpark(canvas: HTMLCanvasElement, historyC: number[], range: TempRange): void {
    if (historyC.length < 2) return;
    const ctx = setupCanvas(canvas);
    if (!ctx) return;
    const { w, h } = canvasSize(canvas);
    const { lo, hi, crit } = range;

    const toY = (c: number): number => {
        const t = (c - lo) / (hi - lo);
        return h - Math.max(0, Math.min(1, t)) * h;
    };

    // Critical reference line (dashed red)
    if (crit >= lo && crit <= hi) {
        const yc = toY(crit);
        ctx.save();
        ctx.strokeStyle = 'rgba(244,67,54,0.55)';
        ctx.lineWidth = 1;
        ctx.setLineDash([3, 3]);
        ctx.beginPath();
        ctx.moveTo(0, yc);
        ctx.lineTo(w, yc);
        ctx.stroke();
        ctx.restore();
    }

    const lastC = historyC[historyC.length - 1] ?? lo;
    const stroke = tempColor(lastC, range);
    const fill = stroke.replace('0.95', '0.3');

    drawBaseline(ctx, w, h);

    const step = sparkStep(w);
    const startX = sparkStartX(w, historyC.length);
    const lastX = startX + (historyC.length - 1) * step;

    // Area
    ctx.beginPath();
    ctx.moveTo(startX, h);
    historyC.forEach((c, i) => ctx.lineTo(startX + i * step, toY(c)));
    ctx.lineTo(lastX, h);
    ctx.closePath();
    const grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, fill);
    grad.addColorStop(1, 'transparent');
    ctx.fillStyle = grad;
    ctx.fill();

    // Stroke
    ctx.beginPath();
    historyC.forEach((c, i) => {
        const x = startX + i * step;
        const y = toY(c);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
    });
    ctx.lineWidth = 1.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = stroke;
    ctx.stroke();

    // End dot
    ctx.beginPath();
    ctx.arc(lastX, toY(lastC), 1.8, 0, Math.PI * 2);
    ctx.fillStyle = stroke;
    ctx.fill();
}

/**
 * Power / throughput sparkline. Values are normalized against their
 * local peak so the trace fills the canvas height.
 */
function drawNormalizedSpark(canvas: HTMLCanvasElement, historyValues: number[]): void {
    if (historyValues.length < 2) return;
    const peak = Math.max(1, ...historyValues);
    const normalized = historyValues.map(v => (v / peak) * 100);

    const ctx = setupCanvas(canvas);
    if (!ctx) return;
    const { w, h } = canvasSize(canvas);

    const lastValue = normalized[normalized.length - 1] ?? 0;
    const fillColor = getColorForValue(lastValue, 0.3);
    const segmentColors = toSegmentColors(normalized, v => getColorForValue(v, 0.95));

    drawBaseline(ctx, w, h);
    drawCurvePath(ctx, normalized, w, h, fillColor, segmentColors);
}

/**
 * Single-direction throughput sparkline (rx or tx).
 * Colored blue (rx) or amber (tx).
 */
function drawNetDirectionSpark(
    canvas: HTMLCanvasElement,
    historyBps: number[],
    dir: 'rx' | 'tx'
): void {
    if (historyBps.length < 2) return;
    const ctx = setupCanvas(canvas);
    if (!ctx) return;
    const { w, h } = canvasSize(canvas);
    const rgb = dir === 'rx' ? RX_RGB : TX_RGB;

    const peak = Math.max(1, ...historyBps);
    const toY = (bps: number) => h - (bps / peak) * h;
    const step = sparkStep(w);
    const startX = sparkStartX(w, historyBps.length);
    const lastX = startX + (historyBps.length - 1) * step;

    drawBaseline(ctx, w, h);

    // Area
    ctx.beginPath();
    ctx.moveTo(startX, h);
    historyBps.forEach((bps, i) => ctx.lineTo(startX + i * step, toY(bps)));
    ctx.lineTo(lastX, h);
    ctx.closePath();
    const grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, `rgba(${rgb},0.3)`);
    grad.addColorStop(1, 'transparent');
    ctx.fillStyle = grad;
    ctx.fill();

    // Single-color stroke with fixed rgb
    ctx.beginPath();
    historyBps.forEach((bps, i) => {
        const x = startX + i * step;
        const y = toY(bps);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
    });
    ctx.strokeStyle = `rgb(${rgb})`;
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // End dot — fixed color
    const lastBps = historyBps[historyBps.length - 1] ?? 0;
    ctx.beginPath();
    ctx.arc(lastX, toY(lastBps), 1.8, 0, Math.PI * 2);
    ctx.fillStyle = `rgb(${rgb})`;
    ctx.fill();
}

/** "No data" placeholder — diagonal hatch + N/A label. */
function drawEmptySpark(canvas: HTMLCanvasElement): void {
    const ctx = setupCanvas(canvas);
    if (!ctx) return;
    const { w, h } = canvasSize(canvas);

    ctx.fillStyle = 'rgba(255,255,255,0.03)';
    ctx.fillRect(0, 0, w, h);

    ctx.save();
    ctx.strokeStyle = 'rgba(255,255,255,0.10)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let x = -h; x < w; x += 6) {
        ctx.moveTo(x, h);
        ctx.lineTo(x + h, 0);
    }
    ctx.stroke();
    ctx.restore();

    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    ctx.font = 'italic 10px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('N/A', w / 2, h / 2);
}

/**
 * Combined rx+tx throughput sparkline overlaid on a single canvas.
 * Each direction uses its own peak for normalization so both are clearly
 * visible regardless of magnitude difference. Areas use 'screen' blend mode
 * so overlapping regions remain legible.
 */
function drawRxTxCombinedSpark(
    canvas: HTMLCanvasElement,
    historyRx: number[],
    historyTx: number[]
): void {
    if (historyRx.length < 2 && historyTx.length < 2) return;
    const ctx = setupCanvas(canvas);
    if (!ctx) return;
    const { w, h } = canvasSize(canvas);

    const peakRx = Math.max(1, ...historyRx);
    const peakTx = Math.max(1, ...historyTx);

    const step = sparkStep(w);
    const len = Math.max(historyRx.length, historyTx.length);
    const startX = w - (len - 1) * step;
    const lastX = startX + (len - 1) * step;

    drawBaseline(ctx, w, h);

    // Helper to draw one direction's curve with its own peak scale
    const drawDir = (
        history: number[],
        peak: number,
        rgb: string,
        alpha: number,
        lineWidth: number
    ) => {
        if (history.length < 2) return;
        const toY = (bps: number) => h - (bps / peak) * h;

        // Area — use screen blend mode so overlapping rx+tx both show
        const grad = ctx!.createLinearGradient(0, 0, 0, h);
        grad.addColorStop(0, `rgba(${rgb},${alpha})`);
        grad.addColorStop(1, 'transparent');
        ctx!.save();
        ctx!.globalCompositeOperation = 'screen';
        ctx!.beginPath();
        ctx!.moveTo(startX, h);
        history.forEach((v, i) => ctx!.lineTo(startX + i * step, toY(v)));
        ctx!.lineTo(lastX, h);
        ctx!.closePath();
        ctx!.fillStyle = grad;
        ctx!.fill();
        ctx!.restore();

        // Single-color stroke for this direction
        ctx!.beginPath();
        history.forEach((v, i) => {
            const x = startX + i * step;
            const y = toY(v);
            if (i === 0) ctx!.moveTo(x, y);
            else ctx!.lineTo(x, y);
        });
        ctx!.strokeStyle = `rgba(${rgb},0.9)`;
        ctx!.lineWidth = lineWidth;
        ctx!.stroke();

        // End dot — fixed color
        const lastV = history[history.length - 1] ?? 0;
        ctx!.beginPath();
        ctx!.arc(lastX, toY(lastV), 2, 0, Math.PI * 2);
        ctx!.fillStyle = `rgba(${rgb},0.9)`;
        ctx!.fill();
    };

    drawDir(historyRx, peakRx, RX_RGB, 0.25, 1.5);
    drawDir(historyTx, peakTx, TX_RGB, 0.25, 1.5);
}

/**
 * Internal: draw a 0-100% curve path with area, stroke, and end dot.
 * Shared by drawUtilSpark and drawNormalizedSpark (after normalization).
 *
 * When `segmentColors` is provided, each line segment is drawn with its
 * own color (green < 50%, yellow 50-80%, red >= 80%). Otherwise the
 * whole stroke uses `strokeColor`.
 */
function drawCurvePath(
    ctx: CanvasRenderingContext2D,
    history: number[],
    w: number,
    h: number,
    fillColor: string,
    segmentColors?: string[]
): void {
    const step = sparkStep(w);
    const startX = sparkStartX(w, history.length);
    const lastX = startX + (history.length - 1) * step;
    const lastValue = history[history.length - 1] ?? 0;

    // Area fill — gradient based on last value's color
    ctx.beginPath();
    ctx.moveTo(startX, h);
    history.forEach((value, i) => {
        ctx.lineTo(startX + i * step, h - (value / 100) * h);
    });
    ctx.lineTo(lastX, h);
    ctx.closePath();
    const grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, fillColor);
    grad.addColorStop(1, 'transparent');
    ctx.fillStyle = grad;
    ctx.fill();

    // Stroke — per-segment coloring when segmentColors is provided
    if (segmentColors) {
        const pts: [number, number][] = history.map((v, i) => [
            startX + i * step,
            h - (v / 100) * h,
        ]);
        drawSmoothStroke(ctx, pts, i => segmentColors[i] ?? fillColor, 1.5, 4);
    } else {
        ctx.beginPath();
        history.forEach((value, i) => {
            const x = startX + i * step;
            const y = h - (value / 100) * h;
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        });
        ctx.lineWidth = 1.5;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.strokeStyle = fillColor;
        ctx.stroke();
    }

    // End dot — color based on last value
    const lastColor = segmentColors
        ? (segmentColors[segmentColors.length - 1] ?? fillColor)
        : fillColor;
    ctx.beginPath();
    ctx.arc(lastX, h - (lastValue / 100) * h, 1.8, 0, Math.PI * 2);
    ctx.fillStyle = lastColor;
    ctx.fill();
}

// ─── Sparkline routing ────────────────────────────────────────────

function routeSparkCanvas(canvas: HTMLCanvasElement, channel: SparkChannel): void {
    const { kind, history, range } = channel;
    if (history.length === 0) {
        drawEmptySpark(canvas);
        return;
    }
    switch (kind) {
        case 'activity':
        case 'util':
            drawUtilSpark(canvas, history);
            break;
        case 'temp':
            drawTempSpark(canvas, history, range ?? { lo: 30, hi: 100, crit: 90 });
            break;
        case 'power':
        case 'read':
        case 'write':
            drawNormalizedSpark(canvas, history);
            break;
        case 'rx':
            drawNetDirectionSpark(canvas, history, 'rx');
            break;
        case 'tx':
            drawNetDirectionSpark(canvas, history, 'tx');
            break;
        case 'rx-tx':
            drawRxTxCombinedSpark(canvas, history, channel.dirRx ?? []);
            break;
    }
}

// ─── Card DOM ─────────────────────────────────────────────────────

const CARD_CLASS = 'sysmon-card';
const CONTAINER_CLASS = 'sysmon-cards';

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
    card.innerHTML = `
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
    return card;
}

/** Create a disk card element. */
function createDiskCard(index: number): HTMLElement {
    const card = document.createElement('div');
    card.className = `${CARD_CLASS} ${CARD_CLASS}--disk`;
    card.dataset.metric = `disk${index}`;
    card.dataset.diskIndex = String(index);
    card.innerHTML = `
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
    return card;
}

/**
 * Remove the card-mode DOM from the parent element.
 */
export function destroyCards(parent: HTMLElement): void {
    const container = parent.querySelector<HTMLElement>(`.${CONTAINER_CLASS}`);
    if (container) container.remove();
}

// ─── Card content update ──────────────────────────────────────────

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
    const display = displayValue ?? '—';

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
