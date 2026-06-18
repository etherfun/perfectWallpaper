import type { SystemMonitorConfig } from './types';

export const MAX_HISTORY_LENGTH = 60;

export const DEFAULT_CONFIG: SystemMonitorConfig = {
    enabled: false,
    displayStyle: 'rows',
    barLayout: 'horizontal',
    monitorPosition: 'right',
    disconnectTimeout: 10000,
    // Base URL of the .NET sidecar (origin only).
    // The apiFetch / apiPost helpers in api.ts
    // accept this and append the per-endpoint
    // path themselves, so the per-endpoint
    // helpers (fetchAggregate, fetchConfig,
    // fetchSetup, ...) take the path as a
    // separate argument. Storing the full
    // endpoint here would double the path on
    // every request.
    serverUrl: 'http://localhost:27420',
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
    showDisk: false,
    monitorX: 95,
    monitorY: 5,
    monitorSize: 14,
    monitorColor: 'rgba(255, 255, 255, 0.8)',
};
