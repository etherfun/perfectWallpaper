import type {
    SystemMonitorCardDomRefs,
    SystemMonitorConfig,
    SystemMonitorDomRefs,
} from '../types';
import { buildCards, destroyCards } from '../ui/cardRenderer';
import { applyConfig } from '../ui/configApply';
import { renderRow } from '../ui/renderer';
import { lastOf } from './history';

/** State the display controller needs from the SystemMonitor instance. */
export interface DisplayOwner {
    config: SystemMonitorConfig;
    refs: SystemMonitorDomRefs | null;
    cardRefs: SystemMonitorCardDomRefs | null;
    lastDisplayStyle: 'rows' | 'cards';
    lastMonitorPosition: 'left' | 'right';
    cpuHistory: number[];
    gpuHistory: number[];
    memoryHistory: number[];
    networkRxHistory: number[];
}

/** Switch between the rows and cards display styles, rebuilding card DOM as needed. */
export function toggleDisplayStyle(owner: DisplayOwner, style: 'rows' | 'cards'): void {
    // Save current style
    owner.lastDisplayStyle = style;
    owner.config.displayStyle = style;

    if (style === 'cards') {
        // Hide row background, build card DOM
        if (owner.refs?.background) owner.refs.background.style.display = 'none';
        if (owner.refs?.container) {
            owner.cardRefs = buildCards(owner.refs.container);
        }
    } else {
        // Destroy card DOM, show row background
        if (owner.refs?.container) destroyCards(owner.refs.container);
        if (owner.refs?.background) owner.refs.background.style.display = '';
        owner.cardRefs = null;
    }
}

/**
 * Apply config-driven layout / font styles to rows and cards.
 * Only re-renders row contents when the alignment changes (rows mode).
 */
export function applyDisplayConfig(owner: DisplayOwner): void {
    applyConfig(owner.refs, owner.config);

    // Apply font color and size to card elements immediately
    if (owner.cardRefs) {
        const { monitorColor, monitorSize } = owner.config;
        const allCards = [
            owner.cardRefs.cards.cpu,
            owner.cardRefs.cards.gpu,
            owner.cardRefs.cards.memory,
            owner.cardRefs.cards.network,
            ...owner.cardRefs.cards.disks,
        ];
        for (const card of allCards) {
            if (!card) continue;
            if (monitorColor) card.style.color = monitorColor;
            if (monitorSize) card.style.fontSize = `${monitorSize}px`;
        }
    }

    // Only re-render when alignment changes (rows mode)
    const alignmentChanged = owner.lastMonitorPosition !== owner.config.monitorPosition;
    if (alignmentChanged && owner.config.displayStyle === 'rows') {
        owner.lastMonitorPosition = owner.config.monitorPosition;
        rerenderAllRows(owner);
    }
}

/** Re-render all row contents with the latest buffered values. */
function rerenderAllRows(owner: DisplayOwner): void {
    if (!owner.refs) return;

    if (owner.config.showCpu) {
        renderRow(
            owner.refs.cpuRow,
            { value: lastOf(owner.cpuHistory) },
            owner.config.cpuMode,
            owner.cpuHistory
        );
    }
    if (owner.config.showGpu) {
        renderRow(
            owner.refs.gpuRow,
            { value: lastOf(owner.gpuHistory) },
            owner.config.gpuMode,
            owner.gpuHistory
        );
    }
    if (owner.config.showMemory) {
        renderRow(
            owner.refs.memoryRow,
            { value: lastOf(owner.memoryHistory) },
            owner.config.memoryMode,
            owner.memoryHistory
        );
    }
    if (owner.config.showNetwork) {
        renderRow(
            owner.refs.networkRow,
            {
                value: 0,
                netRx: '0 B/s',
                netTx: '0 B/s',
                netRxPct: 0,
                netTxPct: 0,
            },
            owner.config.networkMode,
            owner.networkRxHistory
        );
    }
}
