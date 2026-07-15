import { getColorForValue } from '../api/formatters';
import { MAX_HISTORY_LENGTH } from '../constants';

/**
 * Pure functions that update the visual representation of monitor rows.
 *
 * The DOM contract is fixed in `index.html`:
 *   <div class="sysmon-row" data-metric="...">
 *       <div class="sysmon-text">
 *           <span class="sysmon-label">…</span>           <!-- cpu/gpu/memory only -->
 *           <span class="sysmon-value">…</span>          <!-- cpu/gpu/memory only -->
 *           <span class="sysmon-extra">…</span>          <!-- cpu/gpu/memory only -->
 *           <span class="sysmon-net sysmon-net-down">…</span> <!-- network only -->
 *           <span class="sysmon-net sysmon-net-up">…</span>   <!-- network only -->
 *       </div>
 *       <div class="sysmon-viz"></div>                   <!-- bar / curve go here -->
 *   </div>
 *
 * SCSS owns the placement of label vs value vs bar/curve (via the
 * `sysmon-row--curve` modifier class on the row and `sysmon-viz--bar` /
 * `sysmon-viz--curve` modifier classes on the viz slot). The renderer
 * only writes text into existing slots and creates/removes bar / canvas
 * children of `.sysmon-viz`.
 */

export type HistoryType = 'cpu' | 'gpu' | 'memory';
export type DisplayMode = 'text' | 'curve' | 'bar' | 'none';
export type Metric = 'cpu' | 'gpu' | 'memory' | 'network';

/** Payload describing the textual and numeric content of a row. */
export interface RowPayload {
    /** Primary numeric value 0–100 (drives bar width / curve color).
     *  Required for cpu/gpu/memory rows. Network rows can omit it because
     *  they expose two values (rx/tx) instead of a single one. */
    value?: number;
    /** Optional secondary text shown next to the value (e.g. "56°C"). */
    extra?: string;
    /** Network only: download text (e.g. "↓ 382.5 B/s"). */
    netRx?: string;
    /** Network only: upload text (e.g. "↑ 902.5 B/s"). */
    netTx?: string;
    /** Network only: download bar percentage 0–100. */
    netRxPct?: number;
    /** Network only: upload bar percentage 0–100. */
    netTxPct?: number;
}

/** Append a value to a rolling history buffer, capped at MAX_HISTORY_LENGTH. */
export function pushHistory(history: number[], value: number): void {
    history.push(value);
    if (history.length > MAX_HISTORY_LENGTH) {
        history.shift();
    }
}

/**
 * Clear any visualization (canvas, bar, dual-bar) currently inside the row's
 * `.sysmon-viz` slot. Uses a `while` loop instead of `innerHTML = ''` so
 * event listeners (e.g. canvas-bound ResizeObservers) are torn down cleanly
 * across all browsers and test environments.
 */
function clearViz(row: HTMLElement): void {
    const viz = row.querySelector<HTMLElement>('.sysmon-viz');
    if (!viz) return;
    while (viz.firstChild) {
        viz.removeChild(viz.firstChild);
    }
}

/**
 * Set the simple-row textual content: `<value>%` plus an optional `(extra)`.
 * The HTML defines a `.sysmon-value` and `.sysmon-extra` slot inside
 * `.sysmon-text`; we only update the text, never the structure.
 */
function writeSimpleText(row: HTMLElement, value: number, extra: string | undefined): void {
    const valueEl = row.querySelector('.sysmon-value');
    const extraEl = row.querySelector('.sysmon-extra');
    if (valueEl) valueEl.textContent = `${value}%`;
    if (extraEl) extraEl.textContent = extra ? `(${extra})` : '';
}

/** Set the network-row textual content: `↓ rx  ↑ tx`. */
function writeNetworkText(row: HTMLElement, rx: string, tx: string): void {
    const downEl = row.querySelector('.sysmon-net-down');
    const upEl = row.querySelector('.sysmon-net-up');
    if (downEl) downEl.textContent = `↓${rx}`;
    if (upEl) upEl.textContent = `↑${tx}`;
}

/**
 * Render a single fill bar into a viz container.
 * `cls` lets callers (e.g. network) customize the fill class.
 */
