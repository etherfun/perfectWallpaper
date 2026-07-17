// See ElevationHelper.cs for the rationale: Fody pulls a
// 4.0.1.0 NuGet RuntimeInformation that conflicts with
// the mscorlib 4.0.0.0 one. Don't `using` the namespace —
// reference the BCL type by its fully-qualified name at
// each use site.
// We need System.Runtime.InteropServices for the
// DllImport / AllocConsole / FreeConsole declarations on
// the Program class, but the BCL 4.0.0.0 type and the
// 4.0.1.0 NuGet build are both visible to the compiler
// (the latter is pulled in by Costura.Fody's transitive
// graph). Reference the BCL types by their fully-qualified
// name at each use site and do NOT `using` the
// namespace.
using System;
using System.Diagnostics;
using System.IO;
using System.Linq;
using System.Reflection;
using System.Threading;
using Newtonsoft.Json;
using PerfectWall.Server.Endpoints;
using PerfectWall.Server.Models;
using PerfectWall.Server.Server;
using PerfectWall.Server.Services;
using PerfectWall.Server.Utils;

namespace PerfectWall.Server
{
    /// <summary>
    /// PerfectWall system-info HTTP server (.NET Framework 4.8).
    ///
    /// Run modes:
    /// <list type="bullet">
    ///   <item><description>
    ///     <c>perfectwall-server.exe</c> (default): <c>--user</c> mode.
    ///     The process stays unelevated. LHM is **not**
    ///     initialized. CPU temperature / clock / fan stay at
    ///     their "no data" markers, but CPU usage, memory,
    ///     network, and system info are still populated.
    ///   </description></item>
    ///   <item><description>
    ///     <c>perfectwall-server.exe --admin</c>: LHM is
    ///     initialized. The process **must** already be running
    ///     elevated; if not, the CLI prints a UAC hint and
    ///     offers to relaunch itself via the <c>runas</c> verb.
    ///   </description></item>
    /// </list>
    ///
    /// Other flags mirror the historical Rust implementation
    /// (<c>--port</c> / <c>--auto-start</c> / etc.) so the
    /// wallpaper-engine entrypoint keeps working with the new
    /// .NET server binary:
    ///
    ///   <c>--port N</c>            override the listening port
    ///   <c>--auto-start</c>        register for Windows login
    ///   <c>--remove-auto-start</c> unregister
    ///   <c>--no-server</c>         exit without listening
    ///   <c>--console</c>           allocate a console window
    /// </summary>
    public static class Program
    {
        [System.Runtime.InteropServices.DllImport("kernel32.dll")] private static extern bool AllocConsole();
        [System.Runtime.InteropServices.DllImport("kernel32.dll")] private static extern bool FreeConsole();

