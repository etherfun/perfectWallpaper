using System;
using System.Collections;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Reflection;
using PerfectWall.Server.Models;

namespace PerfectWall.Server.Services
{
    /// <summary>
    /// Storage device telemetry, with two data tiers:
    ///
    /// <list type="number">
    ///   <item><description>
    ///     **Always-on** (user mode): we enumerate
    ///     <see cref="DriveInfo"/> for every mounted volume
    ///     and produce a <see cref="DiskSummaryInfo"/> with
    ///     one synthetic "logical drive" entry per volume.
    ///     This is the same data the Windows shell uses for
    ///     "This PC" and works without admin.
    ///   </description></item>
    ///   <item><description>
    ///     **Admin mode**: we additionally call into
    ///     <c>DiskInfoToolkit</c>'s
    ///     <c>StorageManager.ReloadStorages()</c> to get the
    ///     raw physical drive list (NVMe / SATA SSD / HDD /
    ///     USB) with model, serial, firmware, SMART, and
    ///     temperature. Each physical drive is then enriched
    ///     with the matching <see cref="DriveInfo"/> volume
    ///     data, so the JSON contract for an end user looks
    ///     the same — only the fields that are admin-only
    ///     are nullable in user mode.
    ///   </description></item>
    /// </list>
    ///
    /// The reason this is a separate service (rather than a
    /// method on <see cref="HardwareMonitorService"/>) is
    /// twofold:
    ///   1. Disk info is part-LHM and part-pure-managed.
    ///      Mixing the two into one class would force the
    ///      user-mode path to import <c>DiskInfoToolkit</c>
    ///      and pay the native-load cost on every startup.
    ///   2. The <c>dynamic</c> keyword we initially used to
    ///      talk to <c>DiskInfoToolkit</c>'s Storage /
    ///      SmartInfo / Partition types without an explicit
    ///      <c>DiskInfoToolkit</c> reference at the top of
    ///      the file would force a <c>Microsoft.CSharp</c>
    ///      package reference — and the <c>csproj</c>
    ///      explicitly avoids that to sidestep the same
    ///      TFM-conflict pitfall that bit
    ///      <c>System.Management</c>. We use raw
    ///      <see cref="PropertyInfo"/> reflection instead,
    ///      which is only one or two lines more verbose
    ///      per access and skips the <c>dynamic</c> IL
    ///      codegen entirely.
    /// </summary>
    public sealed class DiskInfoService : IDisposable
    {
        private readonly HardwareMonitorService.RunMode _mode;
        private readonly object _lock = new object();
        private bool _disposed;

        // Cache DiskInfoToolkit storage list to avoid hammering
        // ATA/NVMe IDENTIFY DEVICE on every poll. Valid for 5 s —
        // long enough to smooth out per-second polling while still
        // picking up genuine hardware changes (drive swap, hot-swap
        // enclosure, USB plug events).
        private IList _storageCache;
        private long _storageCacheTime;
        private const long StorageCacheMs = 5000;

        public DiskInfoService(HardwareMonitorService.RunMode mode)
        {
            _mode = mode;
        }

