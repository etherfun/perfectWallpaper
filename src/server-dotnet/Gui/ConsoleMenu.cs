using System;
using System.Globalization;
using System.Threading;
using PerfectWall.Server.Endpoints;
using PerfectWall.Server.Loc;
using PerfectWall.Server.Models;
using PerfectWall.Server.Services;

namespace PerfectWall.Server.Gui
{
    /// <summary>
    /// Fallback for users who can't or don't want to use the
    /// WinForms setup window. A background thread watches
    /// stdin; on every keypress, if the user types <c>s</c> or
    /// <c>S</c> we synchronously read the latest state, render
    /// a textual dashboard, and accept a follow-up command.
    ///
    /// The menu is only useful when stdin is a real terminal
    /// (not redirected). In redirected / piped mode (e.g.
    /// when the EXE is launched headless by wallpaper64) we
    /// bail out silently so we don't print noise into the
    /// parent process's pipes.
    ///
    /// <para>
    /// All visible strings come from <see cref="Strings"/>
    /// (the same .resx bundle that drives the WinForms
    /// <see cref="SetupWindow"/>). The active culture is
    /// picked from <see cref="Strings.CurrentCultureName"/>
    /// on every <c>S</c> keypress, so the menu follows
    /// the OS / process UI culture without a runtime API.
    /// </para>
    /// </summary>
    public static class ConsoleMenu
    {
        public static Thread StartInBackground(ConsoleColor original)
        {
            var t = new Thread(() => Loop(original))
            {
                IsBackground = true,
                Name = "PerfectWall.ConsoleMenu"
            };
            t.Start();
            return t;
        }

        private static void Loop(ConsoleColor original)
        {
            try
            {
                // If stdout is redirected, Console.IsInputRedirected
                // is true and we'd deadlock. Bail.
                if (Console.IsInputRedirected || Console.IsOutputRedirected) return;
            }
            catch (Exception ex)
            {
                try { Console.Error.WriteLine($"[ConsoleMenu] Error: {ex.Message}"); } catch { }
                return;
            }

            try
            {
                while (true)
                {
                    if (!Console.KeyAvailable)
                    {
                        Thread.Sleep(200);
                        continue;
                    }
                    var key = Console.ReadKey(intercept: true);
                    if (key.KeyChar != 's' && key.KeyChar != 'S') continue;
                    RunOnce(original);
                }
            }
            catch (Exception ex)
            {
                try { Console.Error.WriteLine($"[ConsoleMenu] Console closed: {ex.Message}"); } catch { }
                // Console closed (Ctrl+C, parent process died) — exit.
            }
        }

