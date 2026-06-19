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
        // Typed as string to match the TypeScript contract
        // (src/systemMonitor/types.ts:351 declares
        // `ubr: string | null`). The round-1 audit flagged
        // the type drift; an int? would serialise as a
        // bare number ("ubr": 4391) and break any TS
        // consumer that does a string equality check.
        // Convert Ubr to its string form in BuildOsInfo().
        [JsonProperty("ubr")] public string Ubr { get; set; } // Update Build Revision (e.g. "4391")
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

    // =================================================================
    //  Disk
    // =================================================================

    /// <summary>
    /// One volume (drive letter) on a physical disk. Always
    /// populated: in user mode it comes from
    /// <see cref="System.IO.DriveInfo"/>; in admin mode it
    /// comes from <c>DiskInfoToolkit.Partition</c> and is
    /// cross-referenced back to the physical drive via the
    /// <c>DriveLetter</c> + <c>VolumePath</c> pairing.
    /// </summary>
    public sealed class DiskPartitionInfo
    {
        // ---- Identity ----
        [JsonProperty("drive_letter")] public string DriveLetter { get; set; } // "C" or "" for un-mounted partitions
        [JsonProperty("volume_path")] public string VolumePath { get; set; }   // "C:\"
        [JsonProperty("label")] public string Label { get; set; }               // "Windows" / "Data" / ""
        [JsonProperty("file_system")] public string FileSystem { get; set; }   // "NTFS" / "exFAT" / "FAT32"
        [JsonProperty("drive_type")] public string DriveType { get; set; }     // "Fixed" / "Removable" / "Network" / "CDRom" / "Unknown"

        // ---- Capacity (bytes; 0 if the drive isn't ready) ----
        [JsonProperty("total_bytes")] public long TotalBytes { get; set; }
        [JsonProperty("used_bytes")] public long UsedBytes { get; set; }
        [JsonProperty("free_bytes")] public long FreeBytes { get; set; }
        [JsonProperty("used_percent")] public float UsedPercent { get; set; }

        // ---- State ----
        [JsonProperty("is_ready")] public bool IsReady { get; set; }
        [JsonProperty("is_boot")] public bool IsBoot { get; set; }              // %SystemDrive% / boot partition
        [JsonProperty("is_system")] public bool IsSystem { get; set; }          // hosts the OS install
    }

    /// <summary>
    /// One physical disk (NVMe / SATA SSD / SATA HDD / USB).
    /// Fields are populated incrementally:
    /// <list type="bullet">
    ///   <item><description>
    ///     In **user mode** we only have <c>DriveInfo</c> data,
    ///     so <see cref="Model"/> stays at the volume-derived
    ///     placeholder, and SMART fields stay null.
    ///   </description></item>
    ///   <item><description>
    ///     In **admin mode** DiskInfoToolkit fills in model /
    ///     serial / firmware / SMART / temperature / lifetime.
    ///   </description></item>
    /// </list>
    /// </summary>
    public sealed class DiskDriveInfo
    {
        [JsonProperty("index")] public int Index { get; set; }                // 0-based index in the drives array
        [JsonProperty("model")] public string Model { get; set; }             // "Samsung SSD 980 PRO 2TB"
        [JsonProperty("vendor")] public string Vendor { get; set; }           // "Samsung" / "WDC" / ...
        [JsonProperty("product_id")] public string ProductId { get; set; }    // raw INQUIRY product
        [JsonProperty("vendor_id")] public string VendorId { get; set; }      // raw INQUIRY vendor
        [JsonProperty("serial_number")] public string SerialNumber { get; set; }
        [JsonProperty("firmware")] public string Firmware { get; set; }       // "5B2QGXA7"
        [JsonProperty("firmware_rev")] public string FirmwareRev { get; set; }// older LHM "FirmwareRev"
        [JsonProperty("bus_type")] public string BusType { get; set; }        // "NVMe" / "SATA" / "USB" / "RAID"
        [JsonProperty("controller_type")] public string ControllerType { get; set; } // "NVMe" / "ATA" / "SCSI" / "USB"
        [JsonProperty("device_id")] public string DeviceId { get; set; }      // "\\\\?\\SCSI#Disk&Ven_Samsung..."
        [JsonProperty("physical_path")] public string PhysicalPath { get; set; }
        [JsonProperty("drive_number")] public int? DriveNumber { get; set; }  // OS drive number (-1 if unknown)

        // ---- Kind flags ----
        [JsonProperty("is_nvme")] public bool IsNVMe { get; set; }
        [JsonProperty("is_ssd")] public bool IsSSD { get; set; }
        [JsonProperty("is_hdd")] public bool IsHDD { get; set; }
        [JsonProperty("is_removable")] public bool IsRemovable { get; set; }
        [JsonProperty("is_usb")] public bool IsUSB { get; set; }
        [JsonProperty("is_virtual")] public bool IsVirtual { get; set; }      // VHD / VHDX / iSCSI LUN

        // ---- Capacity (bytes; 0 if unknown) ----
        [JsonProperty("total_bytes")] public long TotalBytes { get; set; }
        [JsonProperty("total_free_bytes")] public long TotalFreeBytes { get; set; }
        [JsonProperty("total_used_bytes")] public long TotalUsedBytes { get; set; }
        [JsonProperty("used_percent")] public float UsedPercent { get; set; }

        // ---- SMART (admin mode only) ----
        [JsonProperty("smart_available")] public bool SmartAvailable { get; set; }
        [JsonProperty("disk_status")] public string DiskStatus { get; set; }   // "Good" / "Caution" / "Bad" / "Unknown"
        [JsonProperty("temperature")] public float? Temperature { get; set; } // °C, null if SMART didn't report
        [JsonProperty("temperature_warning")] public float? TemperatureWarning { get; set; }
        [JsonProperty("temperature_critical")] public float? TemperatureCritical { get; set; }

        // ---- Activity (always-on, user + admin) ----
        // TotalActivity = current disk I/O utilisation as a
        // percentage (0-100). Populated via DiskInfoToolkit in
        // admin mode; falls back to PDH % Disk Time in user
        // mode. null if no counter was accessible.
        [JsonProperty("total_activity")] public float? TotalActivity { get; set; }
        [JsonProperty("read_rate")] public long? ReadRate { get; set; }    // bytes/s, LHM Throughput sensor
        [JsonProperty("write_rate")] public long? WriteRate { get; set; }   // bytes/s, LHM Throughput sensor

        // ---- Wear / usage counters (admin mode only) ----
        // HostReads / HostWrites / NandWrites come from
        // DiskInfoToolkit in **GB** (CrystalDiskInfo
        // convention). The field name carries the unit so
        // the consumer knows what to expect without a
        // stale byte-conversion from user mode.
        [JsonProperty("life_remaining_percent")] public float? LifeRemainingPercent { get; set; } // 0-100, NVMe: Percentage Used; SSD: Wear_Leveling_Count inverted
        [JsonProperty("host_reads_gb")] public long? HostReadsGb { get; set; }
        [JsonProperty("host_writes_gb")] public long? HostWritesGb { get; set; }
        [JsonProperty("power_on_count")] public long? PowerOnCount { get; set; }
        [JsonProperty("power_on_hours")] public long? PowerOnHours { get; set; }
        [JsonProperty("nand_writes_gb")] public long? NandWritesGb { get; set; }
        [JsonProperty("wear_leveling_count")] public int? WearLevelingCount { get; set; }

        // ---- Partitions (volumes on this drive) ----
        [JsonProperty("partition_count")] public int PartitionCount { get; set; }
        [JsonProperty("partitions")] public List<DiskPartitionInfo> Partitions { get; set; } = new List<DiskPartitionInfo>();

        // ---- Diagnostics ----
        [JsonProperty("read_error")] public string ReadError { get; set; }   // populated if SMART poll failed
    }

    /// <summary>
    /// Aggregate disk info: total bytes across every drive,
    /// plus the per-drive list. Mirrors <see cref="MemoryInfo"/>'s
    /// pattern: scalar totals first, then a list of children.
    /// </summary>
    public sealed class DiskSummaryInfo
    {
        [JsonProperty("drive_count")] public int DriveCount { get; set; }
        [JsonProperty("total_bytes")] public long TotalBytes { get; set; }
        [JsonProperty("total_free_bytes")] public long TotalFreeBytes { get; set; }
        [JsonProperty("total_used_bytes")] public long TotalUsedBytes { get; set; }
        [JsonProperty("used_percent")] public float UsedPercent { get; set; }
        [JsonProperty("drives")] public List<DiskDriveInfo> Drives { get; set; } = new List<DiskDriveInfo>();
    }

    /// <summary>
    /// Lightweight per-drive activity reading extracted from
    /// LHM <c>HardwareType.Storage</c> sensors. Populated
    /// only in admin mode via <c>CollectStorageActivities()</c>;
    /// passed directly to <see cref="DiskInfoService"/> to
    /// avoid a double-enumeration of storage hardware.
    /// Key = hardware identifier string (name or DeviceID).
    /// </summary>
    public sealed class DiskActivityInfo
    {
        [JsonProperty("total_activity")] public float? TotalActivity { get; set; }
        [JsonProperty("read_activity")] public float? ReadActivity { get; set; }
        [JsonProperty("write_activity")] public float? WriteActivity { get; set; }
        [JsonProperty("read_rate")] public long? ReadRate { get; set; }   // bytes/s, Throughput sensor
        [JsonProperty("write_rate")] public long? WriteRate { get; set; }  // bytes/s, Throughput sensor
    }

    // =================================================================
    //  Aggregate
    // =================================================================

    public sealed class AggregateInfo
    {
        [JsonProperty("cpu")] public List<CpuInfo> Cpu { get; set; } = new List<CpuInfo>();
        [JsonProperty("memory")] public MemoryInfo Memory { get; set; } = new MemoryInfo();
        [JsonProperty("gpu")] public List<GpuInfo> Gpu { get; set; } = new List<GpuInfo>();
        [JsonProperty("network")] public NetworkInfo Network { get; set; } = new NetworkInfo();
        [JsonProperty("disks")] public DiskSummaryInfo Disks { get; set; } = new DiskSummaryInfo();
        [JsonProperty("system")] public SystemInfo System { get; set; } = new SystemInfo();
        [JsonProperty("time")] public TimeInfo Time { get; set; } = new TimeInfo();
    }
}
