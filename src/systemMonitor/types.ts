/**
 * Type definitions for the system monitor module.
 */

/**
 * 单个温度传感器读数。与后端 `CpuTempComponent` 对齐。
 */
export interface CpuTempComponent {
    label?: string;
    /** 摄氏度 */
    temperature?: number;
    /** 此次会话中观察到的最高温度（摄氏度） */
    max?: number;
    /** 临界温度（摄氏度），可能为 `null` */
    critical?: number | null;
}

/**
 * 单个 CPU 的完整信息。与后端 `CpuInfo` 字段一一对应。
 *
 * 后端 `/api/sysinfo/cpu` 返回一个 `Vec<CpuInfo>`，主流 PC 只有一个
 * 元素；多路服务器才会 >1。前端默认取 `data.cpu?.[0]`。
 */
export interface CpuData {
    /** CPU 索引（主流系统为 0） */
    id?: number;
    /** 制造商：`AMD` / `Intel` / `Apple` / `ARM` / `Unknown` */
    manufacturer?: string;
    /** 完整品牌字符串 */
    brand?: string;
    /** 当前频率（MHz） */
    speed?: number;
    /** 逻辑核心数（含超线程） */
    cores?: number;
    /** 物理核心数 */
    physical_cores?: number;
    /** 全局使用率（0-100） */
    usage?: number;
    /** 当前温度（摄氏度） */
    temperature?: number;
    /** 此次会话中观察到的最高温度 */
    temperature_max?: number;
    /** 临界温度阈值，可能为 `null` */
    temperature_critical?: number | null;
    /** 温度来源传感器标签 */
    temperature_label?: string;
    /** 是否成功读到有效温度 */
    temperature_available?: boolean;
    /** 系统中检测到的温度传感器数量 */
    temperature_component_count?: number;
    /** 全部传感器读数 */
    temperature_components?: CpuTempComponent[];
}

export interface SystemMonitorData {
    /** CPU 信息数组（与 `/api/sysinfo/cpu` 一致）。 */
    cpu?: CpuData[];
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
