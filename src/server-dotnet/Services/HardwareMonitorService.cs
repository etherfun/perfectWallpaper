using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Linq;
using System.Runtime.InteropServices;
using System.Threading;
using LibreHardwareMonitor.Hardware;
using PerfectWall.Server.Models;
using PerfectWall.Server.Utils;

namespace PerfectWall.Server.Services
{
    /// <summary>
    /// Bridge over LibreHardwareMonitor that is **always
    /// import-safe**: the LHM types are referenced here and
    /// nowhere else, so the rest of the program compiles even on
    /// platforms where LHM cannot run.
    ///
    /// The previous Rust implementation hard-rolled back from
    /// LHM because <c>lhm-sys</c> statically links WinRing0.sys,
    /// which trips Microsoft Defender's vulnerable-driver
    /// blocklist. To keep the door open for users who want
    /// temperatures / fan speeds / clock rates, this build lets
    /// the *user* choose at launch time:
    ///
    /// <list type="bullet">
    ///   <item><description>
    ///     <c>--user</c> (default): process runs **without
    ///     admin**, LHM is **not initialized** at all. Hardware
    ///     sensors stay at zero / null, and the JSON contract
    ///     keeps the old "no data" markers (the frontend already
    ///     hides them). CPU usage / memory / network / system
    ///     information are still populated from pure managed
    ///     APIs.
    ///   </description></item>
    ///   <item><description>
    ///     <c>--admin</c>: the caller is expected to launch with
    ///     the UAC-elevated token (the bundled
    ///     <c>launch-elevated.cmd</c> does this for them). LHM is
    ///     initialized, hardware sensors are read, and the
    ///     driver warning remains the user's explicit choice.
    ///   </description></item>
    /// </list>
    /// </summary>
    public sealed class HardwareMonitorService : IDisposable
    {
        // Hard ceiling on the per-core loop bounds below.
        // 64 covers current Threadripper / Epyc parts
        // with room to spare. Raising the number just
        // allocates a few extra empty slots when a
        // smaller CPU is detected (the inner loops
        // break on the first missing sensor).
        private const int MAX_CORES = 64;

        public enum RunMode
        {
            /// <summary>
            /// LHM disabled. CPU temperature / clock / fan fields
            /// stay at the "no data" markers, but the JSON
            /// contract is preserved.
            /// </summary>
            User,
            /// <summary>
            /// LHM enabled. Requires the OS-level Administrator
            /// token. WinRing0 driver may be loaded.
            /// </summary>
            Admin
        }

        public RunMode Mode { get; }
        public bool IsLhmAvailable => Mode == RunMode.Admin && _computer != null;
        public string InitError { get; private set; }

        private readonly Computer _computer;
        private readonly object _lock = new object();

        // LHM's <c>ISensor.Value</c> for "CPU Total" already returns a
        // 0-100 percentage, so we don't need any local cache.
        // <c>ReadManagedCpuUsage()</c> uses an entirely separate
        // two-sample <c>Process.TotalProcessorTime</c> delta path
        // that does not need to share state with LHM.
        private readonly object _cpuCacheLock = new object();
        // Background-sampled CPU usage. Updated by a dedicated
        // sampler thread so request handlers never block on
        // Thread.Sleep(250). The values are read-mostly (one
        // writer, many readers) so we cache the last sample
        // pair and re-compute on each refresh.
        private float _lastCpuUsagePct;
        private DateTime _lastCpuSampleAt = DateTime.MinValue;
        private bool _cpuSamplerStarted;

        public HardwareMonitorService(RunMode mode)
        {
            Mode = mode;
            if (mode != RunMode.Admin) return;

            try
            {
                _computer = new Computer
                {
                    IsCpuEnabled = true,
                    IsGpuEnabled = true,
                    IsMemoryEnabled = true,
                    IsMotherboardEnabled = true,
                    IsControllerEnabled = false,
                    IsNetworkEnabled = false,
                    IsStorageEnabled = true
                };
                _computer.Open();
            }
            catch (Exception ex)
            {
                InitError = ex.Message;
                // Null out so IsLhmAvailable flips to false.
                _computer = null;
            }
        }

        /// <summary>
        /// Pull a fresh sensor snapshot from LHM. Thread-safe.
        /// Returns an empty list when LHM is not available
        /// (user mode, or admin init failed).
        /// </summary>
        public IList<ISensor> ReadAllSensors()
        {
            if (!IsLhmAvailable) return Array.Empty<ISensor>();
            lock (_lock)
            {
                var result = new List<ISensor>();
                try
                {
                    foreach (var hw in _computer.Hardware)
                    {
                        hw.Update();
                        foreach (var s in hw.Sensors) result.Add(s);
                        foreach (var sub in hw.SubHardware)
                        {
                            sub.Update();
                            foreach (var s in sub.Sensors) result.Add(s);
                        }
                    }
                }
                catch (Exception ex)
                {
                    InitError = ex.Message;
                }
                return result;
            }
        }

        // -----------------------------------------------------------------
        // CPU
        // -----------------------------------------------------------------

