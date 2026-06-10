using System;
using System.Collections.Generic;
using Newtonsoft.Json;

namespace PerfectWall.Server.Models
{
    // =================================================================
    //  CPU
    // =================================================================

    /// <summary>
    /// One CPU temperature sensor reading. Shape kept from the
    /// LHM era so the JSON contract is preserved; admin mode
    /// populates the float values, user mode keeps the "no
    /// data" markers (0.0 / null / "").
    /// </summary>
    public sealed class CpuTempComponent
    {
        [JsonProperty("label")] public string Label { get; set; } = string.Empty;
        [JsonProperty("temperature")] public float Temperature { get; set; }
        [JsonProperty("temperature_min")] public float? TemperatureMin { get; set; }
        [JsonProperty("temperature_max")] public float? TemperatureMax { get; set; }
        [JsonProperty("critical")] public float? Critical { get; set; }
    }

    /// <summary>
    /// One CPU's full information, returned as a single-element
    /// array on mainstream PCs. Every field is nullable /
    /// zero-initialised so the JSON contract is preserved
    /// even when LHM doesn't expose a particular sensor.
    /// </summary>
    public sealed class CpuInfo
    {
        [JsonProperty("id")] public int Id { get; set; }
        [JsonProperty("manufacturer")] public string Manufacturer { get; set; } = "Unknown";
        [JsonProperty("brand")] public string Brand { get; set; } = string.Empty;

        // ---- Clocks (MHz) ----
        [JsonProperty("speed")] public long Speed { get; set; }
        [JsonProperty("bus_speed")] public float? BusSpeed { get; set; }
        [JsonProperty("min_speed")] public float? MinSpeed { get; set; }
        [JsonProperty("max_speed")] public float? MaxSpeed { get; set; }
        [JsonProperty("clock_average")] public float? ClockAverage { get; set; }
        [JsonProperty("clock_average_effective")] public float? ClockAverageEffective { get; set; }
        [JsonProperty("clocks_per_core")] public float[] ClocksPerCore { get; set; }
        [JsonProperty("clocks_effective_per_core")] public float[] ClocksEffectivePerCore { get; set; }

        // ---- Topology ----
        [JsonProperty("cores")] public int Cores { get; set; }
        [JsonProperty("physical_cores")] public int PhysicalCores { get; set; }
        [JsonProperty("threads_per_core")] public int ThreadsPerCore { get; set; } = 2;

        // ---- Usage ----
        [JsonProperty("usage")] public float Usage { get; set; }
        [JsonProperty("usage_per_core")] public float[] UsagePerCore { get; set; }
        [JsonProperty("usage_max_core")] public float? UsageMaxCore { get; set; }
        [JsonProperty("usage_max_core_index")] public int? UsageMaxCoreIndex { get; set; }

        // ---- Temperature ----
        [JsonProperty("temperature")] public float Temperature { get; set; }
        [JsonProperty("temperature_min")] public float? TemperatureMin { get; set; }
        [JsonProperty("temperature_max")] public float? TemperatureMax { get; set; }
        [JsonProperty("temperature_critical")] public float? TemperatureCritical { get; set; }
        [JsonProperty("temperature_label")] public string TemperatureLabel { get; set; } = string.Empty;
        [JsonProperty("temperature_available")] public bool TemperatureAvailable { get; set; }
        [JsonProperty("temperature_component_count")] public int TemperatureComponentCount { get; set; }
        [JsonProperty("temperature_components")] public List<CpuTempComponent> TemperatureComponents { get; set; }
            = new List<CpuTempComponent>();

        // ---- Voltage (V) ----
        [JsonProperty("voltage_core")] public float? VoltageCore { get; set; }
        [JsonProperty("voltage_core_min")] public float? VoltageCoreMin { get; set; }
        [JsonProperty("voltage_core_max")] public float? VoltageCoreMax { get; set; }
        [JsonProperty("voltage_per_core")] public float[] VoltagePerCore { get; set; }

        // ---- Power (W) ----
        [JsonProperty("power_package")] public float? PowerPackage { get; set; }
        [JsonProperty("power_per_core")] public float[] PowerPerCore { get; set; }
    }

    // =================================================================
    //  GPU
    // =================================================================

    public sealed class GpuInfo
    {
        [JsonProperty("id")] public int Id { get; set; }
        [JsonProperty("model")] public string Model { get; set; } = "Unknown";
        [JsonProperty("vendor")] public string Vendor { get; set; } = "Unknown";
        [JsonProperty("subvendor")] public string Subvendor { get; set; } // WMI Win32_VideoController.AdapterCompatibility
        [JsonProperty("driver_version")] public string DriverVersion { get; set; } // WMI / NVAPI

        // ---- VRAM (bytes) ----
        [JsonProperty("vram")] public long Vram { get; set; }                       // total, bytes (compat)
        [JsonProperty("vram_total")] public long? VramTotal { get; set; }
        [JsonProperty("vram_used")] public long? VramUsed { get; set; }
        [JsonProperty("vram_free")] public long? VramFree { get; set; }
        [JsonProperty("vram_used_percent")] public float? VramUsedPercent { get; set; }
        [JsonProperty("vram_shared_used")] public long? VramSharedUsed { get; set; }
        [JsonProperty("vram_type")] public string VramType { get; set; }            // GDDR6X / HBM2e / ...

