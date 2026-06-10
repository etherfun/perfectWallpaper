import { fetchAggregate } from './api';
import { applyConfig } from './configApply';
import { DEFAULT_CONFIG } from './constants';
import { queryDomElements } from './domRefs';
import { formatBytes, formatTemperature } from './formatters';
import { pickPrimaryGpu } from './gpuSelector';
import { type DisplayMode, pushHistory, renderRow, type RowPayload } from './renderer';
import type {
    AggregateInfo,
    CpuInfo,
    GpuInfo,
    SystemMonitorConfig,
    SystemMonitorDomRefs,
} from './types';

/**
 * System Monitor Module
 * 系统监控模块 - 显示CPU、GPU、内存等信息
 * 布局使用预置HTML结构，JS只负责更新文本内容
 */
export class SystemMonitor {
    // Pre-built DOM elements from index.html
    private refs: SystemMonitorDomRefs | null = null;

    private pollInterval: number | null = null;
    private cpuHistory: number[] = [];
    private memoryHistory: number[] = [];
    private gpuHistory: number[] = [];
    private networkRxHistory: number[] = [];
    private networkTxHistory: number[] = [];
    private config: SystemMonitorConfig = { ...DEFAULT_CONFIG };
    private enabled: boolean = false;
    private disconnectTimer: number | null = null;
    private lastConnectedTime: number = 0;
    private hasEverConnected: boolean = false;
    private lastMonitorPosition: 'left' | 'right' = 'right';

    constructor() {
        this.init();
    }

    private init(): void {
        const refs = queryDomElements();
        if (!refs) return;
        this.refs = refs;

        // Apply initial font styles to each row
        const rows = [refs.cpuRow, refs.gpuRow, refs.memoryRow, refs.networkRow];
        rows.forEach(row => {
            if (row) {
                row.style.fontSize = `${this.config.monitorSize}px`;
                row.style.color = this.config.monitorColor;
                row.style.textShadow = 'var(--sysmon-text-shadow, 0 0 5px rgba(0,0,0,0.5))';
            }
        });

        this.applyConfig();
        this.setEnabled(this.config.enabled);

        // Only start polling if enabled in config
        if (this.config.enabled) {
            this.startPolling();
        }
    }

    private async pollData(): Promise<void> {
        if (!this.enabled) return;

        const data = await fetchAggregate(this.config.serverUrl);
        if (data) {
            // Mark as connected on first success
            if (!this.hasEverConnected) {
                this.hasEverConnected = true;
            }
            // Reset disconnect timer on successful connection
            this.lastConnectedTime = Date.now();
            if (this.disconnectTimer) {
                clearTimeout(this.disconnectTimer);
                this.disconnectTimer = null;
            }
            this.updateDisplay(data);
            return;
        }

        // fetchAggregate already logged the
        // underlying error (HTTP / network /
        // server message). Only start the
        // disconnect timer if we've ever
        // connected before — first-poll failure
        // during startup is expected (server
        // might still be initializing).
        if (this.hasEverConnected && !this.disconnectTimer) {
            this.disconnectTimer = window.setTimeout(() => {
                this.destroy();
            }, this.config.disconnectTimeout);
        }
    }

