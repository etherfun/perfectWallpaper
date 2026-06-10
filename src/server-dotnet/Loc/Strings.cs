using System;
using System.Collections.Generic;
using System.Globalization;
using System.IO;
using System.Reflection;
using System.Xml.Linq;

namespace PerfectWall.Server.Loc
{
    /// <summary>
    /// Localized string accessor for the .NET sidecar's
    /// GUI / console / setup-page surfaces. Independent
    /// from the Wallpaper Engine frontend
    /// (<c>source/i18n/*.json</c>) — the project rule is
    /// "GUI i18n must not be mixed with the HTML i18n",
    /// so we use our own .resx bundle under
    /// <c>src/server-dotnet/Loc/</c>.
    ///
    /// <para>
    /// Resolution order for a key:
    /// </para>
    /// <list type="number">
    ///   <item><description>
    ///     requested culture (e.g. <c>zh-CN</c>)
    ///   </description></item>
    ///   <item><description>
    ///     parent culture (e.g. <c>zh</c>) — declared in
    ///     <see cref="FallbackCultures"/>
    ///   </description></item>
    ///   <item><description>
    ///     invariant (English, <c>Strings.resx</c>)
    ///   </description></item>
    /// </list>
    ///
    /// <para>
    /// <b>Why we read .resx with ResXResourceReader instead
    /// of ResourceManager.CreateFileBasedResourceManager:</b>
    /// the file-based resource manager only loads compiled
    /// binary <c>.resources</c> files, NOT <c>.resx</c>
    /// (XML) source files. MSBuild with our csproj
    /// configuration does not produce binary
    /// <c>.resources</c> next to the EXE, so the legacy
    /// implementation silently fell through to the
    /// invariant. ResXResourceReader is happy with the XML
    /// source, which means a translator can drop a new
    /// <c>Strings.&lt;culture&gt;.resx</c> in <c>dist/Loc/</c>
    /// and it Just Works on the next EXE restart, no
    /// rebuild required.
    /// </para>
    /// </summary>
    public static class Strings
    {
        /// <summary>
        /// Invariant (default / English) culture name.
        /// The bare <see cref="ResourceManager"/> already
        /// falls back to the invariant when a key is
        /// missing in the requested culture, so we don't
        /// need to do anything special — we just
        /// guarantee that <c>Strings.resx</c> is the
        /// "neutral" entry point.
        /// </summary>
        public const string DefaultCulture = "en-US";

        /// <summary>
        /// Cultures the server ships translations for.
        /// <see cref="Get"/> will use this list both for
        /// direct lookup and to short-circuit obviously
        /// unsupported requests (e.g. someone asks for
        /// <c>ja-JP</c> → fall straight through to the
        /// invariant rather than thrashing the fallback
        /// chain).
        /// </summary>
        public static readonly string[] SupportedCultures = { "en-US", "zh-CN" };

        /// <summary>
        /// Parent cultures used when the requested
        /// culture is not present. <c>zh-CN</c> falls
        /// back to <c>zh</c>; <c>zh-Hans</c> is the
        /// modern BCP-47 tag, also accepted. We don't
        /// ship a <c>zh.resx</c> right now — that's a
        /// future task — but registering the names here
        /// means a future translator can drop in
        /// <c>Strings.zh.resx</c> and the lookup just
        /// works.
        /// </summary>
        public static readonly string[] FallbackCultures = { "zh-Hans", "zh" };

        // ResX files cache: dictionary keyed by culture
        // name, value is the parsed key→value map. The
        // .resx is read on first access and kept in
        // memory; the GUI renders only on language
        // change or state refresh, so this stays
        // cheap.
        private static readonly Dictionary<string, Dictionary<string, string>> _cache
            = new Dictionary<string, Dictionary<string, string>>(StringComparer.OrdinalIgnoreCase);
        private static readonly object _cacheLock = new object();
        private static string _locDir;