        /// <summary>
        /// Build a full snapshot. Thread-safe. The first
        /// call from each process may take a few hundred
        /// milliseconds because
        /// <c>StorageManager.ReloadStorages()</c> sends an
        /// ATA / NVMe IDENTIFY DEVICE down every storage
        /// controller; subsequent calls reuse the cached
        /// <c>Storage</c> objects and only re-poll SMART.
        /// </summary>
        /// <param name="lhmActivities">Optional per-drive I/O activity
        /// readings from LHM (populated by CollectStorageActivities()).
        /// When null the DiskInfoToolkit Activity property is tried
        /// as a fallback in admin mode.</param>
        public DiskSummaryInfo Collect(Dictionary<string, DiskActivityInfo> lhmActivities = null)
        {
            var summary = new DiskSummaryInfo();
            var volumes = EnumerateVolumes();

            // ---- User-mode path ----
            if (_mode != HardwareMonitorService.RunMode.Admin)
            {
                int idx = 0;
                foreach (var v in volumes)
                {
                    var d = new DiskDriveInfo
                    {
                        Index = idx++,
                        Model = string.IsNullOrEmpty(v.Label) ? $"Local Disk ({v.DriveLetter}:)" : v.Label,
                        Vendor = "Unknown",
                        BusType = ClassifyBusTypeFromDriveType(v.DriveType),
                        IsRemovable = string.Equals(v.DriveType, "Removable", StringComparison.OrdinalIgnoreCase),
                        IsUSB = string.Equals(v.DriveType, "Removable", StringComparison.OrdinalIgnoreCase)
                            && !string.Equals(v.DriveType, "Fixed", StringComparison.OrdinalIgnoreCase),
                        IsSSD = false,
                        IsHDD = false,
                        IsNVMe = false,
                        TotalBytes = v.TotalBytes,
                        TotalFreeBytes = v.FreeBytes,
                        TotalUsedBytes = v.UsedBytes,
                        UsedPercent = v.UsedPercent,
                        SmartAvailable = false,
                        DiskStatus = "Unknown",
                        TotalActivity = null,
                        PartitionCount = 1
                    };
                    d.Partitions.Add(v);
                    summary.Drives.Add(d);
                }
                Summarise(summary);
                return summary;
            }

            // ---- Admin-mode path ----
            // DiskInfoToolkit + DriveInfo cross-reference.
            // Defensive: StorageManager.Storages can be null
            // if ReloadStorages() returned without error
            // but didn't initialise any controllers (e.g.
            // a stripped-down Windows Server image). We
            // fall back to the user-mode view in that case.
            IList rawStorages = null;
            string initError = null;
            var now = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds();
            lock (_lock)
            {
                if (_storageCache != null && (now - _storageCacheTime) < StorageCacheMs)
                {
                    rawStorages = _storageCache;
                }
                else
                {
                    try
                    {
                        InvokeStaticVoid("StorageManager", "ReloadStorages");
                        rawStorages = InvokeStaticGet("StorageManager", "Storages") as IList;
                        _storageCache = rawStorages;
                        _storageCacheTime = now;
                    }
                    catch (Exception ex)
                    {
                        initError = ex.Message;
                    }
                }
            }

            if (rawStorages == null || rawStorages.Count == 0)
            {
                int idx = 0;
                foreach (var v in volumes)
                {
                    var d = new DiskDriveInfo
                    {
                        Index = idx++,
                        Model = string.IsNullOrEmpty(v.Label) ? $"Local Disk ({v.DriveLetter}:)" : v.Label,
                        Vendor = "Unknown",
                        BusType = ClassifyBusTypeFromDriveType(v.DriveType),
                        IsRemovable = string.Equals(v.DriveType, "Removable", StringComparison.OrdinalIgnoreCase),
                        TotalBytes = v.TotalBytes,
                        TotalFreeBytes = v.FreeBytes,
                        TotalUsedBytes = v.UsedBytes,
                        UsedPercent = v.UsedPercent,
                        SmartAvailable = false,
                        DiskStatus = "Unknown",
                        TotalActivity = null,
                        ReadError = initError,
                        PartitionCount = 1
                    };
                    d.Partitions.Add(v);
                    summary.Drives.Add(d);
                }
                Summarise(summary);
                return summary;
            }

            int driveIndex = 0;
            foreach (var rawStorage in rawStorages)
            {
                DiskDriveInfo drive = null;
                try
                {
                    drive = MapStorage(rawStorage, volumes, lhmActivities);
                    drive.Index = driveIndex++;
                    summary.Drives.Add(drive);
                }
                catch (Exception ex)
                {
                    summary.Drives.Add(new DiskDriveInfo
                    {
                        Index = driveIndex++,
                        Model = "Unknown",
                        BusType = "Unknown",
                        DiskStatus = "Unknown",
                        ReadError = ex.Message,
                        SmartAvailable = false,
                        TotalActivity = null
                    });
                }
            }
            Summarise(summary);
            return summary;
        }

