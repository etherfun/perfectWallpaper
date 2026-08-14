import { formatBytes, formatTemperature } from '../api/formatters';
import { pickPrimaryGpu } from '../api/gpuSelector';
import { DEFAULT_CONFIG } from '../constants';
import type {
    AggregateInfo,
    CardRenderData,
    CpuInfo,
    GpuInfo,
    SystemMonitorCardDomRefs,
    SystemMonitorConfig,
    SystemMonitorDomRefs,
} from '../types';
import { buildCards, destroyCards, updateCards } from '../ui/cardRenderer';
import { queryDomElements } from '../ui/domRefs';
import { type DisplayMode, pushHistory, renderRow, type RowPayload } from '../ui/renderer';
import { applyDisplayConfig, type DisplayOwner, toggleDisplayStyle } from './controller';
import {
    buildCpuCard,
    buildDiskCards,
    buildGpuCard,
    buildMemoryCard,
    buildNetworkCard,
    type CpuCardHistories,
    type DiskCardHistories,
    type GpuCardHistories,
} from './format';
import { historyForMetric } from './history';
import { pollDataOnce, type PollOwner, startPollingLoop, stopPollingLoop } from './query';

/**
 * System Monitor Module
 * 系统监控模块 - 显示CPU、GPU、内存等信息
 * 布局使用预置 HTML 结构，JS 只负责更新文本内容
 */
export class SystemMonitor implements DisplayOwner, PollOwner, CpuCardHistories, GpuCardHistories, DiskCardHistories {
    // Pre-built DOM elements from index.html
    refs: SystemMonitorDomRefs | null = null;
    /** Card-mode DOM refs (only set when displayStyle === 'cards') */
    cardRefs: SystemMonitorCardDomRefs | null = null;

    pollInterval: number | null = null;
    cpuHistory: number[] = [];
    cpuTempHistory: number[] = [];
    cpuPowerHistory: number[] = [];
    memoryHistory: number[] = [];
    gpuHistory: number[] = [];
    gpuTempHistory: number[] = [];
    gpuPowerHistory: number[] = [];
    gpuVramHistory: number[] = [];
    networkRxHistory: number[] = [];
    networkTxHistory: number[] = [];
    /** Per-disk usage history, keyed by disk index */
    diskHistories: Map<number, number[]> = new Map();
    /** Per-disk read rate history (bytes/s), keyed by disk index */
    diskReadHistory: Map<number, number[]> = new Map();
    /** Per-disk write rate history (bytes/s), keyed by disk index */
    diskWriteHistory: Map<number, number[]> = new Map();
    /** Per-disk I/O activity history (0-100%), keyed by disk index */
    diskActivityHistory: Map<number, number[]> = new Map();
    config: SystemMonitorConfig = { ...DEFAULT_CONFIG };
    enabled: boolean = false;
    disconnectTimer: number | null = null;
    lastConnectedTime: number = 0;
    hasEverConnected: boolean = false;
    lastMonitorPosition: 'left' | 'right' = 'right';
    lastDisplayStyle: 'rows' | 'cards' = 'rows';

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

        // If starting in card mode, build card DOM and hide rows
        if (this.config.displayStyle === 'cards') {
            if (this.refs?.background) this.refs.background.style.display = 'none';
            if (this.refs?.container) {
                this.cardRefs = buildCards(this.refs.container);
            }
        }

        applyDisplayConfig(this);
        this.setEnabled(this.config.enabled);