        /// <summary>
        /// Build a <see cref="CpuInfo"/> array. Always returns
        /// one element (matching the Rust implementation, which
        /// also collapses multi-socket systems to a single
        /// entry). Temperature is zero in user mode.
        /// </summary>
        public List<CpuInfo> CollectCpu()
        {
            var info = new CpuInfo
            {
                Id = 0,
                Brand = string.Empty,
                Speed = 0,
                Cores = Environment.ProcessorCount,
                PhysicalCores = Environment.ProcessorCount,
                Usage = ReadManagedCpuUsage(),
                Temperature = 0f,
                TemperatureMax = 0f,
                TemperatureCritical = null,
                TemperatureLabel = string.Empty,
                TemperatureAvailable = false,
                TemperatureComponentCount = 0,
                TemperatureComponents = new List<CpuTempComponent>()
            };

            if (IsLhmAvailable)
            {
                lock (_lock)
                {
                    var cpu = _computer.Hardware.FirstOrDefault(h => h.HardwareType == HardwareType.Cpu);
                    if (cpu != null)
                    {
                        try { cpu.Update(); } catch { /* ignore */ }
                        info.Brand = cpu.Name ?? string.Empty;
                        info.Manufacturer = ClassifyManufacturer(info.Brand);

                        // Build a (type, name) → ISensor lookup
                        // ONCE. The per-core loops below look
                        // up ~200 sensors on a 64-core part;
                        // doing them as `cpu.Sensors.FirstOrDefault(...)`
                        // is O(n) per call → O(n²) overall. With
                        // the dictionary the whole CPU block is
                        // O(n + m) where m is the per-core
                        // range.
                        //
                        // Note: LHM exposes `IHardware.Sensors`
                        // as `IEnumerable<ISensor>`, not a
                        // collection with a `.Count` property —
                        // the .NET Framework 4.8 BCL can't
                        // take an IEnumerable.Count as a
                        // dictionary capacity hint. The
                        // default-capacity constructor lets the
                        // dictionary resize on demand.
                        var sensorMap = new Dictionary<(SensorType, string), ISensor>();
                        foreach (var s in cpu.Sensors)
                        {
                            // Last write wins on duplicate
                            // (type, name) — LHM doesn't
                            // normally emit them, but the
                            // SubHardware path can.
                            sensorMap[(s.SensorType, s.Name ?? string.Empty)] = s;
                        }

                        // ---- Clocks ----
                        if (sensorMap.TryGetValue((SensorType.Clock, "Bus Speed"), out var busSpeed)
                            && busSpeed.Value is float busMhz) info.BusSpeed = busMhz;

                        if (sensorMap.TryGetValue((SensorType.Clock, "Cores (Average)"), out var avg)
                            && avg.Value is float avgMhz) info.ClockAverage = avgMhz;

                        if (sensorMap.TryGetValue((SensorType.Clock, "Cores (Average Effective)"), out var avgEff)
                            && avgEff.Value is float avgEffMhz) info.ClockAverageEffective = avgEffMhz;

                        // Per-core clocks. LHM exposes Core #N
                        // (actual) and Core #N (Effective) (P-state
                        // adjusted). We keep both arrays aligned by
                        // index.
                        var coreClocks = new List<float>();
                        var coreClocksEff = new List<float>();
                        for (int i = 1; i <= MAX_CORES; i++)
                        {
                            var keyActual = (SensorType.Clock, $"Core #{i}");
                            var keyEff = (SensorType.Clock, $"Core #{i} (Effective)");
                            var hasActual = sensorMap.TryGetValue(keyActual, out var sActual);
                            var hasEff = sensorMap.TryGetValue(keyEff, out var sEff);
                            if (!hasActual && !hasEff) break; // end of physical cores
                            if (hasActual && sActual.Value is float a) coreClocks.Add(a); else coreClocks.Add(0);
                            if (hasEff && sEff.Value is float e) coreClocksEff.Add(e); else coreClocksEff.Add(0);
                        }
                        info.ClocksPerCore = coreClocks.Count > 0 ? coreClocks.ToArray() : null;
                        info.ClocksEffectivePerCore = coreClocksEff.Count > 0 ? coreClocksEff.ToArray() : null;
                        info.PhysicalCores = coreClocks.Count > 0 ? coreClocks.Count : Environment.ProcessorCount;
                        info.ThreadsPerCore = Environment.ProcessorCount / Math.Max(1, info.PhysicalCores);

                        // Speed / max — fall back to the highest
                        // observed clock if we don't have a stable
                        // reading.
                        if (info.ClocksPerCore != null)
                        {
                            var max = 0f; var min = float.MaxValue;
                            foreach (var c in info.ClocksPerCore) { if (c > max) max = c; if (c > 0 && c < min) min = c; }
                            if (max > 0) info.Speed = (long)max;
                            if (min < float.MaxValue) info.MinSpeed = min;
                        }
                        if (info.ClockAverage > 0 && info.ClockAverage > info.Speed) info.MaxSpeed = info.ClockAverage;

                        // ---- Usage ----
                        if (sensorMap.TryGetValue((SensorType.Load, "CPU Total"), out var cpuTotal)
                            && cpuTotal.Value is float ut) info.Usage = ut;

                        // Per-core usage. LHM exposes CPU Core #1
                        // through #N, where N matches logical
                        // processor count.
                        var usagePer = new List<float>();
                        float usageMax = 0; int usageMaxIdx = -1;
                        for (int i = 1; i <= Environment.ProcessorCount; i++)
                        {
                            if (!sensorMap.TryGetValue((SensorType.Load, $"CPU Core #{i}"), out var s))
                                break;
                            var v = s.Value is float f ? f : 0f;
                            usagePer.Add(v);
                            if (v > usageMax) { usageMax = v; usageMaxIdx = i; }
                        }
                        info.UsagePerCore = usagePer.Count > 0 ? usagePer.ToArray() : null;
                        if (usageMaxIdx > 0)
                        {
                            info.UsageMaxCore = usageMax;
                            info.UsageMaxCoreIndex = usageMaxIdx;
                        }

                        // ---- Voltage (VID per core + aggregates) ----
                        var voltages = new List<float>();
                        float vMin = float.MaxValue, vMax = 0;
                        for (int i = 1; i <= MAX_CORES; i++)
                        {
                            if (!sensorMap.TryGetValue((SensorType.Voltage, $"Core #{i} VID"), out var s))
                                break;
                            var v = s.Value is float f ? f : 0f;
                            voltages.Add(v);
                            if (v > 0) { if (v < vMin) vMin = v; if (v > vMax) vMax = v; }
                        }
                        info.VoltagePerCore = voltages.Count > 0 ? voltages.ToArray() : null;
                        if (vMin < float.MaxValue) info.VoltageCoreMin = vMin;
                        if (vMax > 0) info.VoltageCoreMax = vMax;
                        if (info.VoltagePerCore != null && info.VoltagePerCore.Length > 0)
                        {
                            float sum = 0; int n = 0;
                            foreach (var v in info.VoltagePerCore) if (v > 0) { sum += v; n++; }
                            if (n > 0) info.VoltageCore = sum / n;
                        }

                        // ---- Power (Package + per core) ----
                        if (sensorMap.TryGetValue((SensorType.Power, "Package"), out var pkg)
                            && pkg.Value is float pw) info.PowerPackage = pw;

                        var powers = new List<float>();
                        for (int i = 1; i <= MAX_CORES; i++)
                        {
                            if (!sensorMap.TryGetValue((SensorType.Power, $"Core #{i} (SMU)"), out var s))
                                break;
                            powers.Add(s.Value is float f ? f : 0f);
                        }
                        info.PowerPerCore = powers.Count > 0 ? powers.ToArray() : null;

                        // ---- Temperature ----
                        // Package temperature is what most users
                        // call "CPU temperature". The sensor
                        // name varies wildly by vendor and
                        // LHM version:
                        //   * Intel "CPU Package" (Haswell+)
                        //   * AMD Zen "Tctl" (effective
                        //     junction temp) and "Tdie" (per-
                        //     die digital reading) — the
                        //     "Package" string is absent on
                        //     Zen 2/3/4.
                        //   * AMD Zen 5 "CPU Package" came back
                        //     for some 7xxx parts.
                        ISensor packageTemp = null;
                        var preferred = new[] { "Tctl", "Tdie", "Package", "CPU" };
                        foreach (var token in preferred)
                        {
                            // Walk the cached list once instead
                            // of re-scanning `cpu.Sensors` per
                            // token.
                            foreach (var s in sensorMap.Keys)
                            {
                                if (s.Item1 == SensorType.Temperature &&
                                    !string.IsNullOrEmpty(s.Item2) &&
                                    s.Item2.IndexOf(token, StringComparison.OrdinalIgnoreCase) >= 0)
                                {
                                    packageTemp = sensorMap[s];
                                    break;
                                }
                            }
                            if (packageTemp != null) break;
                        }
                        if (packageTemp != null && packageTemp.Value is float pt)
                        {
                            if (pt >= 0f && !float.IsNaN(pt) && !float.IsInfinity(pt))
                            {
                                info.Temperature = pt;
                                info.TemperatureAvailable = true;
                                info.TemperatureLabel = packageTemp.Name;
                                info.TemperatureComponentCount = 1;
                                info.TemperatureMin = packageTemp.Min;
                                info.TemperatureMax = packageTemp.Max;
                                info.TemperatureComponents.Add(new CpuTempComponent
                                {
                                    Label = packageTemp.Name,
                                    Temperature = pt,
                                    TemperatureMin = packageTemp.Min,
                                    TemperatureMax = packageTemp.Max
                                });
                            }

                            // Also capture per-core temps if
                            // available so the JSON shows them.
                            foreach (var s in cpu.Sensors)
                            {
                                if (s.SensorType != SensorType.Temperature) continue;
                                if (s == packageTemp) continue;
                                if (s.Value is float t && t > 0f)
                                {
                                    info.TemperatureComponents.Add(new CpuTempComponent
                                    {
                                        Label = s.Name,
                                        Temperature = t,
                                        TemperatureMin = s.Min,
                                        TemperatureMax = s.Max
                                    });
                                    info.TemperatureComponentCount++;
                                }
                            }
                        }
                    }
                }
            }
            else
            {
                // User mode: no LHM. Pull a best-effort brand
                // from PROCESSOR_IDENTIFIER and classify it the
                // same way the LHM branch does. Windows
                // populates PROCESSOR_IDENTIFIER with strings
                // like "AMD64 Family 25 Model 97 …" or
                // "Intel64 Family 6 Model 142 …" which we
                // collapse to "AMD" / "Intel" in
                // `ClassifyManufacturer`.
                info.Brand = Environment.GetEnvironmentVariable("PROCESSOR_IDENTIFIER") ?? string.Empty;
                info.Manufacturer = ClassifyManufacturer(info.Brand);
            }

            return new List<CpuInfo> { info };
        }

