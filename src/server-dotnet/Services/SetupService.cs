using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.IO;
using System.Linq;
using System.Net.Http;
using System.Reflection;
using System.Runtime.InteropServices;
using System.Threading;
using System.Threading.Tasks;
using System.Xml.Linq;
using Microsoft.Win32;
using PerfectWall.Server.Models;
using PerfectWall.Server.Utils;

namespace PerfectWall.Server.Services
{
    /// <summary>
    /// Cross-mode setup helpers shared by the WinForms GUI
    /// and the console fallback menu. Everything here is
    /// pure logic — the views just bind to the same methods.
    /// </summary>
    public static class SetupService
    {
        // AllocConsole is still used by the --console
        // CLI flag in Program.cs so a user who
        // launches the EXE from a parent cmd can
        // get a real console attached at startup.
        // The "Open console" button in the setup
        // page no longer uses this — it spawns a
        // separate PowerShell tail child instead,
        // see OpenConsole() below.
        [DllImport("kernel32.dll", SetLastError = true)]
        [return: MarshalAs(UnmanagedType.Bool)]
        private static extern bool AllocConsole();

        public sealed class State
        {
            public ServerConfig Config { get; set; }
            public bool IsElevated { get; set; }
            public bool AutoStartUserRegistered { get; set; }
            public bool AutoStartAdminRegistered { get; set; }
            public bool PawnioInstalled { get; set; }
            public string PawnioVersion { get; set; }
            // The .sys file's last-write timestamp in
            // UTC. Reported as a separate field so the
            // setup page can show "version X" and
            // "install time Y" on different rows —
            // collapsing them into a single "version"
            // string (as the previous code did) hid
            // the install time behind a fake version
            // number. null when the file isn't on
            // disk (e.g. service registered but file
            // missing — see DetectPawnio for the
            // distinct sub-state in that case).
            public string PawnioInstallTime { get; set; }
            // The latest PawnIO release tag fetched
            // from GitHub. Populated by a background
            // refresh that runs at most once per hour
            // to stay well under the 60-req/h anonymous
            // GitHub API rate limit. null on first
            // call (background fetch hasn't returned
            // yet) or when the network is unreachable
            // — the UI renders "(无网络)" in that
            // case.
            public string PawnioLatestVersion { get; set; }
            public string PawnioPath { get; set; }
            public bool LhmWillWorkWithPawnio { get; set; }
            // Diagnostic fields surfaced in the setup page's
            // "Diagnostics" card. The HTML renders them as a
            // key/value table; the JS reads them straight from
            // /api/setup. Everything here is best-effort —
            // a missing value (e.g. a stripped EXE) just
            // produces "—" in the UI, never an exception.
            public HardwareMonitorService.RunMode RunMode { get; set; }
            public int ProcessId { get; set; }
            public string ExePath { get; set; }
            public DateTime? StartTime { get; set; }
            public string Architecture { get; set; }
            public string DotNetVersion { get; set; }
        }

        /// <summary>
        /// Convenience overload for callers that don't track
        /// run mode (the console menu). Defaults the mode to
        /// <see cref="HardwareMonitorService.RunMode.User"/>,
        /// which is a safe "we don't know" answer; the
        /// diagnostics card on the web UI always uses the
        /// explicit overload below, so it stays truthful.
        /// </summary>
        public static State Inspect()
        {
            return Inspect(HardwareMonitorService.RunMode.User);
        }

        /// <summary>
        /// Gather all the state the user can see / toggle from
        /// the setup UI. Every field is read-only best-effort;
        /// a missing PawnIO or an unelevated token never throws.
        /// <paramref name="runMode"/> is the resolved
        /// user-vs-admin mode Main() computed at startup —
        /// passed in explicitly so the endpoint layer can
        /// surface it without the service having to track
        /// global state.
        /// </summary>
        public static State Inspect(HardwareMonitorService.RunMode runMode)
        {
            var cfg = ServerConfig.Load();
            // Fire-and-forget background fetch of the
            // latest PawnIO release tag. Inspect()
            // returns the cached value (possibly null
            // on the first call); the worker writes
            // the result into the static field, and
            // the next /api/setup tick picks it up.
            // We don't block the HTTP thread on the
            // HTTPS request — a slow or unreachable
            // GitHub must not freeze the setup page.
            MaybeRefreshLatestPawnioVersion();
            var pawnioState = DetectPawnioState();
            var state = new State
            {
                Config = cfg,
                IsElevated = ElevationHelper.IsElevated(),
                AutoStartUserRegistered = IsAutoStartUserRegistered(),
                AutoStartAdminRegistered = IsAutoStartAdminRegisteredViaTaskScheduler(),
                PawnioInstalled = pawnioState.installed,
                PawnioVersion = pawnioState.version,
                PawnioInstallTime = pawnioState.installTime,
                PawnioPath = pawnioState.path,
                PawnioLatestVersion = _cachedLatestPawnioVersion,
                LhmWillWorkWithPawnio = pawnioState.installed && ElevationHelper.IsElevated(),
                RunMode = runMode,
            };
            // The diagnostic fields below read from the live
            // process. Wrap individually so one failure (e.g.
            // stripped EXE, no /proc) doesn't blank the rest.
            try
            {
                using (var p = Process.GetCurrentProcess())
                {
                    state.ProcessId = p.Id;
                    // Process.StartTime is DateTimeKind.Local on
                    // .NET Framework 4.8. The setup page
                    // renders it via `new Date(s.start_time)
                    // .toLocaleString()` which correctly
                    // respects the embedded offset, but the
                    // inline comment in the page says "ISO
                    // 8601 locale-agnostic" — a lie when
                    // Kind==Local. Normalise to UTC here so
                    // the round-trip is genuinely locale-free.
                    state.StartTime = p.StartTime.ToUniversalTime();
                    try { state.ExePath = p.MainModule?.FileName; } catch { /* access denied on some AVs */ }
                }
            }
            catch { /* best effort */ }
            // IntPtr.Size is the BCL 4.0 in-box API for the
            // current process word size. We deliberately avoid
            // System.Runtime.InteropServices.RuntimeInformation
            // because Fody's transitive graph pulls a 4.0.1.0
            // build of that type that collides with the
            // mscorlib 4.0.0.0 in-box version (see Program.cs
            // header for the long story).
            state.Architecture = IntPtr.Size == 8 ? "x64" : "x86";
            // We do not call RuntimeInformation.FrameworkDescription
            // for the same Fody-collision reason. The .NET
            // Framework 4.8 target is fixed by the csproj; the
            // Environment.Version (CLR number) is the truthful
            // value to display.
            state.DotNetVersion = ".NET Framework " + Environment.Version.ToString();
            return state;
        }