        // -----------------------------------------------------------------
        //  Storage mapping (reflection over DiskInfoToolkit)
        // -----------------------------------------------------------------

        private static DiskDriveInfo MapStorage(object storage, List<DiskPartitionInfo> volumes, Dictionary<string, DiskActivityInfo> lhmActivities)
        {
            string model = SafeString(GetProp(storage, "Model"));
            string vendor = SafeString(GetProp(storage, "Vendor"));
            string productId = SafeString(GetProp(storage, "ProductID"));
            string vendorId = SafeString(GetProp(storage, "VendorID"));
            string serial = SafeString(GetProp(storage, "SerialNumber"));
            string firmware = SafeString(GetProp(storage, "Firmware"));
            string firmwareRev = SafeString(GetProp(storage, "FirmwareRev"));
            string busType = SafeString(GetProp(storage, "BusType"));
            object controllerObj = GetProp(storage, "StorageControllerType");
            string controller = controllerObj == null ? null : controllerObj.ToString();
            string deviceId = SafeString(GetProp(storage, "DeviceID"));
            string physicalPath = SafeString(GetProp(storage, "PhysicalPath"));
            int? driveNumber = SafeInt(GetProp(storage, "DriveNumber"));

            bool isNVMe = SafeBool(GetProp(storage, "IsNVMe"));
            bool isSSD = SafeBool(GetProp(storage, "IsSSD"));
            bool isRemovable = SafeBool(GetProp(storage, "IsRemoveableMedia"));
            bool isHDD = !isNVMe && !isSSD;

            // Update() forces a fresh SMART poll. We call it
            // explicitly because the toolkit's constructor-
            // time Update is lazy and only fires when the
            // consumer enumerates Sensors.
            try { InvokeInstanceVoid(storage, "Update"); } catch { /* broken drive */ }

            object smart = GetProp(storage, "Smart");

            float? temperature = SafeFloat(GetProp(smart, "Temperature"));
            float? tempWarning = SafeFloat(GetProp(smart, "TemperatureWarning"));
            float? tempCritical = SafeFloat(GetProp(smart, "TemperatureCritical"));
            float? life = SafeFloat(GetProp(smart, "Life"));
            // DiskInfoToolkit reports HostReads/HostWrites/NandWrites
            // in **GB** (CrystalDiskInfo convention). Surface them
            // as-is — the JSON field name carries the unit so there's
            // no ambiguity. Byte-level conversion would overflow in
            // user mode (null * 1e9 = null) and add no value when
            // the counters are only meaningful as GB.
            long? hostReads = SafeLong(GetProp(smart, "HostReads"));
            long? hostWrites = SafeLong(GetProp(smart, "HostWrites"));
            long? powerOnCount = SafeLong(GetProp(smart, "PowerOnCount"));
            long? powerOnHours = SafeLong(GetProp(smart, "MeasuredPowerOnHours"));
            long? nandWrites = SafeLong(GetProp(smart, "NandWrites"));
            int? wearLeveling = SafeInt(GetProp(smart, "WearLevelingCount"));
            object diskStatusObj = GetProp(smart, "DiskStatus");
            string smartStatus = diskStatusObj == null ? null : diskStatusObj.ToString();
            string diskStatus = ClassifyDiskStatus(smartStatus, life, temperature, tempCritical);

            // ---- Activity (admin mode) ----
            // Primary source: LHM HardwareType.Storage "Total Activity"
            // Load sensor. This is the canonical Windows disk
            // activity counter. Fall back to DiskInfoToolkit
            // Storage.Activity if LHM didn't surface it.
            float? totalActivity = null;
            long? readRate = null;
            long? writeRate = null;
            if (lhmActivities != null && lhmActivities.Count > 0)
            {
                if (!string.IsNullOrEmpty(model) && lhmActivities.TryGetValue(model, out var ai))
                {
                    totalActivity = ai.TotalActivity;
                    readRate = ai.ReadRate;
                    writeRate = ai.WriteRate;
                }
                if (!totalActivity.HasValue)
                {
                    foreach (var kvp in lhmActivities)
                    {
                        if (kvp.Value.TotalActivity.HasValue)
                        {
                            totalActivity = kvp.Value.TotalActivity;
                            break;
                        }
                    }
                }
                if (!readRate.HasValue || !writeRate.HasValue)
                {
                    foreach (var kvp in lhmActivities)
                    {
                        if (!readRate.HasValue) readRate = kvp.Value.ReadRate;
                        if (!writeRate.HasValue) writeRate = kvp.Value.WriteRate;
                        if (readRate.HasValue && writeRate.HasValue) break;
                    }
                }
            }
            if (!totalActivity.HasValue)
            {
                totalActivity = SafeFloat(GetProp(storage, "Activity"));
                if (!totalActivity.HasValue) totalActivity = SafeFloat(GetProp(storage, "ActivityPercent"));
            }

            // ---- Capacity ----
            long totalBytes = SafeLong(GetProp(storage, "TotalSize")) ?? 0L;
            long totalFreeBytes = SafeLong(GetProp(storage, "TotalFreeSize")) ?? 0L;
            long totalUsedBytes = totalBytes > totalFreeBytes ? totalBytes - totalFreeBytes : 0L;
            float usedPercent = totalBytes > 0
                ? (float)(totalUsedBytes * 100.0 / totalBytes)
                : 0f;

            // ---- Partitions ----
            var partitions = new List<DiskPartitionInfo>();
            try
            {
                var rawPartitions = GetProp(storage, "Partitions") as IEnumerable;
                if (rawPartitions != null)
                {
                    foreach (var p in rawPartitions)
                    {
                        try { partitions.Add(MapPartition(p, volumes)); }
                        catch { /* skip a broken partition */ }
                    }
                }
            }
            catch { /* storage.Partitions itself can throw on broken controllers */ }

            // If DiskInfoToolkit didn't surface any
            // partitions for this drive but we *know* a
            // volume is mounted (from DriveInfo), attach
            // any orphan volume that doesn't already appear
            // on a more specific physical drive. Best-effort
            // pairing using drive letter as the key.
            if (partitions.Count == 0 && !string.IsNullOrEmpty(model))
            {
                foreach (var v in volumes)
                {
                    if (!string.IsNullOrEmpty(v.DriveLetter)
                        && char.IsLetter(v.DriveLetter[0]))
                    {
                        partitions.Add(v);
                    }
                }
            }

            bool isUsb = string.Equals(busType, "USB", StringComparison.OrdinalIgnoreCase);

            return new DiskDriveInfo
            {
                Model = model,
                Vendor = vendor,
                ProductId = productId,
                VendorId = vendorId,
                SerialNumber = serial,
                Firmware = firmware,
                FirmwareRev = firmwareRev,
                BusType = string.IsNullOrEmpty(busType) ? "Unknown" : busType,
                ControllerType = string.IsNullOrEmpty(controller) ? "Unknown" : controller,
                DeviceId = deviceId,
                PhysicalPath = physicalPath,
                DriveNumber = driveNumber,
                IsNVMe = isNVMe,
                IsSSD = isSSD,
                IsHDD = isHDD,
                IsRemovable = isRemovable,
                IsUSB = isUsb,
                IsVirtual = false,
                TotalBytes = totalBytes,
                TotalFreeBytes = totalFreeBytes,
                TotalUsedBytes = totalUsedBytes,
                UsedPercent = usedPercent,
                SmartAvailable = smart != null,
                DiskStatus = diskStatus,
                Temperature = temperature,
                TemperatureWarning = tempWarning,
                TemperatureCritical = tempCritical,
                TotalActivity = totalActivity,
                ReadRate = readRate,
                WriteRate = writeRate,
                LifeRemainingPercent = life,
                HostReadsGb = hostReads,
                HostWritesGb = hostWrites,
                PowerOnCount = powerOnCount,
                PowerOnHours = powerOnHours,
                NandWritesGb = nandWrites,
                WearLevelingCount = wearLeveling,
                PartitionCount = partitions.Count,
                Partitions = partitions
            };
        }