        // -----------------------------------------------------------------
        //  System info (hostname, OS build, username, ...)
        // -----------------------------------------------------------------

        /// <summary>
        /// Build a fully populated <see cref="SystemInfo"/>. Works
        /// in both user and admin mode — everything comes from
        /// pure managed APIs (Environment + Win32 registry) so we
        /// never have to fall back to LHM for OS metadata.
        /// </summary>
        public SystemInfo CollectSystem()
        {
            // Boot time = now - uptime. Environment.TickCount
            // is a 32-bit int that overflows (wraps to
            // negative) after ~24.8 days of system uptime.
            // On a long-lived wallpaper host that's a real
            // case: boot_time would jump into the future.
            // Use Stopwatch which is a 64-bit counter.
            // Stopwatch.Frequency is the ticks-per-second of
            // the underlying high-resolution timer, not
            // necessarily 1000.
            var nowMs = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds();
            var uptimeTicks = System.Diagnostics.Stopwatch.GetTimestamp();
            var uptimeSec = (long)(uptimeTicks / System.Diagnostics.Stopwatch.Frequency);
            var bootTime = nowMs - uptimeSec * 1000L;

            var tz = TimeZoneInfo.Local;
            return new SystemInfo
            {
                Hostname = Environment.MachineName,
                Username = Environment.UserName,
                Domain = Environment.UserDomainName,
                Platform = Environment.OSVersion.Platform.ToString(), // legacy compat field
                Os = BuildOsInfo(),
                Arch = IntPtr.Size == 8 ? "x64" : "x86",
                Uptime = uptimeSec,
                BootTime = bootTime,
                Timezone = tz.Id,
                TzOffsetMinutes = (int)tz.GetUtcOffset(DateTime.UtcNow).TotalMinutes,
                Locale = System.Globalization.CultureInfo.CurrentCulture.Name,
                Distro = Environment.OSVersion.VersionString, // legacy compat
                Release = Environment.OSVersion.Version.ToString(), // legacy compat
                IsElevated = ElevationHelper.IsElevated()
            };
        }

