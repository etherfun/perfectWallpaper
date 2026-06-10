import { getSystemMonitor, initSystemMonitor, updateConfig } from '@/systemMonitor';
import { config } from '@/utils/config';
import { elements } from '@/utils/elementManager';
import { debugLogger } from '@/utils/logger';

import { logInitComplete } from './_helpers';
import { WallpaperProperties } from './types';

/**
 * Handle auto-start setting change.
 *
 * Routes through the typed `updateConfig` helper in
 * `systemMonitor/api.ts` so we share the same envelope
 * parsing / i18n error logging as every other caller of
 * the .NET sidecar (no more raw `fetch` + status code
 * surgery here).
 *
 * @param enabled Whether auto-start is enabled
 */
async function handleAutoStart(enabled: boolean): Promise<void> {
    const monitor = getSystemMonitor();
    if (!monitor) return;

    const baseUrl = monitor['config'].serverUrl;
    const updated = await updateConfig(baseUrl, { auto_start: enabled });
    if (!updated) {
        // updateConfig already logged the underlying
        // HTTP / envelope / network failure via the
        // shared `debugLogger` channel.
        debugLogger.error('[Sysmon] Failed to update auto-start');
    }
}

/**
 * 处理系统监控属性
 * @param properties 属性对象
 * @param FirstLoad 是否首次加载
 */
export function handleSystemMonitorProperties(
    properties: WallpaperProperties,
    FirstLoad: boolean
): void {
    if (FirstLoad) {
        initSystemMonitor();
    }

    const monitor = getSystemMonitor();
    if (!monitor) return;

    if (properties.sysmon_server_port) {
        monitor.updateConfig({
            serverPort: properties.sysmon_server_port.value,
        });
    }

    if (properties.sysmon_auto_start && Object.keys(properties).length === 1) {
        handleAutoStart(properties.sysmon_auto_start.value);
    }

    if (properties.sysmon_update_interval) {
        monitor.updateConfig({
            updateInterval: properties.sysmon_update_interval.value * 1000,
        });
    }

    if (properties.sysmon_cpu_mode) {
        const modes: Array<'none' | 'text' | 'bar' | 'curve'> = ['none', 'text', 'bar', 'curve'];
        const mode = modes[properties.sysmon_cpu_mode.value] || 'text';
        monitor.updateConfig({ cpuMode: mode });
    }

    if (properties.sysmon_gpu_mode) {
        const modes: Array<'none' | 'text' | 'bar' | 'curve'> = ['none', 'text', 'bar', 'curve'];
        const mode = modes[properties.sysmon_gpu_mode.value] || 'text';
        monitor.updateConfig({ gpuMode: mode });
    }

    if (properties.sysmon_memory_mode) {
        const modes: Array<'none' | 'text' | 'bar' | 'curve'> = ['none', 'text', 'bar', 'curve'];
        const mode = modes[properties.sysmon_memory_mode.value] || 'text';
        monitor.updateConfig({ memoryMode: mode });
    }

    if (properties.sysmon_network_mode) {
        const modes: Array<'none' | 'text' | 'bar' | 'curve'> = ['none', 'text', 'bar', 'curve'];
        const mode = modes[properties.sysmon_network_mode.value] || 'text';
        monitor.updateConfig({ networkMode: mode });
    }

    if (properties.sysmon_show_cpu) {
        monitor.updateConfig({
            showCpu: properties.sysmon_show_cpu.value,
        });
    }

    if (properties.sysmon_show_gpu) {
        monitor.updateConfig({
            showGpu: properties.sysmon_show_gpu.value,
        });
    }

    if (properties.sysmon_show_memory) {
        monitor.updateConfig({
            showMemory: properties.sysmon_show_memory.value,
        });
    }

    if (properties.sysmon_show_network) {
        monitor.updateConfig({
            showNetwork: properties.sysmon_show_network.value,
        });
    }

    if (properties.sysmon_x) {
        monitor.updateConfig({
            monitorX: properties.sysmon_x.value,
        });
    }

    if (properties.sysmon_y) {
        monitor.updateConfig({
            monitorY: properties.sysmon_y.value,
        });
    }

    if (properties.sysmon_size) {
        monitor.updateConfig({
            monitorSize: properties.sysmon_size.value,
        });
    }

    if (properties.sysmon_color) {
        const c = properties.sysmon_color.value
            .split(' ')
            .map((c: string) => Math.ceil(parseFloat(c) * 255));
        monitor.updateConfig({
            monitorColor: `rgba(${c.join(',')})`,
        });
    }

    if (properties.sysmon_enabled !== undefined && config.server_mode) {
        monitor.setEnabled(properties.sysmon_enabled.value);
    }

    if (properties.sysmon_bar_layout) {
        const layouts: Array<'horizontal' | 'vertical'> = ['horizontal', 'vertical'];
        const layout = layouts[properties.sysmon_bar_layout.value] || 'horizontal';
        monitor.updateConfig({ barLayout: layout });
    }

    if (properties.sysmon_position) {
        const positions: Array<'left' | 'right'> = ['left', 'right'];
        const position = positions[properties.sysmon_position.value] || 'right';
        monitor.updateConfig({ monitorPosition: position });
    }

    if (properties.sysmon_disconnect_timeout) {
        monitor.updateConfig({
            disconnectTimeout: properties.sysmon_disconnect_timeout.value * 1000,
        });
    }

    // Yakeli (acrylic) effect settings
    if (properties.sysmon_yakeli_show) {
        elements.body.style.setProperty(
            '--sysmon-yakeli-enabled',
            properties.sysmon_yakeli_show.value ? '1' : '0'
        );
    }

    if (properties.sysmon_bluryakeli) {
        elements.body.style.setProperty(
            '--sysmon-blur-yakeli',
            `${properties.sysmon_bluryakeli.value}px`
        );
    }

    if (properties.sysmon_yakeli) {
        elements.body.style.setProperty(
            '--sysmon-yakeli',
            String(properties.sysmon_yakeli.value / 100)
        );
    }

    if (properties.sysmon_yakelicolor) {
        const c = properties.sysmon_yakelicolor.value
            .split(' ')
            .map((v: string) => Math.ceil(parseFloat(v) * 255));
        elements.body.style.setProperty('--sysmon-yakeli-color', c.join(', '));
    }

    if (properties.sysmon_roundedcorners) {
        elements.body.style.setProperty(
            '--sysmon-roundedcorners',
            String(properties.sysmon_roundedcorners.value)
        );
    }

    if (FirstLoad) {
        logInitComplete('[Sysmon]', '系统性能', FirstLoad);
    }
}