        private static DiskPartitionInfo MapPartition(object partition, List<DiskPartitionInfo> driveInfoVolumes)
        {
            string driveLetter = SafeString(GetProp(partition, "DriveLetter")) ?? string.Empty;
            string volumePath = SafeString(GetProp(partition, "VolumePath")) ?? string.Empty;
            long totalBytes = SafeLong(GetProp(partition, "PartitionLength")) ?? 0L;
            long freeBytes = SafeLong(GetProp(partition, "AvailableFreeSpace")) ?? 0L;
            long usedBytes = totalBytes > freeBytes ? totalBytes - freeBytes : 0L;
            float usedPercent = totalBytes > 0 ? (float)(usedBytes * 100.0 / totalBytes) : 0f;

            // Cross-reference the live DriveInfo for the
            // most accurate label / file system / is-ready
            // values. DiskInfoToolkit's Partition has
            // DriveLetter but no friendly volume label.
            string label = string.Empty;
            string fileSystem = string.Empty;
            string driveType = "Fixed";
            bool isReady = false;
            if (!string.IsNullOrEmpty(driveLetter))
            {
                var match = driveInfoVolumes.FirstOrDefault(v =>
                    string.Equals(v.DriveLetter, driveLetter, StringComparison.OrdinalIgnoreCase));
                if (match != null)
                {
                    label = match.Label;
                    fileSystem = match.FileSystem;
                    driveType = match.DriveType;
                    isReady = match.IsReady;
                    if (match.TotalBytes > 0)
                    {
                        // DriveInfo is more accurate on
                        // exFAT / ReFS volumes where
                        // DiskInfoToolkit's PartitionLength
                        // can be slightly off.
                        totalBytes = match.TotalBytes;
                        freeBytes = match.FreeBytes;
                        usedBytes = match.UsedBytes;
                        usedPercent = match.UsedPercent;
                    }
                }
            }

            return new DiskPartitionInfo
            {
                DriveLetter = driveLetter,
                VolumePath = volumePath,
                Label = label,
                FileSystem = fileSystem,
                DriveType = driveType,
                TotalBytes = totalBytes,
                UsedBytes = usedBytes,
                FreeBytes = freeBytes,
                UsedPercent = usedPercent,
                IsReady = isReady,
                IsBoot = IsBootDrive(driveLetter),
                IsSystem = IsSystemDrive(driveLetter, volumePath)
            };
        }

