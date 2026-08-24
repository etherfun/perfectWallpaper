using System;
using System.IO;
using Newtonsoft.Json;

namespace PerfectWall.Server.Models
{
    /// <summary>
    /// Server configuration, persisted to <c>server-config.json</c>
    /// next to the executable. Matches the Rust
    /// <c>ServerConfig</c> shape so we can re-use the same file
    /// if anyone swaps the binary in and out.
    /// </summary>
    public sealed class ServerConfig
    {
        [JsonProperty("port")] public int Port { get; set; } = 27420;
        [JsonProperty("auto_start")] public bool AutoStart { get; set; } = false;
        // User-mode auto-start: when enabled, the server is
        // launched at this user's logon via an HKCU\…\Run
        // entry and runs unprivileged (no temperature / fan
        // data).  Admin-mode auto-start (see AutoStartAdmin)
        // instead registers a Task Scheduler task that fires
        // ONLOGON with highest privileges.  Both fire at the
        // SAME user's logon, so they are mutually exclusive —
        // enabling one removes the other (see SetupService) to
        // avoid launching the server twice.  This field is a
        // persisted preference only; the live state is read
        // from the OS (HKCU entry / Task Scheduler task).
        [JsonProperty("auto_start_admin")] public bool AutoStartAdmin { get; set; } = false;
        [JsonProperty("log_level")] public string LogLevel { get; set; } = "info";
        // UI language override. Empty string means
        // "follow the OS" (CultureInfo.CurrentUICulture).
        // Set to a supported culture name (e.g. "zh-CN",
        // "en-US") to force a specific language for the
        // setup window and console menu. The WinForms
        // language picker writes this field on every
        // selection change and saves the config so the
        // choice survives EXE restarts. See
        // Loc/Strings.SupportedCultures for the list of
        // currently recognised values.
        [JsonProperty("lang")] public string Lang { get; set; } = "";
        // When true, the setup page auto-opens on the
        // first launch. After the first launch this is
        // set to false so subsequent launches skip the
        // auto-open. The user can still open setup via
        // the console menu ('s') or the dockbar.
        [JsonProperty("first_launch")] public bool FirstLaunch { get; set; } = true;

        public static string ConfigPath
        {
            get
            {
                var exe = System.Reflection.Assembly.GetExecutingAssembly().Location;
                var dir = Path.GetDirectoryName(exe) ?? AppDomain.CurrentDomain.BaseDirectory;
                return Path.Combine(dir, "server-config.json");
            }
        }

        public static ServerConfig Load()
        {
            var path = ConfigPath;
            if (File.Exists(path))
            {
                try
                {
                    var text = File.ReadAllText(path);
                    var parsed = JsonConvert.DeserializeObject<ServerConfig>(text);
                    if (parsed != null) return parsed;
                }
                catch (Exception ex)
                {
                    Console.Error.WriteLine($"[Config] Failed to parse config: {ex.Message}, using defaults");
                }
            }
            var defaults = new ServerConfig();
            try
            {
                if (File.Exists(path))
                {
                    var bak = path + ".bak";
                    if (File.Exists(bak)) File.Delete(bak);
                    File.Move(path, bak);
                }
                defaults.Save();
            }
            catch { /* best effort */ }
            return defaults;
        }

        public void Save()
        {
            var path = ConfigPath;
            Directory.CreateDirectory(Path.GetDirectoryName(path) ?? ".");
            File.WriteAllText(path, JsonConvert.SerializeObject(this, Formatting.Indented));
        }

        public string Validate()
        {
            if (Port < 1024) return "Port must be >= 1024";
            if (Port > 65535) return "Port must be <= 65535";
            return null;
        }

        // Shared validator used by /api/config (POST),
        // /api/setup (set_port) and the console menu. Keeps the
        // 1024-65535 bounds in one place so the three entry
        // points can never drift.
        public const int MinPort = 1024;
        public const int MaxPort = 65535;

        public static string ValidatePort(int port)
        {
            if (port < MinPort) return $"Port must be >= {MinPort}";
            if (port > MaxPort) return $"Port must be <= {MaxPort}";
            return null;
        }
    }
}
