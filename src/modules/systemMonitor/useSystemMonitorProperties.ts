import { getSystemMonitor, initSystemMonitor, updateConfig } from '@/modules/systemMonitor';
import { useConfigStore } from '@/stores/config';
import { elements } from '@/utils/elementManager';
import { debugLogger } from '@/utils/logger';

import { WallpaperProperties } from '../../types/types';
import { logInitComplete } from '../../utils/helpers';

/** WE 下拉索引 → 显示模式 映射表（sysmon_*_mode 属性取值 0~3） */
const DISPLAY_MODES: Array<'none' | 'text' | 'bar' | 'curve'> = ['none', 'text', 'bar', 'curve'];
/** WE 下拉索引 → 布局 映射表（sysmon_bar_layout 取值 0~1） */
const BAR_LAYOUTS: Array<'horizontal' | 'vertical'> = ['horizontal', 'vertical'];
/** WE 下拉索引 → 位置 映射表（sysmon_position 取值 0~1） */
const MONITOR_POSITIONS: Array<'left' | 'right'> = ['left', 'right'];

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

    const baseUrl = monitor.config.serverUrl;
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
 * @param properties 灞炴€у璞?
 * @param FirstLoad 是否首次加载
 */
export function useSystemMonitorProperties(
    properties: WallpaperProperties,
    FirstLoad: boolean
): void {
    if (FirstLoad) {
        initSystemMonitor();
    }

    const monitor = getSystemMonitor();
    if (!monitor) return;

   // 如果之前 initSystemMonitor() 时 DOM 尚未就绪，此刻确保重新初始化
    monitor.ensureInitialized();

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
        const mode = DISPLAY_MODES[properties.sysmon_cpu_mode.value] || 'text';
        monitor.updateConfig({ cpuMode: mode });
    }

    if (properties.sysmon_gpu_mode) {
        const mode = DISPLAY_MODES[properties.sysmon_gpu_mode.value] || 'text';
        monitor.updateConfig({ gpuMode: mode });
    }

    if (properties.sysmon_memory_mode) {
        const mode = DISPLAY_MODES[properties.sysmon_memory_mode.value] || 'text';
        monitor.updateConfig({ memoryMode: mode });
    }

    if (properties.sysmon_network_mode) {
        const mode = DISPLAY_MODES[properties.sysmon_network_mode.value] || 'text';
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
            .map((v: string) => Math.ceil(parseFloat(v) * 255));
        monitor.updateConfig({
            monitorColor: `rgba(${c.join(',')})`,
        });
    }

    if (properties.sysmon_enabled !== undefined && useConfigStore().server_mode === true) {
        monitor.setEnabled(properties.sysmon_enabled.value);
    }

    if (properties.sysmon_bar_layout) {
        const layout = BAR_LAYOUTS[properties.sysmon_bar_layout.value] || 'horizontal';
        monitor.updateConfig({ barLayout: layout });
    }

    if (properties.sysmon_position) {
        const position = MONITOR_POSITIONS[properties.sysmon_position.value] || 'right';
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

    if (properties.sysmon_display_style) {
        const styles: Array<'rows' | 'cards'> = ['rows', 'cards'];
        const style = styles[properties.sysmon_display_style.value] || 'rows';
        monitor.updateConfig({ displayStyle: style });
    }

    if (properties.sysmon_show_disk) {
        monitor.updateConfig({
            showDisk: properties.sysmon_show_disk.value,
        });
    }

    if (FirstLoad) {
        logInitComplete('[Sysmon]', '系统性能', FirstLoad);
    }
}