        /// <summary>
        /// Look up <paramref name="key"/> in the resource
        /// bundle for <paramref name="cultureName"/>.
        /// Returns <paramref name="fallback"/> if the key
        /// is missing in every supported culture. Never
        /// throws — a missing key in a missing-culture
        /// scenario is a legitimate outcome (we want the
        /// default English text to surface, not a
        /// 500-style exception in the GUI).
        /// </summary>
        public static string Get(string key, string cultureName, string fallback = null)
        {
            if (string.IsNullOrEmpty(key)) return fallback ?? string.Empty;
            try
            {
                var ci = ResolveCulture(cultureName);
                var bag = LoadResx(ci.Name);
                if (bag != null && bag.TryGetValue(key, out var v) && !string.IsNullOrEmpty(v))
                {
                    return v;
                }
                // If the requested culture didn't have the
                // key, fall through to the invariant
                // (Strings.resx in dist/Loc/) — the source
                // bundle always carries every key.
                var inv = LoadResx(string.Empty);
                if (inv != null && inv.TryGetValue(key, out var v2) && !string.IsNullOrEmpty(v2))
                {
                    return v2;
                }
            }
            catch
            {
                // Missing file, malformed XML, etc. Fall
                // through to fallback string. The user
                // seeing the English default is the
                // designed behaviour when the resource is
                // unavailable.
            }
            return fallback ?? "[" + key + "]";
        }

        /// <summary>
        /// Resolve <paramref name="name"/> to a real
        /// <see cref="CultureInfo"/>, honouring the
        /// supported-cultures whitelist and parent-culture
        /// fallback. Returns invariant when nothing
        /// matches.
        /// </summary>
        public static CultureInfo ResolveCulture(string name)
        {
            if (string.IsNullOrWhiteSpace(name)) return CultureInfo.InvariantCulture;
            try
            {
                var ci = new CultureInfo(name);
                // Exact match (case-insensitive)
                foreach (var s in SupportedCultures)
                {
                    if (string.Equals(s, ci.Name, StringComparison.OrdinalIgnoreCase))
                    {
                        return CultureInfo.GetCultureInfo(s);
                    }
                }
                // Parent match
                var parent = ci.Parent;
                while (parent != null && parent.Name != string.Empty)
                {
                    foreach (var s in SupportedCultures)
                    {
                        if (string.Equals(s, parent.Name, StringComparison.OrdinalIgnoreCase))
                        {
                            return CultureInfo.GetCultureInfo(s);
                        }
                    }
                    foreach (var s in FallbackCultures)
                    {
                        if (string.Equals(s, parent.Name, StringComparison.OrdinalIgnoreCase))
                        {
                            return CultureInfo.GetCultureInfo(s);
                        }
                    }
                    parent = parent.Parent;
                }
            }
            catch
            {
                // Bad culture name; fall through.
            }
            return CultureInfo.InvariantCulture;
        }

        /// <summary>
        /// Return the active UI culture as resolved by
        /// <see cref="ResolveCulture"/>. Used by the GUI
        /// chrome and the console fallback to pick their
        /// initial language.
        /// </summary>
        public static string CurrentCultureName()
        {
            return ResolveCulture(CultureInfo.CurrentUICulture.Name).Name;
        }

        /// <summary>
        /// Serialize the entire bundle (every supported
        /// culture, every key) as a flat
        /// <c>{ culture: { key: value, ... }, ... }</c>
        /// JSON object. Used by debug tooling and unit
        /// tests to verify the .resx files round-trip
        /// cleanly. The HTML setup page is intentionally
        /// English-only — its i18n lives in the Wallpaper
        /// Engine frontend's <c>source/i18n/*.json</c>
        /// pipeline, not here.
        /// </summary>
        public static Dictionary<string, Dictionary<string, string>> DumpAll()
        {
            var result = new Dictionary<string, Dictionary<string, string>>();
            // Always include the invariant (default
            // English) bag first.
            result[string.Empty] = LoadResx(string.Empty) ?? new Dictionary<string, string>();
            foreach (var culture in SupportedCultures)
            {
                var bag = LoadResx(culture);
                if (bag != null) result[culture] = bag;
            }
            return result;
        }