        private static OsInfo BuildOsInfo()
        {
            // Read the friendly product name + build + UBR from
            // the registry. Falls back to environment variables
            // on weird editions where ProductName is missing.
            var info = new OsInfo
            {
                Name = Environment.OSVersion.VersionString,
                Version = Environment.OSVersion.Version.ToString(),
                Build = Environment.OSVersion.Version.Build.ToString(),
                Display = Environment.OSVersion.VersionString
            };
            try
            {
                using var key = Microsoft.Win32.Registry.LocalMachine.OpenSubKey(
                    @"SOFTWARE\Microsoft\Windows NT\CurrentVersion");
                if (key != null)
                {
                    var pn = key.GetValue("ProductName") as string;
                    if (!string.IsNullOrEmpty(pn)) info.Name = pn;
                    var cb = key.GetValue("CurrentBuild") as string;
                    if (!string.IsNullOrEmpty(cb)) info.Build = cb;
                    if (int.TryParse(key.GetValue("UBR") as string, out var ubr)) info.Ubr = ubr.ToString(System.Globalization.CultureInfo.InvariantCulture);
                }
            }
            catch
            {
                // UAC-restricted or non-NT; fall through.
            }
            return info;
        }

        private static string ClassifyManufacturer(string brand)
        {
            // Note: many systems expose the brand string as
            // "AMD64 Family 25 Model 97 …" or
            // "Intel(R) Core(TM) i7-…". The substring checks
            // below catch both the full vendor name and the
            // `AMD64` family string returned by
            // `PROCESSOR_IDENTIFIER` on x64 Windows. We do NOT
            // want to false-positive on "ARM" inside a brand
            // like "AMD Ryzen ARM Edition", so we check the
            // long names first.
            if (string.IsNullOrEmpty(brand)) return "Unknown";
            if (brand.IndexOf("Intel", StringComparison.OrdinalIgnoreCase) >= 0) return "Intel";
            if (brand.IndexOf("AMD", StringComparison.OrdinalIgnoreCase) >= 0) return "AMD";
            if (brand.IndexOf("Apple", StringComparison.OrdinalIgnoreCase) >= 0) return "Apple";
            if (brand.IndexOf("ARM", StringComparison.OrdinalIgnoreCase) >= 0) return "ARM";
            return "Unknown";
        }

        // -----------------------------------------------------------------
        // GPU
        // -----------------------------------------------------------------

