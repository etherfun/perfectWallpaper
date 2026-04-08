/**
 * System Monitor Module
 * 系统监控模块 - 显示CPU、GPU、内存等信息
 * 布局使用预置HTML结构，JS只负责更新文本内容
 */


// 配置类型
interface SystemMonitorConfig {
    enabled: boolean;
    barLayout: 'horizontal' | 'vertical';
    monitorPosition: 'left' | 'right';
    disconnectTimeout: number;
    serverUrl: string;
    serverPort: number;
    updateInterval: number;
    cpuMode: 'text' | 'curve' | 'bar' | 'none';
    gpuMode: 'text' | 'curve' | 'bar' | 'none';
    memoryMode: 'text' | 'curve' | 'bar' | 'none';
    networkMode: 'text' | 'curve' | 'bar' | 'none';
    showCpu: boolean;
    showGpu: boolean;
    showMemory: boolean;
    showNetwork: boolean;
    monitorX: number;
    monitorY: number;
    monitorSize: number;
    monitorColor: string;
}

const DEFAULT_CONFIG: SystemMonitorConfig = {
    enabled: true,
    barLayout: 'horizontal',
    monitorPosition: 'right',
    disconnectTimeout: 10000,
    serverUrl: 'http://localhost:27420/api/sysinfo',
    serverPort: 27420,
    updateInterval: 2000,
    cpuMode: 'text',
    gpuMode: 'text',
    memoryMode: 'text',
    networkMode: 'text',
    showCpu: true,
    showGpu: true,
    showMemory: true,
    showNetwork: false,
    monitorX: 95,
    monitorY: 5,
    monitorSize: 14,
    monitorColor: 'rgba(255, 255, 255, 0.8)'
};

class SystemMonitor {
    // Pre-built DOM elements from index.html
    private container: HTMLElement | null = null;
    private background: HTMLElement | null = null;
    private cpuRow: HTMLElement | null = null;
    private gpuRow: HTMLElement | null = null;
    private memoryRow: HTMLElement | null = null;
    private networkRow: HTMLElement | null = null;

    private pollInterval: number | null = null;
    private cpuHistory: number[] = [];
    private memoryHistory: number[] = [];
    private gpuHistory: number[] = [];
    private networkRxHistory: number[] = [];
    private networkTxHistory: number[] = [];
    private maxHistoryLength = 60;
    private config: SystemMonitorConfig = { ...DEFAULT_CONFIG };
    private enabled: boolean = true;
    private disconnectTimer: number | null = null;
    private lastConnectedTime: number = 0;
    private hasEverConnected: boolean = false;

    constructor() {
        this.init();
    }

    private init(): void {
        this.createElements();
        this.startPolling();
    }

