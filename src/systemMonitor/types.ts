/**
 * Type definitions for the system monitor module.
 *
 * The two sections of this file:
 *   1. Backend response types — exact shape of
 *      every JSON the .NET sidecar emits, used
 *      by apiFetch helpers in renderer.ts. Field
 *      nullability mirrors the server: `string`
 *      fields the server may legitimately omit
 *      (e.g. `pawnio_latest_version` while the
 *      background GitHub fetch hasn't returned)
 *      are `string | null`, not `string?`.
 *   2. Renderer-side types — the small subset the
 *      wallpaper renderer actually consumes, with
 *      optional fields for the parts that may
 *      not have arrived yet on first paint.
 *
 * Avoid `any`. Use `unknown` only at API
 * boundaries (JSON.parse of untrusted input);
 * narrow with type predicates before use.
 */

/* =================================================================
 *  0. 通用响应包装
 * ================================================================= */

/**
 * 后端 .NET 端所有 `/api/*` 端点的标准外层。
 * `timestamp` 是 Unix 毫秒（`Date.now()`）。
 */
export interface ApiResponse<T> {
    success: boolean;
    data: T | null;
    error: string | null;
    timestamp: number;
}

/**
 * 错误响应的窄形式。`data` 必为 null。
 */
export interface ApiErrorResponse {
    success: false;
    data: null;
    error: string;
    timestamp: number;
}

/**
 * 区分 `data` 还是 `error` 的类型守卫。`error` 字段是
 * 后端 i18n 化的字符串或英文原句。
 */
export function isApiError<T>(r: ApiResponse<T>): r is ApiErrorResponse {
    return r.success === false;
}

/* =================================================================
 *  1. `/api/sysinfo/*` —— 硬件监控
 * ================================================================= */

/**
 * 单个温度传感器读数。CPU 多传感器（如 AMD CCD 阵列）
 * 和 GPU 多传感器（如核心 + 显存结温）都会用这个。
 */
export interface TempComponent {
    label: string;
    /** 摄氏度 */
    temperature: number;
    temperature_min: number | null;
    temperature_max: number | null;
    /** 临界温度阈值，可能为 null */
    critical: number | null;
}

export interface CpuInfo {
    id: number;
    manufacturer: string;
    brand: string;
    /** 当前频率 MHz，可能为 0（未读到） */
    speed: number;
    bus_speed: number | null;
    min_speed: number | null;
    max_speed: number | null;
    clock_average: number | null;
    clock_average_effective: number | null;
    /** 每核频率 MHz */
    clocks_per_core: number[] | null;
    clocks_effective_per_core: number[] | null;
    /** 逻辑核数（含超线程） */
    cores: number;
    physical_cores: number;
    threads_per_core: number;
    /** 全局使用率 0-100 */
    usage: number;
    usage_per_core: number[] | null;
    usage_max_core: number | null;
    /** 单核最高使用率所在 0-based 索引 */
    usage_max_core_index: number | null;
    temperature: number;
    temperature_min: number | null;
    temperature_max: number | null;
    temperature_critical: number | null;
    temperature_label: string;
    temperature_available: boolean;
    temperature_component_count: number;
    temperature_components: TempComponent[];
    voltage_core: number | null;
    voltage_core_min: number | null;
    voltage_core_max: number | null;
    voltage_per_core: number[] | null;
    /** W（CPU package TDP） */
    power_package: number | null;
    power_per_core: number[] | null;
}