        // -----------------------------------------------------------------
        //  Auto-start
        // -----------------------------------------------------------------

        private const string HkcuRunKey = @"Software\Microsoft\Windows\CurrentVersion\Run";
        private const string HklmRunKey = @"Software\Microsoft\Windows\CurrentVersion\Run";
        private const string AppName = "PerfectWallServer";
        // Task Scheduler task name. Picked to mirror the
        // registry AppName so the relationship between
        // "the old HKLM\Run entry" and "the new task
        // entry" is obvious to anyone debugging with
        // schtasks / regedit side by side.
        private const string TaskSchedulerName = "PerfectWallServer";
        // The Windows shell binary that fronts the
        // Task Scheduler service. We shell out to it
        // rather than COM-interop the ITaskService
        // interfaces — the schtasks.exe surface is
        // tiny, human-readable, and has been the
        // supported wrapper since Windows 2000.
        private const string SchtasksExe = "schtasks.exe";

        /// <summary>
        /// True if the user-mode (HKCU\…\Run) auto-start
        /// entry is currently registered. Symmetric with
        /// <see cref="IsAutoStartAdminRegisteredViaTaskScheduler"/>
        /// for the admin-mode (Task Scheduler) variant.
        /// </summary>
        public static bool IsAutoStartUserRegistered()
        {
            try
            {
                using var key = Registry.CurrentUser.OpenSubKey(HkcuRunKey, writable: false);
                return key?.GetValue(AppName) != null;
            }
            catch { return false; }
        }

        public static void SetAutoStartUser(bool enable)
        {
            try
            {
                using var key = Registry.CurrentUser.OpenSubKey(HkcuRunKey, writable: true);
                if (enable)
                {
                    // Append --no-open so the logon-
                    // launched copy of perfectwall-server
                    // does NOT pop a browser window.
                    // Without this, the EXE inherits a
                    // user-interactive token at logon
                    // (winlogon / taskhostw is the
                    // parent) and the default-browser
                    // launch can land in a fresh
                    // browser instance with a blank
                    // profile, silently losing the
                    // user's cookies, extensions, and
                    // saved logins.
                    //
                    // The HTTP server still starts on
                    // the saved port, so any other
                    // already-running browser tab
                    // pointed at http://localhost:<port>
                    // keeps working, and the user can
                    // reach /setup by opening the URL
                    // manually if they want to.
                    key.SetValue(AppName, "\"" + GetExePath() + "\" --no-open", RegistryValueKind.String);
                    // Mutual exclusion with the admin
                    // (Task Scheduler) auto-start: both fire at
                    // this user's logon, so leaving the admin
                    // task enabled would launch the server a
                    // second time. Drop it now. This only
                    // succeeds when we are elevated (the admin
                    // task can only be deleted by an elevated
                    // process) — which is exactly the case
                    // where the user is consciously switching
                    // from admin to user mode. If we are not
                    // elevated the call is a no-op (best
                    // effort) and the user can clear the admin
                    // entry from an elevated instance.
                    TryRemoveAdminAutoStartTask();
                }
                else
                {
                    key.DeleteValue(AppName, throwOnMissingValue: false);
                }
            }
            catch (Exception ex)
            {
                throw new InvalidOperationException(
                    "Failed to update HKCU\\…\\Run. The user profile may be locked or the " +
                    "process may not have access to the current user's registry hive.", ex);
            }
        }

        // -----------------------------------------------------------------
        //  Admin auto-start via Task Scheduler
        // -----------------------------------------------------------------
        // The old design wrote HKLM\...\Run and let
        // explorer.exe (running as the user) re-launch
        // the EXE at logon. That path requires the user
        // to click through a UAC prompt at every login —
        // a deal-breaker for a setup page that the user
        // otherwise touches once.
        //
        // The new design creates a Task Scheduler entry
        // with /RL HIGHEST (run with highest privileges).
        // The Schedule service (running as SYSTEM)
        // launches the task at logon, so the user token
        // is already elevated when the EXE starts — no
        // UAC prompt. The trade-off is that the EXE must
        // be running elevated at the moment of
        // registration, so the caller has to enforce
        // IsElevated before invoking the enable path.
        // -----------------------------------------------------------------