        // We previously hosted a WinForms WebBrowser
        // (SetupWindow) which required [STAThread] for COM
        // apartment init. The setup UI now lives in the user's
        // default browser via SetupEndpoints, so the STA
        // requirement is gone. If a future change re-introduces
        // COM / WinForms hosting, add the attribute back.
        public static int Main(string[] args)
        {
            ServerConfig cfg;
            HardwareMonitorService.RunMode mode;
            bool console, noServer, autoStart, removeAutoStart, relaunch;
            bool adminExplicit = false, userExplicit = false;
            bool noOpen = false;
            try
            {
                ParseFlags(args, out cfg, out mode, out console, out noServer,
                    out autoStart, out removeAutoStart, out relaunch,
                    out adminExplicit, out userExplicit, out noOpen);
            }
            catch (Exception ex)
            {
                Console.Error.WriteLine($"[Arg] parse error: {ex.Message}");
                return 1;
            }

            // Apply the user's language preference BEFORE
            // any UI / strings access. The WinForms setup
            // window and the console fallback menu both
            // call Strings.Get(...) which routes through
            // CultureInfo.CurrentUICulture. An empty
            // cfg.Lang means "follow the OS" — leaving
            // CurrentUICulture alone is the correct
            // behaviour.
            ApplyLangPreference(cfg);

            // Tee Console.Out / Console.Error to a
            // log file before any startup banner
            // is written. The EXE is built
            // OutputType=WinExe so console writes
            // are a no-op; this is the only way
            // the user can see startup output
            // (via the setup page's "Open
            // console" button, which spawns a
            // PowerShell tail child against the
            // same file).
            SetupService.InitLogFile();

            // The user-facing entry points are exactly two:
            //
            //   1. Double-click perfectwall-server.exe
            //      → we run user mode, no admin, no UAC.
            //
            //   2. Right-click perfectwall-server.exe → "Run as administrator"
            //      → Explorer hands us an elevated token; we promote
            //      to admin mode automatically and LHM is allowed to
            //      touch the ring0 driver.
            //
            // The legacy --user / --admin flags are still honoured for
            // scripts that want to force a specific mode, but a bare
            // double-click now picks user mode and a right-click admin
            // launch picks admin mode, with no .cmd helper in the loop.
            if (!adminExplicit && !userExplicit)
            {
                mode = PerfectWall.Server.Utils.ElevationHelper.IsElevated()
                    ? HardwareMonitorService.RunMode.Admin
                    : HardwareMonitorService.RunMode.User;
                Console.WriteLine(
                    mode == HardwareMonitorService.RunMode.Admin
                        ? "[Server] No --user/--admin flag given, but the process is elevated. Auto-promoting to admin mode so LHM can read sensors."
                        : "[Server] No --user/--admin flag given. Running in user mode (no LHM). Right-click → 'Run as administrator' to enable temperature/fan/clock readings.");
            }

            if (console && Environment.OSVersion.Platform == PlatformID.Win32NT)
            {
                try { AllocConsole(); } catch { /* already attached */ }
            }

            if (autoStart)
            {
                try
                {
                    SetupService.SetAutoStartUser(true);
                    Console.WriteLine("Auto-start enabled");
                }
                catch (Exception ex)
                {
                    Console.Error.WriteLine($"Auto-start failed: {ex.Message}");
                    return 1;
                }
                return 0;
            }
            if (removeAutoStart)
            {
                try
                {
                    SetupService.SetAutoStartUser(false);
                    Console.WriteLine("Auto-start disabled");
                }
                catch (Exception ex)
                {
                    Console.Error.WriteLine($"Auto-start failed: {ex.Message}");
                    return 1;
                }
                return 0;
            }
            // ---- --probe: print a JSON diagnostic report
            //      about elevation + LHM and exit. This is the
            //      fastest way for the user to verify that the
            //      right-click "Run as administrator" entry
            //      point actually delivered an admin token and
            //      that LHM initialised. Check this BEFORE
            //      the noServer early-return so the probe
            //      doesn't get swallowed. ----
            if (relaunch) // --probe sets relaunch=true
            {
                return RunProbe(mode);
            }

            // ---- --dump-sensors: print every sensor LHM
            //      knows about and exit. This is the
            //      diagnostic for "why is my CPU temperature
            //      0?" — the user gets to see the exact
            //      Sensor.Name strings LHM 0.9.6 exposes on
            //      their machine, so we can pick the right
            //      matchers in HardwareMonitorService. ----
            if (args.Any(a => a == "--dump-sensors"))
            {
                return DumpSensors(mode);
            }

            if (noServer)
            {
                Console.WriteLine("Server not started (--no-server specified)");
                return 0;
            }

            // ---- elevation gate ----
            if (mode == HardwareMonitorService.RunMode.Admin && !ElevationHelper.IsElevated())
            {
                Console.Error.WriteLine(
                    "[CLI] --admin was requested but the current process is NOT elevated. " +
                    "Re-launching with the runas verb...");
                var pid = ElevationHelper.RelaunchElevated(args);
                if (pid == 0)
                {
                    Console.Error.WriteLine(
                        "[CLI] UAC relaunch declined or failed. Falling back to --user mode " +
                        "so the server still starts (hardware sensors will be zero).");
                    mode = HardwareMonitorService.RunMode.User;
                }
                else
                {
                    Console.WriteLine($"[CLI] Re-launched as elevated PID {pid}. This non-elevated copy will exit.");
                    return 0;
                }
            }

            // ---- save config ----
            try { cfg.Save(); } catch (Exception ex) { Console.Error.WriteLine($"[Config] save failed: {ex.Message}"); }

            // ---- construct hardware service FIRST so we can
            //      print a truthful banner (otherwise the user
            //      sees "LHM enabled" then a silent fallback
            //      to user-mode data) ----
            var hw = new HardwareMonitorService(mode);
            var sampler = new SystemSampler();
            // DiskInfoService is its own type because disk
            // info is hybrid: it has a *always-on* user-mode
            // path (System.IO.DriveInfo for volume sizes and
            // filesystem labels) and a *admin-mode* SMART
            // path (DiskInfoToolkit for model, serial,
            // firmware, temperature, lifetime counters).
            // Mixing the two into HardwareMonitorService would
            // force user mode to load the DiskInfoToolkit
            // assembly on every startup; splitting them keeps
            // the JIT cost off the cold path.
            var disks = new DiskInfoService(mode);

            Console.WriteLine($"[Server] mode={mode}, port={cfg.Port}, elevated={ElevationHelper.IsElevated()}");
            if (mode == HardwareMonitorService.RunMode.User)
            {
                Console.WriteLine("[Server] LHM NOT requested (--user). " +
                    "CPU/GPU temperature, clock, and fan fields will be 0 / unavailable.");
            }
            else if (hw.IsLhmAvailable)
            {
                // The em-dash below was historically
                // corrupted to `?` in the C# source
                // (same UTF-8 byte-corruption pattern
                // as sysmon-card-preview.html). Now
                // written directly as U+2014 so editors
                // without auto-detect show the right
                // glyph.
                Console.WriteLine("[Server] LHM initialised \u2014 temperatures, clocks, " +
                    "and fan speeds will be reported.");
            }
            else
            {
                // Admin mode but LHM init failed. This is the
                // typical "I'm admin and temps are still zero"
                // case the user reported. Print the *actual*
                // error and a hint, then continue running with
                // user-mode data instead of pretending.
                Console.Error.WriteLine(
                    "[LHM] --admin mode is active but LibreHardwareMonitor failed to initialise.");
                Console.Error.WriteLine($"[LHM] Reason: {hw.InitError ?? "(no computer object)"}");
                Console.Error.WriteLine(
                    "[LHM] Common causes on modern Windows:");
                Console.Error.WriteLine(
                    "[LHM]   1. Smart App Control / Defender blocked the WinRing0 kernel driver");
                Console.Error.WriteLine(
                    "[LHM]   2. HVCI / Memory Integrity is on (Settings \u2192 Privacy & security \u2192 Windows Security \u2192 Device security)");
                Console.Error.WriteLine(
                    "[LHM]   3. Install the PawnIO community driver (https://github.com/namazso/PawnIO.Setup/releases) and reboot");
                Console.Error.WriteLine(
                    "[LHM] Continuing in user-mode-equivalent: sensor data will be zero.");
            }
            var router = new Router();

            SysInfoEndpoints.Map(router, hw, sampler, disks);
            FileEndpoints.Map(router);
            IconEndpoints.Map(router);
            DockbarEndpoints.Map(router);
            ServerConfig currentCfg = cfg;
            ConfigEndpoints.Map(router, () => currentCfg, c => currentCfg = c);
            // The run mode is decided once in Main() and
            // captured by closure. The setup endpoint reads
            // it via the getter so the diagnostics card stays
            // truthful even if a future UAC flow flips the
            // mode after startup.
            HardwareMonitorService.RunMode currentMode = mode;
            SetupEndpoints.Map(router, () => currentCfg, c => currentCfg = c, () => currentMode);

            var server = new HttpServer(cfg.Port, router);
            try
            {
                server.Start();
            }
            catch (Exception ex)
            {
                Console.Error.WriteLine($"[HTTP] start failed: {ex.Message}");
                return 1;
            }

            Console.WriteLine($"Server running on http://0.0.0.0:{cfg.Port}");

            // ---- Setup UI ----
            // The user-facing setup surface is /setup, served
            // by SetupEndpoints. We hand it off to the user's
            // default browser (Edge / Chrome / Firefox) so the
            // modern HTML + CSS renders correctly. The previous
            // WinForms WebBrowser host ran the page inside an
            // embedded IE 7 (quirks mode), which couldn't
            // render CSS grid, flexbox, border-radius, or even
            // a reliable placeholder attribute — the embedded
            // surface always looked broken compared to the
            // browser. The console fallback menu (type `s` in
            // the terminal) is kept as a no-GUI option.
            //
            // Auto-open policy:
            //   * Wallpaper Engine spawns us headless, so the
            //     UserInteractive check is already enough for
            //     that case.
            //   * HKCU\…\Run and Task Scheduler logon tasks
            //     *also* have a user-interactive token (the
            //     user is logged in when the process starts),
            //     but they are spawned by `winlogon.exe` /
            //     `taskhostw.exe` and a Process.Start from
            //     such a parent will pop a browser in a
            //     context the user can't see — worse, on
            //     multi-account / RDP systems the new browser
            //     instance can have a blank profile and lose
            //     cookies, extensions, and saved logins.
            //     Therefore the auto-start registration code
            //     always appends `--no-open` to the EXE path,
            //     and `LaunchContext.CanOpenBrowser` adds a
            //     belt-and-suspenders parent-process check so
            //     we never pop a browser from a headless
            //     launcher even if the flag is forgotten.
            //     Additionally, FirstLaunch is checked so that
            //     setup only auto-opens on the very first run on
            //     this machine; subsequent cold starts are silent.
            //     The user can still open setup via the console
            //     menu ('s') or the dockbar at any time.
            if (!noOpen && cfg.FirstLaunch)
            {
                TryOpenSetupPage(cfg.Port);
                cfg.FirstLaunch = false;
                cfg.Save();
            }
            PerfectWall.Server.Gui.ConsoleMenu.StartInBackground(Console.ForegroundColor);

            // Wait for Ctrl+C
            var exit = new ManualResetEventSlim(false);
            Console.CancelKeyPress += (s, e) => { e.Cancel = true; exit.Set(); };
            AppDomain.CurrentDomain.ProcessExit += (s, e) => { exit.Set(); };
            exit.Wait();
            server.Stop();
            // Dispose the LHM service first — it owns
            // the (unmanaged) `Computer` instance — then
            // the disk service. `DiskInfoService.Dispose`
            // is a documented no-op today but calling it
            // keeps the cleanup pattern symmetric so a
            // future real teardown doesn't have to
            // retrofit the call site.
            hw.Dispose();
            disks.Dispose();
            return 0;
        }

