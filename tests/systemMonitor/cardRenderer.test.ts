// @vitest-environment jsdom
/**
 * Tests for src/systemMonitor/cardRenderer.ts
 *
 * Covers:
 *   - buildCards creates the correct DOM structure
 *   - destroyCards removes card DOM
 *   - updateCards correctly sets labels, values, meta, and spark canvases
 *   - Empty/null payloads hide cards
 *   - Disk cards are created/destroyed dynamically
 */

import { afterEach, beforeAll, beforeEach, describe, expect, test, vi } from 'vitest';

import { buildCards, destroyCards, updateCards } from '@/systemMonitor/cardRenderer';
import type { CardRenderData } from '@/systemMonitor/types';

vi.mock('@/i18n', () => ({
    globalT: vi.fn((key: string) => {
        const map: Record<string, string> = {
            sysmon_card_util: 'Util',
            sysmon_card_temp: 'Temp',
            sysmon_card_power: 'Power',
            sysmon_card_vram: 'VRAM',
            sysmon_card_read: 'Read',
            sysmon_card_write: 'Write',
            sysmon_card_rx: '↓RX',
            sysmon_card_tx: '↑TX',
            sysmon_card_axis_util: '0–100%',
            sysmon_card_axis_power: '0–peak',
            sysmon_card_axis_last_2_min: 'last 2 min · overlaid',
            sysmon_card_freq: 'Freq',
            sysmon_card_hot: 'Hot',
            sysmon_card_vcore: 'V',
            sysmon_card_vram_meta: 'VRAM',
            sysmon_card_core_clock: 'Core',
            sysmon_card_mem_junc: 'Mem Junc',
            sysmon_card_used: 'Used',
            sysmon_card_free: 'Free',
            sysmon_card_life: 'Life',
            sysmon_card_rx_meta: 'RX',
            sysmon_card_tx_meta: 'TX',
            sysmon_card_label_cpu: 'CPU',
            sysmon_card_label_gpu: 'GPU',
            sysmon_card_label_mem: 'MEM',
            sysmon_card_label_net: 'NET',
            sysmon_card_label_disk: 'DISK',
            sysmon_card_max: 'max',
            sysmon_card_peak: 'peak',
        };
        return map[key] ?? key;
    }),
}));

// jsdom has no canvas 2D backend; stub it to avoid noisy stderr output.
beforeAll(() => {
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null);
});

afterEach(() => {
    vi.restoreAllMocks();
});

function makeParent(): HTMLElement {
    const el = document.createElement('div');
    el.id = 'system-monitor';
    document.body.appendChild(el);
    return el;
}

/** Minimal render data with all cards visible. */
function makeRenderData(): CardRenderData {
    return {
        cpu: {
            label: 'CPU · AMD Ryzen 9 7845HX',
            value: '13%',
            extra: '(89°C)',
            meta: [
                { label: 'Freq', value: '5065 MHz' },
                { label: 'Power', value: '68.1 W' },
            ],
            sparks: [
                { kind: 'util', history: [10, 20, 30, 13], displayValue: '13%' },
                { kind: 'temp', history: [75, 80, 89, 89], displayValue: '89°C', range: { lo: 40, hi: 95, crit: 95 } },
            ],
            sparkLayout: 'double-full',
        },
        gpu: {
            label: 'GPU · NVIDIA GeForce RTX 5060 Laptop',
            value: '17%',
            extra: '(56°C)',
            meta: [
                { label: 'Power', value: '25.5 W' },
                { label: 'VRAM', value: '2.7/8.0 GB' },
            ],
            sparks: [
                { kind: 'util', history: [10, 15, 17], displayValue: '17%' },
                { kind: 'temp', history: [50, 54, 56], displayValue: '56°C', range: { lo: 30, hi: 95, crit: 92 } },
            ],
            sparkLayout: 'quad',
        },
        memory: {
            label: 'MEM · 33.5 GB total',
            value: '57%',
            extra: '(18.9/33.5 GB)',
            meta: [
                { label: 'Used', value: '18.9 GB' },
                { label: 'Total', value: '33.5 GB' },
            ],
            sparks: [
                { kind: 'util', history: [50, 55, 57], displayValue: '57%' },
            ],
            sparkLayout: 'solo',
        },
        network: {
            label: 'NET',
            value: '414 B/s',
            extra: null,
            meta: [
                { label: 'RX', value: '414 B/s' },
                { label: 'TX', value: '138 B/s' },
            ],
            sparks: [
                { kind: 'rx-tx', history: [300, 400, 414], dirRx: [100, 120, 138], displayValue: '414 B/s', dirTxDisplay: '138 B/s' },
            ],
            sparkLayout: 'combined',
        },
        disks: [
            {
                label: 'DISK #0 · YMTC PC411 · NVMe',
                value: '42%',
                extra: '(215 GB / 512 GB)',
                meta: [
                    { label: 'Used', value: '215 GB' },
                    { label: 'Free', value: '297 GB' },
                    { label: 'Temp', value: '45°C' },
                    { label: 'Life', value: '82%' },
                ],
                sparks: [
                    { kind: 'read', history: [1e8, 1.2e8, 1.1e8], displayValue: '120 MB/s' },
                    { kind: 'write', history: [4e7, 5e7, 4.5e7], displayValue: '45 MB/s' },
                    { kind: 'util', history: [40, 42, 42], displayValue: '42%' },
                ],
                sparkLayout: 'double-full',
            },
        ],
    };
}

