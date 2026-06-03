/**
 * Optional clock widget rendered in the top-left of the lyrics overlay.
 */

const CLOCK_INTERVAL_MS = 1000;

/**
 * Start a 1Hz tick that updates `clockElement.textContent` to the current
 * local time. The tick is gated on `isVisible()` so the DOM write only
 * happens while the overlay is shown.
 *
 * Returns a `stop` function that clears the interval.
 */
export function startClockUpdate(
    clockElement: HTMLElement,
    isVisible: () => boolean
): () => void {
    const updateClock = (): void => {
        if (clockElement && isVisible()) {
            clockElement.textContent = new Date().toLocaleTimeString();
        }
    };
    updateClock();
    const id = setInterval(updateClock, CLOCK_INTERVAL_MS) as unknown as number;
    return () => clearInterval(id);
}