        /// <summary>
        /// True if the "PerfectWallServer" task exists in
        /// the root of the local Task Scheduler. We use
        /// <c>schtasks /Query /TN ...</c> with the exit
        /// code as the signal: 0 = present, 1 = not
        /// found, anything else = error. We don't parse
        /// stdout/stderr here; the existence check only
        /// cares about the exit code.
        /// </summary>
        public static bool IsAutoStartAdminRegisteredViaTaskScheduler()
        {
            try
            {
                return RunSchtasks("/Query /TN \"" + TaskSchedulerName + "\"", throwOnError: false) == 0;
            }
            catch
            {
                // Worst case (schtasks.exe missing, ACL on
                // System32, etc.) — treat as "not registered"
                // so the UI shows a sensible default. The
                // user can retry; failure here is benign
                // because the actual write path will surface
                // a real error.
                return false;
            }
        }

        /// <summary>
        /// Register the admin auto-start as a Task
        /// Scheduler entry that fires at the current
        /// user's logon with "Run with highest
        /// privileges". The caller must be running
        /// elevated (admin token); otherwise schtasks
        /// will fail with E_ACCESSDENIED and we'll
        /// surface a friendly message.
        ///
        /// <para>
        /// As a side-effect, any legacy HKLM\…\Run
        /// entry left over from the previous design
        /// is removed. Otherwise the user would end
        /// up with two logon launchers — one with
        /// UAC, one without — and the first one to
        /// bind port 27420 would win.
        /// </para>
        /// </summary>
        public static void SetAutoStartAdminViaTaskScheduler(string exePath)
        {
            // 1. Best-effort cleanup of the legacy
            //    HKLM\…\Run entry. We do this first so
            //    a half-completed run (task created but
            //    HKLM still present) can't happen.
            TryRemoveLegacyHklmAdminEntry();
            // 2. The /TR value the Task Scheduler will
            //    execute at logon. We pass the EXE path
            //    in quotes so a Program Files install
            //    (with the space) doesn't break the
            //    command line. We append both
            //    <c>--admin</c> (so Main() picks admin
            //    mode regardless of how it would
            //    otherwise auto-detect) and
            //    <c>--no-open</c> (so the logon-launched
            //    copy does NOT pop a browser). The
            //    latter is critical on multi-account /
            //    RDP systems where a default-browser
            //    launch from a Task Scheduler ONLOGON
            //    context can land in a brand-new
            //    browser instance with a blank profile,
            //    silently losing cookies, extensions,
            //    and saved logins.
            var tr = "\"" + exePath + "\" --admin --no-open";
            // 3. The /SC ONLOGON + /RL HIGHEST combo is
            //    the whole point of the move: ONLOGON
            //    fires on every user logon, HIGHEST tells
            //    the Schedule service to launch the task
            // Mutual exclusion with the user-mode (HKCU\Run)
            // auto-start: both fire at this user's logon, so
            // leaving the HKCU entry enabled would launch the
            // server a second time. The admin task already
            // covers this user's logon with highest
            // privileges, so drop the redundant user-mode
            // entry. (This is the path that fixes the
            // "enable user first, then enable admin" double
            // launch — the admin registration runs elevated
            // and can always delete the HKCU value.)
            TryRemoveUserAutoStartEntry();
            //    with the user's token already elevated,
            //    skipping the explorer.exe→UAC chain.
            //    /RU is the user; we use the current
            //    Environment.UserName so the task fires
            //    for the same account that registered it.
            //    /F forces overwrite if the task already
            //    exists, making this method idempotent.
            var args =
                "/Create /TN \"" + TaskSchedulerName + "\" " +
                "/TR \"" + tr + "\" " +
                "/SC ONLOGON /RL HIGHEST " +
                "/RU \"" + Environment.UserName + "\" " +
                "/F";
            RunSchtasks(args, throwOnError: true);
        }

        /// <summary>
        /// Remove the Task Scheduler entry, plus the
        /// legacy HKLM\…\Run entry if it still exists
        /// (so a user with a half-migrated setup can
        /// clean up in one click).
        /// </summary>
        public static void UnsetAutoStartAdminViaTaskScheduler()
        {
            // Use /F so the delete doesn't prompt on
            // running tasks. The task is allowed to be
            // absent — exit 1 from /Delete on a missing
            // task is treated as "already done".
            var rc = RunSchtasks("/Delete /TN \"" + TaskSchedulerName + "\" /F", throwOnError: false);
            if (rc != 0 && rc != 1)
            {
                // Some other failure (access denied,
                // schtasks missing, etc.). Re-throw so
                // the endpoint surfaces it.
                throw new InvalidOperationException("schtasks /Delete exited " + rc);
            }
            TryRemoveLegacyHklmAdminEntry();
        }

        /// <summary>
        /// Best-effort delete of the legacy
        /// HKLM\…\Run entry. Called from both enable
        /// and disable to keep the two storage paths
        /// from getting out of sync.
        /// </summary>
        private static void TryRemoveLegacyHklmAdminEntry()
        {
            try
            {
                using var key = Registry.LocalMachine.OpenSubKey(HklmRunKey, writable: true);
                if (key?.GetValue(AppName) != null)
                {
                    key.DeleteValue(AppName, throwOnMissingValue: false);
                }
            }
            catch { /* best effort — migration cleanup, not the primary path */ }
        }

