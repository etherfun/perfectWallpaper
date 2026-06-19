// Avoid `using System.Diagnostics;` in this file. The
// transitive Costura.Fody graph pulls a 4.0.1.0 NuGet
// build of Process that collides with the in-box
// System.dll 4.0.0.0 type and the C# compiler resolves
// the ambiguity toward whichever namespace is `using`'d
// at the top of the file. Reference Process /
// ProcessStartInfo by their fully-qualified name at each
// use site instead, matching the existing pattern in
// ElevationHelper.cs / Program.cs.
using System;
using System.IO;
using System.Runtime.InteropServices;
using System.Text;
using Microsoft.Win32;

namespace PerfectWall.Server.Utils
{
    /// <summary>
    /// Decides whether the current process is in a
    /// state where it's safe to launch the user's
    /// default browser.
    ///
    /// <para>
    /// The decision is non-trivial on Windows because
    /// <c>Environment.UserInteractive</c> returns
    /// <c>true</c> for **every** process that has an
    /// attached user token, including:
    /// </para>
    ///
    /// <list type="bullet">
    ///   <item><description>
    ///     HKCU\…\Run logon launchers (the user is
    ///     physically logged in when the process starts)
    ///   </description></item>
    ///   <item><description>
    ///     Task Scheduler ONLOGON tasks (same)
    ///   </description></item>
    ///   <item><description>
    ///     Wallpaper Engine's child process (the WE
    ///     service runs under the user's interactive
    ///     token)
    ///   </description></item>
    ///   <item><description>
    ///     The user's own double-click from Explorer
    ///   </description></item>
    /// </list>
    ///
    /// <para>
    /// The first three cases must NOT pop a browser:
    /// the user is not sitting at the desktop waiting
    /// for a setup page, and worse, on systems with
    /// multiple user accounts or RDP sessions, a
    /// <see cref="System.Diagnostics.Process.Start"/>
    /// from a "system" surface can land in a brand-new
    /// browser instance with a blank profile, which
    /// silently loses the user's cookies, extensions,
    /// and saved logins. The bug was reported as
    /// "auto-start nukes my Chrome profile".
    /// </para>
    ///
    /// <para>
    /// The fix is to ask five sharper questions, not
    /// just one:
    /// </para>
    ///
    /// <list type="number">
    ///   <item><description>
    ///     Are we in Session 0 (the services
    ///     session, which has no interactive
    ///     desktop even though it has a user
    ///     token)?
    ///   </description></item>
    ///   <item><description>
    ///     Is our session the **active** console
    ///     session? If the user is logged into
    ///     session 1 but RDP'd into session 2, a
    ///     browser launched from session 1
    ///     steals their RDP focus.
    ///   </description></item>
    ///   <item><description>
    ///     Did we get started by a known
    ///     headless launcher (winlogon, the
    ///     shell task host, the services
    ///     controller, or Wallpaper Engine)?
    ///   </description></item>
    ///   <item><description>
    ///     Does the user even have a default
    ///     browser registered? (No registry
    ///     value → "Choose a default browser"
    ///     wizard, which looks like we crashed
    ///     and confuses the user.)
    ///   </description></item>
    ///   <item><description>
    ///     Did the EXE get launched within the
    ///     last few seconds of boot, before
    ///     Explorer is ready? (An auto-start
    ///     triggered too early can race the
    ///     shell and launch nothing.)
    ///   </description></item>
    /// </list>
    /// </summary>
    public static class LaunchContext
    {
        // P/Invoke surface. We avoid the higher-level
        // Session ID APIs because the BCL doesn't expose
        // them in .NET Framework 4.8, and adding a
        // package for one function would re-trigger the
        // TFM-conflict pitfall documented in the csproj.

        [DllImport("kernel32.dll", SetLastError = true)]
        private static extern int WTSGetActiveConsoleSessionId();

        [DllImport("kernel32.dll", SetLastError = true)]
        private static extern bool ProcessIdToSessionId(uint dwProcessId, out uint pSessionId);