        // -----------------------------------------------------------------
        //  Volume enumeration (always-on)
        // -----------------------------------------------------------------

        private static List<DiskPartitionInfo> EnumerateVolumes()
        {
            var result = new List<DiskPartitionInfo>();
            string sysDrive = SafeSystemDrive();
            try
            {
                foreach (var di in DriveInfo.GetDrives())
                {
                    try
                    {
                        var info = new DiskPartitionInfo
                        {
                            DriveLetter = string.IsNullOrEmpty(di.Name) ? string.Empty : di.Name.TrimEnd('\\', ':'),
                            VolumePath = di.RootDirectory?.FullName ?? string.Empty,
                            Label = di.VolumeLabel ?? string.Empty,
                            FileSystem = string.IsNullOrEmpty(di.DriveFormat) ? "Unknown" : di.DriveFormat,
                            DriveType = di.DriveType.ToString(),
                            IsReady = di.IsReady
                        };
                        if (di.IsReady)
                        {
                            info.TotalBytes = di.TotalSize;
                            info.FreeBytes = di.AvailableFreeSpace;
                            info.UsedBytes = di.TotalSize > di.AvailableFreeSpace
                                ? di.TotalSize - di.AvailableFreeSpace
                                : 0L;
                            info.UsedPercent = di.TotalSize > 0
                                ? (float)(info.UsedBytes * 100.0 / di.TotalSize)
                                : 0f;
                        }
                        info.IsBoot = IsBootDrive(info.DriveLetter);
                        info.IsSystem = IsSystemDrive(info.DriveLetter, info.VolumePath)
                            || string.Equals(info.DriveLetter, sysDrive, StringComparison.OrdinalIgnoreCase);
                        result.Add(info);
                    }
                    catch
                    {
                        // One bad volume (e.g. an empty CD
                        // drive) can throw on .IsReady.
                        // Skip it and keep going.
                    }
                }
            }
            catch
            {
                // DriveInfo.GetDrives() itself can throw on
                // some virtual / filtered environments.
            }
            return result;
        }

