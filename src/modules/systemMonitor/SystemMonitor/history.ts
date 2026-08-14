/**
 * History-buffer helpers for the System Monitor.
 *
 * Handles the rolling value buffers that back row-mode curves and
 * card-mode sparklines: metric lookups, last values, peaks, and
 * lazy per-disk map entries.
 */

/**
 * Pick the matching history buffer for a simple row based on its metric tag.
 * Falls back to an empty buffer (so curve mode renders no curve yet) when
 * the row has no data-metric attribute.
 */
export function historyForMetric(
    row: HTMLElement,
    owner: { cpuHistory: number[]; gpuHistory: number[]; memoryHistory: number[] }
): number[] {
    switch (row.dataset.metric) {
        case 'cpu':
            return owner.cpuHistory;
        case 'gpu':
            return owner.gpuHistory;
        case 'memory':
            return owner.memoryHistory;
        default:
            return [];
    }
}

/** Last value of a history buffer, or 0 when empty. */
export function lastOf(history: number[]): number {
    if (history.length === 0) return 0;
    return history[history.length - 1] ?? 0;
}

/** Largest value in a history buffer, with a floor of 1 (avoids div-by-zero). */
export function peakOf(history: number[]): number {
    return Math.max(1, ...history);
}

/** Get-or-create the per-disk history buffer for a disk index. */
export function getOrCreateHistory(map: Map<number, number[]>, index: number): number[] {
    let hist = map.get(index);
    if (!hist) {
        hist = [];
        map.set(index, hist);
    }
    return hist;
}
