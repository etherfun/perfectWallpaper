// @vitest-environment jsdom
/**
 * Tests for src/systemMonitor/renderer.ts
 *
 * Covers the DOM-update contract of `renderRow` plus the rolling-buffer
 * behaviour of `pushHistory`. The SCSS-side fixed-width treatment
 * (`.sysmon-text { min-width: 12em }` + `.sysmon-value { min-width: 4ch;
 * text-align: right }` + `.sysmon-extra { max-width: 6em; overflow:
 * hidden; text-overflow: ellipsis }`) is what actually keeps the
 * horizontal-layout taskbar from twitching as the digit count or
 * `extra` string length changes, but jsdom does not apply external
 * stylesheets, so we cannot assert `getComputedStyle(...).minWidth`
 * here. Instead we assert the structural contract that makes the CSS
 * effective:
 *
 *   - `.sysmon-value` is a *persistent* node whose `textContent` is
 *     updated in place; the node reference MUST stay the same across
 *     successive renders so the browser keeps the same layout box.
 *   - `.sysmon-extra` is *also* a persistent node (the CSS now
 *     expects `display: inline-block` to make `max-width` work).
 *   - The `.sysmon-row--curve` / `.sysmon-viz--bar` / `.sysmon-viz--curve`
 *     modifier classes are applied (or cleared) exactly as the mode
 *     argument dictates, so the row's flex direction and the viz slot's
 *     height stay in lock-step with the active visualization.
 */

import { afterEach, beforeAll, beforeEach, describe, expect, test, vi } from 'vitest';

import { MAX_HISTORY_LENGTH } from '@/modules/systemMonitor/constants';
import { pushHistory, renderRow, type RowPayload } from '@/modules/systemMonitor/renderer';

// jsdom ships without a `<canvas>` 2D backend, so calling
// `canvas.getContext('2d')` writes a noisy "Not implemented" error to
// stderr on every curve render. We don't need a real drawing context
// for these structural assertions — `drawCurveInto` short-circuits
// when `getContext` returns falsy, after creating and appending the
// `<canvas>` to the parent (see renderer.ts:147-148). Stubbing the
// prototype method keeps the canvas in the DOM for assertions while
// silencing the spurious stderr noise.
beforeAll(() => {
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null);
});

/** Build a minimal but valid sysmon row matching the HTML template. */
function makeRow(metric: 'cpu' | 'gpu' | 'memory' | 'network' = 'cpu'): HTMLElement {
    const row = document.createElement('div');
    row.className = 'sysmon-row';
    row.dataset.metric = metric;

    const text = document.createElement('div');
    text.className = 'sysmon-text';

    if (metric === 'network') {
        const down = document.createElement('span');
        down.className = 'sysmon-net sysmon-net-down';
        const up = document.createElement('span');
        up.className = 'sysmon-net sysmon-net-up';
        text.appendChild(down);
        text.appendChild(up);
    } else {
        const label = document.createElement('span');
        label.className = 'sysmon-label';
        const value = document.createElement('span');
        value.className = 'sysmon-value';
        const extra = document.createElement('span');
        extra.className = 'sysmon-extra';
        text.appendChild(label);
        text.appendChild(value);
        text.appendChild(extra);
    }

    const viz = document.createElement('div');
    viz.className = 'sysmon-viz';

    row.appendChild(text);
    row.appendChild(viz);
    return row;
}