        /// <summary>
        /// Best-effort delete of the user-mode
        /// (HKCU\…\Run) auto-start entry. Used to keep the
        /// user and admin auto-start paths mutually exclusive
        /// so the server never launches twice at logon.
        /// </summary>
        private static void TryRemoveUserAutoStartEntry()
        {
            try
            {
                using var key = Registry.CurrentUser.OpenSubKey(HkcuRunKey, writable: true);
                if (key?.GetValue(AppName) != null)
                {
                    key.DeleteValue(AppName, throwOnMissingValue: false);
                }
            }
            catch { /* best effort — the admin task is the source of truth now */ }
        }

        /// <summary>
        /// Best-effort delete of the admin (Task Scheduler)
        /// auto-start entry. Used to keep the user and admin
        /// auto-start paths mutually exclusive. Deleting a
        /// Task Scheduler task requires an elevated token, so
        /// this is a genuine no-op (swallowed exception) when
        /// called from a non-elevated process — which is fine,
        /// because a non-elevated process could not have
        /// created the admin task in the first place.
        /// </summary>
        private static void TryRemoveAdminAutoStartTask()
        {
            try
            {
                UnsetAutoStartAdminViaTaskScheduler();
            }
            catch { /* best effort — not elevated or task absent */ }
        }

        /// <summary>
        /// Run schtasks.exe with the given argument
        /// string. Returns the exit code. When
        /// <paramref name="throwOnError"/> is true
        /// (the default), a non-zero exit throws with
        /// schtasks' stderr text included. The caller
        /// is expected to wrap a real failure in a
        /// friendlier message at the endpoint layer.
        /// </summary>
        private static int RunSchtasks(string args, bool throwOnError)
        {
            var psi = new ProcessStartInfo
            {
                FileName = SchtasksExe,
                Arguments = args,
                // UseShellExecute = false keeps the
                // schtasks child process as a normal
                // Win32 child. We DON'T want the runas
                // verb here: the calling process is
                // already elevated (the endpoint checks
                // IsElevated before invoking), so the
                // child inherits a token that already
                // has the Se* privileges it needs to
                // talk to the Schedule service. Asking
                // for runas here would just trigger a
                // second UAC dialog for no reason.
                UseShellExecute = false,
                CreateNoWindow = true,
                RedirectStandardOutput = true,
                RedirectStandardError = true,
            };
            using (var p = Process.Start(psi))
            {
                // We read both streams in full before
                // WaitForExit to avoid a deadlock on
                // schtasks filling its pipe buffer.
                var stdout = p.StandardOutput.ReadToEnd();
                var stderr = p.StandardError.ReadToEnd();
                p.WaitForExit();
                if (throwOnError && p.ExitCode != 0)
                {
                    throw new InvalidOperationException(
                        "schtasks.exe exit " + p.ExitCode + ": " + stderr.Trim());
                }
                return p.ExitCode;
            }
        }

        // -----------------------------------------------------------------
        //  On-demand console
        // -----------------------------------------------------------------
        // The EXE is built with OutputType=WinExe so
        // double-clicking it doesn't pop a console
        // window next to the wallpaper. The previous
        // design attached a console via
        // AllocConsole() and re-bound Console.Out,
        // but closing that console terminated the
        // process — SetConsoleCtrlHandler on a
        // console that AllocConsole created is
        // unreliable on Windows; the close event
        // sometimes terminates the process before
        // our handler runs.
        //
        // The new design is: the EXE always writes
        // logs to a file. "Open console" in the
        // setup page spawns a separate PowerShell
        // child process that tails that file in a
        // real console window. The child owns its
        // own console; closing it terminates the
        // child, not our server. The user can
        // re-open the console at any time and see
        // the live log.
        // -----------------------------------------------------------------

        /// <summary>
        /// Path to the always-on log file. All
        /// Console.WriteLine calls from the EXE
        /// (startup banner, mode banner, runtime
        /// errors, etc.) go here in addition to
        /// anywhere else they're routed. We keep
        /// history across restarts (FileMode.Append)
        /// and allow concurrent readers
        /// (FileShare.ReadWrite) so the
        /// "Open console" PowerShell tail child
        /// can hold an open handle while the EXE
        /// is still writing.
        /// </summary>
        public static string LogFilePath
        {
            get
            {
                var dir = Path.Combine(
                    Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData),
                    "PerfectWall");
                Directory.CreateDirectory(dir);
                return Path.Combine(dir, "server.log");
            }
        }

        /// <summary>
        /// Called from Program.Main right after the
        /// HTTP server is up. We redirect
        /// Console.Out / Console.Error to a file
        /// stream (with FileShare.ReadWrite so the
        /// PowerShell tail child can hold the file
        /// open concurrently). The EXE is built
        /// with OutputType=WinExe so the file is
        /// the only place logs go until the user
        /// clicks "Open console" — at which point
        /// PowerShell tail-follows the same file in
        /// a separate console window owned by the
        /// PowerShell child, NOT by us. Closing
        /// that PowerShell window terminates
        /// PowerShell (and Get-Content -Wait) but
        /// leaves our server process untouched.
        /// </summary>
        public static void InitLogFile()
        {
            try
            {
                var path = LogFilePath;
                var stream = new FileStream(
                    path, FileMode.Append, FileAccess.Write, FileShare.ReadWrite);
                var writer = new StreamWriter(stream, System.Text.Encoding.UTF8)
                {
                    AutoFlush = true,
                };
                Console.SetOut(writer);
                Console.SetError(writer);
                Console.WriteLine(
                    $"[{DateTime.Now:yyyy-MM-dd HH:mm:ss}] perfectwall-server.exe started (log tee active: {path})");
            }
            catch
            {
                // Permission denied, disk full,
                // sandboxed profile, etc. We just
                // don't tee to a file — the EXE
                // continues with the WinExe
                // null-stream default. Same as
                // before this method existed.
            }
        }

