// @vitest-environment jsdom
/**
 * Tests for src/composables/useSystemMonitorProperties.ts — Stage 3-2
 *
 * Verifies system monitor property handler dispatches to monitor.updateConfig()
 * correctly. We mock the systemMonitor instance API and verify call args.
 */
import { createPinia, setActivePinia } from 'pinia';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

import { debugLogger } from '@/utils/logger';

const { mockMonitor, mockInit, mockUpdateConfig } = vi.hoisted(() => {
    const mockUpdateConfig = vi.fn();
    const mockSetEnabled = vi.fn();
    const mockMonitor = {
        updateConfig: mockUpdateConfig,
        setEnabled: mockSetEnabled,
        config: { serverUrl: 'http://localhost:8080' },
    };
    return { mockMonitor, mockInit: vi.fn(), mockUpdateConfig };
});

vi.mock('@/systemMonitor', () => ({
    getSystemMonitor: () => mockMonitor,
    initSystemMonitor: () => mockInit(),
    updateConfig: vi.fn().mockResolvedValue(true),
}));

vi.mock('@/utils/elementManager', () => ({
    elements: {
        body: document.body,
    },
}));

import { useSystemMonitorProperties } from '@/composables/useSystemMonitorProperties';

beforeEach(() => {
    setActivePinia(createPinia());
    debugLogger.clearLogs();
    document.body.removeAttribute('style');
    mockUpdateConfig.mockClear();
    mockMonitor.setEnabled.mockClear();
    mockInit.mockClear();
});

afterEach(() => {
    vi.restoreAllMocks();
});

describe('useSystemMonitorProperties', () => {
    test('FirstLoad → initSystemMonitor called', () => {
        useSystemMonitorProperties({} as never, true);
        expect(mockInit).toHaveBeenCalledTimes(1);
    });

    test('server_port → monitor.updateConfig({ serverPort })', () => {
        useSystemMonitorProperties(
            { sysmon_server_port: { value: 9090 } } as never,
            false
        );
        expect(mockUpdateConfig).toHaveBeenCalledWith({ serverPort: 9090 });
    });

    test('update_interval → monitor.updateConfig({ updateInterval: *1000 })', () => {
        useSystemMonitorProperties(
            { sysmon_update_interval: { value: 5 } } as never,
            false
        );
        expect(mockUpdateConfig).toHaveBeenCalledWith({ updateInterval: 5000 });
    });

    test('cpu_mode 0..3 → text/bar/curve modes', () => {
        useSystemMonitorProperties({ sysmon_cpu_mode: { value: 0 } } as never, false);
        expect(mockUpdateConfig).toHaveBeenCalledWith({ cpuMode: 'none' });
        useSystemMonitorProperties({ sysmon_cpu_mode: { value: 2 } } as never, false);
        expect(mockUpdateConfig).toHaveBeenCalledWith({ cpuMode: 'bar' });
    });

    test('color → monitorColor rgba() string', () => {
        useSystemMonitorProperties({ sysmon_color: { value: '1 0.5 0' } } as never, false);
        expect(mockUpdateConfig).toHaveBeenCalledWith({ monitorColor: 'rgba(255,128,0)' });
    });

    test('yakeli_show → --sysmon-yakeli-enabled CSS', () => {
        useSystemMonitorProperties(
            { sysmon_yakeli_show: { value: true } } as never,
            false
        );
        expect(document.body.style.getPropertyValue('--sysmon-yakeli-enabled')).toBe('1');
    });

    test('yakeli /100 → CSS', () => {
        useSystemMonitorProperties({ sysmon_yakeli: { value: 50 } } as never, false);
        expect(document.body.style.getPropertyValue('--sysmon-yakeli')).toBe('0.5');
    });

    test('disconnect_timeout → *1000', () => {
        useSystemMonitorProperties(
            { sysmon_disconnect_timeout: { value: 30 } } as never,
            false
        );
        expect(mockUpdateConfig).toHaveBeenCalledWith({ disconnectTimeout: 30000 });
    });

    test('logs init complete on FirstLoad', () => {
        useSystemMonitorProperties({} as never, true);
        const matched = debugLogger.logs.find(
            l => l.message === '[Sysmon] 系统性能参数初始化完成'
        );
        expect(matched).toBeDefined();
    });
});