        // Only start polling if enabled in config
        if (this.config.enabled) {
            this.startPolling();
        }
    }

    /**
     * 延迟初始化：如果构造函数执行时 DOM 尚不存在（Vue 尚未 mount），
     * 则在 DOM 就绪后由 SystemMonitor.vue 的 onMounted 调用本方法。
     * 幂等方法——已初始化则跳过。
     */
    ensureInitialized(): void {
        if (this.refs) return;
        this.init();
    }

    private async pollData(): Promise<void> {
        await pollDataOnce(this);
    }

    updateDisplay(data: AggregateInfo): void {
        const refs = this.refs;
        if (!refs) return;

        if (this.config.displayStyle === 'cards') {
            this.updateCardDisplay(data);
            return;
        }

        // ── Row-mode rendering (existing) ──

        // CPU
        this.renderSimple(refs.cpuRow, this.config.showCpu, this.config.cpuMode, () => {
            const cpu0: CpuInfo | undefined = data.cpu[0];
            const usage = Math.round(cpu0?.usage ?? 0);
            const tempText = cpu0 ? (formatTemperature(cpu0.temperature) ?? undefined) : undefined;
            pushHistory(this.cpuHistory, usage);
            return { value: usage, extra: tempText };
        });

        // GPU
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
     * Update card-mode display with the latest aggregate data.
     */
    private updateCardDisplay(data: AggregateInfo): void {
        if (!this.cardRefs) return;

        const cpu0: CpuInfo | undefined = data.cpu[0];
        const gpu: GpuInfo | undefined = pickPrimaryGpu(data.gpu);

        // Push history buffers
        if (cpu0) {
            pushHistory(this.cpuHistory, Math.round(cpu0.usage ?? 0));
            if (cpu0.temperature > 0)
                pushHistory(this.cpuTempHistory, Math.round(cpu0.temperature));
            if ((cpu0.power_package ?? 0) > 0)
                pushHistory(this.cpuPowerHistory, cpu0.power_package ?? 0);
        }
        if (gpu) {
            pushHistory(this.gpuHistory, Math.round(gpu.utilization ?? 0));
            if (gpu.temperature > 0) pushHistory(this.gpuTempHistory, Math.round(gpu.temperature));
            if ((gpu.power ?? 0) > 0) pushHistory(this.gpuPowerHistory, gpu.power ?? 0);
            const vramPct = gpu.vram_used_percent ?? 0;
            if (vramPct > 0) pushHistory(this.gpuVramHistory, Math.round(vramPct));
        }

        const memUsedPct = Math.round(data.memory.used_percent ?? 0);
        pushHistory(this.memoryHistory, memUsedPct);

        const rx = data.network.rx ?? 0;
        const tx = data.network.tx ?? 0;
        pushHistory(this.networkRxHistory, rx);
        pushHistory(this.networkTxHistory, tx);

        // Build card render data
        const renderData: CardRenderData = {
            cpu: buildCpuCard(cpu0, this.config, this),
            gpu: buildGpuCard(gpu, this.config, this),
            memory: buildMemoryCard(data.memory, this.config, this.memoryHistory),
            network: buildNetworkCard(
                data.network,
                this.config,
                this.networkRxHistory,
                this.networkTxHistory
            ),
            disks: buildDiskCards(data.disks.drives, this.config, this),
        };

        updateCards(this.cardRefs, renderData, {
            monitorColor: this.config.monitorColor,
            monitorSize: this.config.monitorSize,
        });
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
        const wasStyle = this.config.displayStyle;
        this.config = { ...this.config, ...newConfig };

        if (newConfig.serverPort !== undefined) {
            this.config.serverUrl = `http://localhost:${this.config.serverPort}`;
        }

        if (newConfig.enabled !== undefined && newConfig.enabled !== wasEnabled) {
            this.setEnabled(newConfig.enabled);
        }

        // Handle displayStyle toggle
        if (newConfig.displayStyle !== undefined && newConfig.displayStyle !== wasStyle) {
            toggleDisplayStyle(this, newConfig.displayStyle);
        }

        applyDisplayConfig(this);
    }

    public destroy(): void {
        this.stopPolling();
        if (this.refs?.container) destroyCards(this.refs.container);
        this.cardRefs = null;
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
            // In card mode, cards container visibility is controlled by buildCards/destroyCards
        } else {
            this.stopPolling();
            if (this.refs?.container) this.refs.container.style.display = 'none';
        }
    }

    private startPolling(): void {
        startPollingLoop(this);
    }

    private stopPolling(): void {
        stopPollingLoop(this);
    }
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