// ─── buildCards ───────────────────────────────────────────────────

describe('buildCards', () => {
    let parent: HTMLElement;

    beforeEach(() => {
        parent = makeParent();
    });

    afterEach(() => {
        document.body.innerHTML = '';
    });

    test('creates container with 4 metric cards', () => {
        const refs = buildCards(parent);

        expect(refs.container).toBeTruthy();
        expect(refs.container.className).toBe('sysmon-cards');
        expect(refs.cards.cpu).toBeTruthy();
        expect(refs.cards.gpu).toBeTruthy();
        expect(refs.cards.memory).toBeTruthy();
        expect(refs.cards.network).toBeTruthy();
        expect(refs.cards.disks).toEqual([]);
        expect(refs.canvases).toBeInstanceOf(Map);
    });

    test('cards have correct data-metric attributes', () => {
        const refs = buildCards(parent);

        expect(refs.cards.cpu?.dataset.metric).toBe('cpu');
        expect(refs.cards.gpu?.dataset.metric).toBe('gpu');
        expect(refs.cards.memory?.dataset.metric).toBe('memory');
        expect(refs.cards.network?.dataset.metric).toBe('network');
    });

    test('removes existing cards container before building', () => {
        const first = buildCards(parent);
        const firstContainer = first.container;

        // Build again — old container should be removed, new one created
        const second = buildCards(parent);

        expect(document.body.contains(firstContainer)).toBe(false);
        expect(document.body.contains(second.container)).toBe(true);
        expect(second.container).not.toBe(firstContainer);
    });

    test('card elements contain expected sub-slots', () => {
        const refs = buildCards(parent);

        for (const card of [refs.cards.cpu, refs.cards.gpu, refs.cards.memory, refs.cards.network]) {
            expect(card?.querySelector('.sysmon-card__label')).toBeTruthy();
            expect(card?.querySelector('.sysmon-card__value')).toBeTruthy();
            expect(card?.querySelector('.sysmon-card__extra')).toBeTruthy();
            expect(card?.querySelector('.sysmon-card__meta')).toBeTruthy();
            expect(card?.querySelector('.sysmon-card__sparks')).toBeTruthy();
        }
    });
});

// ─── destroyCards ─────────────────────────────────────────────────

describe('destroyCards', () => {
    let parent: HTMLElement;

    beforeEach(() => {
        parent = makeParent();
    });

    afterEach(() => {
        document.body.innerHTML = '';
    });

    test('removes cards container from parent', () => {
        buildCards(parent);
        expect(parent.querySelector('.sysmon-cards')).toBeTruthy();

        destroyCards(parent);
        expect(parent.querySelector('.sysmon-cards')).toBeNull();
    });

    test('is safe when no cards exist', () => {
        expect(() => destroyCards(parent)).not.toThrow();
    });
});

// ─── updateCards ──────────────────────────────────────────────────

