/**
 * Hide/restore overlapping page chrome (picture info, player info, system
 * monitor) while the lyrics overlay is on screen. Toggled via
 * `visibility: hidden` so layout is preserved.
 */

import { HIDDEN_SELECTORS } from '../constants';

/** Set `visibility: hidden` on every element matching HIDDEN_SELECTORS */
export function hideOtherElements(): void {
    HIDDEN_SELECTORS.forEach(selector => {
        const el = document.querySelector(selector);
        if (el) {
            (el as HTMLElement).style.visibility = 'hidden';
        }
    });
}

/** Restore the previously-hidden page chrome to `visibility: visible` */
export function restoreOtherElements(): void {
    HIDDEN_SELECTORS.forEach(selector => {
        const el = document.querySelector(selector);
        if (el) {
            (el as HTMLElement).style.visibility = 'visible';
        }
    });
}