        // ---- Clocks (MHz) ----
        [JsonProperty("core_clock")] public float? CoreClock { get; set; }
        [JsonProperty("core_clock_max")] public float? CoreClockMax { get; set; }
        [JsonProperty("memory_clock")] public float? MemoryClock { get; set; }
        [JsonProperty("sm_clock")] public float? SmClock { get; set; }
        [JsonProperty("video_clock")] public float? VideoClock { get; set; }

        // ---- Temperature (°C) ----
        [JsonProperty("temperature")] public float Temperature { get; set; }
        [JsonProperty("temperature_min")] public float? TemperatureMin { get; set; }
        [JsonProperty("temperature_max")] public float? TemperatureMax { get; set; }
        [JsonProperty("temperature_critical")] public float? TemperatureCritical { get; set; }
        [JsonProperty("temperature_hot_spot")] public float? TemperatureHotSpot { get; set; } // NVIDIA Memory Junction
        [JsonProperty("temperature_memory_junction")] public float? TemperatureMemoryJunction { get; set; }
        [JsonProperty("temperature_available")] public bool TemperatureAvailable { get; set; }
        [JsonProperty("temperature_components")] public List<CpuTempComponent> TemperatureComponents { get; set; }
            = new List<CpuTempComponent>();

        // ---- Utilization ----
        [JsonProperty("utilization")] public float Utilization { get; set; }
        [JsonProperty("utilization_3d")] public float? Utilization3D { get; set; }
        [JsonProperty("utilization_copy")] public float? UtilizationCopy { get; set; }
        [JsonProperty("utilization_video_decode")] public float? UtilizationVideoDecode { get; set; }
        [JsonProperty("utilization_video_encode")] public float? UtilizationVideoEncode { get; set; }
        [JsonProperty("utilization_compute")] public float? UtilizationCompute { get; set; }
        [JsonProperty("utilization_memory_controller")] public float? UtilizationMemoryController { get; set; }
        [JsonProperty("utilization_video_engine")] public float? UtilizationVideoEngine { get; set; }
        [JsonProperty("utilization_bus")] public float? UtilizationBus { get; set; }
        [JsonProperty("utilization_vr")] public float? UtilizationVR { get; set; }
        [JsonProperty("utilization_security")] public float? UtilizationSecurity { get; set; }
        [JsonProperty("utilization_jpeg_decode")] public float? UtilizationJpegDecode { get; set; }
        [JsonProperty("utilization_optical_flow")] public float? UtilizationOpticalFlow { get; set; }

        // ---- Fan ----
        [JsonProperty("fan_speed_percent")] public float? FanSpeedPercent { get; set; }
        [JsonProperty("fan_speed_rpm")] public float? FanSpeedRpm { get; set; }
        [JsonProperty("fan_speed_available")] public bool FanSpeedAvailable { get; set; }

        // ---- Power (W) ----
        [JsonProperty("power")] public float? Power { get; set; }
        [JsonProperty("power_percent")] public float? PowerPercent { get; set; }

        // ---- Voltage (V) ----
        [JsonProperty("voltage_core")] public float? VoltageCore { get; set; }
        [JsonProperty("voltage_memory")] public float? VoltageMemory { get; set; }

        // ---- PCIe ----
        [JsonProperty("pcie_rx_bps")] public float? PcieRxBps { get; set; }
        [JsonProperty("pcie_tx_bps")] public float? PcieTxBps { get; set; }
    }

    // =================================================================
    //  Memory
    // =================================================================

    public sealed class DimmInfo
    {
        [JsonProperty("slot")] public int Slot { get; set; }
        [JsonProperty("manufacturer")] public string Manufacturer { get; set; } // SPD: "Micron Technology" etc
        [JsonProperty("part_number")] public string PartNumber { get; set; }
        [JsonProperty("capacity_bytes")] public long CapacityBytes { get; set; }
        [JsonProperty("speed_mt_s")] public int? SpeedMtS { get; set; } // e.g. 5600 MT/s
        [JsonProperty("temperature")] public float? Temperature { get; set; }
    }

    public sealed class MemoryInfo
    {
        // ---- Physical RAM (from GlobalMemoryStatusEx) ----
        [JsonProperty("total")] public ulong Total { get; set; }
        [JsonProperty("used")] public ulong Used { get; set; }
        [JsonProperty("free")] public ulong Free { get; set; }
        [JsonProperty("used_percent")] public float UsedPercent { get; set; }
        [JsonProperty("available")] public ulong Available { get; set; }

        // ---- Virtual / commit memory (from GlobalMemoryStatusEx) ----
        [JsonProperty("virtual_total")] public ulong VirtualTotal { get; set; } // = RAM + page file
        [JsonProperty("virtual_used")] public ulong VirtualUsed { get; set; }
        [JsonProperty("virtual_free")] public ulong VirtualFree { get; set; }
        [JsonProperty("virtual_used_percent")] public float VirtualUsedPercent { get; set; }