        public static bool OpenConsole()
        {
            // Spawn a SEPARATE PowerShell process
            // to tail the log file. The new
            // console window is owned by
            // powershell, not by us — closing
            // powershell terminates the tail
            // view but does NOT affect the
            // server. This is more robust than
            // AllocConsole + SetConsoleCtrlHandler
            // because the two processes are
            // genuinely independent; there's no
            // close-event plumbing to misfire.
            //
            // -NoProfile: skip PS profile loading
            //   for fast startup
            // -ExecutionPolicy Bypass: the user's
            //   PS execution policy may be
            //   Restricted; we explicitly bypass
            //   because the command is hard-coded
            //   (not user input) and read-only
            // Get-Content -Wait: read all existing
            //   content, then block-and-print new
            //   lines as they appear in the file.
            //   This is Windows' closest equivalent
            //   to "tail -f" and ships with every
            //   supported Windows version.
            try
            {
                // Escape single quotes by doubling
                // them (PowerShell convention) so a
                // LogFilePath containing `'`
                // can't break out of the quoted
                // string. LogFilePath is built from
                // %LOCALAPPDATA% which is normally
                // safe but can be redirected by a
                // malicious Roaming profile.
                var escapedPath = LogFilePath.Replace("'", "''");
                var psi = new System.Diagnostics.ProcessStartInfo
                {
                    FileName = "powershell.exe",
                    Arguments = "-NoProfile -ExecutionPolicy Bypass -Command \"Get-Content -Path '" + escapedPath + "' -Wait\"",
                    UseShellExecute = true,
                    CreateNoWindow = false,
                };
                System.Diagnostics.Process.Start(psi);
                return true;
            }
            catch
            {
                // PowerShell not found (extremely
                // rare on Win10/11; would mean a
                // seriously broken install). Fall
                // back to cmd.exe + type + pause.
                // Not a real tail — shows the log
                // once and waits for the user to
                // dismiss — but better than
                // nothing.
                try
                {
                    // Wrap the path in double-quotes
                    // and escape any embedded `"` by
                    // doubling. cmd.exe quoting rules:
                    // backslash-quote pairs are
                    // passed through; an unbalanced
                    // `"` would terminate the
                    // argument early.
                    var escapedCmdPath = LogFilePath.Replace("\"", "\\\"");
                    var psi = new System.Diagnostics.ProcessStartInfo
                    {
                        FileName = "cmd.exe",
                        Arguments = "/c \"title PerfectWall Server Log && type \"" + escapedCmdPath + "\" && echo. && echo --- end of log; refresh by running type again --- && pause\"",
                        UseShellExecute = true,
                        CreateNoWindow = false,
                    };
                    System.Diagnostics.Process.Start(psi);
                    return true;
                }
                catch
                {
                    return false;
                }
            }
        }

        // -----------------------------------------------------------------
        //  PawnIO detection
        // -----------------------------------------------------------------