describe('systemMonitor/renderer', () => {
    // Each `renderRow` test appends a fresh row fixture to `document.body`.
    // The fixtures are scoped via local `row` references, so leftover rows
    // from a prior test cannot bleed into assertions, but clearing the body
    // keeps memory flat and removes any chance of `document.querySelector`
    // being used in a future test picking up stale fixtures.
    afterEach(() => {
        document.body.innerHTML = '';
    });

    describe('pushHistory', () => {
        test('appends new samples to the end of the buffer', () => {
            const history: number[] = [];
            pushHistory(history, 10);
            pushHistory(history, 20);
            pushHistory(history, 30);
            expect(history).toEqual([10, 20, 30]);
        });

        test('drops the oldest sample once MAX_HISTORY_LENGTH is exceeded', () => {
            const history: number[] = [];
            for (let i = 0; i < MAX_HISTORY_LENGTH; i++) {
                pushHistory(history, i);
            }
            expect(history.length).toBe(MAX_HISTORY_LENGTH);
            expect(history[0]).toBe(0);
            expect(history[history.length - 1]).toBe(MAX_HISTORY_LENGTH - 1);

            // One more push → oldest is shifted out, newest is at the end.
            pushHistory(history, 999);
            expect(history.length).toBe(MAX_HISTORY_LENGTH);
            expect(history[0]).toBe(1);
            expect(history[history.length - 1]).toBe(999);
        });

        test('caps the buffer at exactly MAX_HISTORY_LENGTH after many pushes', () => {
            const history: number[] = [];
            for (let i = 0; i < MAX_HISTORY_LENGTH * 3; i++) {
                pushHistory(history, i);
            }
            expect(history.length).toBe(MAX_HISTORY_LENGTH);
            // Only the last MAX_HISTORY_LENGTH samples survive.
            expect(history[0]).toBe(MAX_HISTORY_LENGTH * 2);
            expect(history[history.length - 1]).toBe(MAX_HISTORY_LENGTH * 3 - 1);
        });
    });

    describe('renderRow — simple row (cpu / gpu / memory)', () => {
        let row: HTMLElement;

        beforeEach(() => {
            row = makeRow('cpu');
            document.body.appendChild(row);
        });

        test('text mode writes `${value}%` into the persistent value node', () => {
            const payload: RowPayload = { value: 42 };
            renderRow(row, payload, 'text', []);
            const valueEl = row.querySelector('.sysmon-value');
            expect(valueEl?.textContent).toBe('42%');
        });

        test('value node reference is stable across successive text updates', () => {
            // This is the structural contract that lets SCSS `min-width: 4ch`
            // actually do its job: the browser sees the SAME layout box for
            // every value update, so it never has to relayout siblings.
            const before = row.querySelector('.sysmon-value');
            renderRow(row, { value: 0 }, 'text', []);
            const after1 = row.querySelector('.sysmon-value');
            renderRow(row, { value: 50 }, 'text', []);
            const after2 = row.querySelector('.sysmon-value');
            renderRow(row, { value: 100 }, 'text', []);

            expect(after1).toBe(before);
            expect(after2).toBe(after1);
            expect(after1?.textContent).toBe('100%');
        });

        test('text mode leaves the viz slot empty (no canvas, no bar)', () => {
            renderRow(row, { value: 25 }, 'text', []);
            const viz = row.querySelector('.sysmon-viz');
            expect(viz?.children.length).toBe(0);
            expect(viz?.querySelector('canvas')).toBeNull();
            expect(viz?.querySelector('.sysmon-bar')).toBeNull();
        });

        test('text mode drops curve/bar modifier classes from the row and viz', () => {
            // Pre-seed: row is in curve mode with a canvas in the viz slot.
            renderRow(row, { value: 10 }, 'curve', [1, 2, 3]);
            expect(row.classList.contains('sysmon-row--curve')).toBe(true);
            expect(
                row.querySelector('.sysmon-viz')?.classList.contains('sysmon-viz--curve')
            ).toBe(true);

            // Switching back to text must clear the modifiers and tear down viz.
            renderRow(row, { value: 10 }, 'text', []);
            expect(row.classList.contains('sysmon-row--curve')).toBe(false);
            const viz = row.querySelector('.sysmon-viz');
            expect(viz?.classList.contains('sysmon-viz--bar')).toBe(false);
            expect(viz?.classList.contains('sysmon-viz--curve')).toBe(false);
            expect(viz?.querySelector('canvas')).toBeNull();
        });

        test('text mode writes `(extra)` into the extra node when provided', () => {
            renderRow(row, { value: 33, extra: '56°C' }, 'text', []);
            const extra = row.querySelector('.sysmon-extra');
            expect(extra?.textContent).toBe('(56°C)');
        });

        test('extra node reference is stable across successive updates', () => {
            // The SCSS now treats `.sysmon-extra` as `display: inline-block`
            // with `max-width: 6em; overflow: hidden; text-overflow:
            // ellipsis`. For that to be effective, the JS side must
            // update `textContent` in place — never recreate the node —
            // so the browser keeps the same layout box (and the same
            // ellipsis-clamp behaviour) across updates.
            const before = row.querySelector('.sysmon-extra');
            renderRow(row, { value: 33 }, 'text', []);
            const after1 = row.querySelector('.sysmon-extra');
            renderRow(row, { value: 33, extra: '12°C' }, 'text', []);
            const after2 = row.querySelector('.sysmon-extra');
            renderRow(row, { value: 33, extra: '99°C' }, 'text', []);
            const after3 = row.querySelector('.sysmon-extra');

            expect(after1).toBe(before);
            expect(after2).toBe(after1);
            expect(after3).toBe(after2);
            expect(after3?.textContent).toBe('(99°C)');
        });

        test('text mode leaves extra empty when no extra is provided', () => {
            renderRow(row, { value: 33 }, 'text', []);
            const extra = row.querySelector('.sysmon-extra');
            expect(extra?.textContent).toBe('');
        });

        test('bar mode adds a single bar with a fill child to the viz slot', () => {
            renderRow(row, { value: 75 }, 'bar', []);
            const viz = row.querySelector('.sysmon-viz');
            const bars = viz?.querySelectorAll('.sysmon-bar');
            expect(bars?.length).toBe(1);
            expect(bars?.[0]?.querySelector('.sysmon-bar-fill')).not.toBeNull();
            expect(viz?.querySelector('canvas')).toBeNull();
        });

        test('bar mode applies `sysmon-viz--bar` to the viz slot', () => {
            renderRow(row, { value: 75 }, 'bar', []);
            const viz = row.querySelector('.sysmon-viz');
            expect(viz?.classList.contains('sysmon-viz--bar')).toBe(true);
            expect(viz?.classList.contains('sysmon-viz--curve')).toBe(false);
            // Simple rows are always column-flex — curve modifier must NOT be set.
            expect(row.classList.contains('sysmon-row--curve')).toBe(false);
        });

        test('curve mode creates a <canvas> in the viz slot when history has data', () => {
            renderRow(row, { value: 50 }, 'curve', [10, 20, 30, 40, 50]);
            const viz = row.querySelector('.sysmon-viz');
            expect(viz?.querySelector('canvas')).not.toBeNull();
            expect(viz?.querySelector('.sysmon-bar')).toBeNull();
        });

        test('curve mode applies row + viz curve modifier classes', () => {
            renderRow(row, { value: 50 }, 'curve', [1, 2, 3]);
            expect(row.classList.contains('sysmon-row--curve')).toBe(true);
            const viz = row.querySelector('.sysmon-viz');
            expect(viz?.classList.contains('sysmon-viz--curve')).toBe(true);
            expect(viz?.classList.contains('sysmon-viz--bar')).toBe(false);
        });

        test('curve mode leaves viz empty when history has fewer than 2 samples', () => {
            // `drawCurveInto` short-circuits when there is not enough data
            // to plot a meaningful curve — the viz slot stays clean.
            renderRow(row, { value: 50 }, 'curve', []);
            expect(row.querySelector('.sysmon-viz canvas')).toBeNull();

            renderRow(row, { value: 50 }, 'curve', [42]);
            expect(row.querySelector('.sysmon-viz canvas')).toBeNull();
        });

        test('none mode hides the row via inline display', () => {
            renderRow(row, { value: 0 }, 'none', []);
            expect(row.style.display).toBe('none');
        });

        test('none mode also clears the curve modifier on the row', () => {
            renderRow(row, { value: 10 }, 'curve', [1, 2, 3]);
            expect(row.classList.contains('sysmon-row--curve')).toBe(true);

            renderRow(row, { value: 0 }, 'none', []);
            expect(row.style.display).toBe('none');
            expect(row.classList.contains('sysmon-row--curve')).toBe(false);
        });

        test('switching modes tears down the previous visualization', () => {
            renderRow(row, { value: 10 }, 'bar', []);
            expect(row.querySelector('.sysmon-bar')).not.toBeNull();

            renderRow(row, { value: 10 }, 'curve', [1, 2, 3]);
            const viz = row.querySelector('.sysmon-viz');
            expect(viz?.querySelector('.sysmon-bar')).toBeNull();
            expect(viz?.querySelector('canvas')).not.toBeNull();

            renderRow(row, { value: 10 }, 'text', []);
            expect(row.querySelector('.sysmon-bar')).toBeNull();
            expect(row.querySelector('canvas')).toBeNull();
        });
    });

    describe('renderRow — network row', () => {
        let row: HTMLElement;

        beforeEach(() => {
            row = makeRow('network');
            document.body.appendChild(row);
        });

        test('text mode writes `↓rx` and `↑tx` into the net nodes', () => {
            const payload: RowPayload = { netRx: '382.5 B/s', netTx: '902.5 B/s' };
            renderRow(row, payload, 'text', []);
            const down = row.querySelector('.sysmon-net-down');
            const up = row.querySelector('.sysmon-net-up');
            expect(down?.textContent).toBe('↓382.5 B/s');
            expect(up?.textContent).toBe('↑902.5 B/s');
        });

        test('text mode defaults rx/tx to `0 B/s` when payload omits them', () => {
            renderRow(row, {}, 'text', []);
            expect(row.querySelector('.sysmon-net-down')?.textContent).toBe('↓0 B/s');
            expect(row.querySelector('.sysmon-net-up')?.textContent).toBe('↑0 B/s');
        });

        test('bar mode creates two stacked bars (rx above tx) with distinct fill classes', () => {
            renderRow(row, { netRxPct: 30, netTxPct: 70 }, 'bar', []);
            const viz = row.querySelector('.sysmon-viz');
            const bars = viz?.querySelectorAll('.sysmon-bar');
            expect(bars?.length).toBe(2);
            expect(bars?.[0]?.querySelector('.sysmon-bar-fill--rx')).not.toBeNull();
            expect(bars?.[1]?.querySelector('.sysmon-bar-fill--tx')).not.toBeNull();
        });

        test('curve mode creates two side-by-side `.sysmon-viz--curve` lanes', () => {
            renderRow(row, {}, 'curve', [10, 20, 30, 40]);
            const viz = row.querySelector('.sysmon-viz');
            const lanes = viz?.querySelectorAll('.sysmon-viz--curve');
            expect(lanes?.length).toBe(2);
            // Each lane should have its own canvas.
            expect(lanes?.[0]?.querySelector('canvas')).not.toBeNull();
            expect(lanes?.[1]?.querySelector('canvas')).not.toBeNull();
        });

        test('network row ignores `value` field — text mode keeps rx/tx from netRx/netTx', () => {
            // Regression guard: a misrouted simple-row payload on a network
            // row must not clobber the net spans.
            renderRow(
                row,
                { value: 88, netRx: '1.0 KB/s', netTx: '2.0 KB/s' },
                'text',
                []
            );
            expect(row.querySelector('.sysmon-net-down')?.textContent).toBe('↓1.0 KB/s');
            expect(row.querySelector('.sysmon-net-up')?.textContent).toBe('↑2.0 KB/s');
            expect(row.querySelector('.sysmon-value')).toBeNull();
        });
    });

    describe('renderRow — defensive paths', () => {
        test('null row argument is a no-op (does not throw)', () => {
            expect(() => renderRow(null, { value: 50 }, 'text', [])).not.toThrow();
        });

        test('payload.value defaults to 0 when omitted on a simple row', () => {
            const row = makeRow('cpu');
            document.body.appendChild(row);
            renderRow(row, {}, 'text', []);
            expect(row.querySelector('.sysmon-value')?.textContent).toBe('0%');
        });
    });
});