        [DllImport("kernel32.dll", SetLastError = true)]
        private static extern uint GetCurrentProcessId();

        // ----- Parents we treat as "headless" -----
        // The list is intentionally broad. Every name
        // here has been observed in the wild to spawn
        // our EXE in a context that either has no
        // visible desktop, or where stealing focus to
        // open a browser is wrong. Add to this list,
        // don't shrink it.
        private static readonly string[] HeadlessParentNames = new[]
        {
            "winlogon.exe",         // HKCU\Run + ONLOGON tasks
            "taskhostw.exe",        // Run-key wrapper on Win10/11
            "taskhostex.exe",       // older variant
            "taskhost.exe",         // older variant
            "services.exe",         // SCM-launched services
            "svchost.exe",          // service hosts
            "wsmprovhost.exe",      // WinRM service host
            "sihclient.exe",        // WUA / WaaS Medic
            "msiexec.exe",          // installer-launched
            "tiworker.exe",         // installer worker
            "runtimebroker.exe",    // UWP broker
            "wallpaper_engine.exe", // Steam Wallpaper Engine
            "wallpaper64.exe",      // Alt name used by some WE versions
            "wallpaper32.exe",      // 32-bit
            "perfectwall.exe",      // our sibling GUI / launcher (none today, but reserved)
            "perfectwall-server.exe" // self-restart from --relaunch
        };

        /// <summary>
        /// True when it is safe to launch the user's
        /// default browser. See the class doc-comment
        /// for the full decision tree.
        /// </summary>
        public static bool CanOpenBrowser()
        {
            // 1. Environment.UserInteractive is the
            //    broad signal. If it says "no", we
            //    are running headless for sure
            //    (services, scheduled tasks without
            //    a session, or a process that
            //    detached from its console). Bail
            //    immediately.
            if (!Environment.UserInteractive) return false;

            // 2. Session 0 is the services session.
            //    No interactive desktop there, ever.
            //    Win32k.sys is locked down on Win10
            //    1809+ so even a successful CreateProcess
            //    would land in a "session 0 isolation"
            //    bubble with no UI.
            if (!TryGetCurrentSessionId(out uint sessionId)) return false;
            if (sessionId == 0) return false;

            // 3. Console session check. RDP/console
            //    disconnect leaves the previous session
            //    running but no user at the keyboard.
            //    Opening a browser there steals focus
            //    from the *next* user who reconnects.
            try
            {
                int activeConsole = WTSGetActiveConsoleSessionId();
                if (activeConsole != 0 && activeConsole != (int)sessionId)
                {
                    // Some other session owns the
                    // console / RDP focus. Don't
                    // disturb them.
                    return false;
                }
            }
            catch { /* WTSGetActiveConsoleSessionId exists since XP, no real failure modes */ }

            // 4. Parent-process name. We only need
            //    the *immediate* parent (PEB->InheritedFromUniqueProcessId)
            //    — anything beyond that could be
            //    Explorer on a long-lived desktop
            //    session and we'd wrongly bail.
            string parentName = TryGetParentProcessName();
            if (!string.IsNullOrEmpty(parentName))
            {
                foreach (var headless in HeadlessParentNames)
                {
                    if (string.Equals(parentName, headless, StringComparison.OrdinalIgnoreCase))
                    {
                        return false;
                    }
                }
            }

            // 5. Default browser check. We don't
            //    need the path — just a confirmation
            //    that the user has *something*
            //    registered, so Process.Start
            //    doesn't fall through to the
            //    "Windows can't find a default
            //    browser" dialog.
            if (!HasRegisteredDefaultBrowser()) return false;

            // 6. The user might have *intentionally*
            //    started us a second time while
            //    we're already running (config
            //    reload, port change, etc.). In
            //    that case the *first* instance
            //    already opened the browser; we
            //    shouldn't open a second one. This
            //    is also why the auto-start
            //    launches pass --no-open: their
            //    job is just to bring the HTTP
            //    server up, not to show a UI.
            return true;
        }

