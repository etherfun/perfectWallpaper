/**
 * System Monitor Module
 * 系统监控模块 - 显示CPU、GPU、内存等信息
 */

import { config, appConfig } from '@/utils/config';
import { elements, getElementAs } from '@/utils/elementManager';

// 配置类型
interface SystemMonitorConfig {
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
    private eventSource: EventSource | null = null;
    private pollInterval: number | null = null;
    private cpuHistory: number[] = [];
    private memoryHistory: number[] = [];
    private gpuHistory: number[] = [];
    private networkRxHistory: number[] = [];
    private networkTxHistory: number[] = [];
    private maxHistoryLength = 60;
    private config: SystemMonitorConfig = { ...DEFAULT_CONFIG };

    constructor() {
        //this.init();
    }

    private init(): void {
        this.createElements();
        this.startPolling();
    }

    private createElements(): void {
        // 创建容器
        this.container = document.createElement('div');
        this.container.id = 'system-monitor';
        this.container.style.cssText = `
            position: fixed;
            top: ${this.config.monitorY}%;
            right: ${100 - this.config.monitorX}%;
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

    private startPolling(): void {
        this.pollData();
        this.pollInterval = window.setInterval(() => this.pollData(), this.config.updateInterval);
    }

    private async pollData(): Promise<void> {
        try {
            const response = await fetch(this.config.serverUrl);
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            const json = await response.json();
            if (json.success) {
                this.updateDisplay(json.data);
            }
        } catch (error) {
            console.warn('[SystemMonitor] Failed to fetch system info:', error);
        }
    }

    private updateDisplay(data: any): void {
        // 更新CPU
        if (this.config.showCpu) {
            const cpuUsage = Math.round(data.cpu?.usage || 0);
            this.cpuHistory.push(cpuUsage);
            if (this.cpuHistory.length > this.maxHistoryLength) {
                this.cpuHistory.shift();
            }
            this.updateItem(this.cpuElement, 'CPU', cpuUsage, this.config.cpuMode);
        } else {
            this.cpuElement!.style.display = 'none';
        }

        // 更新GPU
        if (this.config.showGpu && data.gpu?.length > 0) {
            const gpu = data.gpu[0];
            const gpuUsage = Math.round(gpu.utilization || 0);
            const gpuTemp = gpu.temperature || 0;
            this.gpuHistory.push(gpuUsage);
            if (this.gpuHistory.length > this.maxHistoryLength) {
                this.gpuHistory.shift();
            }
            this.updateItem(this.gpuElement, 'GPU', gpuUsage, this.config.gpuMode, `${gpuTemp}°C`);
        } else {
            this.gpuElement!.style.display = 'none';
        }

        // 更新内存
        if (this.config.showMemory) {
            const memUsed = Math.round(data.memory?.usedPercent || 0);
            const memTotal = this.formatBytes(data.memory?.total || 0);
            this.memoryHistory.push(memUsed);
            if (this.memoryHistory.length > this.maxHistoryLength) {
                this.memoryHistory.shift();
            }
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

        switch (mode) {
            case 'text':
                element.innerHTML = `${label}: ${value}%${extra ? ` (${extra})` : ''}`;
                element.style.display = 'block';
                break;
            case 'curve':
                element.innerHTML = `
                    <span>${label}: ${value}%${extra ? ` (${extra})` : ''}</span>
                    <canvas class="sysmon-canvas" width="100" height="30"></canvas>
                `;
                element.style.display = 'flex';
                element.style.flexDirection = 'column';
                const canvas = element.querySelector('.sysmon-canvas') as HTMLCanvasElement;
                if (canvas) this.drawCurve(canvas, label.toLowerCase() as 'cpu' | 'gpu' | 'memory');
                break;
            case 'bar':
                element.innerHTML = `
                    <span>${label}: ${value}%${extra ? ` (${extra})` : ''}</span>
                    <div class="sysmon-bar-container">
                        <div class="sysmon-bar" style="width: ${value}%; background: ${this.getColorForValue(value)};"></div>
                    </div>
                `;
                element.style.display = 'block';
                break;
            case 'none':
            default:
                element.style.display = 'none';
                break;
        }
    }

    private updateNetworkDisplay(rx: string, tx: string): void {
        if (!this.networkElement) return;
        this.networkElement.innerHTML = `NET: ↓${rx} ↑${tx}`;
        this.networkElement.style.display = 'block';
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
        this.config = { ...this.config, ...newConfig };
        this.applyConfig();
    }

    private applyConfig(): void {
        if (!this.container) return;

        this.container.style.right = `${100 - this.config.monitorX}%`;
        this.container.style.top = `${this.config.monitorY}%`;
        this.container.style.fontSize = `${this.config.monitorSize}px`;
        this.container.style.color = this.config.monitorColor;
    }

    // 销毁
    public destroy(): void {
        if (this.pollInterval) {
            clearInterval(this.pollInterval);
        }
        if (this.eventSource) {
            this.eventSource.close();
        }
        this.container?.remove();
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
