/**
 * String Utility Functions
 * Shared string manipulation utilities for the project
 */

/**
 * Escape HTML special characters in a string
 */
export function escapeHtml(text: string): string {
    if (!text) return '';
    return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

/**
 * Truncate a URL for display purposes
 */
export function truncateUrl(url: string, maxLength: number): string {
    if (url.length <= maxLength) return url;
    const half = Math.floor(maxLength / 2) - 2;
    return url.substring(0, half) + '...' + url.substring(url.length - half);
}