export interface GpuInfo {
    id: number;
    model: string;
    vendor: string;
    subvendor: string | null;
    driver_version: string | null;
    /** bytes */
    vram: number;
    vram_total: number;
    vram_used: number;
    vram_free: number | null;
    vram_used_percent: number | null;
    vram_shared_used: number | null;
    vram_type: string | null;
    core_clock: number | null;
    core_clock_max: number | null;
    memory_clock: number | null;
    sm_clock: number | null;
    video_clock: number | null;
    temperature: number;
    temperature_min: number | null;
    temperature_max: number | null;
    temperature_critical: number | null;
    temperature_hot_spot: number | null;
    temperature_memory_junction: number | null;
    temperature_available: boolean;
    temperature_components: TempComponent[];
    /** 0-100 */
    utilization: number;
    utilization_3d: number | null;
    utilization_copy: number | null;
    utilization_video_decode: number | null;
    utilization_video_encode: number | null;
    utilization_compute: number | null;
    utilization_memory_controller: number | null;
    utilization_video_engine: number | null;
    utilization_bus: number | null;
    utilization_vr: number | null;
    /**
     * 后端字段名是 "utilization_security"（直译自
     * LibreHardwareMonitor），不是 typo。前端如果做
     * 渲染要按字段名访问。
     */
    utilization_security: number | null;
    utilization_jpeg_decode: number | null;
    utilization_optical_flow: number | null;
    fan_speed_percent: number | null;
    fan_speed_rpm: number | null;
    fan_speed_available: boolean;
    /** W */
    power: number | null;
    power_percent: number | null;
    voltage_core: number | null;
    voltage_memory: number | null;
    /** bytes/s */
    pcie_rx_bps: number | null;
    pcie_tx_bps: number | null;
}

export interface MemoryInfo {
    /** bytes */
    total: number;
    used: number;
    free: number;
    /** 0-100 */
    used_percent: number;
    available: number;
    virtual_total: number;
    virtual_used: number;
    virtual_free: number;
    virtual_used_percent: number;
    page_file_total: number;
    page_file_used: number;
    page_file_free: number;
    page_file_used_percent: number;
    dimm_count: number;
    dimm_total_capacity: number;
    dimms: unknown[];
}

export interface NetworkInterface {
    name: string;
    description: string;
    type: 'ethernet' | 'wifi' | 'loopback' | 'tunnel' | string;
    mac: string | null;
    ipv4: string[];
    ipv6: string[];
    speed_mbps: number;
    is_up: boolean;
    rx_bytes: number | null;
    tx_bytes: number | null;
    rx_bps: number | null;
    tx_bps: number | null;
    utilization_percent: number | null;
}

export interface NetworkInfo {
    /** 当前采样窗口 B/s */
    rx: number;
    tx: number;
    /** 自启动后累计 bytes */
    rx_total: number;
    tx_total: number;
    interface_count: number;
    interfaces: NetworkInterface[];
}

export interface OsInfo {
    name: string;
    /**
     * ⚠️ 后端 EXE 没有 supported-OS manifest 时
     * 永远是 `"6.2.9200.0"`（Win 8 基线），不准。
     * 真正版本要看 `build` + `ubr`。
     */
    version: string;
    build: string;
    ubr: string | null;
    display: string;
}

export interface SystemInfo {
    hostname: string;
    username: string;
    domain: string;
    platform: 'Win32NT' | string;
    os: OsInfo;
    arch: 'x64' | 'x86' | string;
    /** 秒 */
    uptime: number;
    /** Unix 毫秒 */
    boot_time: number;
    timezone: string;
    tz_offset_minutes: number;
    locale: string;
    distro: string;
    release: string;
    is_elevated: boolean;
}

export interface TimeInfo {
    /** `Date.now()` 毫秒 */
    current: number;
    timezone: string;
    /** 秒 */
    uptime: number;
}

/**
 * `GET /api/sysinfo` 的 data 字段。
 * 后端是 `C# class AggregateInfo`，按字段顺序：
 * Cpu → Memory → Gpu → Network → System → Time。
 */
export interface AggregateInfo {
    cpu: CpuInfo[];
    memory: MemoryInfo;
    gpu: GpuInfo[];
    network: NetworkInfo;
    system: SystemInfo;
    time: TimeInfo;
}

/* =================================================================
 *  2. `/api/config` —— 简单 KV
 * ================================================================= */

export interface ConfigView {
    port: number;
    auto_start: boolean;
    log_level: 'info' | 'debug' | 'warn' | 'error' | string;
}

/**
 * `POST /api/config` 的请求体。所有字段 nullable：
 * 后端按 HasValue 局部更新，null 字段保持现状。
 */
export interface UpdateConfigRequest {
    port: number | null;
    auto_start: boolean | null;
    log_level: string | null;
}

/* =================================================================
 *  3. `/api/setup` —— 配置 + 状态 + i18n
 * ================================================================= */

/** 后端 HardwareMonitorService.RunMode 序列化 */
export type RunMode = 'User' | 'Admin';

/** Setup 端点的 config 子对象 */
export interface SetupConfig {
    port: number;
    log_level: string;
    /** 已解析的 BCP-47（空 → 跟 OS） */
    lang: string;
    supported_languages: string[];
}