        // -----------------------------------------------------------------
        //  Internals: .resx loading
        // -----------------------------------------------------------------

        /// <summary>
        /// Locate the <c>Loc/</c> directory that holds
        /// the .resx files. Search order:
        /// <list type="number">
        ///   <item><description>
        ///     <c>&lt;exe&gt;/Loc/</c> — where
        ///     build-dotnet.ps1 mirrors the bundle next
        ///     to perfectwall-server.exe.
        ///   </description></item>
        ///   <item><description>
        ///     <c>&lt;exe&gt;/../src/server-dotnet/Loc/</c>
        ///     — for running the EXE straight from
        ///     <c>build/</c> in dev.
        ///   </description></item>
        ///   <item><description>
        ///     <c>&lt;cwd&gt;/Loc/</c> — last-ditch.
        ///   </description></item>
        /// </list>
        /// </summary>
        private static string LocateLocDirectory()
        {
            if (!string.IsNullOrEmpty(_locDir)) return _locDir;
            var exe = Assembly.GetExecutingAssembly().Location;
            if (!string.IsNullOrEmpty(exe))
            {
                var dir = Path.Combine(Path.GetDirectoryName(exe), "Loc");
                if (File.Exists(Path.Combine(dir, "Strings.resx"))) { _locDir = dir; return _locDir; }
            }
            if (!string.IsNullOrEmpty(exe))
            {
                var dir = Path.Combine(Path.GetDirectoryName(exe), "..", "src", "server-dotnet", "Loc");
                if (File.Exists(Path.Combine(dir, "Strings.resx"))) { _locDir = dir; return _locDir; }
            }
            var cwd = Environment.CurrentDirectory;
            var dir3 = Path.Combine(cwd, "Loc");
            if (File.Exists(Path.Combine(dir3, "Strings.resx"))) { _locDir = dir3; return _locDir; }
            // Last-ditch: return cwd. The caller will
            // get a missing-file error from
            // ResXResourceReader and Get() falls through
            // to the fallback string.
            _locDir = cwd;
            return _locDir;
        }

        /// <summary>
        /// Load and parse the .resx file for
        /// <paramref name="cultureName"/>. Empty string
        /// is the invariant (<c>Strings.resx</c>). The
        /// result is cached in <see cref="_cache"/>; on
        /// the first call after process start the file
        /// is parsed once, every subsequent call is a
        /// dictionary lookup.
        /// </summary>
        private static Dictionary<string, string> LoadResx(string cultureName)
        {
            lock (_cacheLock)
            {
                if (_cache.TryGetValue(cultureName, out var hit))
                {
                    return hit;
                }
            }
            var dir = LocateLocDirectory();
            var fileName = string.IsNullOrEmpty(cultureName)
                ? "Strings.resx"
                : "Strings." + cultureName + ".resx";
            var path = Path.Combine(dir, fileName);
            if (!File.Exists(path))
            {
                // Cache the negative result too so we
                // don't hammer the FS on every GUI repaint.
                lock (_cacheLock) _cache[cultureName] = null;
                return null;
            }
            Dictionary<string, string> bag = null;
            try
            {
                // Parse the .resx XML with XDocument rather than
                // ResXResourceReader. The original used
                // ResXResourceReader because it ships in
                // System.Windows.Forms and supports the full
                // .resx type system (mime types, file refs, etc.).
                // We don't need any of that — every <data> entry
                // in this project is a plain string — so the
                // ~15-line LINQ-to-XML walk below is enough and
                // lets us drop the WinForms dependency entirely.
                var doc = XDocument.Load(path);
                bag = new Dictionary<string, string>(StringComparer.Ordinal);
                foreach (var data in doc.Descendants("data"))
                {
                    var key = data.Attribute("name")?.Value;
                    if (string.IsNullOrEmpty(key)) continue;
                    var val = data.Element("value")?.Value;
                    bag[key] = val;
                }
            }
            catch
            {
                bag = null;
            }
            lock (_cacheLock) _cache[cultureName] = bag;
            return bag;
        }
    }
}