function makeBar(fillPct: number, fillClass = 'sysmon-bar-fill'): HTMLElement {
    const clamped = Math.max(0, Math.min(100, fillPct));
    const track = document.createElement('div');
    track.className = 'sysmon-bar';
    const fill = document.createElement('div');
    fill.className = fillClass;
    fill.style.width = `${clamped}%`;
    fill.style.background = getColorForValue(clamped);
    track.appendChild(fill);
    return track;
}

/**
 * Draw a single-line curve into a fresh <canvas> child of `parent`.
 * Returns the canvas (or null if there's not enough history to plot a curve).
 *
 * Layout: the curve spans the FULL width of the canvas, with the most
 * recent data point pinned to the right edge. We scale the x-step so that
 * `MAX_HISTORY_LENGTH` samples would fill the canvas — this keeps the
 * curve readable at any history length, not just at full buffer.
 *
 * Visual aids for legibility:
 *   - a dashed baseline at the bottom (0%) so the user can read the
 *     0–100% scale at a glance
 *   - a subtle area fill below the curve, fading to transparent
 *   - round line caps and joins so the polyline looks smooth even when
 *     samples are sparse
 *   - DPR-aware pixel sizing so the curve stays crisp on HiDPI screens
 */
function drawCurveInto(parent: HTMLElement, history: number[]): HTMLCanvasElement | null {
    if (history.length < 2) {
        // Not enough data points to plot a meaningful curve yet — skip
        // creating the canvas so the viz slot stays clean.
        return null;
    }

    const canvas = document.createElement('canvas');
    parent.appendChild(canvas);

    // Read the parent slot's actual layout size (the SCSS side gives
    // `.sysmon-viz` a fixed width/height). We fall back to a sensible
    // default if the element isn't laid out yet (e.g. test environments
    // without a real viewport).
    const rect = parent.getBoundingClientRect();
    const cssWidth = Math.max(1, Math.round(rect.width) || 80);
    const cssHeight = Math.max(1, Math.round(rect.height) || 24);

    const dpr = (typeof window !== 'undefined' && window.devicePixelRatio) || 1;
    canvas.width = Math.round(cssWidth * dpr);
    canvas.height = Math.round(cssHeight * dpr);
    canvas.style.width = `${cssWidth}px`;
    canvas.style.height = `${cssHeight}px`;

    const ctx = canvas.getContext('2d');
    if (!ctx) return canvas;
    ctx.scale(dpr, dpr);

    const w = cssWidth;
    const h = cssHeight;
    const lastValue = history[history.length - 1] ?? 0;
    const stroke = getColorForValue(lastValue);
    const fill = getColorForValue(lastValue, 0.3);

    // ---- Baseline (subtle dashed line at 0%) ---------------------
    ctx.save();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.18)';
    ctx.lineWidth = 1;
    ctx.setLineDash([2, 2]);
    ctx.beginPath();
    ctx.moveTo(0, h - 0.5);
    ctx.lineTo(w, h - 0.5);
    ctx.stroke();
    ctx.restore();

    // ---- Curve geometry ------------------------------------------
    // `step` is the per-sample x spacing assuming the buffer were full.
    // `startX` pins the latest sample to the right edge and lets earlier
    // samples extend leftward from there. This makes the curve visibly
    // grow toward the left as more data comes in, while the right edge
    // always tracks the live value.
    const step = w / (MAX_HISTORY_LENGTH - 1);
    const startX = w - (history.length - 1) * step;

    // ---- Area fill (drawn first so the stroke sits on top) ------
    ctx.beginPath();
    ctx.moveTo(startX, h);
    history.forEach((value, index) => {
        const x = startX + index * step;
        const y = h - (value / 100) * h;
        ctx.lineTo(x, y);
    });
    const lastX = startX + (history.length - 1) * step;
    ctx.lineTo(lastX, h);
    ctx.closePath();
    const gradient = ctx.createLinearGradient(0, 0, 0, h);
    gradient.addColorStop(0, fill);
    gradient.addColorStop(1, 'transparent');
    ctx.fillStyle = gradient;
    ctx.fill();

    // ---- Stroke --------------------------------------------------
    ctx.beginPath();
    history.forEach((value, index) => {
        const x = startX + index * step;
        const y = h - (value / 100) * h;
        if (index === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
    });
    ctx.lineWidth = 1.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = stroke;
    ctx.stroke();

    // ---- End-point dot (current value marker) -------------------
    ctx.beginPath();
    ctx.arc(lastX, h - (lastValue / 100) * h, 1.8, 0, Math.PI * 2);
    ctx.fillStyle = stroke;
    ctx.fill();

    return canvas;
}