/**
 * `GET /api/setup` 的 data 字段。
 * `pawnio_*` 字段在 PawnIO 未装/未读到 时为 null。
 */
export interface SetupState {
    config: SetupConfig;
    /** 完整 i18n 字符串表（key → 翻译） */
    strings: Record<ApiStringKey, string>;
    /** "1.0.0+<git-sha>" */
    server_version: string;
    is_elevated: boolean;
    run_mode: RunMode;
    process_id: number;
    exe_path: string;
    /** ISO 8601, e.g. "2026-06-09T11:42:39.0390944+08:00" */
    start_time: string;
    architecture: 'x64' | 'x86' | string;
    /** ".NET Framework <CLR 版本>" */
    dotnet_version: string;
    auto_start_user_registered: boolean;
    auto_start_admin_registered: boolean;
    pawnio_installed: boolean;
    pawnio_path: string | null;
    /** PE VS_VERSIONINFO */
    pawnio_version: string | null;
    /** "yyyy-MM-dd UTC" */
    pawnio_install_time: string | null;
    /** GitHub PawnIO.Setup atom feed 缓存（1h TTL） */
    pawnio_latest_version: string | null;
    /** pawnio_installed && is_elevated */
    lhm_will_work_with_pawnio: boolean;
}

/**
 * `POST /api/setup` 的请求体（discriminated union）。
 * 后端 `SetupRequest` 用 `JsonProperty` 接收，action 是
 * 分发键，其它字段按 action 选读。
 */
export type SetupActionRequest =
    | { action: 'set_port'; port: number }
    | { action: 'set_lang'; lang: string }
    | { action: 'set_auto_start_user'; enable: boolean }
    | { action: 'set_auto_start_admin'; enable: boolean }
    | { action: 'open_pawnio_releases' }
    | { action: 'open_console' };

/** set_port 的成功响应（特殊：返回小对象，服务器要重启） */
export interface SetPortSuccess {
    success: true;
    message: string;
    new_port: number;
}

/** open_pawnio_releases 成功 */
export interface OpenPawnioReleasesSuccess {
    success: true;
    data: { opened: true };
}

/** open_console 成功 */
export interface OpenConsoleSuccess {
    success: true;
    data: {
        console_opened: true;
        /** true=新开，false=已存在幂等返回 */
        fresh: boolean;
    };
}

/**
 * set_lang / set_auto_start_user / set_auto_start_admin
 * 成功后直接返回完整 SetupState（用 GetState 重发）。
 * 不是强类型 union 是因为后端是 `object`，
 * 前端消费路径通过 `r.data as SetupState` 收紧。
 */
export type SetupStateAfterAction = SetupState;

/* =================================================================
 *  4. `/api/files` —— 媒体文件
 * ================================================================= */

export interface FileEntry {
    name: string;
    path: string;
}

export interface FileListResult {
    directory: string;
    files: FileEntry[];
    count: number;
}

export interface AudioMetadata {
    title: string;
    artist: string;
    album: string;
    year: number | null;
    track: number | null;
    /** 秒 */
    duration: number | null;
    genre: string[] | null;
    picture: { format: string; data: string /* base64 */ } | null;
}

export type MediaAction = 'play-pause' | 'next' | 'prev' | 'stop';

export interface MediaControlResult {
    success: true;
    data: { opened: true };
}

/* =================================================================
 *  5. `/api/icon` —— 图标
 * ================================================================= */

export interface IconData {
    /** "data:image/...;base64,..." data URL */
    icon: string;
    cached: boolean;
}

export interface AllIconItem {
    icon: string;
    width: number;
    height: number;
    is_png: boolean;
}

export interface AllIconsResult {
    icons: AllIconItem[];
    count: number;
}

export interface CustomIconRequest {
    type: 'image/png' | 'image/jpeg' | 'image/jpg' | 'image/webp' | 'image/gif' | 'image/svg+xml';
    /** base64 编码的图像 */
    data: string;
}

export interface CustomIconResponse {
    success: true;
    data: {
        icon: string;
        /** bytes */
        size: number;
    };
}

export interface ClearCacheResponse {
    success: true;
    data: { cleared: number };
}

/* =================================================================
 *  6. `/api/dockbar` —— Dockbar
 * ================================================================= */

