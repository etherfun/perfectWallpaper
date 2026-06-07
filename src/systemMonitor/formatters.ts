/**
 * Pure formatting helpers shared across the system monitor module.
 */

export function formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return (bytes / Math.pow(k, i)).toFixed(1) + ' ' + sizes[i];
}

/**
 * Format a sensor temperature (in °C) for display in the `(extra)` slot.
 *
 * - 0 / negative / NaN / non-finite → returns `null` so callers can
 *   decide to omit the text entirely (matches the renderer's
 *   `(extra ? ... : '')` convention).
 * - Otherwise returns `"<rounded>°C"`. We round to the nearest integer
 *   so the `(extra)` slot width stays stable across readings.
 */
export function formatTemperature(celsius: number | null | undefined): string | null {
    if (celsius === null || celsius === undefined) return null;
    if (!Number.isFinite(celsius)) return null;
    if (celsius <= 0) return null;
    return `${Math.round(celsius)}°C`;
}

export function getColorForValue(value: number, alpha?: number): string {
    const a = alpha !== undefined ? alpha : 1;
    if (value < 50) {
        return `rgba(76, 175, 80, ${a})`;
    } else if (value < 80) {
        return `rgba(255, 193, 7, ${a})`;
    } else {
        return `rgba(244, 67, 54, ${a})`;
    }
}