/**
 * Render a metric row. Works for cpu / gpu / memory (simple) and network.
 *
 * - `text` mode: writes value/extra (or rx/tx for network) into existing slots.
 * - `bar` mode: writes text + adds a fill bar to the viz slot.
 *   For network, a stacked rx-over-tx bar is drawn.
 * - `curve` mode: writes text + draws a curve canvas into the viz slot.
 *   For network, two curves are drawn (rx above, tx below).
 * - `none` / default: hides the row.
 */
export function renderRow(
    row: HTMLElement | null,
    payload: RowPayload,
    mode: DisplayMode,
    history: number[]
): void {
    if (!row) return;

    const isNetwork = row.dataset.metric === 'network';

    // Text content is always refreshed so the user sees current values,
    // regardless of which visualization is in front.
    if (isNetwork) {
        writeNetworkText(row, payload.netRx ?? '0 B/s', payload.netTx ?? '0 B/s');
    } else {
        // Simple rows always have a value; default to 0 if a caller forgot.
        writeSimpleText(row, payload.value ?? 0, payload.extra);
    }

    clearViz(row);

    const viz = row.querySelector<HTMLElement>('.sysmon-viz');
    if (!viz) return;

    if (mode === 'text' || mode === 'none') {
        if (mode === 'none') {
            row.style.display = 'none';
        } else {
            row.style.display = '';
        }
        // Drop the mode-driven layout classes on the row and viz slot so
        // the layout collapses back to the default column (text on top,
        // bar slot below). The viz slot itself still has its reserved
        // 6px height from SCSS, so toggling text ↔ bar doesn't reflow
        // neighboring rows.
        row.classList.remove('sysmon-row--curve');
        viz.classList.remove('sysmon-viz--bar', 'sysmon-viz--curve');
        return;
    }

    row.style.display = '';

    // Mark the row + viz slot with mode-driven modifier classes:
    //   - `sysmon-row--curve` switches the row from column to row, so the
    //     viz (first child) sits on the left and the text sits on the right.
    //   - `sysmon-viz--curve` on the viz slot grows its height to 24px.
    //   - `sysmon-viz--bar` is a no-op height-wise (the slot is already
    //     6px tall) but is kept for symmetry / future use.
    row.classList.toggle('sysmon-row--curve', mode === 'curve');
    viz.classList.toggle('sysmon-viz--bar', mode === 'bar');
    viz.classList.toggle('sysmon-viz--curve', mode === 'curve');

    if (mode === 'bar') {
        if (isNetwork) {
            viz.appendChild(makeBar(payload.netRxPct ?? 0, 'sysmon-bar-fill sysmon-bar-fill--rx'));
            viz.appendChild(makeBar(payload.netTxPct ?? 0, 'sysmon-bar-fill sysmon-bar-fill--tx'));
        } else {
            viz.appendChild(makeBar(payload.value ?? 0));
        }
        return;
    }

    if (mode === 'curve') {
        if (isNetwork) {
            // Two side-by-side lanes for network: rx on the left, tx on
            // the right. Each lane is its own `.sysmon-viz--curve` so it
            // gets the standard 24px height and canvas-fill treatment.
            const rxLane = document.createElement('div');
            rxLane.className = 'sysmon-viz sysmon-viz--curve';
            const txLane = document.createElement('div');
            txLane.className = 'sysmon-viz sysmon-viz--curve';
            viz.appendChild(rxLane);
            viz.appendChild(txLane);
            // Use the rx history as the primary; the tx lane reuses the
            // same buffer for visual symmetry (callers with a real tx
            // history can extend RowPayload to carry it).
            drawCurveInto(rxLane, history);
            drawCurveInto(txLane, history);
        } else {
            drawCurveInto(viz, history);
        }
    }
}
