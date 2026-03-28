/**
 * System Monitor Module
 * 系统监控模块 - 显示CPU、GPU、内存等信息
 */

import { elements, getElementAs } from '@/utils/elementManager';

// 配置类型
interface SystemMonitorConfig {
    enabled: boolean;
    barLayout: 'horizontal' | 'vertical';
    monitorPosition: 'left' | 'right';
    disconnectTimeout: number;
    serverUrl: string;
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
    serverUrl: 'http://localhost:3842/api/system',
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
    private container: HTMLElement | null = null;
    private cpuElement: HTMLElement | null = null;
    private gpuElement: HTMLElement | null = null;
    private memoryElement: HTMLElement | null = null;
    private networkElement: HTMLElement | null = null;
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

    constructor() {
        this.init();
    }

    private init(): void {
        this.createElements();
        this.startPolling();
    }

    private createElements(): void {
        // 创建容器
        this.container = document.createElement('div');
        this.container.id = 'system-monitor';
        const isLeft = this.config.monitorPosition === 'left';
        this.container.style.cssText = `
            position: fixed;
            top: ${this.config.monitorY}%;
            ${isLeft ? 'left' : 'right'}: ${100 - this.config.monitorX}%;
            display: flex;
            flex-direction: column;
            gap: 4px;
            font-size: ${this.config.monitorSize}px;
            color: ${this.config.monitorColor};
            z-index: 9999;
            pointer-events: none;
            text-shadow: 0 0 5px rgba(0,0,0,0.5);
            font-family: 'Segoe UI', 'Microsoft YaHei', sans-serif;
        `;

        // 添加样式以固定文本宽度
        const style = document.createElement('style');
        style.textContent = `
            #system-monitor .sysmon-label { min-width: 36px; }
            #system-monitor .sysmon-value { font-variant-numeric: tabular-nums; min-width: 32px; text-align: right; }
            #system-monitor .sysmon-extra { font-variant-numeric: tabular-nums; }
        `;
        this.container.appendChild(style);

        // CPU元素
        this.cpuElement = document.createElement('div');
        this.cpuElement.id = 'sysmon-cpu';
        this.cpuElement.className = 'sysmon-item sysmon-cpu';

        // GPU元素
        this.gpuElement = document.createElement('div');
        this.gpuElement.id = 'sysmon-gpu';
        this.gpuElement.className = 'sysmon-item sysmon-gpu';

        // 内存元素
        this.memoryElement = document.createElement('div');
        this.memoryElement.id = 'sysmon-memory';
        this.memoryElement.className = 'sysmon-item sysmon-memory';

        // 网络元素
        this.networkElement = document.createElement('div');
        this.networkElement.id = 'sysmon-network';
        this.networkElement.className = 'sysmon-item sysmon-network';

        this.container.appendChild(this.cpuElement);
        this.container.appendChild(this.gpuElement);
        this.container.appendChild(this.memoryElement);
        this.container.appendChild(this.networkElement);

        document.body.appendChild(this.container);
    }

    private async pollData(): Promise<void> {
        if (!this.enabled) return;

        try {
            const response = await fetch(this.config.serverUrl);
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            const json = await response.json();

            // Reset disconnect timer on successful connection
            this.lastConnectedTime = Date.now();
            if (this.disconnectTimer) {
                clearTimeout(this.disconnectTimer);
                this.disconnectTimer = null;
            }

            if (json.success) {
                this.updateDisplay(json.data);
            }
        } catch (error) {
            // Start disconnect timer if not already started
            if (!this.disconnectTimer) {
                this.disconnectTimer = window.setTimeout(() => {
                    this.destroy();
                }, this.config.disconnectTimeout);
            }
        }
    }

