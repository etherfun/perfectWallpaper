// Costura.Fody's transitive dependency graph pulls in the
// 4.0.1.0 NuGet build of RuntimeInformation, which collides
// with the mscorlib 4.0.0.0 type. Reference the BCL types
// by their fully-qualified name at each use site and do NOT
// `using` the namespace.
using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Security.Principal;

namespace PerfectWall.Server.Utils
{
    /// <summary>
    /// Detects whether the current process is elevated. Used by
    /// the CLI to decide whether <c>--admin</c> can succeed.
    /// </summary>
    public static class ElevationHelper
    {
        /// <summary>
        /// <c>true</c> when the process token is in the local
        /// Administrators group with the elevated role active.
        /// On non-Windows or when the SID lookup fails this
        /// returns <c>false</c>.
        /// </summary>
        public static bool IsElevated()
        {
            if (Environment.OSVersion.Platform != PlatformID.Win32NT)
                return false;
            try
            {
                using var identity = WindowsIdentity.GetCurrent();
                var principal = new WindowsPrincipal(identity);
                return principal.IsInRole(WindowsBuiltInRole.Administrator);
            }
            catch
            {
                return false;
            }
        }

        /// <summary>
        /// Re-launch the current executable with the
        /// <c>runas</c> verb, requesting elevation. Returns the
        /// PID of the spawned process. <c>0</c> on failure.
        /// </summary>
        public static int RelaunchElevated(string[] args)
        {
            if (Environment.OSVersion.Platform != PlatformID.Win32NT) return 0;
            try
            {
                // .NET Framework 4.8 doesn't have
                // Environment.ProcessPath. The MainModule path
                // is the most reliable way to get the actual
                // .exe (not the shadow-copy DLL) on the
                // framework target.
                string exe = null;
                try { exe = Process.GetCurrentProcess().MainModule?.FileName; } catch { }
                if (string.IsNullOrEmpty(exe))
                {
                    // Last-ditch fallback: assume the exe lives
                    // next to the running assembly (true for
                    // both `dotnet build` outputs and
                    // xcopy deployments).
                    var loc = System.Reflection.Assembly.GetExecutingAssembly().Location;
                    var dir = System.IO.Path.GetDirectoryName(loc);
                    exe = System.IO.Path.Combine(dir ?? string.Empty, "perfectwall-server.exe");
                }
                if (string.IsNullOrEmpty(exe) || !System.IO.File.Exists(exe)) return 0;

                var psi = new ProcessStartInfo
                {
                    FileName = exe,
                    UseShellExecute = true,
                    Verb = "runas",
                };
                // Filter out the --admin flag from the args we
                // forward so the new process doesn't loop
                // through RelaunchElevated again.
                var forwarded = new List<string>();
                bool skipNext = false;
                foreach (var a in args)
                {
                    if (skipNext) { skipNext = false; continue; }
                    if (a == "--admin" || a == "--user") continue;
                    if (a == "--port" || a == "-p") { skipNext = true; continue; }
                    forwarded.Add(a);
                }
                psi.Arguments = string.Join(" ", forwarded);
                var p = Process.Start(psi);
                return p?.Id ?? 0;
            }
            catch
            {
                return 0;
            }
        }
    }
}
