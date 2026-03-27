/**
 * System Monitor Property Handler
 * 处理系统监控相关属性
 */

import { appConfig, config } from '@/utils/config';
import { getSystemMonitor, initSystemMonitor } from '@/systemMonitor';
import { WallpaperProperties } from './types';

/**
 * 处理系统监控属性
 * @param properties 属性对象
 * @param FirstLoad 是否首次加载
 */
export function handleSystemMonitorProperties(
    properties: WallpaperProperties,
    FirstLoad: boolean
): void {
    // 首次加载时初始化系统监控
    if (FirstLoad) {
        initSystemMonitor();
    }

    const monitor = getSystemMonitor();
    if (!monitor) return;

    // 服务器URL
    if (properties.sysmon_server_url) {
        monitor.updateConfig({
            serverUrl: properties.sysmon_server_url.value
        });
    }

    // 更新间隔
    if (properties.sysmon_update_interval) {
        monitor.updateConfig({
            updateInterval: properties.sysmon_update_interval.value * 1000
        });
    }

    // CPU显示模式
    if (properties.sysmon_cpu_mode) {
        const modes: Array<'none' | 'text' | 'bar' | 'curve'> = ['none', 'text', 'bar', 'curve'];
        const mode = modes[properties.sysmon_cpu_mode.value] || 'text';
        monitor.updateConfig({ cpuMode: mode });
    }

    // GPU显示模式
    if (properties.sysmon_gpu_mode) {
        const modes: Array<'none' | 'text' | 'bar' | 'curve'> = ['none', 'text', 'bar', 'curve'];
        const mode = modes[properties.sysmon_gpu_mode.value] || 'text';
        monitor.updateConfig({ gpuMode: mode });
    }

    // 内存显示模式
    if (properties.sysmon_memory_mode) {
        const modes: Array<'none' | 'text' | 'bar' | 'curve'> = ['none', 'text', 'bar', 'curve'];
        const mode = modes[properties.sysmon_memory_mode.value] || 'text';
        monitor.updateConfig({ memoryMode: mode });
    }

    // 网络显示模式
    if (properties.sysmon_network_mode) {
        const modes: Array<'none' | 'text' | 'bar' | 'curve'> = ['none', 'text', 'bar', 'curve'];
        const mode = modes[properties.sysmon_network_mode.value] || 'text';
        monitor.updateConfig({ networkMode: mode });
    }

    // 显示/隐藏CPU
    if (properties.sysmon_show_cpu) {
        monitor.updateConfig({
            showCpu: properties.sysmon_show_cpu.value
        });
    }

    // 显示/隐藏GPU
    if (properties.sysmon_show_gpu) {
        monitor.updateConfig({
            showGpu: properties.sysmon_show_gpu.value
        });
    }

    // 显示/隐藏内存
    if (properties.sysmon_show_memory) {
        monitor.updateConfig({
            showMemory: properties.sysmon_show_memory.value
        });
    }

    // 显示/隐藏网络
    if (properties.sysmon_show_network) {
        monitor.updateConfig({
            showNetwork: properties.sysmon_show_network.value
        });
    }

    // 位置X
    if (properties.sysmon_x) {
        monitor.updateConfig({
            monitorX: properties.sysmon_x.value
        });
    }

    // 位置Y
    if (properties.sysmon_y) {
        monitor.updateConfig({
            monitorY: properties.sysmon_y.value
        });
    }

    // 字体大小
    if (properties.sysmon_size) {
        monitor.updateConfig({
            monitorSize: properties.sysmon_size.value
        });
    }

    // 颜色
    if (properties.sysmon_color) {
        const c = properties.sysmon_color.value.split(' ').map((c: string) => Math.ceil(parseFloat(c) * 255));
        monitor.updateConfig({
            monitorColor: `rgba(${c.join(',')})`
        });
    }
}