    private updateDisplay(data: any): void {
        // 更新CPU
        if (this.config.showCpu) {
            const cpuUsage = Math.round(data.cpu?.usage || 0);
            this.pushHistory(this.cpuHistory, cpuUsage);
            this.updateItem(this.cpuElement, 'CPU', cpuUsage, this.config.cpuMode);
        } else {
            this.cpuElement!.style.display = 'none';
        }

        // 更新GPU
        if (this.config.showGpu && data.gpu?.length > 0) {
            const gpu = data.gpu[0];
            const gpuUsage = Math.round(gpu.utilization || 0);
            const gpuTemp = gpu.temperature || 0;
            this.pushHistory(this.gpuHistory, gpuUsage);
            this.updateItem(this.gpuElement, 'GPU', gpuUsage, this.config.gpuMode, `${gpuTemp}°C`);
        } else {
            this.gpuElement!.style.display = 'none';
        }

        // 更新内存
        if (this.config.showMemory) {
            const memUsed = Math.round(data.memory?.usedPercent || 0);
            const memTotal = this.formatBytes(data.memory?.total || 0);
            this.pushHistory(this.memoryHistory, memUsed);
            this.updateItem(this.memoryElement, 'MEM', memUsed, this.config.memoryMode, memTotal);
        } else {
            this.memoryElement!.style.display = 'none';
        }

        // 更新网络
        if (this.config.showNetwork) {
            const rx = this.formatBytes(data.network?.rx || 0) + '/s';
            const tx = this.formatBytes(data.network?.tx || 0) + '/s';
            this.updateNetworkDisplay(rx, tx);
        } else {
            this.networkElement!.style.display = 'none';
        }
    }

    private updateItem(element: HTMLElement | null, label: string, value: number, mode: string, extra?: string): void {
        if (!element) return;

        const isLeft = this.config.monitorPosition === 'left';

        switch (mode) {
            case 'text':
                // Left side: "CPU: 0%", Right side: "0%: CPU"
                if (isLeft) {
                    element.innerHTML = `<span class="sysmon-label">${label}:</span><span class="sysmon-value">${value}%</span>${extra ? `<span class="sysmon-extra"> (${extra})</span>` : ''}`;
                } else {
                    element.innerHTML = `<span class="sysmon-value">${value}%</span><span class="sysmon-label">${label}:</span>${extra ? `<span class="sysmon-extra"> (${extra})</span>` : ''}`;
                }
                element.style.display = 'flex';
                element.style.alignItems = 'center';
                element.style.gap = '4px';
                element.style.whiteSpace = 'nowrap';
                break;
            case 'curve':
                // Left side: canvas on right, text on left; Right side: text on left, canvas on right
                if (isLeft) {
                    element.innerHTML = `
                        <span>${label}: ${value}%${extra ? ` (${extra})` : ''}</span>
                        <canvas class="sysmon-canvas" width="100" height="30"></canvas>
                    `;
                    element.style.flexDirection = 'row';
                } else {
                    element.innerHTML = `
                        <canvas class="sysmon-canvas" width="100" height="30"></canvas>
                        <span>${value}%${extra ? ` (${extra})` : ''} ${label}:</span>
                    `;
                    element.style.flexDirection = 'row-reverse';
                }
                element.style.display = 'flex';
                element.style.alignItems = 'center';
                element.style.gap = '4px';
                const canvas = element.querySelector('.sysmon-canvas') as HTMLCanvasElement;
                if (canvas) this.drawCurve(canvas, label.toLowerCase() as 'cpu' | 'gpu' | 'memory');
                break;
            case 'bar':
                const isVertical = this.config.barLayout === 'vertical';
                const barSize = isVertical ? 'height' : 'width';
                // Left side: "CPU: 0% [====]" (label first)
                // Right side: "[====] 0%: CPU" (value first)
                const barContent = `
                    <span>${label}: ${value}%${extra ? ` (${extra})` : ''}</span>
                    <div class="sysmon-bar-container" style="display: flex; ${isVertical ? 'flex-direction: column;' : 'flex-direction: row;'} ${isVertical ? 'width: 100%;' : 'height: 100%;'} align-items: center; gap: 4px;">
                        <div class="sysmon-bar" style="${barSize}: ${value}%; background: ${this.getColorForValue(value)}; transition: ${barSize} 0.3s ease; ${isVertical ? 'width: 100%;' : 'height: 8px;'}"></div>
                    </div>
                `;
                const barContentFlipped = `
                    <div class="sysmon-bar-container" style="display: flex; ${isVertical ? 'flex-direction: column;' : 'flex-direction: row;'} ${isVertical ? 'width: 100%;' : 'height: 100%;'} align-items: center; gap: 4px;">
                        <div class="sysmon-bar" style="${barSize}: ${value}%; background: ${this.getColorForValue(value)}; transition: ${barSize} 0.3s ease; ${isVertical ? 'width: 100%;' : 'height: 8px;'}"></div>
                    </div>
                    <span>${value}%${extra ? ` (${extra})` : ''} ${label}:</span>
                `;
                element.innerHTML = isLeft ? barContent : barContentFlipped;
                element.style.display = 'flex';
                element.style.flexDirection = isVertical ? 'column' : (isLeft ? 'row' : 'row-reverse');
                element.style.alignItems = 'center';
                element.style.gap = '8px';
                break;
            case 'none':
            default:
                element.style.display = 'none';
                break;
        }
    }

