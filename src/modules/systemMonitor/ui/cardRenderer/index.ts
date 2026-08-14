/**
 * Card-mode renderer for the System Monitor.
 *
 * When `displayStyle === 'cards'`, the existing compact rows are replaced
 * with rich cards that show a large primary value, a meta info grid, and
 * multiple sparkline canvases.
 *
 * Architecture mirror: sysmon-card-preview.html (Style D – Stacked List)
 *
 * Each card is a `.sysmon-card` element with the structure:
 *   .sysmon-card
 *     .sysmon-card__label-row  → metric label (e.g. "CPU · AMD Ryzen 9 7845HX")
 *     .sysmon-card__value-row  → value + extra (e.g. "13%" "(89°C)")
 *     .sysmon-card__meta       → info grid (e.g. "Freq 5065 MHz")
 *     .sysmon-card__sparks     → sparkline area (spark-pair × N)
 *       .spark-pair
 *         .head                → label + current value + axis
 *         canvas.spark         → the sparkline canvas
 */

export { buildCards, destroyCards } from './create';
export { routeSparkCanvas } from './sparks';
export { updateCards } from './update';
