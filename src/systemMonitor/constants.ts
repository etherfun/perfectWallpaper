import type { SystemMonitorConfig } from './types';

export const MAX_HISTORY_LENGTH = 60;

export const DEFAULT_CONFIG: SystemMonitorConfig = {
    enabled: false,
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
    monitorColor: 'rgba(255, 255, 255, 0.8)',
};