        /// <summary>
        /// Render the menu once and accept one command. Public
        /// so <c>--setup-cli</c> can call us synchronously.
        /// </summary>
        public static void RunOnce(ConsoleColor original)
        {
            // Re-read the UI culture on every render so the
            // menu follows the process's CurrentUICulture
            // (which can flip if a later flow calls
            // CultureInfo.CurrentUICulture = ... — e.g. a
            // future --lang CLI flag).
            var culture = Strings.CurrentCultureName();
            var state = SetupService.Inspect();
            Console.WriteLine();
            Console.WriteLine(Strings.Get("Console_MenuTitle", culture));
            Console.WriteLine(string.Format(Strings.Get("Console_PortLabel", culture), state.Config.Port));
            Console.WriteLine(string.Format(Strings.Get("Console_ElevatedLabel", culture), state.IsElevated));
            Console.WriteLine(string.Format(
                Strings.Get("Console_UserAutoStartLabel", culture),
                state.AutoStartUserRegistered
                    ? Strings.Get("Console_Enabled", culture)
                    : Strings.Get("Console_Disabled", culture)));
            Console.WriteLine(string.Format(
                Strings.Get("Console_AdminAutoStartLabel", culture),
                state.AutoStartAdminRegistered
                    ? Strings.Get("Console_Enabled", culture)
                    : Strings.Get("Console_Disabled", culture)));
            Console.WriteLine(string.Format(
                Strings.Get("Console_PawnioLabel", culture),
                state.PawnioInstalled
                    ? string.Format(Strings.Get("Console_PawnioInstalledFormat", culture), state.PawnioVersion ?? "?")
                    : Strings.Get("Console_PawnioNotInstalled", culture)));
            if (!state.PawnioInstalled)
            {
                Console.WriteLine(Strings.Get("Console_PawnioLhmHint", culture));
            }
            Console.WriteLine();
            Console.WriteLine(Strings.Get("Console_ChoicePort", culture));
            Console.WriteLine(Strings.Get("Console_ChoiceUser", culture));
            Console.WriteLine(Strings.Get("Console_ChoiceAdmin", culture) +
                (state.IsElevated ? string.Empty : Strings.Get("Console_ChoiceAdminNeedsElevation", culture)));
            Console.WriteLine(Strings.Get("Console_ChoicePawnio", culture));
            Console.WriteLine(Strings.Get("Console_ChoiceQuit", culture));
            Console.Write(Strings.Get("Console_Prompt", culture));
            var line = Console.ReadLine();
            if (line == null) return;
            line = line.Trim().ToLowerInvariant();
            try
            {
                switch (line)
                {
                    case "p":
                        ChangePort(culture);
                        break;
                    case "u":
                        SetupService.SetAutoStartUser(!state.AutoStartUserRegistered);
                        Console.WriteLine(string.Format(
                            Strings.Get("Console_UserAutoStartUpdated", culture),
                            SetupService.IsAutoStartUserRegistered()
                                ? Strings.Get("Console_Enabled", culture)
                                : Strings.Get("Console_Disabled", culture)));
                        break;
                    case "a":
                        if (!state.IsElevated)
                        {
                            Console.WriteLine(Strings.Get("Console_NeedElevationForAdmin", culture));
                            return;
                        }
                        SetupService.SetAutoStartAdminViaTaskScheduler(System.Reflection.Assembly.GetExecutingAssembly().Location);
                        Console.WriteLine(string.Format(
                            Strings.Get("Console_AdminAutoStartUpdated", culture),
                            SetupService.IsAutoStartAdminRegisteredViaTaskScheduler()
                                ? Strings.Get("Console_Enabled", culture)
                                : Strings.Get("Console_Disabled", culture)));
                        break;
                    case "o":
                        SetupService.OpenPawnioReleasesPage();
                        Console.WriteLine(Strings.Get("Console_PawnioOpened", culture));
                        break;
                    case "q":
                    case "":
                        return;
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine(string.Format(Strings.Get("Console_ActionFailed", culture), ex.Message));
            }
        }

        private static void ChangePort(string culture)
        {
            Console.Write(Strings.Get("Console_PortPrompt", culture));
            var line = Console.ReadLine();
            if (string.IsNullOrWhiteSpace(line)) return;
            if (!int.TryParse(line.Trim(), NumberStyles.Integer, CultureInfo.InvariantCulture, out var p))
            {
                Console.WriteLine(Strings.Get("Console_PortInvalid", culture));
                return;
            }
            // Reuse the same bounds check as /api/config and
            // /api/setup so the three entry points can never
            // drift. Without this gate the user could write
            // a malformed port number to server-config.json
            // and the listener would refuse to bind on the
            // next launch.
            var portErr = ServerConfig.ValidatePort(p);
            if (portErr != null)
            {
                Console.WriteLine(string.Format(Strings.Get("Console_PortInvalid", culture), portErr));
                return;
            }
            var cfg = ServerConfig.Load();
            // Skip the restart if the user typed the same
            // number they already had. Restarting on a no-op
            // is a 800 ms service outage for nothing and
            // can confuse the user ("why did it bounce
            // when I didn't change anything?").
            if (cfg.Port == p)
            {
                Console.WriteLine(Strings.Get("Console_PortSaved", culture));
                return;
            }
            cfg.Port = p;
            cfg.Save();
            Console.WriteLine(Strings.Get("Console_PortSaved", culture));
            // The HTTP listener is bound to the old port
            // and can't be rebound in-process on .NET
            // Framework's HttpListener. Kick off the same
            // self-restart path /api/setup set_port uses so
            // the change actually takes effect — otherwise
            // the user would see "Port saved" but the
            // listener would still be on the old port until
            // they manually restarted the EXE.
            SetupEndpoints.TriggerSelfRestart();
        }
    }
}
