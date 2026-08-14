import { fetchAggregate } from '../api/api';
import type { AggregateInfo } from '../types';

/** State the polling loop needs from the SystemMonitor instance. */
export interface PollOwner {
    enabled: boolean;
    config: { serverUrl: string; disconnectTimeout: number; updateInterval: number };
    hasEverConnected: boolean;
    lastConnectedTime: number;
    disconnectTimer: number | null;
    pollInterval: number | null;
    updateDisplay(data: AggregateInfo): void;
    destroy(): void;
}

/**
 * One poll cycle: fetch the aggregate data and update the display.
 * The caller (SystemMonitor) decides whether polling is enabled.
 */
export async function pollDataOnce(owner: PollOwner): Promise<void> {
    if (!owner.enabled) return;

    const data = await fetchAggregate(owner.config.serverUrl);
    if (data) {
        // Mark as connected on first success
        if (!owner.hasEverConnected) {
            owner.hasEverConnected = true;
        }
        // Reset disconnect timer on successful connection
        owner.lastConnectedTime = Date.now();
        if (owner.disconnectTimer) {
            clearTimeout(owner.disconnectTimer);
            owner.disconnectTimer = null;
        }
        owner.updateDisplay(data);
        return;
    }

    // fetchAggregate already logged the
    // underlying error (HTTP / network /
    // server message). Only start the
    // disconnect timer if we've ever
    // connected before – first-poll failure
    // during startup is expected (server
    // might still be initializing).
    if (owner.hasEverConnected && !owner.disconnectTimer) {
        owner.disconnectTimer = window.setTimeout(() => {
            owner.destroy();
        }, owner.config.disconnectTimeout);
    }
}

/** Kick off the polling loop (idempotent — skips when already running). */
export function startPollingLoop(owner: PollOwner): void {
    if (owner.pollInterval) return;
    void pollDataOnce(owner);
    owner.pollInterval = window.setInterval(
        () => void pollDataOnce(owner),
        owner.config.updateInterval
    );
}

/** Stop the polling loop and any pending disconnect timer. */
export function stopPollingLoop(owner: PollOwner): void {
    if (owner.pollInterval) {
        clearInterval(owner.pollInterval);
        owner.pollInterval = null;
    }
    if (owner.disconnectTimer) {
        clearTimeout(owner.disconnectTimer);
        owner.disconnectTimer = null;
    }
}