        /// <summary>
        /// Print a one-shot JSON diagnostic showing what
        /// <c>--admin</c> would actually be able to do in this
        /// process. Useful when the user right-clicks
        /// <c>launch-elevated.cmd</c> 鈫?"Run as administrator"
        /// and the resulting process still seems to behave as
        /// user mode. Exit code is non-zero when admin mode
        /// was requested but could not be honoured.
        /// </summary>
        private static bool IsWindowsPlatform()
        {
            // We avoid RuntimeInformation.IsOSPlatform here
            // because Costura.Fody's transitive graph pulls
            // a 4.0.1.0 NuGet build of the type that collides
            // with the mscorlib 4.0.0.0 one. Environment.OSVersion
            // is the in-box API and never ambiguous.
            return Environment.OSVersion.Platform == PlatformID.Win32NT;
        }
        private static int RunProbe(HardwareMonitorService.RunMode mode)
        {
            using (var hw = new HardwareMonitorService(mode))
            {
                var cpuData = hw.CollectCpu();
                var cpu0 = cpuData[0];
                var report = new
                {
                    requested_mode = mode.ToString(),
                    is_elevated = ElevationHelper.IsElevated(),
                    // Route through a static method to avoid
                    // the 4.0.1.0 / 4.0.0.0 RuntimeInformation
                    // collision that Fody's transitive graph
                    // pulls in.
                    is_windows = IsWindowsPlatform(),
                    lhm_available = hw.IsLhmAvailable,
                    lhm_init_error = hw.InitError,
                    cpus_found = cpuData.Count,
                    sample_cpu = cpu0.Manufacturer + " / " + cpu0.Brand,
                    sample_cpu_temperature = cpu0.Temperature,
                    temperature_available = cpu0.TemperatureAvailable,
                    gpus_found = hw.CollectGpu().Count,
                };
                Console.WriteLine("=== perfectwall-server probe ===");
                Console.WriteLine(JsonConvert.SerializeObject(report, Formatting.Indented));
                Console.WriteLine("=================================");
                int rc = 0;
                if (mode == HardwareMonitorService.RunMode.Admin)
                {
                    if (!report.is_elevated) rc = 2;
                    else if (!report.lhm_available) rc = 3;
                }
                return rc;
            }
        }