        /// <summary>
        /// Build a <see cref="GpuInfo"/> array. Always returns at
        /// least one entry: the placeholder matches the Rust
        /// implementation's failure-path shape.
        /// </summary>
        public List<GpuInfo> CollectGpu()
        {
            var result = new List<GpuInfo>();
            if (!IsLhmAvailable)
            {
                result.Add(new GpuInfo());
                return result;
            }

            lock (_lock)
            {
                int idx = 0;
                foreach (var hw in _computer.Hardware)
                {
                    if (hw.HardwareType != HardwareType.GpuNvidia
                        && hw.HardwareType != HardwareType.GpuAmd
                        && hw.HardwareType != HardwareType.GpuIntel) continue;
                    try { hw.Update(); } catch { continue; }

                    var info = new GpuInfo
                    {
                        Id = idx++,
                        Model = hw.Name ?? "Unknown",
                        Vendor = VendorName(hw.HardwareType),
                        Vram = 0,
                        Utilization = 0f,
                        Temperature = 0f
                    };

                    // ---- VRAM (SmallData sensors from LHM, in MB) ----
                    // LHM exposes both D3D Dedicated and shared
                    // "GPU Memory Used/Total/Free" sensors. The
                    // D3D Dedicated variants are the true
                    // physical VRAM; the GPU Memory pair is the
                    // OS-visible pool including shared system RAM
                    // (Windows LUID). We populate the
                    // dedicated-pair into vram_* and the
                    // shared-pair into vram_shared_used.
                    var d3dUsed = hw.Sensors.FirstOrDefault(s =>
                        s.SensorType == SensorType.SmallData &&
                        s.Name.IndexOf("D3D Dedicated Memory Used", StringComparison.OrdinalIgnoreCase) >= 0);
                    var d3dFree = hw.Sensors.FirstOrDefault(s =>
                        s.SensorType == SensorType.SmallData &&
                        s.Name.IndexOf("D3D Dedicated Memory Free", StringComparison.OrdinalIgnoreCase) >= 0);
                    var d3dTotal = hw.Sensors.FirstOrDefault(s =>
                        s.SensorType == SensorType.SmallData &&
                        s.Name.IndexOf("D3D Dedicated Memory Total", StringComparison.OrdinalIgnoreCase) >= 0);
                    if (d3dTotal?.Value is float d3dt) info.VramTotal = (long)(d3dt * 1024 * 1024);
                    if (d3dUsed?.Value is float d3du) info.VramUsed = (long)(d3du * 1024 * 1024);
                    if (d3dFree?.Value is float d3df) info.VramFree = (long)(d3df * 1024 * 1024);
                    if (info.VramTotal.HasValue && info.VramTotal > 0 && info.VramUsed.HasValue)
                    {
                        info.VramUsedPercent = info.VramUsed.Value * 100f / info.VramTotal.Value;
                        info.Vram = info.VramTotal.Value; // legacy compat
                    }

                    var d3dShared = hw.Sensors.FirstOrDefault(s =>
                        s.SensorType == SensorType.SmallData &&
                        s.Name.IndexOf("D3D Shared Memory Used", StringComparison.OrdinalIgnoreCase) >= 0);
                    if (d3dShared?.Value is float d3ds) info.VramSharedUsed = (long)(d3ds * 1024 * 1024);

                    // Fallback for GPUs that don't expose D3D
                    // sensors (older Intel, virtual adapters):
                    // try the "GPU Memory Used/Total" pair.
                    if (!info.VramTotal.HasValue)
                    {
                        var gpuTotal = hw.Sensors.FirstOrDefault(s =>
                            s.SensorType == SensorType.SmallData && s.Name == "GPU Memory Total");
                        var gpuUsed = hw.Sensors.FirstOrDefault(s =>
                            s.SensorType == SensorType.SmallData && s.Name == "GPU Memory Used");
                        if (gpuTotal?.Value is float gt) info.VramTotal = (long)(gt * 1024 * 1024);
                        if (gpuUsed?.Value is float gu) info.VramUsed = (long)(gu * 1024 * 1024);
                    }

                    // ---- Clocks (MHz) ----
                    var coreClock = hw.Sensors.FirstOrDefault(s =>
                        s.SensorType == SensorType.Clock && s.Name == "GPU Core");
                    if (coreClock?.Value is float cc) info.CoreClock = cc;
                    if (coreClock != null && coreClock.Max > 0) info.CoreClockMax = coreClock.Max;

                    var memClock = hw.Sensors.FirstOrDefault(s =>
                        s.SensorType == SensorType.Clock && s.Name == "GPU Memory");
                    if (memClock?.Value is float mc) info.MemoryClock = mc;

                    var smClock = hw.Sensors.FirstOrDefault(s =>
                        s.SensorType == SensorType.Clock && s.Name == "SM");
                    if (smClock?.Value is float smc) info.SmClock = smc;

                    var vidClock = hw.Sensors.FirstOrDefault(s =>
                        s.SensorType == SensorType.Clock && s.Name == "Video");
                    if (vidClock?.Value is float vdc) info.VideoClock = vdc;

                    // ---- Sub-utilization breakdown ----
                    // NVIDIA: "D3D 3D", "D3D Copy", "GPU Memory Controller",
                    //          "GPU Video Engine", "GPU Bus", "D3D Video Decode",
                    //          "D3D Video Encode", "D3D VR", "D3D Security",
                    //          "D3D JPEG Decode 0", "D3D Optical Flow Accelerator 0"
                    // AMD:   "D3D 3D", "D3D Compute 0", "D3D Compute 1",
                    //          "D3D Copy", "D3D High Priority 3D", "D3D High Priority Compute",
                    //          "D3D Security 1", "D3D Timer 0", "D3D Video Codec 0",
                    //          "D3D Video Decode 1", "D3D Video JPEG 0"
                    // We pick a small set of the most useful
                    // (every vendor has them); the JSON
                    // contract stays machine-agnostic.
                    info.Utilization3D = LookupD3DLoad(hw, "D3D 3D");
                    info.UtilizationCopy = LookupD3DLoad(hw, "D3D Copy");
                    info.UtilizationVideoDecode = LookupD3DLoad(hw, "D3D Video Decode");
                    info.UtilizationVideoEncode = LookupD3DLoad(hw, "D3D Video Encode");
                    info.UtilizationCompute = LookupD3DLoad(hw, "D3D Compute");
                    info.UtilizationMemoryController = LookupD3DLoad(hw, "GPU Memory Controller");
                    info.UtilizationVideoEngine = LookupD3DLoad(hw, "GPU Video Engine");
                    info.UtilizationBus = LookupD3DLoad(hw, "GPU Bus");
                    info.UtilizationVR = LookupD3DLoad(hw, "D3D VR");
                    info.UtilizationSecurity = LookupD3DLoad(hw, "D3D Security");
                    info.UtilizationJpegDecode = LookupD3DLoad(hw, "D3D JPEG Decode");
                    info.UtilizationOpticalFlow = LookupD3DLoad(hw, "D3D Optical Flow");

                    // Master utilization. AMD uses "GPU Core";
                    // NVIDIA uses "GPU Core" too (fall back to
                    // the first Load sensor with non-zero value).
                    var master = hw.Sensors.FirstOrDefault(s =>
                        s.SensorType == SensorType.Load && s.Name == "GPU Core");
                    if (master?.Value is float mu) info.Utilization = mu;
                    if (info.Utilization == 0)
                    {
                        var anyLoad = hw.Sensors.FirstOrDefault(s =>
                            s.SensorType == SensorType.Load && s.Value is float fv && fv > 0);
                        if (anyLoad?.Value is float av) info.Utilization = av;
                    }

                    // ---- Temperatures ----
                    var core = hw.Sensors.FirstOrDefault(s =>
                        s.SensorType == SensorType.Temperature && s.Name == "GPU Core");
                    if (core?.Value is float c) info.Temperature = c;
                    if (core != null)
                    {
                        if (core.Min > 0) info.TemperatureMin = core.Min;
                        if (core.Max > 0) info.TemperatureMax = core.Max;
                    }
                    if (info.Temperature > 0) info.TemperatureAvailable = true;
                    info.TemperatureComponents = CollectGpuTempComponents(hw);

                    // NVIDIA Memory Junction = junction temperature
                    // of the GDDR memory (the "hot spot" closest
                    // to the VRAM chips).
                    var memoryJunction = hw.Sensors.FirstOrDefault(s =>
                        s.SensorType == SensorType.Temperature && s.Name == "GPU Memory Junction");
                    if (memoryJunction?.Value is float mj) info.TemperatureMemoryJunction = mj;

                    // AMD Edge = the legacy GPU diode; call it
                    // hot_spot to match the Intel/NVIDIA
                    // convention. AMD Memory Junction doesn't
                    // usually exist on the 610M, so it's null.
                    var edge = hw.Sensors.FirstOrDefault(s =>
                        s.SensorType == SensorType.Temperature && s.Name == "GPU Edge");
                    if (edge?.Value is float e) info.TemperatureHotSpot = e;

                    // ---- Fan ----
                    // NVIDIA: "GPU Fan" (Load) is the %; the
                    // (RPM) sensor is missing on most laptops
                    // (Tachometer NotSupported). AMD: same
                    // pattern under "GPU Fan".
                    var fanPct = hw.Sensors.FirstOrDefault(s =>
                        s.SensorType == SensorType.Load && s.Name == "GPU Fan");
                    if (fanPct?.Value is float fp) info.FanSpeedPercent = fp;
                    var fanRpm = hw.Sensors.FirstOrDefault(s =>
                        s.SensorType == SensorType.Fan);
                    if (fanRpm?.Value is float fr) info.FanSpeedRpm = fr;
                    if (info.FanSpeedPercent.HasValue || info.FanSpeedRpm.HasValue)
                    {
                        info.FanSpeedAvailable = true;
                    }

                    // ---- Power (W) ----
                    var power = hw.Sensors.FirstOrDefault(s =>
                        s.SensorType == SensorType.Power && s.Name == "GPU Package");
                    if (power?.Value is float p) info.Power = p;
                    // PowerLimit / PowerLimitMax: LHM 0.9.6 does
                    // not expose these. NVAPI 私有路径; v2.

                    // ---- Voltage (V) ----
                    var vCore = hw.Sensors.FirstOrDefault(s =>
                        s.SensorType == SensorType.Voltage && s.Name == "GPU Core");
                    if (vCore?.Value is float vc) info.VoltageCore = vc;

                    // ---- PCIe throughput (B/s) ----
                    var pcieRx = hw.Sensors.FirstOrDefault(s =>
                        s.SensorType == SensorType.Throughput && s.Name == "GPU PCIe Rx");
                    if (pcieRx?.Value is float rxv) info.PcieRxBps = rxv;
                    var pcieTx = hw.Sensors.FirstOrDefault(s =>
                        s.SensorType == SensorType.Throughput && s.Name == "GPU PCIe Tx");
                    if (pcieTx?.Value is float txv) info.PcieTxBps = txv;

                    result.Add(info);
                }
            }

            if (result.Count == 0) result.Add(new GpuInfo());
            return result;
        }