        private static string SafeSystemDrive()
        {
            try
            {
                var sd = Environment.GetEnvironmentVariable("SystemDrive");
                if (string.IsNullOrEmpty(sd)) return "C";
                return sd.TrimEnd('\\', ':');
            }
            catch { return "C"; }
        }

        private static bool IsBootDrive(string letter)
        {
            if (string.IsNullOrEmpty(letter)) return false;
            return string.Equals(letter, SafeSystemDrive(), StringComparison.OrdinalIgnoreCase);
        }

        private static bool IsSystemDrive(string letter, string volumePath)
        {
            if (string.IsNullOrEmpty(letter)) return false;
            if (string.IsNullOrEmpty(volumePath)) return false;
            try
            {
                return Directory.Exists(Path.Combine(volumePath, "Windows"));
            }
            catch { return false; }
        }

        // -----------------------------------------------------------------
        //  Bus type / status helpers
        // -----------------------------------------------------------------

        private static string ClassifyBusTypeFromDriveType(string driveType)
        {
            if (string.Equals(driveType, "Removable", StringComparison.OrdinalIgnoreCase)) return "USB";
            if (string.Equals(driveType, "CDRom", StringComparison.OrdinalIgnoreCase)) return "ATAPI";
            if (string.Equals(driveType, "Network", StringComparison.OrdinalIgnoreCase)) return "Network";
            return "Unknown";
        }

        private static string ClassifyDiskStatus(string smartStatus, float? life, float? temperature, float? tempCritical)
        {
            // If DiskInfoToolkit's SmartInfo.DiskStatus is
            // present and not the "Unknown" placeholder,
            // trust it — it knows about reallocated sectors
            // and pending sectors which the simple life
            // percentage check below would miss.
            if (!string.IsNullOrEmpty(smartStatus)
                && !smartStatus.Equals("Unknown", StringComparison.OrdinalIgnoreCase))
            {
                return smartStatus;
            }
            if (life.HasValue && life.Value <= 10f) return "Bad";
            if (life.HasValue && life.Value <= 25f) return "Caution";
            if (tempCritical.HasValue && temperature.HasValue && temperature.Value >= tempCritical.Value) return "Bad";
            if (temperature.HasValue && temperature.Value >= 70f) return "Caution";
            if (life.HasValue) return "Good";
            return "Unknown";
        }

        // -----------------------------------------------------------------
        //  DiskInfoToolkit reflection helpers
        // -----------------------------------------------------------------
        // The package's Storage / SmartInfo / Partition
        // types are referenced via `System.Reflection` so
        // we don't need a `using DiskInfoToolkit;` at the
        // top of the file. That keeps the cost of loading
        // the DiskInfoToolkit assembly out of the JIT's
        // startup path when --user mode never touches it.
        //
        // Each helper swallows both the reflection errors
        // (field doesn't exist on this drive class) and
        // the device errors (the drive is going away
        // mid-poll) so the rest of the snapshot can
        // still be returned.

