import type { SystemMonitorConfig, SystemMonitorDomRefs } from '../types';

/**
 * Apply position, layout class, and font styles to the monitor container
 * based on the current config. Does not re-render row contents; that
 * happens separately via renderer.updateItem when alignment changes.
 */
export function applyConfig(refs: SystemMonitorDomRefs | null, config: SystemMonitorConfig): void {
    if (!refs) return;

    const isLeft = config.monitorPosition === 'left';

    // Position: x is always distance from LEFT edge (0=leftmost, 100=rightmost)
    // SCSS translate(-50%, -50%) centers on this point
    refs.container.style.left = `${config.monitorX}%`;
    refs.container.style.right = 'auto';
    refs.container.style.top = `${config.monitorY}%`;

    // Direction class on background (align-items controls all rows)
    refs.background.classList.toggle('left-side', isLeft);
    refs.background.classList.toggle('right-side', !isLeft);
    refs.background.classList.toggle('horizontal-layout', config.barLayout === 'horizontal');

    // Mirror the same layout classes onto the card-mode container so
    // cards and rows share one layout system (left/right side + horizontal bar).
    const cardsContainer = refs.container.querySelector<HTMLElement>('.sysmon-cards');
    if (cardsContainer) {
        cardsContainer.classList.toggle('left-side', isLeft);
        cardsContainer.classList.toggle('right-side', !isLeft);
        cardsContainer.classList.toggle('horizontal-layout', config.barLayout === 'horizontal');
    }

    // Font styles
    const rows = [refs.cpuRow, refs.gpuRow, refs.memoryRow, refs.networkRow];
    rows.forEach(row => {
        if (row) {
            row.style.fontSize = `${config.monitorSize}px`;
            row.style.color = config.monitorColor;
        }
    });
}