        /// <summary>
        /// Print every sensor LHM 0.9.6 exposes on this
        /// machine. Diagnostic command used to figure out the
        /// exact Sensor.Name strings we have to match in
        /// <see cref="HardwareMonitorService"/>. Run with
        /// <c>--admin</c> to see WinRing0-backed sensor
        /// names.
        /// </summary>
        private static int DumpSensors(HardwareMonitorService.RunMode mode)
        {
            using (var hw = new HardwareMonitorService(mode))
            {
                if (!hw.IsLhmAvailable)
                {
                    Console.Error.WriteLine(
                        $"[dump-sensors] LHM not initialised: {hw.InitError ?? "(no computer object)"}. " +
                        "Run with --admin and an elevated token to see hardware sensors.");
                    return 4;
                }
                var sensors = hw.ReadAllSensors();
                Console.WriteLine("=== perfectwall-server LHM sensor dump ===");
                var byHw = sensors
                    .GroupBy(s => s.Hardware?.Name ?? "<orphan>")
                    .OrderBy(g => g.Key);
                foreach (var group in byHw)
                {
                    Console.WriteLine();
                    Console.WriteLine($"[{group.Key}]");
                    foreach (var s in group.OrderBy(s => s.SensorType).ThenBy(s => s.Name))
                    {
                        var v = s.Value;
                        var vStr = v is null ? "<null>" : v.ToString();
                        var unit = s.SensorType == LibreHardwareMonitor.Hardware.SensorType.Temperature ? "°C"
                                  : s.SensorType == LibreHardwareMonitor.Hardware.SensorType.Clock ? "MHz"
                                  : s.SensorType == LibreHardwareMonitor.Hardware.SensorType.Load ? "%"
                                  : s.SensorType == LibreHardwareMonitor.Hardware.SensorType.Fan ? "RPM"
                                  : s.SensorType == LibreHardwareMonitor.Hardware.SensorType.Voltage ? "V"
                                  : s.SensorType == LibreHardwareMonitor.Hardware.SensorType.Power ? "W"
                                  : "";
                        Console.WriteLine($"  {s.SensorType,-12}  {s.Name,-32}  {vStr,8} {unit}");
                    }
                }
                Console.WriteLine();
                Console.WriteLine($"=== total: {sensors.Count} sensors ===");
                return 0;
            }
        }

