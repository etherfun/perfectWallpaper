import { applyConfig } from './configApply';
import { DEFAULT_CONFIG } from './constants';
import { queryDomElements } from './domRefs';
import { formatBytes } from './formatters';
import { pushHistory, updateItem, updateNetworkDisplay } from './renderer';
import type { SystemMonitorConfig, SystemMonitorData, SystemMonitorDomRefs } from './types';

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
    private enabled: boolean = true;
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

        // Only start polling if enabled in config
        if (this.config.enabled) {
            this.startPolling();
        }
    }

    private async pollData(): Promise<void> {
        if (!this.enabled) return;

        try {
            const response = await fetch(this.config.serverUrl);
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            const json = await response.json();

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

            if (json.success) {
                this.updateDisplay(json.data);
            }
        } catch {
            // Only start disconnect timer if we've ever connected before
            // This prevents auto-disable on startup when server is still initializing
            if (this.hasEverConnected && !this.disconnectTimer) {
                this.disconnectTimer = window.setTimeout(() => {
                    this.destroy();
                }, this.config.disconnectTimeout);
            }
        }
    }

    private updateDisplay(data: SystemMonitorData): void {
        const cpuRow = this.refs?.cpuRow ?? null;
        const gpuRow = this.refs?.gpuRow ?? null;
        const memoryRow = this.refs?.memoryRow ?? null;
        const networkRow = this.refs?.networkRow ?? null;

        // CPU
        if (this.config.showCpu) {
            const cpuUsage = Math.round(data.cpu?.usage || 0);
            pushHistory(this.cpuHistory, cpuUsage);
            updateItem(cpuRow, 'CPU', cpuUsage, this.config.cpuMode, undefined, this.config, this.cpuHistory);
            if (cpuRow) cpuRow.style.display = '';
        } else if (cpuRow) {
            cpuRow.style.display = 'none';
        }

        // GPU
        if (this.config.showGpu && data.gpu && data.gpu.length > 0) {
            const gpu = data.gpu[0];
            if (!gpu) return;
            const gpuUsage = Math.round(gpu.utilization || 0);
            const gpuTemp = gpu.temperature || 0;
            pushHistory(this.gpuHistory, gpuUsage);
            updateItem(gpuRow, 'GPU', gpuUsage, this.config.gpuMode, `${gpuTemp}°C`, this.config, this.gpuHistory);
            if (gpuRow) gpuRow.style.display = '';
        } else if (gpuRow) {
            gpuRow.style.display = 'none';
        }

        // Memory
        if (this.config.showMemory) {
            const memUsed = Math.round(data.memory?.used_percent || 0);
            const memUsedStr = formatBytes(data.memory?.used || 0);
            const memTotalStr = formatBytes(data.memory?.total || 0);
            pushHistory(this.memoryHistory, memUsed);
            updateItem(
                memoryRow,
                'MEM',
                memUsed,
                this.config.memoryMode,
                `${memUsedStr.slice(0, -3)}/${memTotalStr}`,
                this.config,
                this.memoryHistory
            );
            if (memoryRow) memoryRow.style.display = '';
        } else if (memoryRow) {
            memoryRow.style.display = 'none';
        }

        // Network
        if (this.config.showNetwork) {
            const rx = formatBytes(data.network?.rx || 0) + '/s';
            const tx = formatBytes(data.network?.tx || 0) + '/s';
            updateNetworkDisplay(networkRow, rx, tx);
            if (networkRow) networkRow.style.display = '';
        } else if (networkRow) {
            networkRow.style.display = 'none';
        }
    }

    public updateConfig(newConfig: Partial<SystemMonitorConfig>): void {
        const wasEnabled = this.config.enabled;
        this.config = { ...this.config, ...newConfig };

        if (newConfig.serverPort !== undefined) {
            this.config.serverUrl = `http://localhost:${this.config.serverPort}/api/sysinfo`;
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

        // Force re-render of all visible rows to reposition canvas elements
        if (this.config.showCpu && this.cpuHistory.length > 0) {
            updateItem(
                this.refs.cpuRow,
                'CPU',
                this.cpuHistory[this.cpuHistory.length - 1] || 0,
                this.config.cpuMode,
                undefined,
                this.config,
                this.cpuHistory
            );
        }
        if (this.config.showGpu && this.gpuHistory.length > 0) {
            updateItem(
                this.refs.gpuRow,
                'GPU',
                this.gpuHistory[this.gpuHistory.length - 1] || 0,
                this.config.gpuMode,
                undefined,
                this.config,
                this.gpuHistory
            );
        }
        if (this.config.showMemory && this.memoryHistory.length > 0) {
            updateItem(
                this.refs.memoryRow,
                'MEM',
                this.memoryHistory[this.memoryHistory.length - 1] || 0,
                this.config.memoryMode,
                undefined,
                this.config,
                this.memoryHistory
            );
        }
        if (this.config.showNetwork && this.refs.networkRow) {
            const networkLeftSpan = this.refs.networkRow.querySelector('.left') as HTMLElement | null;
            if (networkLeftSpan) {
                const oldCanvas = networkLeftSpan.querySelector('canvas');
                if (oldCanvas) oldCanvas.remove();
            }
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
        this.pollInterval = window.setInterval(() => void this.pollData(), this.config.updateInterval);
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
