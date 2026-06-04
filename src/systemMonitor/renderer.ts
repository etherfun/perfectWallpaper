import { MAX_HISTORY_LENGTH } from './constants';
import { getColorForValue } from './formatters';
import type { SystemMonitorConfig } from './types';

/**
 * Pure functions that update the visual representation of monitor rows.
 * Each function takes its own state as parameters (config / history array)
 * so the orchestrating class can compose them freely.
 */

export type HistoryType = 'cpu' | 'gpu' | 'memory';

export function pushHistory(history: number[], value: number): void {
    history.push(value);
    if (history.length > MAX_HISTORY_LENGTH) {
        history.shift();
    }
}

export function drawCurve(canvas: HTMLCanvasElement, history: number[]): void {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    ctx.clearRect(0, 0, width, height);
    if (history.length < 2) return;

    ctx.strokeStyle = getColorForValue(history[history.length - 1] || 0);
    ctx.lineWidth = 1.5;
    ctx.beginPath();

    const step = width / (MAX_HISTORY_LENGTH - 1);
    const startX = width - (history.length - 1) * step;

    history.forEach((value, index) => {
        const x = startX + index * step;
        const y = height - (value / 100) * height;
        if (index === 0) {
            ctx.moveTo(x, y);
        } else {
            ctx.lineTo(x, y);
        }
    });

    ctx.stroke();

    ctx.lineTo(startX + (history.length - 1) * step, height);
    ctx.lineTo(startX, height);
    ctx.closePath();
    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, getColorForValue(history[history.length - 1] || 0, 0.3));
    gradient.addColorStop(1, 'transparent');
    ctx.fillStyle = gradient;
    ctx.fill();
}

export function drawCurveInRow(row: HTMLElement, type: HistoryType, history: number[]): void {
    const leftSpan = row.querySelector('.left') as HTMLElement | null;
    const rightSpan = row.querySelector('.right');
    if (!rightSpan) return;

    const mainLine = rightSpan.querySelector('.main-line') as HTMLElement | null;
    if (!mainLine) return;

    // Determine where to append canvas based on alignment
    const background = row.closest('.background');
    const isLeft = background?.classList.contains('left-side') ?? false;
    const targetContainer = isLeft ? mainLine : leftSpan;

    if (!targetContainer) return;

    // Clear old canvas from target container
    const oldCanvas = targetContainer.querySelector('canvas');
    if (oldCanvas) oldCanvas.remove();

    const canvas = document.createElement('canvas');
    canvas.width = 80;
    canvas.height = 24;
    canvas.style.cssText = 'display:inline-block;vertical-align:middle;';

    // Position canvas based on alignment
    // Left-aligned: chart appears last (data → extra → chart)
    // Right-aligned: chart appears first (chart → extra → data)
    if (isLeft) {
        targetContainer.appendChild(canvas);
    } else {
        targetContainer.insertBefore(canvas, targetContainer.firstChild);
    }
    drawCurve(canvas, history);
}

export function drawBarInRow(row: HTMLElement, value: number, config: SystemMonitorConfig): void {
    const leftSpan = row.querySelector('.left') as HTMLElement | null;
    const rightSpan = row.querySelector('.right');
    if (!leftSpan || !rightSpan) return;

    // Determine target container for bar based on alignment
    const background = row.closest('.background');
    const isLeft = background?.classList.contains('left-side') ?? false;

    // Determine target container for bar based on alignment
    let targetContainer: HTMLElement;
    if (isLeft) {
        // Left-aligned: bar goes to sub-line in right
        const subLine = rightSpan.querySelector('.sub-line') as HTMLElement | null;
        if (!subLine) return;
        targetContainer = subLine;
    } else {
        // Right-aligned: bar goes to left (with chart)
        targetContainer = leftSpan;
    }

    // Clear old bar container from target
    const oldBar = targetContainer.querySelector('.sysmon-bar');
    if (oldBar) oldBar.remove();

    const isVertical = config.barLayout === 'vertical';

    // Bar container
    const barContainer = document.createElement('div');
    barContainer.className = 'sysmon-bar';
    // Always set width to 80px to match chart width
    if (isVertical) {
        // Vertical bar: column layout, bar below value
        barContainer.style.cssText =
            'display:flex;flex-direction:column;gap:2px;width:80px;margin-top:var(--sysmon-gap,4px);';
    } else {
        // Horizontal bar: row layout, bar after value
        barContainer.style.cssText =
            'display:flex;flex-direction:row;align-items:center;gap:4px;width:80px;margin-top:var(--sysmon-gap,4px);';
    }

    // Bar track (gray background)
    const track = document.createElement('div');
    if (isVertical) {
        track.style.cssText =
            'width:100%;height:4px;background:rgba(255,255,255,0.2);border-radius:2px;';
    } else {
        track.style.cssText =
            'flex:1;height:4px;background:rgba(255,255,255,0.2);border-radius:2px;';
    }

    // Bar fill (colored foreground)
    const fill = document.createElement('div');
    if (isVertical) {
        fill.style.cssText = `width:${value}%;height:100%;background:${getColorForValue(value)};transition:width 0.3s ease;border-radius:2px;`;
    } else {
        fill.style.cssText = `width:${value}%;height:100%;background:${getColorForValue(value)};transition:width 0.3s ease;border-radius:2px;`;
    }

    track.appendChild(fill);
    barContainer.appendChild(track);

    // Append bar to target container
    targetContainer.appendChild(barContainer);
}