        private static void ParseFlags(
            string[] args,
            out ServerConfig cfg,
            out HardwareMonitorService.RunMode mode,
            out bool console,
            out bool noServer,
            out bool autoStart,
            out bool removeAutoStart,
            out bool relaunch,
            out bool adminExplicit,
            out bool userExplicit,
            out bool noOpen)
        {
            cfg = ServerConfig.Load();
            // Default to user mode. If neither --user nor --admin
            // is passed, Main() will auto-promote to admin mode when
            // it detects the process was launched elevated
            // (i.e. the user right-clicked → "Run as administrator").
            mode = HardwareMonitorService.RunMode.User;
            console = false;
            noServer = false;
            autoStart = false;
            removeAutoStart = false;
            relaunch = false;
            adminExplicit = false;
            userExplicit = false;
            // --no-open is appended by the auto-start
            // registration code (HKCU\…\Run and Task
            // Scheduler). When it's present, Main() will
            // still start the HTTP server, but it will
            // NOT call Process.Start on the user's
            // default browser — critical for the
            // "auto-start at logon" path, where a
            // headless launch (winlogon → EXE) would
            // otherwise pop a browser window that lands
            // in a brand-new instance with a blank
            // profile, silently losing the user's
            // cookies / extensions / saved logins.
            noOpen = false;

            for (int i = 0; i < args.Length; i++)
            {
                switch (args[i])
                {
                    case "--port":
                    case "-p":
                        if (i + 1 < args.Length && int.TryParse(args[++i], out var port))
                        {
                            cfg.Port = port;
                        }
                        break;
                    case "--admin":
                        mode = HardwareMonitorService.RunMode.Admin;
                        adminExplicit = true;
                        break;
                    case "--user":
                        mode = HardwareMonitorService.RunMode.User;
                        userExplicit = true;
                        break;
                    case "--auto-start":
                        autoStart = true;
                        break;
                    case "--remove-auto-start":
                        removeAutoStart = true;
                        break;
                    case "--no-server":
                        noServer = true;
                        break;
                    case "--console":
                        console = true;
                        break;
                    case "--relaunch":
                        relaunch = true;
                        break;
                    case "--no-open":
                        // Suppress the
                        // "Process.Start(setup page)"
                        // side effect. The HTTP
                        // server still starts so the
                        // existing instance can be
                        // reached on the saved port;
                        // the user just has to open
                        // the URL themselves (or
                        // click "Open setup page" in
                        // the dockbar / setup menu).
                        noOpen = true;
                        break;
                    case "--probe":
                        relaunch = true; // RunProbe is keyed off this
                        break;
                    case "--dump-sensors":
                        // Handled inline in Main() because we
                        // need to short-circuit before the
                        // --noServer check.
                        break;
                    case "--help":
                    case "-h":
                        PrintHelp();
                        Environment.Exit(0);
                        break;
                    default:
                        // Environment variable PORT overrides
                        // everything; handled below.
                        break;
                }
            }
            var envPort = Environment.GetEnvironmentVariable("PORT");
            if (!string.IsNullOrEmpty(envPort) && int.TryParse(envPort, out var ep))
            {
                cfg.Port = ep;
            }
        }