        // -----------------------------------------------------------------
        // Storage
        // -----------------------------------------------------------------

        /// <summary>
        /// Extract per-drive I/O activity percentages from LHM
        /// <c>HardwareType.Storage</c> sensors. Returns a
        /// dictionary keyed by hardware name (the same name
        /// LHM uses for the <c>IHardware.Name</c> that appears
        /// in the storage hardware list). Only populated when
        /// LHM is available (admin mode). Returns an empty
        /// dictionary in user mode.
        /// </summary>
        public Dictionary<string, DiskActivityInfo> CollectStorageActivities()
        {
            var result = new Dictionary<string, DiskActivityInfo>(StringComparer.OrdinalIgnoreCase);
            if (!IsLhmAvailable) return result;

            lock (_lock)
            {
                EnumerateStorageHardware(_computer.Hardware, result);
            }
            return result;
        }

        private static void EnumerateStorageHardware(IEnumerable<IHardware> hardwareList, Dictionary<string, DiskActivityInfo> result)
        {
            foreach (var hw in hardwareList)
            {
                if (hw.HardwareType == HardwareType.Storage)
                {
                    hw.Update(); // Refresh sensor values before reading
                    var info = new DiskActivityInfo();
                    foreach (var s in hw.Sensors)
                    {
                        // s.Value is typed as object; LHM stores Load sensors
                        // as double on most hardware. Also accept float for
                        // robustness.  Null values are intentionally skipped.
                        if (s.SensorType == SensorType.Load)
                        {
                            if (s.Value is double) { var d = (double)s.Value; if (s.Name == "Total Activity") info.TotalActivity = (float?)d; else if (s.Name == "Read Activity") info.ReadActivity = (float?)d; else if (s.Name == "Write Activity") info.WriteActivity = (float?)d; }
                            else if (s.Value is float) { var f = (float)s.Value; if (s.Name == "Total Activity") info.TotalActivity = f; else if (s.Name == "Read Activity") info.ReadActivity = f; else if (s.Name == "Write Activity") info.WriteActivity = f; }
                        }
                        // Throughput sensors: "Read Rate" / "Write Rate" in bytes/s
                        if (s.SensorType == SensorType.Throughput && s.Value != null)
                        {
                            long bpsVal = 0;
                            bool bpsValid = false;
                            var vb = s.Value;
                            if (vb is double) { bpsVal = (long)(double)vb; bpsValid = true; }
                            else if (vb is float) { bpsVal = (long)(float)vb; bpsValid = true; }
                            else if (vb is long) { bpsVal = (long)vb; bpsValid = true; }
                            else if (vb is int) { bpsVal = (int)vb; bpsValid = true; }
                            if (bpsValid)
                            {
                                if (s.Name == "Read Rate") info.ReadRate = bpsVal;
                                else if (s.Name == "Write Rate") info.WriteRate = bpsVal;
                            }
                        }
                    }
                    if (!result.ContainsKey(hw.Name))
                        result[hw.Name] = info;
                }
                // Recurse into sub-hardware (storage can appear as a
                // sub-device under a controller or motherboard node).
                if (hw.SubHardware.Any())
                    EnumerateStorageHardware(hw.SubHardware, result);
            }
        }

        private static string VendorName(HardwareType t) => t switch
        {
            HardwareType.GpuNvidia => "NVIDIA",
            HardwareType.GpuAmd => "AMD",
            HardwareType.GpuIntel => "Intel",
            _ => "Unknown"
        };

        // -----------------------------------------------------------------
        // Memory
        // -----------------------------------------------------------------

