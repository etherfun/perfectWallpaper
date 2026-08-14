import { globalT } from '@/utils/i18n';

import { formatBytes } from '../api/formatters';
import type {
    CardPayload,
    CpuInfo,
    DiskDriveInfo,
    GpuInfo,
    SparkChannel,
    SystemMonitorConfig,
    TempRange,
} from '../types';
import { pushHistory } from '../ui/renderer';
import { getOrCreateHistory, peakOf } from './history';

/** History buffers backing the CPU card sparks. */
export interface CpuCardHistories {
    cpuHistory: number[];
    cpuTempHistory: number[];
    cpuPowerHistory: number[];
}

/** History buffers backing the GPU card sparks. */
export interface GpuCardHistories {
    gpuHistory: number[];
    gpuTempHistory: number[];
    gpuPowerHistory: number[];
    gpuVramHistory: number[];
}

/** Per-disk history maps backing the disk cards. */
export interface DiskCardHistories {
    diskHistories: Map<number, number[]>;
    diskReadHistory: Map<number, number[]>;
    diskWriteHistory: Map<number, number[]>;
    diskActivityHistory: Map<number, number[]>;
}

/** Build the CPU card payload. */
export function buildCpuCard(
    cpu: CpuInfo | undefined,
    config: Pick<SystemMonitorConfig, 'showCpu'>,
    history: CpuCardHistories
): CardPayload | null {
    if (!cpu || !config.showCpu) return null;
    const usage = Math.round(cpu.usage ?? 0);
    const temp = cpu.temperature;
    const hasTemp = temp > 0 && Number.isFinite(temp);

    const sparks: SparkChannel[] = [];
    const sparkLayout = 'double-full';

    sparks.push({
        kind: 'util',
        history: history.cpuHistory,
        displayValue: `${usage}%`,
    });

    if (hasTemp && history.cpuTempHistory.length > 0) {
        const cpuCrit = cpu.temperature_critical ?? 95;
        sparks.push({
            kind: 'temp',
            history: history.cpuTempHistory,
            range: { lo: 40, hi: Math.max(cpuCrit + 5, 95), crit: cpuCrit },
            displayValue: `${Math.round(temp)}°C`,
            tag: `max ${Math.round(cpu.temperature_max ?? temp)}`,
        });
    }

    const power = cpu.power_package;
    if (power != null && power > 0 && history.cpuPowerHistory.length > 0) {
        const peak = peakOf(history.cpuPowerHistory);
        sparks.push({
            kind: 'power',
            history: history.cpuPowerHistory,
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
        label: `${globalT('sysmon_card_label_cpu')} · ${cpu.brand}`,
        value: `${usage}%`,
        extra: hasTemp ? `(${Math.round(temp)}°C)` : null,
        meta,
        sparks,
        sparkLayout,
    };
}

/** Build the GPU card payload. */
export function buildGpuCard(
    gpu: GpuInfo | undefined,
    config: Pick<SystemMonitorConfig, 'showGpu'>,
    history: GpuCardHistories
): CardPayload | null {
    if (!gpu || !config.showGpu) return null;
    const usage = Math.round(gpu.utilization ?? 0);
    const temp = gpu.temperature;
    const hasTemp = temp > 0 && Number.isFinite(temp);

    const sparks: SparkChannel[] = [];

    sparks.push({
        kind: 'util',
        history: history.gpuHistory,
        displayValue: `${usage}%`,
    });
    let sparkCount = 1;

    if (hasTemp && history.gpuTempHistory.length > 0) {
        const crit = gpu.temperature_critical ?? 92;
        sparks.push({
            kind: 'temp',
            history: history.gpuTempHistory,
            range: { lo: 30, hi: Math.max(crit + 5, 95), crit },
            displayValue: `${Math.round(temp)}°C`,
        });
        sparkCount++;
    }

    const power = gpu.power;
    if (power != null && power > 0 && history.gpuPowerHistory.length > 0) {
        const peak = peakOf(history.gpuPowerHistory);
        sparks.push({
            kind: 'power',
            history: history.gpuPowerHistory,
            displayValue: `${power.toFixed(1)} W`,
            tag: `peak ${Math.round(peak)}`,
        });
        sparkCount++;
    }

    const vramPct = Math.round(gpu.vram_used_percent ?? 0);
    if (vramPct > 0 && history.gpuVramHistory.length > 0) {
        sparks.push({
            kind: 'vram',
            history: history.gpuVramHistory,
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
        label: `${globalT('sysmon_card_label_gpu')} · ${gpu.model}`,
        value: `${usage}%`,
        extra: hasTemp ? `(${Math.round(temp)}°C)` : null,
        meta,
        sparks,
        sparkLayout: sparkLayout as CardPayload['sparkLayout'],
    };
}

/** Build the memory card payload. */
export function buildMemoryCard(
    memory: {
        total: number;
        used: number;
        used_percent: number;
    },
    config: Pick<SystemMonitorConfig, 'showMemory'>,
    memoryHistory: number[]
): CardPayload | null {
    if (!config.showMemory) return null;
    const usedPct = Math.round(memory.used_percent ?? 0);
    const usedStr = formatBytes(memory.used ?? 0);
    const totalStr = formatBytes(memory.total ?? 0);

    const sparks: SparkChannel[] = [
        {
            kind: 'util',
            history: memoryHistory,
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
export function buildNetworkCard(
    network: { rx: number; tx: number },
    config: Pick<SystemMonitorConfig, 'showNetwork'>,
    networkRxHistory: number[],
    networkTxHistory: number[]
): CardPayload | null {
    if (!config.showNetwork) return null;
    const rx = network.rx ?? 0;
    const tx = network.tx ?? 0;
    const rxStr = `${formatBytes(rx)}/s`;
    const txStr = `${formatBytes(tx)}/s`;

    // Combined spark: rx + tx overlaid on single canvas
    const sparks: SparkChannel[] = [];
    if (networkRxHistory.length > 0 && networkTxHistory.length > 0) {
        sparks.push({
            kind: 'rx-tx',
            history: networkRxHistory,
            dirRx: networkTxHistory,
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
export function buildDiskCards(
    drives: DiskDriveInfo[],
    config: Pick<SystemMonitorConfig, 'showDisk'>,
    history: DiskCardHistories
): CardPayload[] {
    if (!drives || !config.showDisk) return [];
    if (drives.length === 0) return [];

    return drives.map((disk, index) => {
        const usedPct = Math.round(disk.used_percent ?? 0);
        const usedStr = formatBytes(disk.total_used_bytes ?? 0);
        const temp = disk.temperature;
        const hasTemp = temp != null && temp > 0 && Number.isFinite(temp);
        const life = disk.life_remaining_percent;

        // Update all per-disk history maps inline
        const hist = getOrCreateHistory(history.diskHistories, index);
        pushHistory(hist, usedPct);

        const readRate = disk.read_rate ?? 0;
        const readHist = getOrCreateHistory(history.diskReadHistory, index);
        pushHistory(readHist, readRate);

        const writeRate = disk.write_rate ?? 0;
        const writeHist = getOrCreateHistory(history.diskWriteHistory, index);
        pushHistory(writeHist, writeRate);

        const activity = disk.total_activity ?? 0;
        const actHist = getOrCreateHistory(history.diskActivityHistory, index);
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
                history: readHist,
                displayValue: `${formatBytes(lastReadBps)}/s`,
                range: { lo: 0, hi: Math.ceil(Math.max(...readHist) * 1.2) } as TempRange,
            });
        }
        if (writeHist.length > 1) {
            sparks.push({
                kind: 'write',
                history: writeHist,
                displayValue: `${formatBytes(lastWriteBps)}/s`,
                range: { lo: 0, hi: Math.ceil(Math.max(...writeHist) * 1.2) } as TempRange,
            });
        }
        sparks.push({
            kind: 'activity',
            history: actHist,
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
            label: `${globalT('sysmon_card_label_disk')} #${index} · ${disk.model} · ${busLabel}`,
            value: primaryStr,
            extra: null,
            meta,
            sparks,
            sparkLayout,
        };
    });
}