export function updateItem(
    row: HTMLElement | null,
    label: string,
    value: number,
    mode: string,
    extra: string | undefined,
    config: SystemMonitorConfig,
    history: number[]
): void {
    if (!row) return;

    const leftSpan = row.querySelector('.left') as HTMLElement | null;
    const rightSpan = row.querySelector('.right') as HTMLElement | null;
    const labelSpan = row.querySelector('.sysmon-label');

    if (!leftSpan || !rightSpan || !labelSpan) return;

    // Read alignment from row's parent background class (kept in sync by applyConfig)
    const background = row.closest('.background');
    const isLeft = background?.classList.contains('left-side') ?? false;
    const mainLine = rightSpan.querySelector('.main-line') as HTMLElement | null;
    const subLine = rightSpan.querySelector('.sub-line') as HTMLElement | null;

    // Clear old canvas from both containers
    const oldCanvasLeft = leftSpan.querySelector('canvas');
    if (oldCanvasLeft) oldCanvasLeft.remove();
    const oldCanvasRight = mainLine?.querySelector('canvas');
    if (oldCanvasRight) oldCanvasRight.remove();

    if (isLeft) {
        leftSpan.innerHTML = '';
        mainLine!.innerHTML = `<span class="sysmon-value">${value}%</span>${extra ? `<span class="sysmon-extra">(${extra})</span>` : ''}`;
    } else {
        leftSpan.innerHTML = `${extra ? `<span class="sysmon-extra">(${extra})</span>` : ''}<span class="sysmon-value">${value}%</span>`;
        mainLine!.innerHTML = '';
    }

    if (subLine) subLine.innerHTML = '';

    switch (mode) {
        case 'text':
            break;
        case 'curve':
            drawCurveInRow(row, label.toLowerCase() as HistoryType, history);
            break;
        case 'bar':
            drawBarInRow(row, value, config);
            break;
        case 'none':
        default:
            row.style.display = 'none';
            break;
    }
}

export function updateNetworkDisplay(row: HTMLElement | null, rx: string, tx: string): void {
    if (!row) return;

    const leftSpan = row.querySelector('.left') as HTMLElement | null;
    const rightSpan = row.querySelector('.right') as HTMLElement | null;
    if (!leftSpan || !rightSpan) return;

    const background = row.closest('.background');
    const isLeft = background?.classList.contains('left-side') ?? false;
    const labelSpan = row.querySelector('.sysmon-label');

    if (!labelSpan) return;

    const mainLine = rightSpan.querySelector('.main-line') as HTMLElement | null;

    const oldCanvasLeft = leftSpan.querySelector('canvas');
    if (oldCanvasLeft) oldCanvasLeft.remove();
    const oldCanvasRight = mainLine?.querySelector('canvas');
    if (oldCanvasRight) oldCanvasRight.remove();

    if (isLeft) {
        leftSpan.innerHTML = '';
        if (!labelSpan.hasAttribute('data-i18n')) labelSpan.textContent = 'NET';
        mainLine!.innerHTML = `<span class="sysmon-net-down">↓${rx}</span> <span class="sysmon-net-up">↑${tx}</span>`;
    } else {
        leftSpan.innerHTML = `<span class="sysmon-net-down">↓${rx}</span> <span class="sysmon-net-up">↑${tx}</span>`;
        if (!labelSpan.hasAttribute('data-i18n')) labelSpan.textContent = 'NET';
        mainLine!.innerHTML = '';
    }
}
