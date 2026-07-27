import { globalT } from '@/utils/i18n';

import { fetchAggregate } from './api/api';
import { formatBytes, formatTemperature } from './api/formatters';
import { pickPrimaryGpu } from './api/gpuSelector';
import { DEFAULT_CONFIG } from './constants';
import type {
    AggregateInfo,
    CardPayload,
    CardRenderData,
    CpuInfo,
    DiskDriveInfo,
    GpuInfo,
    SparkChannel,
    SystemMonitorCardDomRefs,
    SystemMonitorConfig,
    SystemMonitorDomRefs,
    TempRange,
} from './types';
import { buildCards, destroyCards, updateCards } from './ui/cardRenderer';
import { applyConfig } from './ui/configApply';
import { queryDomElements } from './ui/domRefs';
import { type DisplayMode, pushHistory, renderRow, type RowPayload } from './ui/renderer';

/**
 * System Monitor Module
 * 绯荤粺鐩戞帶妯″潡 - 鏄剧ずCPU銆丟PU銆佸唴瀛樼瓑淇℃伅
 * 甯冨眬浣跨敤棰勭疆HTML缁撴瀯锛孞S鍙礋璐ｆ洿鏂版枃鏈唴瀹?
 */
export class SystemMonitor {
    // Pre-built DOM elements from index.html
    private refs: SystemMonitorDomRefs | null = null;
    /** Card-mode DOM refs (only set when displayStyle === 'cards') */
    private cardRefs: SystemMonitorCardDomRefs | null = null;

    private pollInterval: number | null = null;
    private cpuHistory: number[] = [];
    private cpuTempHistory: number[] = [];
    private cpuPowerHistory: number[] = [];
    private memoryHistory: number[] = [];
    private gpuHistory: number[] = [];
    private gpuTempHistory: number[] = [];
    private gpuPowerHistory: number[] = [];
    private gpuVramHistory: number[] = [];
    private networkRxHistory: number[] = [];
    private networkTxHistory: number[] = [];
    /** Per-disk usage history, keyed by disk index */
    private diskHistories: Map<number, number[]> = new Map();
    /** Per-disk read rate history (bytes/s), keyed by disk index */
    private diskReadHistory: Map<number, number[]> = new Map();
    /** Per-disk write rate history (bytes/s), keyed by disk index */
    private diskWriteHistory: Map<number, number[]> = new Map();
    /** Per-disk I/O activity history (0-100%), keyed by disk index */
    private diskActivityHistory: Map<number, number[]> = new Map();
    private config: SystemMonitorConfig = { ...DEFAULT_CONFIG };
    private enabled: boolean = false;
    private disconnectTimer: number | null = null;
    private lastConnectedTime: number = 0;
    private hasEverConnected: boolean = false;
    private lastMonitorPosition: 'left' | 'right' = 'right';
    private lastDisplayStyle: 'rows' | 'cards' = 'rows';

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

        this.applyConfig();
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
        // connected before – first-poll failure
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

        if (this.config.displayStyle === 'cards') {
            this.updateCardDisplay(data);
            return;
        }