        /// <summary>
        /// Apply <paramref name="cfg"/>.Lang to
        /// <see cref="System.Globalization.CultureInfo.CurrentUICulture"/>
        /// when the user has explicitly set a
        /// preference. An empty Lang leaves the OS
        /// culture alone, which is the default.
        ///
        /// We deliberately do NOT set
        /// <see cref="System.Globalization.CultureInfo.CurrentCulture"/>
        /// — that's a number / date / currency
        /// locale, not a UI translation, and flipping
        /// it would surprise users with English
        /// Windows who happen to have zh-CN as their
        /// region format.
        /// </summary>
        private static void ApplyLangPreference(Models.ServerConfig cfg)
        {
            if (cfg == null || string.IsNullOrWhiteSpace(cfg.Lang)) return;
            try
            {
                var ci = new System.Globalization.CultureInfo(cfg.Lang);
                System.Globalization.CultureInfo.CurrentUICulture = ci;
                // Strings.CurrentCultureName() calls
                // ResolveCulture which honours the
                // supported-cultures whitelist, so an
                // unsupported value will quietly fall
                // through to the OS culture on first
                // Get. We don't second-guess the user
                // here — set the value and let the
                // resource lookup decide.
            }
            catch (Exception ex)
            {
                Console.Error.WriteLine($"[Lang] invalid value '{cfg.Lang}': {ex.Message}. Falling back to OS culture.");
            }
        }