    private updateDisplay(data: AggregateInfo): void {
        const refs = this.refs;
        if (!refs) return;

        // CPU
        // `/api/sysinfo` returns `cpu` as a
        // `CpuInfo[]`. On mainstream PCs the
        // array has exactly one element; we
        // always render from index 0 and
        // silently fall back to zeros if the
        // array is empty or missing. The
        // `?? 0` and `?? undefined` patterns
        // satisfy `noUncheckedIndexedAccess`:
        // we explicitly acknowledge the
        // "missing slot" branch instead of
        // asserting non-null.
        this.renderSimple(refs.cpuRow, this.config.showCpu, this.config.cpuMode, () => {
            const cpu0: CpuInfo | undefined = data.cpu[0];
            const usage = Math.round(cpu0?.usage ?? 0);
            const tempText = cpu0 ? (formatTemperature(cpu0.temperature) ?? undefined) : undefined;
            pushHistory(this.cpuHistory, usage);
            return { value: usage, extra: tempText };
        });

        // GPU
        // Pick the most informative card from `data.gpu[]`
        // instead of always taking index 0. On hybrid
        // laptops (iGPU + dGPU) LHM reports the iGPU
        // first and its temperature sensor is usually
        // missing, which would make the row look broken
        // even though the dGPU is fine.
        const gpu: GpuInfo | undefined = pickPrimaryGpu(data.gpu);
        this.renderSimple(refs.gpuRow, this.config.showGpu && !!gpu, this.config.gpuMode, () => {
            if (!gpu) return null;
            const usage = Math.round(gpu.utilization ?? 0);
            const tempText = formatTemperature(gpu.temperature) ?? undefined;
            pushHistory(this.gpuHistory, usage);
            return { value: usage, extra: tempText };
        });

        // Memory
        this.renderSimple(refs.memoryRow, this.config.showMemory, this.config.memoryMode, () => {
            const usedPct = Math.round(data.memory.used_percent ?? 0);
            const usedStr = formatBytes(data.memory.used ?? 0).slice(0, -3);
            const totalStr = formatBytes(data.memory.total ?? 0);
            pushHistory(this.memoryHistory, usedPct);
            return { value: usedPct, extra: `${usedStr}/${totalStr}` };
        });

        // Network
        this.renderNetwork(
            refs.networkRow,
            this.config.showNetwork,
            this.config.networkMode,
            () => {
                const rx = data.network.rx ?? 0;
                const tx = data.network.tx ?? 0;
                const maxBps = Math.max(rx, tx, 1);
                const rxPct = clampPct((rx / maxBps) * 100);
                const txPct = clampPct((tx / maxBps) * 100);
                pushHistory(this.networkRxHistory, rxPct);
                pushHistory(this.networkTxHistory, txPct);
                return {
                    netRx: `${formatBytes(rx)}/s`,
                    netTx: `${formatBytes(tx)}/s`,
                    netRxPct: rxPct,
                    netTxPct: txPct,
                };
            }
        );
    }

    /**
     * Render a simple (cpu/gpu/memory) row. The producer may return null to
     * hide the row this frame (e.g. gpu is missing on this host).
     */
    private renderSimple(
        row: HTMLElement | null,
        visible: boolean,
        mode: DisplayMode,
        produce: () => RowPayload | null
    ): void {
        if (!visible || !row) {
            if (row) row.style.display = 'none';
            return;
        }
        const payload = produce();
        if (!payload) {
            row.style.display = 'none';
            return;
        }
        const history = historyForMetric(row, this);
        renderRow(row, payload, mode, history);
    }

    /** Render the network row. Network has its own history lane pair. */
    private renderNetwork(
        row: HTMLElement | null,
        visible: boolean,
        mode: DisplayMode,
        produce: () => RowPayload
    ): void {
        if (!visible || !row) {
            if (row) row.style.display = 'none';
            return;
        }
        const payload = produce();
        // Network curves use the rx history as the primary; the tx lane
        // reuses the same buffer for visual symmetry (callers can supply
        // a richer payload to override this).
        renderRow(row, payload, mode, this.networkRxHistory);
    }

    public updateConfig(newConfig: Partial<SystemMonitorConfig>): void {
        const wasEnabled = this.config.enabled;
        this.config = { ...this.config, ...newConfig };

        if (newConfig.serverPort !== undefined) {
            // Same as DEFAULT_CONFIG.serverUrl:
            // origin only, the api helpers append
            // the endpoint path.
            this.config.serverUrl = `http://localhost:${this.config.serverPort}`;
        }

        if (newConfig.enabled !== undefined && newConfig.enabled !== wasEnabled) {
            this.setEnabled(newConfig.enabled);
        }

        this.applyConfig();
    }