        // 鈹€鈹€ Row-mode rendering (existing) 鈹€鈹€

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
            cpu: this.buildCpuCard(cpu0),
            gpu: this.buildGpuCard(gpu),
            memory: this.buildMemoryCard(data.memory),
            network: this.buildNetworkCard(data.network),
            disks: this.buildDiskCards(data.disks.drives),
        };

        updateCards(this.cardRefs, renderData, {
            monitorColor: this.config.monitorColor,
            monitorSize: this.config.monitorSize,
        });
    }

    /** Build the CPU card payload. */
    private buildCpuCard(cpu: CpuInfo | undefined): CardPayload | null {
        if (!cpu || !this.config.showCpu) return null;
        const usage = Math.round(cpu.usage ?? 0);
        const temp = cpu.temperature;
        const hasTemp = temp > 0 && Number.isFinite(temp);

        const sparks: SparkChannel[] = [];
        const sparkLayout = 'double-full';

        sparks.push({
            kind: 'util',
            history: [...this.cpuHistory],
            displayValue: `${usage}%`,
        });

        if (hasTemp && this.cpuTempHistory.length > 0) {
            const cpuCrit = cpu.temperature_critical ?? 95;
            sparks.push({
                kind: 'temp',
                history: [...this.cpuTempHistory],
                range: { lo: 40, hi: Math.max(cpuCrit + 5, 95), crit: cpuCrit },
                displayValue: `${Math.round(temp)}掳C`,
                tag: `max ${Math.round(cpu.temperature_max ?? temp)}`,
            });
        }

        const power = cpu.power_package;
        if (power != null && power > 0 && this.cpuPowerHistory.length > 0) {
            const peak = Math.max(1, ...this.cpuPowerHistory);
            sparks.push({
                kind: 'power',
                history: [...this.cpuPowerHistory],
                displayValue: `${power.toFixed(1)} W`,
                tag: `peak ${Math.round(peak)}`,
            });
        }

        const freq = cpu.speed > 0 ? `${cpu.speed} MHz` : null;
        const maxCoreUsage =
            cpu.usage_max_core != null
                ? `#${cpu.usage_max_core_index ?? 0} ${Math.round(cpu.usage_max_core)}%`
                : null;
        const voltage = cpu.voltage_core != null ? `${cpu.voltage_core.toFixed(2)} V` : null;

        const meta: Array<{ label: string; value: string }> = [];
        if (freq) meta.push({ label: globalT('sysmon_card_freq'), value: freq });
        if (power != null)
            meta.push({ label: globalT('sysmon_card_power'), value: `${power.toFixed(1)} W` });
        if (maxCoreUsage) meta.push({ label: globalT('sysmon_card_hot'), value: maxCoreUsage });
        if (voltage) meta.push({ label: globalT('sysmon_card_vcore'), value: voltage });

        return {
            label: `${globalT('sysmon_card_label_cpu')} 路 ${cpu.brand}`,
            value: `${usage}%`,
            extra: hasTemp ? `(${Math.round(temp)}°C)` : null,
            meta,
            sparks,
            sparkLayout,
        };
    }

    /** Build the GPU card payload. */
    private buildGpuCard(gpu: GpuInfo | undefined): CardPayload | null {
        if (!gpu || !this.config.showGpu) return null;
        const usage = Math.round(gpu.utilization ?? 0);
        const temp = gpu.temperature;
        const hasTemp = temp > 0 && Number.isFinite(temp);

        const sparks: SparkChannel[] = [];

        sparks.push({
            kind: 'util',
            history: [...this.gpuHistory],
            displayValue: `${usage}%`,
        });
        let sparkCount = 1;

        if (hasTemp && this.gpuTempHistory.length > 0) {
            const crit = gpu.temperature_critical ?? 92;
            sparks.push({
                kind: 'temp',
                history: [...this.gpuTempHistory],
                range: { lo: 30, hi: Math.max(crit + 5, 95), crit },
                displayValue: `${Math.round(temp)}°C`,
            });
            sparkCount++;
        }

        const power = gpu.power;
        if (power != null && power > 0 && this.gpuPowerHistory.length > 0) {
            const peak = Math.max(1, ...this.gpuPowerHistory);
            sparks.push({
                kind: 'power',
                history: [...this.gpuPowerHistory],
                displayValue: `${power.toFixed(1)} W`,
                tag: `peak ${Math.round(peak)}`,
            });
            sparkCount++;
        }

        const vramPct = Math.round(gpu.vram_used_percent ?? 0);
        if (vramPct > 0 && this.gpuVramHistory.length > 0) {
            sparks.push({
                kind: 'vram',
                history: [...this.gpuVramHistory],
                displayValue: `${vramPct}%`,
            });
            sparkCount++;
        }

        // Choose layout variant based on spark count
        const sparkLayout =
            sparkCount === 4
                ? 'quad'
                : sparkCount === 3
                  ? 'triple'
                  : sparkCount === 2
                    ? 'double-full'
                    : 'solo';

        const vramStr = formatBytes(gpu.vram_total ?? 0);
        const vramUsedStr = formatBytes(gpu.vram_used ?? 0);
        const coreClock = gpu.core_clock != null ? `${gpu.core_clock} MHz` : null;
        const memJunc = gpu.temperature_memory_junction;
        const memJuncStr =
            memJunc != null && memJunc > 0 && Number.isFinite(memJunc)
                ? `${Math.round(memJunc)}°C`
                : null;

        const meta: Array<{ label: string; value: string }> = [];
        if (power != null)
            meta.push({ label: globalT('sysmon_card_power'), value: `${power.toFixed(1)} W` });
        meta.push({ label: globalT('sysmon_card_vram_meta'), value: `${vramUsedStr}/${vramStr}` });
        if (coreClock) meta.push({ label: globalT('sysmon_card_core_clock'), value: coreClock });
        if (memJuncStr) meta.push({ label: globalT('sysmon_card_mem_junc'), value: memJuncStr });

        return {
            label: `${globalT('sysmon_card_label_gpu')} 路 ${gpu.model}`,
            value: `${usage}%`,
            extra: hasTemp ? `(${Math.round(temp)}°C)` : null,
            meta,
            sparks,
            sparkLayout: sparkLayout as CardPayload['sparkLayout'],
        };
    }

    /** Build the memory card payload. */
    private buildMemoryCard(memory: {
        total: number;
        used: number;
        used_percent: number;
    }): CardPayload | null {
        if (!this.config.showMemory) return null;
        const usedPct = Math.round(memory.used_percent ?? 0);
        const usedStr = formatBytes(memory.used ?? 0);
        const totalStr = formatBytes(memory.total ?? 0);

        const sparks: SparkChannel[] = [
            {
                kind: 'util',
                history: [...this.memoryHistory],
                displayValue: `${usedPct}%`,
            },
        ];

        const meta: Array<{ label: string; value: string }> = [
            { label: globalT('sysmon_card_used'), value: usedStr },
            { label: 'Total', value: totalStr },
        ];

        return {
            label: `${globalT('sysmon_card_label_mem')}`,
            value: `${usedPct}%`,
            extra: `(${usedStr}/${totalStr})`,
            meta,
            sparks,
            sparkLayout: 'solo',
        };
    }

    /** Build the network card payload. */
    private buildNetworkCard(network: { rx: number; tx: number }): CardPayload | null {
        if (!this.config.showNetwork) return null;
        const rx = network.rx ?? 0;
        const tx = network.tx ?? 0;
        const rxStr = `${formatBytes(rx)}/s`;
        const txStr = `${formatBytes(tx)}/s`;

        // Combined spark: rx + tx overlaid on single canvas
        const sparks: SparkChannel[] = [];
        if (this.networkRxHistory.length > 0 && this.networkTxHistory.length > 0) {
            sparks.push({
                kind: 'rx-tx',
                history: [...this.networkRxHistory],
                dirRx: [...this.networkTxHistory],
                displayValue: rxStr,
                dirTxDisplay: txStr,
            });
        }

        const meta: Array<{ label: string; value: string }> = [
            // { label: globalT('sysmon_card_rx_meta'), value: rxStr },
            // { label: globalT('sysmon_card_tx_meta'), value: txStr },
        ];

        // Use combined throughput for main value display
        const primary = rx + tx;
        const primaryStr = `${formatBytes(primary)}/s`;

        return {
            label: `${globalT('sysmon_card_label_net')}`,
            value: primaryStr,
            extra: null,
            meta,
            sparks,
            sparkLayout: 'combined',
        };
    }

    /**
     * Build disk card payloads from the drives array in the aggregate.
     * History maps are updated inline so sparklines stay in sync with
     * the main 1-Hz poll – no separate disk polling needed.
     */
    private buildDiskCards(drives: DiskDriveInfo[]): CardPayload[] {
        if (!drives || !this.config.showDisk) return [];
        if (drives.length === 0) return [];

        return drives.map((disk, index) => {
            const usedPct = Math.round(disk.used_percent ?? 0);
            const usedStr = formatBytes(disk.total_used_bytes ?? 0);
            const temp = disk.temperature;
            const hasTemp = temp != null && temp > 0 && Number.isFinite(temp);
            const life = disk.life_remaining_percent;

            // Update all per-disk history maps inline
            let hist = this.diskHistories.get(index);
            if (!hist) {
                hist = [];
                this.diskHistories.set(index, hist);
            }
            pushHistory(hist, usedPct);

            const readRate = disk.read_rate ?? 0;
            let readHist = this.diskReadHistory.get(index);
            if (!readHist) {
                readHist = [];
                this.diskReadHistory.set(index, readHist);
            }
            pushHistory(readHist, readRate);

            const writeRate = disk.write_rate ?? 0;
            let writeHist = this.diskWriteHistory.get(index);
            if (!writeHist) {
                writeHist = [];
                this.diskWriteHistory.set(index, writeHist);
            }
            pushHistory(writeHist, writeRate);

            const activity = disk.total_activity ?? 0;
            let actHist = this.diskActivityHistory.get(index);
            if (!actHist) {
                actHist = [];
                this.diskActivityHistory.set(index, actHist);
            }
            pushHistory(actHist, activity);

            const busLabel = disk.is_nvme
                ? 'NVMe'
                : disk.is_ssd
                  ? 'SSD'
                  : disk.is_hdd
                    ? 'HDD'
                    : disk.bus_type;

            const lastReadBps = readHist[readHist.length - 1] ?? 0;
            const lastWriteBps = writeHist[writeHist.length - 1] ?? 0;

            // Primary value = TotalActivity (disk I/O utilisation %)
            const primaryStr = `${activity.toFixed(1)}%`;

            // Build sparks: Read, Write, then Util
            const sparks: SparkChannel[] = [];
            if (readHist.length > 1) {
                sparks.push({
                    kind: 'read',
                    history: [...readHist],
                    displayValue: `${formatBytes(lastReadBps)}/s`,
                    range: { lo: 0, hi: Math.ceil(Math.max(...readHist) * 1.2) } as TempRange,
                });
            }
            if (writeHist.length > 1) {
                sparks.push({
                    kind: 'write',
                    history: [...writeHist],
                    displayValue: `${formatBytes(lastWriteBps)}/s`,
                    range: { lo: 0, hi: Math.ceil(Math.max(...writeHist) * 1.2) } as TempRange,
                });
            }
            sparks.push({
                kind: 'activity',
                history: [...actHist],
                displayValue: `${activity.toFixed(1)}%`,
            });

            const sparkLayout: CardPayload['sparkLayout'] =
                sparks.length >= 3 ? 'double-full' : sparks.length === 2 ? 'dual' : 'solo';

            const meta: Array<{ label: string; value: string }> = [
                { label: globalT('sysmon_card_used'), value: usedStr },
                { label: globalT('sysmon_card_free'), value: formatBytes(disk.total_free_bytes ?? 0) },
            ];
            if (hasTemp)
                meta.push({ label: globalT('sysmon_card_temp'), value: `${Math.round(temp)}°C` });
            if (life != null)
                meta.push({ label: globalT('sysmon_card_life'), value: `${Math.round(life)}%` });
            if (disk.host_reads_gb != null)
                meta.push({
                    label: globalT('sysmon_card_read'),
                    value: `${disk.host_reads_gb.toFixed(1)} GB`,
                });
            if (disk.host_writes_gb != null)
                meta.push({
                    label: globalT('sysmon_card_write'),
                    value: `${disk.host_writes_gb.toFixed(1)} GB`,
                });

            return {
                label: `${globalT('sysmon_card_label_disk')} #${index} 路 ${disk.model} 路 ${busLabel}`,
                value: primaryStr,
                extra: null,
                meta,
                sparks,
                sparkLayout,
            };
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
            this.toggleDisplayStyle(newConfig.displayStyle);
        }

        this.applyConfig();
    }

    private toggleDisplayStyle(style: 'rows' | 'cards'): void {
        // Save current style
        this.lastDisplayStyle = style;
        this.config.displayStyle = style;

        if (style === 'cards') {
            // Hide row background, build card DOM
            if (this.refs?.background) this.refs.background.style.display = 'none';
            if (this.refs?.container) {
                this.cardRefs = buildCards(this.refs.container);
            }
        } else {
            // Destroy card DOM, show row background
            if (this.refs?.container) destroyCards(this.refs.container);
            if (this.refs?.background) this.refs.background.style.display = '';
            this.cardRefs = null;
        }
    }

    private applyConfig(): void {
        applyConfig(this.refs, this.config);

        // Apply font color and size to card elements immediately
        if (this.cardRefs) {
            const { monitorColor, monitorSize } = this.config;
            const allCards = [
                this.cardRefs.cards.cpu,
                this.cardRefs.cards.gpu,
                this.cardRefs.cards.memory,
                this.cardRefs.cards.network,
                ...this.cardRefs.cards.disks,
            ];
            for (const card of allCards) {
                if (!card) continue;
                if (monitorColor) card.style.color = monitorColor;
                if (monitorSize) card.style.fontSize = `${monitorSize}px`;
            }
        }

        // Only re-render when alignment changes (rows mode)
        const alignmentChanged = this.lastMonitorPosition !== this.config.monitorPosition;
        if (alignmentChanged && this.config.displayStyle === 'rows') {
            this.lastMonitorPosition = this.config.monitorPosition;
            this.rerenderAllRows();
        }
    }

    private rerenderAllRows(): void {
        if (!this.refs) return;

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
    // Access private fields through a typed alias – this is a deliberate,
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

// 瀵煎嚭鍗曚緥
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
