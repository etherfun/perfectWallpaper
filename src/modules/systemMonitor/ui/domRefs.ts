import { debugLogger } from '@/utils/logger';

import type { SystemMonitorDomRefs } from '../types';

/**
 * Look up the pre-built DOM elements declared in index.html.
 * Returns null when the mandatory container / background are missing.
 */
export function queryDomElements(): SystemMonitorDomRefs | null {
    const container = document.getElementById('system-monitor');
    const background = container?.querySelector<HTMLElement>('.background') || null;

    if (!container || !background) {
        debugLogger.error('[Sysmon] DOM elements not found in HTML', {
            missing: 'system-monitor or .background',
        });
        return null;
    }

    return {
        container,
        background,
        cpuRow: container.querySelector<HTMLElement>('.sysmon-cpu'),
        gpuRow: container.querySelector<HTMLElement>('.sysmon-gpu'),
        memoryRow: container.querySelector<HTMLElement>('.sysmon-memory'),
        networkRow: container.querySelector<HTMLElement>('.sysmon-network'),
    };
}