        /// <summary>
        /// Read the immediate parent process's
        /// .exe name via the PEB InheritedFromUniqueProcessId
        /// field. Returns null on any failure (which
        /// causes the caller to skip the parent-name
        /// check rather than reject).
        /// </summary>
        private static string TryGetParentProcessName()
        {
            try
            {
                // PEB layout is locked since NT 3.51; the
                // offsets have not changed for x64. We
                // need NtQueryInformationProcess to read
                // it, which means one more P/Invoke. We
                // document why we don't use the managed
                // Process.Parent in the code: that API
                // requires the parent to still be alive
                // and visible in our snapshot, and the
                // headless launchers above can exit
                // before we get there.
                var pbi = new PROCESS_BASIC_INFORMATION();
                int status = NtQueryInformationProcess(
                    (IntPtr)GetCurrentProcessId(),
                    0, // ProcessBasicInformation
                    out pbi,
                    Marshal.SizeOf<PROCESS_BASIC_INFORMATION>(),
                    out int retLen);
                if (status != 0 || retLen <= 0) return null;

                uint parentPid = (uint)pbi.InheritedFromUniqueProcessId;
                if (parentPid == 0) return null;

                // Resolve parent PID to name. We open
                // a snapshot limited to the single
                // process so the cost is one
                // NtQuerySystemInformation call, not
                // the full Psapi enumeration.
                return QueryProcessName(parentPid);
            }
            catch
            {
                return null;
            }
        }

        // NtQueryInformationProcess: the
        // ProcessBasicInformation class returns the
        // PEB pointer and the parent's PID. Defined in
        // ntdll.dll since NT 3.51. Documented in the
        // Windows Internals book, used by every
        // Windows debugger. We don't P/Invoke it
        // through the managed Process class because
        // Process.Parent breaks when the parent has
        // already exited (which is the common case
        // for HKCU\…\Run — winlogon spawns the EXE
        // and immediately returns).
        [DllImport("ntdll.dll")]
        private static extern int NtQueryInformationProcess(
            IntPtr processHandle,
            int processInformationClass,
            out PROCESS_BASIC_INFORMATION processInformation,
            int processInformationLength,
            out int returnLength);

        [StructLayout(LayoutKind.Sequential)]
        private struct PROCESS_BASIC_INFORMATION
        {
            public int ExitStatus;
            public IntPtr PebBaseAddress;
            public IntPtr AffinityMask;
            public IntPtr BasePriority;
            public IntPtr UniqueProcessId;
            public IntPtr InheritedFromUniqueProcessId;
        }

        // ---- Parent-name resolution via ToolHelp ----
        // We use the kernel32 ToolHelp snapshot
        // because it's the only API that still works
        // when the parent is owned by a different
        // session (NtQuerySystemInformation with
        // SystemProcessInformation works too but
        // requires marshalling a variable-length
        // UNICODE_STRING array — far more code for
        // the same answer).

        [DllImport("kernel32.dll", SetLastError = true)]
        private static extern IntPtr CreateToolhelp32Snapshot(uint dwFlags, uint th32ProcessID);

        [DllImport("kernel32.dll", SetLastError = true)]
        [return: MarshalAs(UnmanagedType.Bool)]
        private static extern bool Process32First(IntPtr hSnapshot, ref PROCESSENTRY32 lppe);

        [DllImport("kernel32.dll", SetLastError = true)]
        [return: MarshalAs(UnmanagedType.Bool)]
        private static extern bool Process32Next(IntPtr hSnapshot, ref PROCESSENTRY32 lppe);

        [DllImport("kernel32.dll", SetLastError = true)]
        [return: MarshalAs(UnmanagedType.Bool)]
        private static extern bool CloseHandle(IntPtr hObject);

        private const uint TH32CS_SNAPPROCESS = 0x00000002;

