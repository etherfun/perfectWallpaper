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
        // When true, AutoStart is registered under HKLM
        // (which requires the process to be elevated at the
        // time of registration) so the OS launches the
        // server with admin rights on login.  When false,
        // AutoStart is registered under HKCU and the server
        // runs unprivileged.  Both can be true simultaneously
        // if the user wants a "regular" HKCU entry for normal
        // use and a separate "admin" HKLM shortcut they trigger
        // manually.
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
            try { defaults.Save(); } catch { /* best effort */ }
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
            return null;
        }
    }
}