        public MemoryInfo CollectMemory()
        {
            // We deliberately DO NOT use LHM's Memory hardware
            // sensors. LHM 0.9.6's Memory class exposes its
            // physical/virtual memory values through .NET
            // properties (PhysicalMemoryUsed /
            // VirtualMemoryUsed) rather than through the
            // Sensor system, so the "Used" / "Available"
            // SensorType.Data values we read off `ram.Sensors`
            // are actually RAMSPDToolkit-NDD raw readings
            // (SPD temperature, DRAM temperatures in °C, etc.)
            // misinterpreted as GB — producing 47 GB of
            // "total" on a 32 GB machine.
            //
            // The truthful source on every Windows version is
            // the kernel32 GlobalMemoryStatusEx API, which
            // returns total / available physical RAM in bytes.
            // Win32 is the same code path PerformanceCounter,
            // Task Manager, and Resource Monitor use.
            var info = QueryGlobalMemoryStatusEx();
            // Populate per-DIMM details (admin mode only).
            // DIMM manufacturer + capacity + tRFC + temperature
            // are exposed by LHM via RAMSPDToolkit-NDD and let
            // the dashboard show "DIMM1: 52.5°C" in real time.
            FillDimmInfo(info);
            return info;
        }

        [StructLayout(LayoutKind.Sequential, CharSet = CharSet.Auto)]
        private struct MEMORYSTATUSEX
        {
            public uint dwLength;
            public uint dwMemoryLoad;
            public ulong ullTotalPhys;
            public ulong ullAvailPhys;
            public ulong ullTotalPageFile;
            public ulong ullAvailPageFile;
            public ulong ullTotalVirtual;
            public ulong ullAvailVirtual;
            public ulong ullAvailExtendedVirtual;
        }

        [DllImport("kernel32.dll", CharSet = CharSet.Auto, SetLastError = true)]
        [return: MarshalAs(UnmanagedType.Bool)]
        private static extern bool GlobalMemoryStatusEx(ref MEMORYSTATUSEX lpBuffer);

        private static MemoryInfo QueryGlobalMemoryStatusEx()
        {
            var status = new MEMORYSTATUSEX { dwLength = (uint)Marshal.SizeOf<MEMORYSTATUSEX>() };
            if (!GlobalMemoryStatusEx(ref status))
            {
                // Fall back to the heuristic we used to ship:
                // assume 4x working set as a smoke-test value.
                using var pc = Process.GetCurrentProcess();
                var ws = (ulong)pc.WorkingSet64;
                return new MemoryInfo
                {
                    Total = ws,
                    Used = ws,
                    Free = 0,
                    UsedPercent = 100f
                };
            }
            var total = status.ullTotalPhys;
            var avail = status.ullAvailPhys;
            var used = total > avail ? total - avail : 0;
            // ullTotalVirtual = total address space Windows
            // committed to the process. ullTotalPageFile =
            // total commit limit (RAM + page file). The
            // contract is:
            //   ullAvailPageFile = currently unused commit
            //                       budget
            //   ullAvailVirtual   = free address space
            //                       currently reserved
            // We surface the page-file numbers in
            // page_file_* and the virtual numbers in
            // virtual_*.
            var pageFileTotal = status.ullTotalPageFile;
            var pageFileFree = status.ullAvailPageFile;
            var pageFileUsed = pageFileTotal > pageFileFree ? pageFileTotal - pageFileFree : 0;
            var virtualTotal = status.ullTotalVirtual;
            var virtualFree = status.ullAvailVirtual;
            var virtualUsed = virtualTotal > virtualFree ? virtualTotal - virtualFree : 0;
            return new MemoryInfo
            {
                Total = total,
                Used = used,
                Free = avail,
                UsedPercent = total > 0 ? (used * 100f / total) : 0f,
                Available = avail,
                VirtualTotal = virtualTotal,
                VirtualUsed = virtualUsed,
                VirtualFree = virtualFree,
                VirtualUsedPercent = virtualTotal > 0 ? (virtualUsed * 100f / virtualTotal) : 0f,
                PageFileTotal = pageFileTotal,
                PageFileUsed = pageFileUsed,
                PageFileFree = pageFileFree,
                PageFileUsedPercent = pageFileTotal > 0 ? (pageFileUsed * 100f / pageFileTotal) : 0f
            };
        }

        // -----------------------------------------------------------------
        //  GPU helper extractors
        // -----------------------------------------------------------------

        private static float? LookupD3DLoad(IHardware hw, string substring)
        {
            try
            {
                // We try an exact match first, then a prefix
                // match (NVIDIA uses "GPU Memory Controller",
                // AMD uses "D3D Compute 0" / "D3D Compute 1" —
                // we want exact when possible).
                var s = hw.Sensors.FirstOrDefault(x =>
                    x.SensorType == SensorType.Load && x.Name == substring);
                if (s == null)
                {
                    s = hw.Sensors.FirstOrDefault(x =>
                        x.SensorType == SensorType.Load &&
                        x.Name.StartsWith(substring, StringComparison.OrdinalIgnoreCase));
                }
                if (s?.Value is float v) return v;
                return null;
            }
            catch { return null; }
        }

        private static List<CpuTempComponent> CollectGpuTempComponents(IHardware hw)
        {
            var list = new List<CpuTempComponent>();
            try
            {
                foreach (var s in hw.Sensors)
                {
                    if (s.SensorType != SensorType.Temperature) continue;
                    if (!(s.Value is float v)) continue;
                    list.Add(new CpuTempComponent
                    {
                        Label = s.Name,
                        Temperature = v,
                        TemperatureMin = s.Min,
                        TemperatureMax = s.Max
                    });
                }
            }
            catch { }
            return list;
        }

        // -----------------------------------------------------------------
        //  DIMM info (LHM /memory/dimm/*)
        // -----------------------------------------------------------------