    private createElements(): void {
        // Get pre-built DOM elements from index.html
        this.container = document.getElementById('system-monitor');
        this.background = this.container?.querySelector('.background') || null;

        this.cpuRow = this.container?.querySelector('.sysmon-cpu') || null;
        this.gpuRow = this.container?.querySelector('.sysmon-gpu') || null;
        this.memoryRow = this.container?.querySelector('.sysmon-memory') || null;
        this.networkRow = this.container?.querySelector('.sysmon-network') || null;

        if (!this.container || !this.background) {
            console.error('[Sysmon] DOM elements not found in HTML');
            return;
        }

        // Apply initial font styles to each row
        const rows = [this.cpuRow, this.gpuRow, this.memoryRow, this.networkRow];
        rows.forEach(row => {
            if (row) {
                row.style.fontSize = `${this.config.monitorSize}px`;
                row.style.color = this.config.monitorColor;
                row.style.textShadow = 'var(--sysmon-text-shadow, 0 0 5px rgba(0,0,0,0.5))';
            }
        });

        this.applyConfig();
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

    private updateDisplay(data: any): void {
        // CPU
        if (this.config.showCpu) {
            const cpuUsage = Math.round(data.cpu?.usage || 0);
            this.pushHistory(this.cpuHistory, cpuUsage);
            this.updateItem(this.cpuRow, 'CPU', cpuUsage, this.config.cpuMode);
            this.cpuRow!.style.display = '';
        } else if (this.cpuRow) {
            this.cpuRow.style.display = 'none';
        }

        // GPU
        if (this.config.showGpu && data.gpu?.length > 0) {
            const gpu = data.gpu[0];
            const gpuUsage = Math.round(gpu.utilization || 0);
            const gpuTemp = gpu.temperature || 0;
            this.pushHistory(this.gpuHistory, gpuUsage);
            this.updateItem(this.gpuRow, 'GPU', gpuUsage, this.config.gpuMode, `${gpuTemp}°C`);
            this.gpuRow!.style.display = '';
        } else if (this.gpuRow) {
            this.gpuRow.style.display = 'none';
        }

        // Memory
        if (this.config.showMemory) {
            const memUsed = Math.round(data.memory?.used_percent || 0);
            const memUsedStr = this.formatBytes(data.memory?.used || 0);
            const memTotalStr = this.formatBytes(data.memory?.total || 0);
            this.pushHistory(this.memoryHistory, memUsed);
            this.updateItem(this.memoryRow, 'MEM', memUsed, this.config.memoryMode, `${memUsedStr.slice(0, -3)}/${memTotalStr}`);
            this.memoryRow!.style.display = '';
        } else if (this.memoryRow) {
            this.memoryRow.style.display = 'none';
        }

        // Network
        if (this.config.showNetwork) {
            const rx = this.formatBytes(data.network?.rx || 0) + '/s';
            const tx = this.formatBytes(data.network?.tx || 0) + '/s';
            this.updateNetworkDisplay(rx, tx);
            this.networkRow!.style.display = '';
        } else if (this.networkRow) {
            this.networkRow.style.display = 'none';
        }
    }

    private updateItem(row: HTMLElement | null, label: string, value: number, mode: string, extra?: string): void {
        if (!row) return;

        const leftSpan = row.querySelector('.left') as HTMLElement | null;
        const rightSpan = row.querySelector('.right') as HTMLElement | null;
        const labelSpan = row.querySelector('.sysmon-label');

        if (!leftSpan || !rightSpan || !labelSpan) return;

        const isLeft = this.config.monitorPosition === 'left';
        const mainLine = rightSpan.querySelector('.main-line') as HTMLElement | null;
        const subLine = rightSpan.querySelector('.sub-line') as HTMLElement | null;

        if (isLeft) {
            leftSpan.innerHTML = '';
            mainLine!.innerHTML = `<span class="sysmon-value">${value}%</span>${extra ? `<span class="sysmon-extra">(${extra})</span>` : ''}`;
        } else {
            leftSpan.innerHTML = `${extra ? `<span class="sysmon-extra">(${extra})</span>` : ''}</span><span class="sysmon-value">${value}%</span>`;
            mainLine!.innerHTML = '';
        }

        if (subLine) subLine.innerHTML = '';


        switch (mode) {
            case 'text':
                break;
            case 'curve':
                this.drawCurveInRow(row, label.toLowerCase() as 'cpu' | 'gpu' | 'memory');
                break;
            case 'bar':
                this.drawBarInRow(row, value);
                break;
            case 'none':
            default:
                row.style.display = 'none';
                break;
        }
    }

    private drawCurveInRow(row: HTMLElement, type: 'cpu' | 'gpu' | 'memory'): void {
        const rightSpan = row.querySelector('.right');
        if (!rightSpan) return;

        const mainLine = rightSpan.querySelector('.main-line');
        if (!mainLine) return;

        // Clear old canvas
        const oldCanvas = mainLine.querySelector('canvas');
        if (oldCanvas) oldCanvas.remove();

        const canvas = document.createElement('canvas');
        canvas.width = 80;
        canvas.height = 24;
        canvas.style.cssText = 'display:inline-block;vertical-align:middle;';

        mainLine.appendChild(canvas);
        this.drawCurve(canvas, type);
    }

    private drawBarInRow(row: HTMLElement, value: number): void {
        const rightSpan = row.querySelector('.right');
        if (!rightSpan) return;

        const subLine = rightSpan.querySelector('.sub-line') as HTMLElement | null;
        if (!subLine) return;

        // Clear old bar container
        subLine.innerHTML = '';

        const isVertical = this.config.barLayout === 'vertical';

        // Bar container
        const barContainer = document.createElement('div');
        barContainer.className = 'sysmon-bar';
        if (isVertical) {
            // Vertical bar: column layout, bar below value
            barContainer.style.cssText = 'display:flex;flex-direction:column;gap:2px;width:80px;';
        } else {
            // Horizontal bar: row layout, bar after value
            barContainer.style.cssText = 'display:flex;flex-direction:row;align-items:center;gap:4px;';
        }

        // Bar track (gray background)
        const track = document.createElement('div');
        if (isVertical) {
            track.style.cssText = 'width:100%;height:4px;background:rgba(255,255,255,0.2);border-radius:2px;';
        } else {
            track.style.cssText = 'flex:1;height:4px;background:rgba(255,255,255,0.2);border-radius:2px;';
        }

        // Bar fill (colored foreground)
        const fill = document.createElement('div');
        if (isVertical) {
            fill.style.cssText = `width:${value}%;height:100%;background:${this.getColorForValue(value)};transition:width 0.3s ease;border-radius:2px;`;
        } else {
            fill.style.cssText = `width:${value}%;height:100%;background:${this.getColorForValue(value)};transition:width 0.3s ease;border-radius:2px;`;
        }

        track.appendChild(fill);
        barContainer.appendChild(track);

        // Append bar to sub-line
        subLine.appendChild(barContainer);
    }

    private updateNetworkDisplay(rx: string, tx: string): void {
        if (!this.networkRow) return;

        const leftSpan = this.networkRow.querySelector('.left');
        const rightSpan = this.networkRow.querySelector('.right');
        if (!leftSpan || !rightSpan) return;

        const isLeft = this.config.monitorPosition === 'left';
        const labelSpan = this.networkRow.querySelector('.sysmon-label');

        if (!leftSpan || !rightSpan || !labelSpan) return;

        const mainLine = rightSpan.querySelector('.main-line') as HTMLElement | null;

        if (isLeft) {
            leftSpan.innerHTML = '';
            if (!labelSpan.hasAttribute('data-i18n')) labelSpan.textContent = 'NET';
            mainLine!.innerHTML = `<span class="sysmon-net-down">↓${rx}</span> <span class="sysmon-net-up">↑${tx}</span>`;
        } else {
            leftSpan.innerHTML = `<span class="sysmon-net-down">↓${rx}</span> <span class="sysmon-net-up">↑${tx}</span>`;
            if (!labelSpan.hasAttribute('data-i18n')) labelSpan.textContent = 'NET';
            mainLine!.innerHTML = '';
        }
    }

    private drawCurve(canvas: HTMLCanvasElement, type: 'cpu' | 'gpu' | 'memory'): void {
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const history = type === 'cpu' ? this.cpuHistory :
                        type === 'gpu' ? this.gpuHistory :
                        this.memoryHistory;

        const width = canvas.width;
        const height = canvas.height;

        ctx.clearRect(0, 0, width, height);
        if (history.length < 2) return;

        ctx.strokeStyle = this.getColorForValue(history[history.length - 1] || 0);
        ctx.lineWidth = 1.5;
        ctx.beginPath();

        const step = width / (this.maxHistoryLength - 1);
        const startX = width - (history.length - 1) * step;

        history.forEach((value, index) => {
            const x = startX + index * step;
            const y = height - (value / 100) * height;
            if (index === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        });

        ctx.stroke();

        ctx.lineTo(startX + (history.length - 1) * step, height);
        ctx.lineTo(startX, height);
        ctx.closePath();
        const gradient = ctx.createLinearGradient(0, 0, 0, height);
        gradient.addColorStop(0, this.getColorForValue(history[history.length - 1] || 0, 0.3));
        gradient.addColorStop(1, 'transparent');
        ctx.fillStyle = gradient;
        ctx.fill();
    }

    private getColorForValue(value: number, alpha?: number): string {
        const a = alpha !== undefined ? alpha : 1;
        if (value < 50) {
            return `rgba(76, 175, 80, ${a})`;
        } else if (value < 80) {
            return `rgba(255, 193, 7, ${a})`;
        } else {
            return `rgba(244, 67, 54, ${a})`;
        }
    }

    private formatBytes(bytes: number): string {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return (bytes / Math.pow(k, i)).toFixed(1) + ' ' + sizes[i];
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
        if (!this.container || !this.background) return;

        const isLeft = this.config.monitorPosition === 'left';

        // Position
        if (this.container) {
            if (isLeft) {
                this.container.style.left = `${100 - this.config.monitorX}%`;
                this.container.style.right = 'auto';
            } else {
                this.container.style.right = `${100 - this.config.monitorX}%`;
                this.container.style.left = 'auto';
            }
            this.container.style.top = `${this.config.monitorY}%`;
        }

        // Direction class on background (align-items controls all rows)
        if (this.background) {
            this.background.classList.toggle('left-side', isLeft);
            this.background.classList.toggle('right-side', !isLeft);
            this.background.classList.toggle('horizontal-layout', this.config.barLayout === 'horizontal');
        }

        // Font styles
        const rows = [this.cpuRow, this.gpuRow, this.memoryRow, this.networkRow];
        rows.forEach(row => {
            if (row) {
                row.style.fontSize = `${this.config.monitorSize}px`;
                row.style.color = this.config.monitorColor;
            }
        });
    }

    public destroy(): void {
        this.stopPolling();
        instance = null;
    }

    public toggle(): void {
        this.enabled = !this.enabled;
        if (this.enabled) {
            this.startPolling();
            if (this.container) this.container.style.display = '';
        } else {
            this.stopPolling();
            if (this.container) this.container.style.display = 'none';
        }
    }

    public isEnabled(): boolean {
        return this.enabled;
    }

    public setEnabled(enabled: boolean): void {
        this.enabled = enabled;
        if (enabled) {
            this.startPolling();
            if (this.container) this.container.style.display = '';
        } else {
            this.stopPolling();
            if (this.container) this.container.style.display = 'none';
        }
    }

    private startPolling(): void {
        if (this.pollInterval) return;
        this.pollData();
        this.pollInterval = window.setInterval(() => this.pollData(), this.config.updateInterval);
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

    private pushHistory(history: number[], value: number): void {
        history.push(value);
        if (history.length > this.maxHistoryLength) {
            history.shift();
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

export { SystemMonitor };