        /// <summary>
        /// Best-effort: launch the user's default
        /// browser at <c>http://localhost:{port}/setup</c>.
        /// No-op (with a one-line log) if any of the
        /// following is true:
        ///
        /// <list type="bullet">
        ///   <item><description>
        ///     We're in Session 0 (services).
        ///   </description></item>
        ///   <item><description>
        ///     We're in a different session than the
        ///     active console (RDP focus theft).
        ///   </description></item>
        ///   <item><description>
        ///     The parent process is on the
        ///     <see cref="Utils.LaunchContext"/>
        ///     headless-list (winlogon, taskhost,
        ///     services, Wallpaper Engine, ...).
        ///   </description></item>
        ///   <item><description>
        ///     The user has no default browser
        ///     registered.
        ///   </description></item>
        /// </list>
        ///
        /// The "silent log" is intentional. We do
        /// <em>not</em> raise a console error when we
        /// skip the open — every auto-start at logon
        /// would otherwise print "[Setup] skipped"
        /// once per user per boot, which looks like a
        /// problem to anyone reading the log.
        /// </summary>
        private static void TryOpenSetupPage(int port)
        {
            if (!PerfectWall.Server.Utils.LaunchContext.CanOpenBrowser())
            {
                return;
            }
            try
            {
                // We deliberately use UseShellExecute=true
                // here (not the lower-level CreateProcess
                // path) because the Shell knows how to
                // resolve the user's default HTTP handler
                // from the registered ProgId, including
                // per-protocol preferences (e.g. "open
                // localhost links in Firefox, not Edge").
                // The trade-off is that ShellExecute can
                // take a few hundred ms on a cold start
                // while the Shell association cache warms
                // up; the success rate is much higher
                // than the CreateProcess path on systems
                // where the default browser is a UWP /
                // packaged app (Edge Chromium, Firefox
                // MSIX, etc.).
                System.Diagnostics.Process.Start(new System.Diagnostics.ProcessStartInfo
                {
                    FileName = "http://localhost:" + port + "/setup",
                    UseShellExecute = true
                });
            }
            catch (Exception ex)
            {
                // No default browser registered, no GUI
                // session, or the user is on Server
                // Core / Nano. Log at info level so a
                // debug-mode user can see why the page
                // didn't pop, but a casual user gets a
                // clean startup.
                Console.WriteLine($"[Setup] browser auto-open skipped: {ex.Message}");
            }
        }

        private static void PrintHelp()
        {
            Console.WriteLine("perfectwall-server (.NET Framework 4.8)");
            Console.WriteLine();
            Console.WriteLine("Usage:");
            Console.WriteLine("  Double-click perfectwall-server.exe");
            Console.WriteLine("    → runs in user mode, no admin, no UAC.");
            Console.WriteLine();
            Console.WriteLine("  Right-click perfectwall-server.exe → 'Run as administrator'");
            Console.WriteLine("    → runs in admin mode, LHM enabled, real hardware readings.");
            Console.WriteLine();
            Console.WriteLine("Both code paths auto-detect the launch context. The flags");
            Console.WriteLine("below are only for scripts and CI runners that need to");
            Console.WriteLine("force a specific mode or override the auto-promotion.");
            Console.WriteLine();
            Console.WriteLine("Setup UI:");
            Console.WriteLine("  A WinForms setup window opens automatically when the EXE is");
            Console.WriteLine("  launched directly (Environment.UserInteractive). It shows");
            Console.WriteLine("  port, both auto-start variants, and PawnIO status; the same");
            Console.WriteLine("  page is served at GET /setup for browser access from");
            Console.WriteLine("  another machine.");
            Console.WriteLine("  In a console, type 's' at any time to open the same");
            Console.WriteLine("  dashboard interactively.");
            Console.WriteLine();
            Console.WriteLine("Options:");
            Console.WriteLine("  -p, --port <N>           override listening port");
            Console.WriteLine("      --user               force user mode (LHM disabled)");
            Console.WriteLine("      --admin              force admin mode (LHM enabled, requires UAC)");
            Console.WriteLine("      --no-open            do NOT auto-open /setup in the default browser");
            Console.WriteLine("                           (used by the auto-start registration paths so a");
            Console.WriteLine("                           logon-launched copy never pops a fresh browser");
            Console.WriteLine("                           instance that would lose the user's profile)");
            Console.WriteLine("      --probe              print a JSON diagnostic and exit");
            Console.WriteLine("      --dump-sensors       print every LHM sensor name (diagnostic) and exit");
            Console.WriteLine("      --auto-start         register for Windows login and exit");
            Console.WriteLine("      --remove-auto-start  unregister and exit");
            Console.WriteLine("      --no-server          exit without listening");
            Console.WriteLine("      --console            allocate a console window");
            Console.WriteLine("  -h, --help               show this help");
        }
    }
}