        // ---- Page file ----
        [JsonProperty("page_file_total")] public ulong PageFileTotal { get; set; }
        [JsonProperty("page_file_used")] public ulong PageFileUsed { get; set; }
        [JsonProperty("page_file_free")] public ulong PageFileFree { get; set; }
        [JsonProperty("page_file_used_percent")] public float PageFileUsedPercent { get; set; }

        // ---- DIMM info (from LHM /memory/dimm/*) ----
        [JsonProperty("dimm_count")] public int DimmCount { get; set; }
        [JsonProperty("dimm_total_capacity")] public long DimmTotalCapacity { get; set; }
        [JsonProperty("dimms")] public List<DimmInfo> Dimms { get; set; } = new List<DimmInfo>();
    }

    // =================================================================
    //  Network
    // =================================================================

    public sealed class NetworkInterfaceInfo
    {
        [JsonProperty("name")] public string Name { get; set; }
        [JsonProperty("description")] public string Description { get; set; }
        [JsonProperty("type")] public string Type { get; set; } // ethernet / wifi / vpn / loopback / tunnel
        [JsonProperty("mac")] public string Mac { get; set; }
        [JsonProperty("ipv4")] public string[] Ipv4 { get; set; } = Array.Empty<string>();
        [JsonProperty("ipv6")] public string[] Ipv6 { get; set; } = Array.Empty<string>();
        [JsonProperty("speed_mbps")] public long? SpeedMbps { get; set; }
        [JsonProperty("is_up")] public bool IsUp { get; set; }

        // ---- LHM-exposed counters (always in MB / MB·s) ----
        [JsonProperty("rx_bytes")] public long? RxBytes { get; set; }
        [JsonProperty("tx_bytes")] public long? TxBytes { get; set; }
        [JsonProperty("rx_bps")] public float? RxBps { get; set; }
        [JsonProperty("tx_bps")] public float? TxBps { get; set; }
        [JsonProperty("utilization_percent")] public float? UtilizationPercent { get; set; }
    }

    public sealed class NetworkInfo
    {
        [JsonProperty("rx")] public double Rx { get; set; } // total B/s
        [JsonProperty("tx")] public double Tx { get; set; }
        [JsonProperty("rx_total")] public long RxTotal { get; set; }
        [JsonProperty("tx_total")] public long TxTotal { get; set; }
        [JsonProperty("interface_count")] public int InterfaceCount { get; set; }
        [JsonProperty("interfaces")] public List<NetworkInterfaceInfo> Interfaces { get; set; }
            = new List<NetworkInterfaceInfo>();
    }

    // =================================================================
    //  System
    // =================================================================

    public sealed class OsInfo
    {
        [JsonProperty("name")] public string Name { get; set; } // "Microsoft Windows 11 Pro"
        [JsonProperty("version")] public string Version { get; set; } // "10.0.22631"
        [JsonProperty("build")] public string Build { get; set; } // "22631"
        [JsonProperty("ubr")] public int? Ubr { get; set; } // Update Build Revision (e.g. 4391)
        [JsonProperty("display")] public string Display { get; set; } // compat field
    }

    public sealed class SystemInfo
    {
        [JsonProperty("hostname")] public string Hostname { get; set; }
        [JsonProperty("username")] public string Username { get; set; }
        [JsonProperty("domain")] public string Domain { get; set; }
        [JsonProperty("platform")] public string Platform { get; set; } // legacy: "Win32NT"
        [JsonProperty("os")] public OsInfo Os { get; set; } = new OsInfo();
        [JsonProperty("arch")] public string Arch { get; set; }
        [JsonProperty("uptime")] public long Uptime { get; set; }
        [JsonProperty("boot_time")] public long BootTime { get; set; }
        [JsonProperty("timezone")] public string Timezone { get; set; }
        [JsonProperty("tz_offset_minutes")] public int TzOffsetMinutes { get; set; }
        [JsonProperty("locale")] public string Locale { get; set; }
        [JsonProperty("distro")] public string Distro { get; set; } // compat
        [JsonProperty("release")] public string Release { get; set; } // compat
        [JsonProperty("is_elevated")] public bool IsElevated { get; set; }
    }

    public sealed class TimeInfo
    {
        [JsonProperty("current")] public long Current { get; set; }
        [JsonProperty("timezone")] public string Timezone { get; set; }
        [JsonProperty("uptime")] public long Uptime { get; set; }
    }

    public sealed class AggregateInfo
    {
        [JsonProperty("cpu")] public List<CpuInfo> Cpu { get; set; } = new List<CpuInfo>();
        [JsonProperty("memory")] public MemoryInfo Memory { get; set; } = new MemoryInfo();
        [JsonProperty("gpu")] public List<GpuInfo> Gpu { get; set; } = new List<GpuInfo>();
        [JsonProperty("network")] public NetworkInfo Network { get; set; } = new NetworkInfo();
        [JsonProperty("system")] public SystemInfo System { get; set; } = new SystemInfo();
        [JsonProperty("time")] public TimeInfo Time { get; set; } = new TimeInfo();
    }
}