export interface OpenItemRequest {
    type: 'url' | 'app' | 'file';
    url?: string;
    path?: string;
}

export interface OpenItemResponse {
    success: true;
    data: { opened: true };
}

export interface SelectFileResult {
    path: string;
    name: string | null;
}

/* =================================================================
 *  7. i18n key 完整表
 * ================================================================= */

/**
 * 全部 /api/setup `strings` dict 的 key 集合。
 * 用 union 而不是 `string` 是为了配合 strict mode：
 * 写 `'Api_BtnNeedAdimn'` 拼错时 TS 直接报错。
 */
export type ApiStringKey =
    // HTML 标签 + 页面标题
    | 'Api_HtmlLang'
    | 'Api_PageTitle'
    // 端口卡
    | 'Api_LabelPort'
    | 'Api_PortSub'
    | 'Api_PortInputPlaceholder'
    | 'Api_PortCurrent'
    | 'Api_InvalidPortStatus'
    | 'Api_SavingStatus'
    | 'Api_BtnSave'
    // 自启动
    | 'Api_LabelUserAutoStart'
    | 'Api_SubUserAutoStart'
    | 'Api_LabelAdminAutoStart'
    | 'Api_SubAdminAutoStart'
    | 'Api_BtnToggle'
    | 'Api_BtnEnable'
    | 'Api_BtnDisable'
    | 'Api_Enabled'
    | 'Api_Disabled'
    | 'Api_DisabledAdminHint'
    | 'Api_BtnNeedAdmin'
    | 'Api_AdminNeededHint'
    // PawnIO
    | 'Api_LabelPawnio'
    | 'Api_SubPawnioMissing'
    | 'Api_PawnioInstalled'
    | 'Api_PawnioNotInstalled'
    | 'Api_BtnOpenPawnio'
    | 'Api_LabelPawnioPath'
    | 'Api_LabelPawnioVersion'
    | 'Api_LabelPawnioLatest'
    | 'Api_LabelPawnioInstallTime'
    | 'Api_PawnioNoNetwork'
    | 'Api_PawnioUnknown'
    // 控制台
    | 'Api_BtnOpenConsole'
    | 'Api_ConsoleOpenedNote'
    | 'Api_ConsoleAlreadyOpen'
    // 诊断
    | 'Api_LabelDiagnostics'
    | 'Api_LabelRunMode'
    | 'Api_RunModeUser'
    | 'Api_RunModeAdmin'
    | 'Api_LabelProcessId'
    | 'Api_LabelExePath'
    | 'Api_LabelStartTime'
    | 'Api_LabelArchitecture'
    | 'Api_LabelDotnetVersion'
    // 语言切换
    | 'Api_LangSwitcherLabel'
    | 'Api_LangEn'
    | 'Api_LangZhCn'
    // 通用
    | 'Api_DefaultSaved'
    | 'Api_ActionFailedFormat'
    | 'Api_GenericError';

/* =================================================================
 *  8. 渲染端使用的简化类型（历史遗留，下游继续消费）
 * ================================================================= */

/**
 * 单个温度传感器读数（与 TempComponent 字段同义，
 * 保留是为不破坏 historyHandler.ts / pwcCPU.ts 的引用）。
 */
export interface CpuTempComponent {
    label?: string;
    /** 摄氏度 */
    temperature?: number;
    /** 此次会话中观察到的最高温度 */
    max?: number;
    /** 临界温度，可能为 null */
    critical?: number | null;
}

/**
 * 渲染端消费的 CpuData 子集（带 `?` 表示可空）。
 * 完整版本是 `CpuInfo`（上面）。
 */
export interface CpuData {
    id?: number;
    manufacturer?: string;
    brand?: string;
    /** MHz */
    speed?: number;
    /** 逻辑核数 */
    cores?: number;
    /** 物理核数 */
    physical_cores?: number;
    /** 0-100 */
    usage?: number;
    temperature?: number;
    temperature_max?: number;
    temperature_critical?: number | null;
    temperature_label?: string;
    temperature_available?: boolean;
    temperature_component_count?: number;
    temperature_components?: CpuTempComponent[];
}

/* =================================================================
 *  9. SystemMonitor 业务配置 + DOM 引用
 * ================================================================= */

export interface SystemMonitorData {
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
