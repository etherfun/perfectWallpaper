/**
 * Type definitions for the system monitor module.
 */

export interface SystemMonitorData {
    cpu?: { usage?: number };
    gpu?: Array<{ utilization?: number; temperature?: number }>;
    memory?: { used_percent?: number; used?: number; total?: number };
    network?: { rx?: number; tx?: number };
}

export interface SystemMonitorConfig {
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

export interface SystemMonitorDomRefs {
    container: HTMLElement;
    background: HTMLElement;
    cpuRow: HTMLElement | null;
    gpuRow: HTMLElement | null;
    memoryRow: HTMLElement | null;
    networkRow: HTMLElement | null;
}