        public void FillDimmInfo(MemoryInfo info)
        {
            if (!IsLhmAvailable) return;
            lock (_lock)
            {
                var dimms = _computer.Hardware.Where(h => h.HardwareType == HardwareType.Memory && h.Name.Contains("DIMM"))
                    .ToList();
                if (dimms.Count == 0) return;
                try
                {
                    foreach (var d in dimms)
                    {
                        try { d.Update(); } catch { }
                        var entry = new DimmInfo
                        {
                            Slot = info.Dimms.Count,
                            Manufacturer = d.Name?.IndexOf("Micron", StringComparison.OrdinalIgnoreCase) >= 0 ? "Micron"
                                        : d.Name?.IndexOf("Samsung", StringComparison.OrdinalIgnoreCase) >= 0 ? "Samsung"
                                        : d.Name?.IndexOf("SK Hynix", StringComparison.OrdinalIgnoreCase) >= 0 ? "SK Hynix"
                                        : d.Name?.IndexOf("Kingston", StringComparison.OrdinalIgnoreCase) >= 0 ? "Kingston"
                                        : d.Name?.IndexOf("Corsair", StringComparison.OrdinalIgnoreCase) >= 0 ? "Corsair"
                                        : "Unknown"
                        };
                        var cap = d.Sensors.FirstOrDefault(s =>
                            s.SensorType == SensorType.Data && s.Name == "Capacity");
                        if (cap?.Value is float cv) entry.CapacityBytes = (long)(cv * 1024L * 1024L * 1024L); // LHM "Capacity" for DIMM is in GiB
                        var speed = d.Sensors.FirstOrDefault(s =>
                            s.SensorType == SensorType.Timing && s.Name.StartsWith("tCK", StringComparison.OrdinalIgnoreCase));
                        if (speed?.Value is float tck)
                        {
                            // tCK (cycle time) in ns; 1/tCK*2*1000 = MT/s
                            if (tck > 0) entry.SpeedMtS = (int)Math.Round(2 * 1000.0 / tck);
                        }
                        var temp = d.Sensors.FirstOrDefault(s =>
                            s.SensorType == SensorType.Temperature && s.Name.StartsWith("DIMM", StringComparison.OrdinalIgnoreCase));
                        if (temp?.Value is float t) entry.Temperature = t;
                        info.Dimms.Add(entry);
                        info.DimmTotalCapacity += entry.CapacityBytes;
                    }
                    info.DimmCount = info.Dimms.Count;
                }
                catch (Exception ex) { InitError = ex.Message; }
            }
        }

        // -----------------------------------------------------------------
        // CPU usage (works in user mode)
        // -----------------------------------------------------------------

        /// <summary>
        /// Read a 0-100 CPU usage percentage. The first call
        /// lazily starts a background sampler thread that
        /// refreshes the value every <see cref="CPU_SAMPLE_INTERVAL_MS"/>
        /// milliseconds; subsequent calls return the cached
        /// percentage immediately, so request handlers never
        /// block on a 250 ms sample window.
        /// </summary>
        public float ReadManagedCpuUsage()
        {
            EnsureCpuSamplerStarted();
            lock (_cpuCacheLock)
            {
                return _lastCpuUsagePct;
            }
        }

        // How often the background CPU-usage sampler refreshes
        // the cached value. 250 ms matches the original two-sample
        // window so the 1 Hz dashboard still sees a fresh reading
        // on every poll.
        private const int CPU_SAMPLE_INTERVAL_MS = 250;

        private void EnsureCpuSamplerStarted()
        {
            if (_cpuSamplerStarted) return;
            lock (_cpuCacheLock)
            {
                if (_cpuSamplerStarted) return;
                _cpuSamplerStarted = true;
                // Fire-and-forget: the sampler thread runs for
                // the lifetime of the service and is killed by
                // the process exit / Dispose path.
                var t = new Thread(CpuSamplerLoop)
                {
                    IsBackground = true,
                    Name = "HardwareMonitorService.CpuSampler"
                };
                t.Start();
            }
        }

        private void CpuSamplerLoop()
        {
            Process p = null;
            try { p = Process.GetCurrentProcess(); }
            catch { return; }

            try
            {
                while (true)
                {
                    TimeSpan t0;
                    DateTime w0;
                    try
                    {
                        t0 = p.TotalProcessorTime;
                        w0 = DateTime.UtcNow;
                    }
                    catch
                    {
                        // Without a baseline the next iteration
                        // can't compute a usage delta. Sleep
                        // for the sample interval so a
                        // persistently-throwing Process (AV
                        // hook, job-object teardown) doesn't
                        // spin at 100% CPU on this thread.
                        Thread.Sleep(CPU_SAMPLE_INTERVAL_MS);
                        continue;
                    }

                    Thread.Sleep(CPU_SAMPLE_INTERVAL_MS);

                    TimeSpan t1;
                    DateTime w1;
                    try { p.Refresh(); t1 = p.TotalProcessorTime; w1 = DateTime.UtcNow; }
                    catch
                    {
                        // Same reasoning: if Refresh keeps
                        // failing we'd otherwise tight-loop.
                        // Throttle and retry on the next
                        // interval.
                        Thread.Sleep(CPU_SAMPLE_INTERVAL_MS);
                        continue;
                    }

                    var cpuMs = (t1 - t0).TotalMilliseconds;
                    var wallMs = (w1 - w0).TotalMilliseconds;
                    if (wallMs <= 0) continue;
                    var usage = (float)(cpuMs / (wallMs * Environment.ProcessorCount) * 100.0);
                    if (usage < 0f) usage = 0f; else if (usage > 100f) usage = 100f;
                    lock (_cpuCacheLock)
                    {
                        _lastCpuUsagePct = usage;
                        _lastCpuSampleAt = w1;
                    }
                }
            }
            finally
            {
                try { p?.Dispose(); } catch { }
            }
        }

        // -----------------------------------------------------------------
        // Misc
        // -----------------------------------------------------------------

        public void Dispose()
        {
            try { _computer?.Close(); } catch { }
        }
    }
}