    private updateNetworkDisplay(rx: string, tx: string): void {
        if (!this.networkElement) return;
        const isLeft = this.config.monitorPosition === 'left';
        // Left side: "NET: ↓rx ↑tx", Right side: "↓rx ↑tx :NET"
        if (isLeft) {
            this.networkElement.innerHTML = `NET: ↓${rx} ↑${tx}`;
        } else {
            this.networkElement.innerHTML = `↓${rx} ↑${tx} :NET`;
        }
        this.networkElement.style.display = 'flex';
        this.networkElement.style.alignItems = 'center';
        this.networkElement.style.gap = '4px';
    }

    private drawCurve(canvas: HTMLCanvasElement, type: 'cpu' | 'gpu' | 'memory'): void {
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const history = type === 'cpu' ? this.cpuHistory :
                        type === 'gpu' ? this.gpuHistory :
                        type === 'memory' ? this.memoryHistory : [];

        const width = canvas.width;
        const height = canvas.height;

        ctx.clearRect(0, 0, width, height);

        if (history.length < 2) return;

        // 绘制背景网格
        ctx.strokeStyle = 'rgba(255,255,255,0.1)';
        ctx.lineWidth = 0.5;
        for (let i = 0; i <= 4; i++) {
            const y = (height / 4) * i;
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(width, y);
            ctx.stroke();
        }

        // 绘制曲线
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

        // 填充
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
            return `rgba(76, 175, 80, ${a})`; // 绿色
        } else if (value < 80) {
            return `rgba(255, 193, 7, ${a})`; // 黄色
        } else {
            return `rgba(244, 67, 54, ${a})`; // 红色
        }
    }

    private formatBytes(bytes: number): string {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
    }

    // 更新配置
    public updateConfig(newConfig: Partial<SystemMonitorConfig>): void {
        const wasEnabled = this.config.enabled;
        this.config = { ...this.config, ...newConfig };

        // Handle enabled state change
        if (newConfig.enabled !== undefined && newConfig.enabled !== wasEnabled) {
            this.setEnabled(newConfig.enabled);
        }

        this.applyConfig();
    }

    private applyConfig(): void {
        if (!this.container) return;

        const isLeft = this.config.monitorPosition === 'left';
        if (isLeft) {
            this.container.style.left = `${100 - this.config.monitorX}%`;
            this.container.style.right = 'auto';
        } else {
            this.container.style.right = `${100 - this.config.monitorX}%`;
            this.container.style.left = 'auto';
        }
        this.container.style.top = `${this.config.monitorY}%`;
        this.container.style.fontSize = `${this.config.monitorSize}px`;
        this.container.style.color = this.config.monitorColor;
    }

    // 销毁
    public destroy(): void {
        this.stopPolling();
        instance = null;
        this.container?.remove();
    }

    // 切换显示/隐藏
    public toggle(): void {
        this.enabled = !this.enabled;
        if (this.enabled) {
            this.startPolling();
            if (this.container) this.container.style.display = 'flex';
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
            if (this.container) this.container.style.display = 'flex';
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