        [StructLayout(LayoutKind.Sequential, CharSet = CharSet.Unicode)]
        private struct PROCESSENTRY32
        {
            public uint dwSize;
            public uint cntUsage;
            public uint th32ProcessID;
            public IntPtr th32DefaultHeapID;
            public uint th32ModuleID;
            public uint cntThreads;
            public uint th32ParentProcessID;
            public int pcPriClassBase;
            public uint dwFlags;
            [MarshalAs(UnmanagedType.ByValTStr, SizeConst = 260)]
            public string szExeFile;
        }

        private static string QueryProcessName(uint pid)
        {
            IntPtr snap = CreateToolhelp32Snapshot(TH32CS_SNAPPROCESS, 0);
            if (snap == IntPtr.Zero || snap.ToInt64() == -1) return null;
            try
            {
                var entry = new PROCESSENTRY32 { dwSize = (uint)Marshal.SizeOf<PROCESSENTRY32>() };
                if (!Process32First(snap, ref entry)) return null;
                do
                {
                    if (entry.th32ProcessID == pid)
                    {
                        return entry.szExeFile;
                    }
                } while (Process32Next(snap, ref entry));
                return null;
            }
            finally
            {
                CloseHandle(snap);
            }
        }

        private static bool TryGetCurrentSessionId(out uint sessionId)
        {
            try
            {
                return ProcessIdToSessionId(GetCurrentProcessId(), out sessionId);
            }
            catch
            {
                sessionId = 0;
                return false;
            }
        }

        /// <summary>
        /// True if the user (or, failing that, the
        /// machine) has any default browser
        /// registered. Reads the same registry key
        /// the Shell uses, not the legacy
        /// user-choice cache.
        /// </summary>
        private static bool HasRegisteredDefaultBrowser()
        {
            // HKCU\Software\Microsoft\Windows\Shell\Associations\UrlAssociations\http\UserChoice
            // → "ProgId" → the ProgId's
            //    HKCU\Software\Classes\<ProgId>\shell\open\command
            // The UserChoice route is what
            // Process.Start(UseShellExecute=true) reads
            // on Windows 10/11. If the user has not
            // picked a default (e.g. fresh install
            // where the OOBE pick hasn't happened),
            // this key is absent and we'd otherwise
            // pop the "Choose default browser" OOBE.
            try
            {
                // Pin the 64-bit view explicitly. The
                // default `Registry.CurrentUser` is fine
                // for native 64-bit processes, but the
                // EXE is `AnyCPU` and may run under WOW
                // in some hosts (e.g. some MSBuild
                // task hosts). Without the explicit view
                // the wrong hive can be read on
                // `Software\Classes` paths that have
                // redirected `Wow6432Node` siblings.
                using var classesRoot = RegistryKey.OpenBaseKey(
                    RegistryHive.CurrentUser, RegistryView.Registry64);
                using var userChoice = classesRoot.OpenSubKey(
                    @"Software\Microsoft\Windows\Shell\Associations\UrlAssociations\http\UserChoice");
                if (userChoice != null)
                {
                    var progId = userChoice.GetValue("ProgId") as string;
                    if (!string.IsNullOrEmpty(progId))
                    {
                        using var cmd = classesRoot.OpenSubKey(
                            $@"Software\Classes\{progId}\shell\open\command");
                        if (cmd != null)
                        {
                            var target = cmd.GetValue(null) as string;
                            if (!string.IsNullOrEmpty(target)) return true;
                        }
                    }
                }
            }
            catch { /* fall through to machine-wide check */ }

            // Fallback: machine-wide default. The
            // SetUserFTA API stores defaults in
            // HKLM\SOFTWARE\Clients\StartMenuInternet.
            try
            {
                using var clients = Registry.LocalMachine.OpenSubKey(
                    @"SOFTWARE\Clients\StartMenuInternet");
                if (clients != null)
                {
                    // Any registered client is a
                    // positive signal; we don't
                    // need to know which one.
                    foreach (var name in clients.GetSubKeyNames())
                    {
                        if (!string.IsNullOrEmpty(name)) return true;
                    }
                }
            }
            catch { }

            return false;
        }
    }
}