        /// <summary>
        /// Probe the standard install locations for
        /// <c>PawnIO.sys</c>. Returns true if the driver is
        /// present; populates <paramref name="version"/> and
        /// <paramref name="path"/> when found.
        ///
        /// PawnIO (https://github.com/namazso/PawnIO) is the
        /// community-maintained WinRing0 replacement. When it
        /// is installed, LibreHardwareMonitor 0.9.6 loads its
        /// sensors through <c>PawnIO.sys</c> without triggering
        /// Defender's vulnerable-driver blocklist — so LHM
        /// can read CPU/GPU temperatures even on machines with
        /// HVCI / Memory Integrity enabled.
        /// </summary>
        public static bool DetectPawnio(out string version, out string path)
        {
            // Two things this method gets right that the
            // old version did not:
            //
            //   1. The "version" string is no longer
            //      "v16KiB, 2024-12-01" — that was the
            //      .sys file size in kilobytes plus the
            //      mtime, masquerading as a version
            //      number. Users reasonably read it as
            //      "v16" and got confused. We now
            //      return the mtime alone, labelled
            //      "UTC", so a reader can tell at a
            //      glance "this is when the .sys on
            //      disk was last modified" — a useful
            //      piece of info for diagnosing
            //      "is this the version I expected?"
            //      without claiming a version we don't
            //      actually know.
            //
            //   2. The ImagePath read from the service
            //      registry is a kernel-style device
            //      path (e.g.
            //      "\SystemRoot\System32\DriverStore\...
            //      \PawnIO.sys") — NOT a real filesystem
            //      path. The old code called
            //      File.Exists() on it directly, which
            //      always returned false, so the
            //      registry fallback silently failed
            //      for any user whose PawnIO was
            //      installed via the standard Windows
            //      driver package (which puts the .sys
            //      in DriverStore\FileRepository, not
            //      drivers\). We now expand the path
            //      through ExpandDevicePath() before
            //      calling File.Exists().
            version = null;
            path = null;
            try
            {
                var sysRoot = Environment.SystemDirectory;
                // The two filenames we know PawnIO
                // ships as. Tried in order; first hit
                // wins. We deliberately do NOT scan
                // DriverStore\FileRepository\ because
                // the directory layout is hash-based
                // (pawnio.inf_amd64_<hash>\) and
                // enumerating it would require glob
                // semantics that the BCL doesn't give
                // us. The registry-based path below
                // covers the DriverStore case via
                // service ImagePath.
                var candidates = new[]
                {
                    Path.Combine(sysRoot, "drivers", "PawnIO.sys"),
                    Path.Combine(sysRoot, "drivers", "PawnIO_x64.sys"),
                    Path.Combine(sysRoot, "PawnIO.sys"),
                };
                foreach (var c in candidates)
                {
                    if (File.Exists(c))
                    {
                        path = c;
                        version = GetPawnioVersionString(c);
                        return true;
                    }
                }
                // Service registry fallback. The
                // ImagePath for a kernel driver uses
                // a kernel device path that needs
                // expansion (see ExpandDevicePath).
                // The service-name list is a defensive
                // sweep — PawnIO itself uses "PawnIO"
                // but we have seen forks and packed
                // redistributions under slightly
                // different names.
                var serviceNames = new[] { "PawnIO", "PawnIO_x64", "pawnio" };
                foreach (var name in serviceNames)
                {
                    using var svc = Registry.LocalMachine.OpenSubKey(
                        @"SYSTEM\CurrentControlSet\Services\" + name);
                    if (svc == null) continue;
                    var imagePath = svc.GetValue("ImagePath") as string;
                    if (string.IsNullOrEmpty(imagePath)) continue;
                    var expanded = ExpandDevicePath(imagePath);
                    if (!string.IsNullOrEmpty(expanded) && File.Exists(expanded))
                    {
                        path = expanded;
                        version = GetPawnioVersionString(expanded);
                        return true;
                    }
                    // Service is registered but the
                    // file is gone. We treat that as
                    // "installed but broken": the
                    // driver was at some point set
                    // up, but a subsequent cleanup or
                    // a partial uninstall left the
                    // service key without its binary.
                    // The UI shows the original
                    // (unexpanded) ImagePath so the
                    // user can reinstall to the
                    // right place.
                    path = "(missing) " + imagePath;
                    version = "service registered, file missing";
                    return true;
                }
            }
            catch { /* best-effort */ }
            return false;
        }

        /// <summary>
        /// Expand the kernel-style device path that
        /// driver <c>ImagePath</c> values use. Forms
        /// we have to handle, all observed in the wild
        /// or documented:
        ///   \SystemRoot\System32\drivers\PawnIO.sys
        ///   \??\C:\Windows\System32\drivers\PawnIO.sys
        ///   C:\Windows\System32\drivers\PawnIO.sys
        /// The plain <c>C:\</c>-prefixed form needs
        /// no expansion; the <c>\??\</c> form is a
        /// kernel Object Manager prefix that maps to
        /// the same path; the <c>\SystemRoot\</c>
        /// form is the kernel's name for
        /// <c>%SystemRoot%</c> (typically
        /// <c>C:\Windows</c>). We deliberately do NOT
        /// use <c>Environment.ExpandEnvironmentVariables</c>
        /// because that would mangle stray '%' bytes
        /// inside the path, and we want a literal
        /// string substitution.
        /// </summary>
        private static string ExpandDevicePath(string raw)
        {
            if (string.IsNullOrEmpty(raw)) return raw;
            if (raw.StartsWith(@"\??\"))
            {
                return raw.Substring(4);
            }
            if (raw.StartsWith(@"\SystemRoot\"))
            {
                var sysRoot = Environment.GetFolderPath(Environment.SpecialFolder.Windows);
                if (string.IsNullOrEmpty(sysRoot))
                {
                    sysRoot = Environment.SystemDirectory;
                    // Strip the trailing "\System32" so
                    // the concat below yields the
                    // expected \SystemRoot substitution
                    // (C:\Windows), not C:\Windows\System32.
                    if (sysRoot.EndsWith(@"\System32", StringComparison.OrdinalIgnoreCase))
                    {
                        sysRoot = sysRoot.Substring(0, sysRoot.Length - 8);
                    }
                }
                // raw[11:] skips the leading "\SystemRoot"
                // so the result is sysRoot + "X..." not
                // sysRoot + "\SystemRoot\X...".
                return sysRoot + raw.Substring(11);
            }
            return raw;
        }

        /// <summary>
        /// Extract the real version string from a
        /// PawnIO.sys (or any PE file) by reading its
        /// embedded VS_VERSIONINFO resource. PawnIO's
        /// open-source build embeds the GitHub release
        /// version (e.g. "3.3.0.0") there, so
        /// <c>FileVersionInfo.FileVersion</c> is the
        /// authoritative answer. If the resource is
        /// missing (some packed redistributions strip
        /// it) or empty, we fall back to the .sys
        /// file's last-write timestamp labelled
        /// "UTC" — strictly less informative than a
        /// version, but at least an honest "this is
        /// when this binary on disk was last touched",
        /// which is enough to answer "do I have the
        /// build I think I have?".
        /// </summary>
        private static string GetPawnioVersionString(string sysPath)
        {
            try
            {
                var fvi = FileVersionInfo.GetVersionInfo(sysPath);
                // FileVersion is the canonical field;
                // ProductVersion is a fallback some
                // build pipelines set differently.
                var v = !string.IsNullOrWhiteSpace(fvi.FileVersion) ? fvi.FileVersion : fvi.ProductVersion;
                if (!string.IsNullOrWhiteSpace(v)) return v.Trim();
            }
            catch { /* best-effort */ }
            try
            {
                return new FileInfo(sysPath).LastWriteTimeUtc.ToString("yyyy-MM-dd") + " UTC";
            }
            catch { /* best-effort */ }
            return null;
        }

        /// <summary>
        /// Read the .sys file's last-write timestamp as
        /// an ISO date in UTC. PawnIO's mtime is the
        /// closest thing to a stable "install time"
        /// signal: when installed via the standard
        /// Windows driver package, the .sys lands in
        /// DriverStore with an mtime that maps to the
        /// install date; when the user copies a newer
        /// .sys in by hand, the mtime moves to that
        /// newer timestamp. Either way, the user gets
        /// an honest "this is when this driver on
        /// disk was last touched" — not a version
        /// number mislabelled as a date.
        /// </summary>
        private static string GetPawnioInstallTime(string sysPath)
        {
            try
            {
                return new FileInfo(sysPath).LastWriteTimeUtc.ToString("yyyy-MM-dd") + " UTC";
            }
            catch { /* best-effort */ }
            return null;
        }

        /// <summary>
        /// The single source of truth for the PawnIO
        /// detection results. Returns a tuple of
        /// (installed, version, installTime, path) so
        /// the State object can populate all four
        /// fields in one call. The previous design
        /// had two separate methods (DetectPawnio
        /// + a "service registered" branch) that
        /// each computed overlapping bits; this
        /// refactor is a single function with a
        /// single state machine.
        /// </summary>
        private static (bool installed, string version, string installTime, string path)
            DetectPawnioState()
        {
            string version = null;
            string installTime = null;
            string path = null;
            try
            {
                var sysRoot = Environment.SystemDirectory;
                var candidates = new[]
                {
                    Path.Combine(sysRoot, "drivers", "PawnIO.sys"),
                    Path.Combine(sysRoot, "drivers", "PawnIO_x64.sys"),
                    Path.Combine(sysRoot, "PawnIO.sys"),
                };
                foreach (var c in candidates)
                {
                    if (File.Exists(c))
                    {
                        path = c;
                        version = GetPawnioVersionString(c);
                        installTime = GetPawnioInstallTime(c);
                        return (true, version, installTime, path);
                    }
                }
                var serviceNames = new[] { "PawnIO", "PawnIO_x64", "pawnio" };
                foreach (var name in serviceNames)
                {
                    using var svc = Registry.LocalMachine.OpenSubKey(
                        @"SYSTEM\CurrentControlSet\Services\" + name);
                    if (svc == null) continue;
                    var imagePath = svc.GetValue("ImagePath") as string;
                    if (string.IsNullOrEmpty(imagePath)) continue;
                    var expanded = ExpandDevicePath(imagePath);
                    if (!string.IsNullOrEmpty(expanded) && File.Exists(expanded))
                    {
                        path = expanded;
                        version = GetPawnioVersionString(expanded);
                        installTime = GetPawnioInstallTime(expanded);
                        return (true, version, installTime, path);
                    }
                    // Service is registered but the
                    // file is gone. We surface the
                    // original ImagePath so the user
                    // can see what the install
                    // expected, and a special "service
                    // registered, file missing"
                    // version string so the UI knows
                    // this is a degraded state.
                    path = "(missing) " + imagePath;
                    version = "service registered, file missing";
                    return (true, version, null, path);
                }
            }
            catch { /* best-effort */ }
            return (false, null, null, null);
        }

        // -----------------------------------------------------------------
        //  Latest-version lookup (GitHub releases feed)
        // -----------------------------------------------------------------
        // The PawnIO card surfaces a "latest" version
        // next to the locally installed one so the user
        // can tell at a glance "I have 2.2.0 but
        // upstream is 2.3.0 — should I update?".
        //
        // The source code lives at
        //   github.com/namazso/PawnIO
        // but **releases are published at**
        //   github.com/namazso/PawnIO.Setup
        // — the latter is the installer/setup project
        // that wraps the driver with a Windows
        // installer. We read the latter's Atom feed,
        // which is the same one GitHub uses to render
        // the /releases page.
        //
        // The unauthenticated REST API
        // (api.github.com/repos/.../releases/latest)
        // is rate-limited at 60 req/h per IP — too
        // easy to exhaust on a long-lived setup page.
        // We use the Atom release feed instead, which
        // GitHub does not rate-limit. The first
        // <entry> in the feed is the latest release;
        // we extract the tag from the entry's
        // <link rel="alternate"> URL, not from the
        // <title>, because the title can be "Release
        // 2.2.0" (humanised) while the tag is just
        // "2.2.0" (machine-friendly).
        // -----------------------------------------------------------------
        private static string _cachedLatestPawnioVersion = null;
        private static DateTime _latestPawnioFetchedAtUtc = DateTime.MinValue;
        private static readonly object _latestPawnioFetchLock = new object();
        private static readonly TimeSpan LatestPawnioCacheTtl = TimeSpan.FromHours(1);
        // In-flight gate. The previous round-1 fix
        // only deduped by timestamp — between the
        // moment a fetch started and the moment it
        // populated the cache, every concurrent
        // /api/setup call would also see
        // `_cachedLatestPawnioVersion == null` and
        // spawn its own HTTP fetch. The Interlocked
        // gate below ensures only one in-flight
        // request at a time, with callers outside
        // the gate bailing immediately.
        private static int _fetchInFlight = 0;

        // HttpClient is designed to be a long-lived
        // singleton — creating one per fetch is the
        // canonical .NET anti-pattern (socket
        // exhaustion under load). Lazy-init on first
        // use; never disposed because the process
        // owns it for its entire lifetime.
        private static readonly Lazy<HttpClient> _pawnioHttp =
            new Lazy<HttpClient>(() =>
            {
                var c = new HttpClient();
                c.Timeout = TimeSpan.FromSeconds(5);
                c.DefaultRequestHeaders.UserAgent.ParseAdd("perfectwall-server");
                return c;
            });

        private static void MaybeRefreshLatestPawnioVersion()
        {
            // Fast path: cache is still fresh.
            if (_cachedLatestPawnioVersion != null &&
                DateTime.UtcNow - _latestPawnioFetchedAtUtc < LatestPawnioCacheTtl)
            {
                return;
            }
            // In-flight gate. If a fetch is already
            // running, bail — don't enqueue a
            // duplicate. The previous round-1 fix
            // used a lock + timestamp to dedupe,
            // which has a window between the
            // timestamp claim and the actual HTTP
            // request start where concurrent
            // callers all decide to spawn their own
            // fetch.
            if (Interlocked.CompareExchange(ref _fetchInFlight, 1, 0) != 0)
            {
                return;
            }
            // The previous round-1 fix also kept
            // the lock + timestamp around in case
            // the new code missed a path. The
            // Interlocked gate above is sufficient;
            // the lock is retained only for the
            // TTL-write below so the timestamp
            // update is atomic w.r.t. the cache
            // read in the fast path.
            lock (_latestPawnioFetchLock)
            {
                _latestPawnioFetchedAtUtc = DateTime.UtcNow;
            }
            // Fire-and-forget. The round-1 fix
            // replaced the previous
            // `ThreadPool.QueueUserWorkItem` +
            // `.Result` (sync-over-async) with
            // `Task.Run(async () => ...)` which
            // properly awaits the HTTP call.
            _ = Task.Run(async () =>
            {
                try { await RefreshLatestPawnioVersionAsync().ConfigureAwait(false); }
                finally { Interlocked.Exchange(ref _fetchInFlight, 0); }
            });
        }

        private static async Task RefreshLatestPawnioVersionAsync()
        {
            try
            {
                // The unauthenticated REST API
                // (api.github.com/repos/.../
                // releases/latest) is rate-limited
                // at 60 req/h per IP — too easy
                // to exhaust on a long-lived
                // setup page. We use the Atom
                // release feed instead, which
                // GitHub does not rate-limit
                // (the /releases page renders
                // from the same feed). The first
                // <entry>/<title> is the latest
                // tag, which is what we want.
                var atom = await _pawnioHttp.Value.GetStringAsync(
                    "https://github.com/namazso/PawnIO.Setup/releases.atom"
                ).ConfigureAwait(false);
                // Parse with XDocument — the previous
                // regex parser broke on the nested
                // <entry> shape that GitHub started
                // emitting in mid-2024.
                var doc = XDocument.Parse(atom);
                var ns = doc.Root?.GetDefaultNamespace() ?? XNamespace.None;
                var firstEntry = doc.Descendants(ns + "entry").FirstOrDefault();
                if (firstEntry != null)
                {
                    // The version is in the entry's
                    // <link rel="alternate" href=".../releases/tag/VERSION"/>
                    // attribute. The <title> element is
                    // humanised ("Release 2.2.0") so we
                    // ignore it.
                    var link = firstEntry.Elements(ns + "link")
                        .FirstOrDefault(e => (string?)e.Attribute("rel") == "alternate");
                    var href = (string?)link?.Attribute("href");
                    if (!string.IsNullOrEmpty(href))
                    {
                        var idx = href.LastIndexOf("/tag/", StringComparison.Ordinal);
                        if (idx >= 0)
                        {
                            var tag = href.Substring(idx + "/tag/".Length);
                            _cachedLatestPawnioVersion = tag.Trim().TrimStart('v');
                        }
                    }
                }
            }
            catch
            {
                // Network error, timeout, parse
                // failure, etc. Leave the cache
                // as-is so the next successful
                // fetch still wins. The UI
                // renders null as "无网络".
            }
        }

        /// <summary>
        /// Open PawnIO's GitHub releases page in the user's
        /// default browser. Used by the GUI's "Install PawnIO"
        /// button.
        /// </summary>
        public static void OpenPawnioReleasesPage()
        {
            try
            {
                Process.Start(new ProcessStartInfo
                {
                    FileName = "https://github.com/namazso/PawnIO.Setup/releases",
                    UseShellExecute = true
                });
            }
            catch { /* best-effort */ }
        }

        // -----------------------------------------------------------------
        //  Helpers
        // -----------------------------------------------------------------

        private static string GetExePath()
        {
            // Same fallback the rest of the project uses:
            // MainModule for net48, exe next to the assembly
            // otherwise.
            try
            {
                var p = Process.GetCurrentProcess().MainModule?.FileName;
                if (!string.IsNullOrEmpty(p) && File.Exists(p)) return p;
            }
            catch { }
            var loc = Assembly.GetExecutingAssembly().Location;
            return Path.Combine(Path.GetDirectoryName(loc) ?? ".", "perfectwall-server.exe");
        }
    }
}