        private static Type ToolkitType(string name)
        {
            try
            {
                // The package's types all live under the
                // DiskInfoToolkit namespace. Reflection on
                // a missing type is a TypeLoadException
                // that we swallow to null.
                foreach (var asm in AppDomain.CurrentDomain.GetAssemblies())
                {
                    if (asm.GetName().Name != "DiskInfoToolkit") continue;
                    var t = asm.GetType("DiskInfoToolkit." + name, false, false);
                    if (t != null) return t;
                }
                // Assembly not yet loaded. Probe for it by
                // partial name so the user-mode path stays
                // cheap — the cost is paid only on the
                // first admin-mode call.
                var probe = System.Reflection.Assembly.Load("DiskInfoToolkit");
                return probe?.GetType("DiskInfoToolkit." + name, false, false);
            }
            catch { return null; }
        }

        private static object InvokeStaticVoid(string typeName, string methodName, params object[] args)
        {
            try
            {
                var t = ToolkitType(typeName);
                if (t == null) return null;
                var m = t.GetMethod(methodName, BindingFlags.Public | BindingFlags.Static);
                if (m == null) return null;
                return m.Invoke(null, args);
            }
            catch { return null; }
        }

        private static object InvokeStaticGet(string typeName, string propertyName)
        {
            try
            {
                var t = ToolkitType(typeName);
                if (t == null) return null;
                var p = t.GetProperty(propertyName, BindingFlags.Public | BindingFlags.Static);
                if (p == null) return null;
                return p.GetValue(null);
            }
            catch { return null; }
        }

        private static void InvokeInstanceVoid(object instance, string methodName)
        {
            try
            {
                if (instance == null) return;
                var m = instance.GetType().GetMethod(methodName, BindingFlags.Public | BindingFlags.Instance);
                if (m == null) return;
                m.Invoke(instance, null);
            }
            catch { /* reflection or device failure */ }
        }

        private static object GetProp(object instance, string name)
        {
            try
            {
                if (instance == null) return null;
                var p = instance.GetType().GetProperty(name, BindingFlags.Public | BindingFlags.Instance);
                if (p == null) return null;
                if (!p.CanRead) return null;
                return p.GetValue(instance);
            }
            catch { return null; }
        }

        private static string SafeString(object v)
        {
            try { return v?.ToString(); }
            catch { return null; }
        }

        private static bool SafeBool(object v)
        {
            try
            {
                if (v is bool b) return b;
                if (v != null && bool.TryParse(v.ToString(), out var parsed)) return parsed;
                return false;
            }
            catch { return false; }
        }

        private static int? SafeInt(object v)
        {
            try
            {
                if (v == null) return null;
                if (v is int i) return i;
                if (int.TryParse(v.ToString(), out var parsed)) return parsed;
                return null;
            }
            catch { return null; }
        }

        private static long? SafeLong(object v)
        {
            try
            {
                if (v == null) return null;
                if (v is long l) return l;
                if (v is int i) return (long)i;
                if (v is ulong u) return (long)u;
                if (long.TryParse(v.ToString(), out var parsed)) return parsed;
                return null;
            }
            catch { return null; }
        }

        private static float? SafeFloat(object v)
        {
            try
            {
                if (v == null) return null;
                if (v is float f) return f;
                if (v is double d) return (float)d;
                if (float.TryParse(v.ToString(), out var parsed)) return parsed;
                return null;
            }
            catch { return null; }
        }

        private static void Summarise(DiskSummaryInfo summary)
        {
            summary.DriveCount = summary.Drives.Count;
            long total = 0, free = 0;
            foreach (var d in summary.Drives)
            {
                total += d.TotalBytes;
                free += d.TotalFreeBytes;
            }
            summary.TotalBytes = total;
            summary.TotalFreeBytes = free;
            summary.TotalUsedBytes = total > free ? total - free : 0L;
            summary.UsedPercent = total > 0 ? (float)(summary.TotalUsedBytes * 100.0 / total) : 0f;
        }

        public void Dispose()
        {
            if (_disposed) return;
            _disposed = true;
        }
    }
}