    private applyConfig(): void {
        applyConfig(this.refs, this.config);

        // Only re-render when alignment changes (performance optimization)
        const alignmentChanged = this.lastMonitorPosition !== this.config.monitorPosition;
        if (alignmentChanged) {
            this.lastMonitorPosition = this.config.monitorPosition;
            this.rerenderAllRows();
        }
    }

    private rerenderAllRows(): void {
        if (!this.refs) return;

        // Force re-render of all visible rows to reposition viz elements.
        // The last cached value/extra are not preserved across alignment
        // flips; we emit an empty payload which still clears the viz slot.
        if (this.config.showCpu) {
            renderRow(
                this.refs.cpuRow,
                { value: lastOf(this.cpuHistory) },
                this.config.cpuMode,
                this.cpuHistory
            );
        }
        if (this.config.showGpu) {
            renderRow(
                this.refs.gpuRow,
                { value: lastOf(this.gpuHistory) },
                this.config.gpuMode,
                this.gpuHistory
            );
        }
        if (this.config.showMemory) {
            renderRow(
                this.refs.memoryRow,
                { value: lastOf(this.memoryHistory) },
                this.config.memoryMode,
                this.memoryHistory
            );
        }
        if (this.config.showNetwork) {
            renderRow(
                this.refs.networkRow,
                {
                    value: 0,
                    netRx: '0 B/s',
                    netTx: '0 B/s',
                    netRxPct: 0,
                    netTxPct: 0,
                },
                this.config.networkMode,
                this.networkRxHistory
            );
        }
    }

    public destroy(): void {
        this.stopPolling();
        instance = null;
    }

    public toggle(): void {
        this.setEnabled(!this.enabled);
    }

    public isEnabled(): boolean {
        return this.enabled;
    }

    public setEnabled(enabled: boolean): void {
        this.enabled = enabled;
        if (enabled) {
            this.startPolling();
            if (this.refs?.container) this.refs.container.style.display = '';
        } else {
            this.stopPolling();
            if (this.refs?.container) this.refs.container.style.display = 'none';
        }
    }

    private startPolling(): void {
        if (this.pollInterval) return;
        void this.pollData();
        this.pollInterval = window.setInterval(
            () => void this.pollData(),
            this.config.updateInterval
        );
    }

    private stopPolling(): void {
        if (this.pollInterval) {
            clearInterval(this.pollInterval);
            this.pollInterval = null;
        }
        if (this.disconnectTimer) {
            clearTimeout(this.disconnectTimer);
            this.disconnectTimer = null;
        }
    }
}

/**
 * Pick the matching history buffer for a simple row based on its metric tag.
 * Falls back to an empty buffer (so curve mode renders no curve yet) when
 * the row has no data-metric attribute.
 */
function historyForMetric(row: HTMLElement, owner: SystemMonitor): number[] {
    // Access private fields through a typed alias — this is a deliberate,
    // tightly-scoped bridge that keeps the renderer free of metric branching.
    const self = owner as unknown as {
        cpuHistory: number[];
        gpuHistory: number[];
        memoryHistory: number[];
    };
    switch (row.dataset.metric) {
        case 'cpu':
            return self.cpuHistory;
        case 'gpu':
            return self.gpuHistory;
        case 'memory':
            return self.memoryHistory;
        default:
            return [];
    }
}

function lastOf(history: number[]): number {
    if (history.length === 0) return 0;
    return history[history.length - 1] ?? 0;
}

function clampPct(v: number): number {
    if (Number.isNaN(v) || !Number.isFinite(v)) return 0;
    if (v < 0) return 0;
    if (v > 100) return 100;
    return v;
}

// 导出单例
let instance: SystemMonitor | null = null;

export function initSystemMonitor(): SystemMonitor {
    if (!instance) {
        instance = new SystemMonitor();
    }
    return instance;
}

export function getSystemMonitor(): SystemMonitor | null {
    return instance;
}
