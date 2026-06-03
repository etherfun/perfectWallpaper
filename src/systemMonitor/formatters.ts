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