describe('updateCards', () => {
    let parent: HTMLElement;
    let refs: ReturnType<typeof buildCards>;

    beforeEach(() => {
        parent = makeParent();
        refs = buildCards(parent);
    });

    afterEach(() => {
        document.body.innerHTML = '';
    });

    test('sets card label, value, and extra text', () => {
        const data = makeRenderData();
        updateCards(refs, data);

        expect(refs.cards.cpu?.querySelector('.sysmon-card__label')?.textContent).toBe(
            'CPU · AMD Ryzen 9 7845HX'
        );
        expect(refs.cards.cpu?.querySelector('.sysmon-card__value')?.textContent).toBe('13%');
        expect(refs.cards.cpu?.querySelector('.sysmon-card__extra')?.textContent).toBe('(89°C)');
    });

    test('sets meta grid content', () => {
        const data = makeRenderData();
        updateCards(refs, data);

        const meta = refs.cards.cpu?.querySelector('.sysmon-card__meta');
        expect(meta?.children.length).toBe(2);
        expect(meta?.children[0]?.innerHTML).toContain('Freq');
        expect(meta?.children[0]?.innerHTML).toContain('5065 MHz');
        expect(meta?.children[1]?.innerHTML).toContain('Power');
    });

    test('creates spark canvases in the sparks container', () => {
        const data = makeRenderData();
        updateCards(refs, data);

        // sparksEl uses both 'sysmon-card__sparks' (CSS grid) and 'spark-cell' (layout)
        const sparks = refs.cards.cpu?.querySelector('.sysmon-card__sparks');
        const canvases = sparks?.querySelectorAll('canvas.spark');
        expect(canvases?.length).toBe(2); // util + temp

        // Canvas elements are tracked in the map
        expect(refs.canvases.has('cpu.util')).toBe(true);
        expect(refs.canvases.has('cpu.temp')).toBe(true);
    });

    test('spark container gets correct layout class', () => {
        const data = makeRenderData();
        updateCards(refs, data);

        // sparksEl.className = 'sysmon-card__sparks spark-cell spark-cell--<variant>'
        const cpuSparks = refs.cards.cpu?.querySelector('.sysmon-card__sparks');
        expect(cpuSparks?.className).toContain('spark-cell--double-full');

        const memSparks = refs.cards.memory?.querySelector('.sysmon-card__sparks');
        expect(memSparks?.className).toContain('spark-cell--solo');
    });

    test('null payload hides card', () => {
        const data = makeRenderData();
        data.cpu = null;
        updateCards(refs, data);

        expect(refs.cards.cpu?.style.display).toBe('none');
        // Other cards remain visible
        expect(refs.cards.gpu?.style.display).not.toBe('none');
    });

    test('network card shows rx/tx spark heads', () => {
        const data = makeRenderData();
        updateCards(refs, data);

        // NET uses combined rx-tx spark on a single canvas
        const sparks = refs.cards.network?.querySelector('.spark-cell');
        expect(sparks?.className).toContain('spark-cell--combined');
        expect(refs.canvases.has('network.rx-tx')).toBe(true);
        // Single canvas for combined rx-tx, not separate rx/tx
        const canvases = refs.cards.network?.querySelectorAll('canvas.spark');
        expect(canvases?.length).toBe(1);
    });
});

// ─── Disk cards ───────────────────────────────────────────────────

describe('updateCards — disks', () => {
    let parent: HTMLElement;
    let refs: ReturnType<typeof buildCards>;

    beforeEach(() => {
        parent = makeParent();
        refs = buildCards(parent);
    });

    afterEach(() => {
        document.body.innerHTML = '';
    });

    test('creates disk cards from render data', () => {
        const data = makeRenderData();
        updateCards(refs, data);

        expect(refs.cards.disks.length).toBe(1);
        expect(refs.cards.disks[0]?.dataset.metric).toBe('disk0');
        expect(refs.cards.disks[0]?.querySelector('.sysmon-card__label')?.textContent).toBe(
            'DISK #0 · YMTC PC411 · NVMe'
        );
    });

    test('removes old disk cards when updating with fewer disks', () => {
        const data = makeRenderData();
        updateCards(refs, data);
        expect(refs.cards.disks.length).toBe(1);
        const firstDisk = refs.cards.disks[0];

        data.disks = [];
        updateCards(refs, data);

        expect(refs.cards.disks.length).toBe(0);
        expect(document.body.contains(firstDisk)).toBe(false);
    });

    test('adds new disk cards when data has more disks', () => {
        const data = makeRenderData();
        updateCards(refs, data);
        expect(refs.cards.disks.length).toBe(1);

        data.disks.push({
            label: 'DISK #1 · BIWIN NV7400 · NVMe',
            value: '28%',
            extra: '(545 GB / 2 TB)',
            meta: [{ label: 'Used', value: '545 GB' }],
            sparks: [{ kind: 'util', history: [28], displayValue: '28%' }],
            sparkLayout: 'solo',
        });
        updateCards(refs, data);

        expect(refs.cards.disks.length).toBe(2);
    });
});

// ─── Spark head HTML ──────────────────────────────────────────────

describe('spark head labels', () => {
    let parent: HTMLElement;
    let refs: ReturnType<typeof buildCards>;

    beforeEach(() => {
        parent = makeParent();
        refs = buildCards(parent);
    });

    afterEach(() => {
        document.body.innerHTML = '';
    });

    test('util spark head shows percentage', () => {
        updateCards(refs, makeRenderData());
        const head = refs.cards.cpu?.querySelector('.spark-pair .head');
        expect(head?.innerHTML).toContain('Util');
        expect(head?.innerHTML).toContain('13%');
    });

    test('rx spark head shows dir-rx class', () => {
        updateCards(refs, makeRenderData());
        const rxHead = refs.cards.network?.querySelector('.dir-rx');
        expect(rxHead).toBeTruthy();
        expect(rxHead?.innerHTML).toContain('414 B/s');
    });

    test('tx spark head shows dir-tx class', () => {
        updateCards(refs, makeRenderData());
        const txHead = refs.cards.network?.querySelector('.dir-tx');
        expect(txHead).toBeTruthy();
        expect(txHead?.innerHTML).toContain('138 B/s');
    });
});
