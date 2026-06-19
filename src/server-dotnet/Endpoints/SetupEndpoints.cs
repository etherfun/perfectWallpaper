using System;
using System.Linq;
using System.Threading.Tasks;
using Newtonsoft.Json;
using PerfectWall.Server.Loc;
using PerfectWall.Server.Models;
using PerfectWall.Server.Server;
using PerfectWall.Server.Services;

namespace PerfectWall.Server.Endpoints
{
    /// <summary>
    /// Three endpoints that drive the setup UI:
    /// <list type="bullet">
    ///   <item><description>
    ///     <c>GET  /setup</c>  — the WinForms setup window will
    ///     load this page in a <c>WebBrowser</c> control. We
    ///     ship a single-file HTML (no external assets) so the
    ///     Costura-embedded EXE has zero network dependency.
    ///   </description></item>
    ///   <item><description>
    ///     <c>GET  /api/setup</c>  — current state (port,
    ///     auto-start, PawnIO, elevation). The response also
    ///     carries the active language and a flat
    ///     <c>strings</c> dictionary so the embedded JS can
    ///     re-paint dynamic text in the user's language.
    ///   </description></item>
    ///   <item><description>
    ///     <c>POST /api/setup</c>  — apply a settings change
    ///     (port / auto-start toggles / language). Returns the
    ///     new state on success so the UI can refresh without
    ///     a follow-up GET.
    ///   </description></item>
    /// </list>
    ///
    /// <para>
    /// The HTML page used to be English-only on disk. It is
    /// now server-templated: every user-visible label is a
    /// <c>{{Api_*}}</c> placeholder substituted at request
    /// time from <see cref="Loc.Strings"/>. The user's
    /// language is read from <c>ServerConfig.Lang</c>
    /// (set by <c>Program.ApplyLangPreference</c>) with
    /// <c>CultureInfo.CurrentUICulture</c> as the fallback.
    /// The Wallpaper Engine frontend still owns its own i18n
    /// pipeline (<c>source/i18n/*.json</c>); the keys here
    /// are the .NET sidecar's chrome / admin / console
    /// strings and live in
    /// <c>src/server-dotnet/Loc/Strings.resx</c>.
    /// </para>
    /// </summary>
    public static class SetupEndpoints
    {
        // Set to 1 the moment a SelfRestart is scheduled.
        // Subsequent handlers see this and return a 503
        // instead of touching config state or talking to
        // LHM — the process is about to exit, so any
        // work they do is wasted (and any state mutation
        // they perform is racy with the new EXE that
        // takes over the port). Interlocked because the
        // race is across HTTP request threads, the
        // SelfRestart background thread, and the
        // ConsoleMenu thread.
        private static int _restartScheduled = 0;
        private static bool IsRestartScheduled => System.Threading.Interlocked.CompareExchange(ref _restartScheduled, 0, 0) == 1;

        // How long SelfRestart waits between writing the
        // response and spawning the new EXE. Long enough
        // for the client to receive the JSON, short enough
        // that the user doesn't see a "hanging" page.
        private const int SelfRestartDelayMs = 800;

        public static void Map(
            Router router,
            Func<ServerConfig> configGetter,
            Action<ServerConfig> configSetter,
            Func<HardwareMonitorService.RunMode> runModeGetter)
        {
            // GetSetupPage needs the active ServerConfig to pick
            // the right Strings.* bundle. Plumb configGetter
            // through; the JS-side strings dictionary is rebuilt
            // by GetState on every refresh tick. The run mode
            // getter is read by Inspect() to surface the
            // diagnostics card truthfully.
            router.Get("/setup", ctx => GetSetupPage(ctx, configGetter, runModeGetter));
            router.Get("/api/setup", ctx => GetState(ctx, configGetter, runModeGetter));
            router.Post("/api/setup", ctx => Update(ctx, configGetter, configSetter, runModeGetter));
        }

        // -----------------------------------------------------------------
        //  GET /setup — the embedded HTML page
        // -----------------------------------------------------------------

        private static async Task GetSetupPage(
            HttpContext ctx,
            Func<ServerConfig> configGetter,
            Func<HardwareMonitorService.RunMode> runModeGetter)
        {
            if (IsRestartScheduled)
            {
                // We're in the middle of self-restarting.
                // The current process is on its way out;
                // any further work is wasted. Tell the
                // client to retry the new port.
                await ctx.WriteJsonAsync(new
                {
                    success = false,
                    error = "server is restarting; retry shortly"
                }, 503);
                return;
            }
            // We build the page as a constant string instead
            // of an embedded resource so the WinForms setup
            // window can load it via a `WebBrowser.DocumentText`
            // call without needing a custom resource resolver.
            var cfg = configGetter();
            var culture = ResolveCurrentCultureName(cfg);
            var strings = BuildStrings(culture, cfg.Port);
            var html = ApplyPlaceholders(BuildSetupHtml(), strings);
            await ctx.WriteTextAsync(html, "text/html; charset=utf-8");
        }

        private static string BuildSetupHtml()
        {
            // Single-quoted attribute strings; no <script>
            // tags — we use document.write + an XMLHttpRequest
            // to keep this page immune to embedded-script
            // blocks in C# string literals. CSP-friendly.
            //
            // Every user-visible label is a {{Api_*}}
            // placeholder. ApplyPlaceholders() swaps them
            // out at request time from BuildStrings(). Adding
            // a new label = (1) add the data row in
            // Strings.resx + Strings.zh-CN.resx, (2) add the
            // key to BuildStrings(), (3) drop a {{Api_Key}}
            // token in this template. That's it.
            return @"<!doctype html>
<html lang='{{Api_HtmlLang}}'>
<head>
<meta charset='utf-8'>
<title>{{Api_PageTitle}}</title>
<style>
body { font-family: 'Segoe UI', system-ui, sans-serif; background: #1a1a1a; color: #e0e0e0; margin: 0; padding: 24px; }
h1 { font-weight: 300; font-size: 18px; margin: 0 0 24px 0; color: #fff; }
h1 small { color: #888; font-size: 12px; margin-left: 12px; }
/* CSS multi-column layout: cards flow top-to-bottom
   in each column with no row-height constraint, so
   a short card (e.g. the Language picker with two
   buttons) is immediately followed by the next
   card in the same column, not left waiting at
   the bottom of a row sized by the tallest
   neighbour. This is the Pinterest masonry look:
   the browser does the column packing and we get
   a tight, gap-free layout for free.

   The HTML order is column-major, not row-major —
   1.1 / 1.2 stack in column 1, 2.1 / 2.2 stack
   in column 2. The original page used a CSS Grid
   (row-major) with `align-self: start`; that
   preserved the source order but left a vertical
   gap below any short card because the row was
   sized by the tallest neighbour. The user
   preferred the column-pack look, accepting the
   order change. `break-inside: avoid` keeps a
   single card from being split across the bottom
   of one column and the top of the next. The
   narrow-window media query collapses to a single
   column on phones where two columns would be
   unreadable. */
.grid { column-count: 2; column-gap: 12px; width: 100%; }
@media (max-width: 640px) {
  .grid { column-count: 1; }
}
.card { background: #262626; border: 1px solid #333; border-radius: 6px; padding: 16px; width: 100%; box-sizing: border-box; break-inside: avoid; margin-bottom: 12px; }
.card .label { font-size: 11px; color: #888; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 6px; }
.card .value { font-size: 24px; font-weight: 500; color: #fff; }
.card .sub { font-size: 11px; color: #888; margin-top: 4px; white-space: pre-line; overflow-wrap: anywhere; }
.card.ok { border-left: 3px solid #4caf50; }
.card.warn { border-left: 3px solid #ff9800; }
.card.bad { border-left: 3px solid #f44336; }
.row { display: flex; gap: 8px; align-items: center; margin-top: 12px; }
input[type='text'] { background: #1a1a1a; color: #fff; border: 1px solid #444; border-radius: 3px; padding: 4px 8px; width: 100px; }
button { background: #0d6efd; color: #fff; border: 0; border-radius: 3px; padding: 6px 12px; cursor: pointer; font-size: 12px; }
button:disabled { background: #555; cursor: not-allowed; }
button.danger { background: #b71c1c; }
button.secondary { background: #444; }
button.lang-active { background: #4caf50; cursor: default; }
.status { font-size: 12px; color: #888; margin-left: 8px; }
/* Wide variant for the diagnostics card. With
   CSS multi-column layout, `column-span: all`
   takes the card out of the column flow and
   makes it span the full row width. After a
   spanning element the column flow restarts on
   the next row. margin-top: 12px gives the same
   vertical breathing room the regular cards get
   (their `margin-bottom: 12px` produces the
   gap above the next card; column-spanning
   elements don't pick up the same gap because
   they sit outside the column flow). The
   margin-bottom: 0 override is kept so a wide
   card at the very end of the page doesn't
   leave a trailing 12px gap of empty space. */
.card-wide { column-span: all; margin-top: 12px; margin-bottom: 0; }
.diag { width: 100%; border-collapse: collapse; font-size: 12px; margin-top: 8px; }
.diag td { padding: 8px 0; vertical-align: top; }
.diag td:first-child { color: #888; width: 140px; padding-right: 16px; white-space: nowrap; }
.diag td:last-child { color: #fff; word-break: break-all; }
</style>
</head>
<body>
<h1>{{Api_PageTitle}} <small id='ver'></small></h1>
<div class='grid'>
  <div class='card' id='card-port'>
    <div class='label'>{{Api_LabelPort}}</div>
    <div class='value' id='port'>—</div>
    <div class='sub' id='port-sub'></div>
    <div class='row'>
      <input type='text' id='port-input' placeholder='{{Api_PortInputPlaceholder}}' value='{{Api_PortCurrent}}'>
      <button onclick='savePort()'>{{Api_BtnSave}}</button>
      <span class='status' id='port-status'></span>
    </div>
  </div>
  <div class='card' id='card-autostart-user'>
    <div class='label'>{{Api_LabelUserAutoStart}}</div>
    <div class='value' id='autostart-user'>—</div>
    <div class='sub'>{{Api_SubUserAutoStart}}</div>
    <div class='row'>
      <button id='autostart-user-btn' onclick='toggleAutoStartUser()'>{{Api_BtnToggle}}</button>
    </div>
  </div>
  <div class='card' id='card-autostart-admin'>
    <div class='label'>{{Api_LabelAdminAutoStart}}</div>
    <div class='value' id='autostart-admin'>—</div>
    <div class='sub'>{{Api_SubAdminAutoStart}}</div>
    <div class='row'>
      <button id='autostart-admin-btn' onclick='toggleAutoStartAdmin()'>{{Api_BtnToggle}}</button>
    </div>
  </div>
  <div class='card' id='card-pawnio'>
    <div class='label'>{{Api_LabelPawnio}}</div>
    <div class='value' id='pawnio'>—</div>
    <div class='sub' id='pawnio-sub'></div>
    <div class='row'>
      <button class='secondary' onclick='openPawnioReleases()'>{{Api_BtnOpenPawnio}}</button>
    </div>
  </div>
  <div class='card' id='card-lang'>
    <div class='label'>{{Api_LangSwitcherLabel}}</div>
    <div class='value' id='lang-value'>—</div>
    <div class='sub' id='lang-sub'></div>
    <div class='row'>
      <button id='lang-en' class='lang-btn' onclick='setLang(""en-US"")'>{{Api_LangEn}}</button>
      <button id='lang-zh' class='lang-btn' onclick='setLang(""zh-CN"")'>{{Api_LangZhCn}}</button>
    </div>
  </div>
  <div class='card card-wide' id='card-diagnostics'>
    <div class='label'>{{Api_LabelDiagnostics}}</div>
    <table class='diag'>
      <tr><td>{{Api_LabelRunMode}}</td><td id='diag-runmode'>—</td></tr>
      <tr><td>{{Api_LabelProcessId}}</td><td id='diag-pid'>—</td></tr>
      <tr><td>{{Api_LabelExePath}}</td><td id='diag-exepath'>—</td></tr>
      <tr><td>{{Api_LabelStartTime}}</td><td id='diag-starttime'>—</td></tr>
      <tr><td>{{Api_LabelArchitecture}}</td><td id='diag-arch'>—</td></tr>
      <tr><td>{{Api_LabelDotnetVersion}}</td><td id='diag-dotnet'>—</td></tr>
    </table>
    <div class='row'>
      <button class='secondary' onclick='openConsole()'>{{Api_BtnOpenConsole}}</button>
    </div>
  </div>
</div>
<p class='status' id='elevated-note' style='margin-top: 16px;'></p>
<p class='status' id='error' style='color: #f44336; margin-top: 8px;'></p>
<script>
var I18N = {};
function t(k, fallback) { return (I18N && I18N[k]) || fallback || k; }
function fmt(k, fallback) {
  var args = Array.prototype.slice.call(arguments, 2);
  var s = t(k, fallback);
  return s.replace(/\{(\d+)\}/g, function(m, i) {
    var idx = parseInt(i, 10);
    return (idx >= 0 && idx < args.length) ? args[idx] : m;
  });
}
function http(method, body) {
  return new Promise(function(resolve, reject) {
    var xhr = new XMLHttpRequest();
    xhr.open(method, '/api/setup', true);
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.onload = function() {
      if (xhr.status >= 200 && xhr.status < 300) {
        try { resolve(JSON.parse(xhr.responseText)); } catch (e) { reject(e); }
      } else {
        try { reject(JSON.parse(xhr.responseText)); } catch (e) { reject(new Error('HTTP ' + xhr.status)); }
      }
    };
    xhr.onerror = function() { reject(new Error('network')); };
    xhr.send(body == null ? null : JSON.stringify(body));
  });
}
function savePort() {
  var v = document.getElementById('port-input').value;
  var p = parseInt(v);
  if (!(p >= 1024 && p <= 65535)) {
    document.getElementById('port-status').textContent = t('Api_InvalidPortStatus', 'Invalid port (must be 1024-65535).');
    return;
  }
  document.getElementById('port-status').textContent = t('Api_SavingStatus', 'Saving…');
  http('POST', { action: 'set_port', port: p }).then(function(resp) {
    document.getElementById('port-status').textContent = resp.message || t('Api_DefaultSaved', 'Saved.');
    // The server is restarting on the new port. Wait
    // two seconds (well past the 800ms grace) and then
    // redirect this page to the new port so the user
    // doesn't have to copy/paste.
    setTimeout(function() {
      var newUrl = window.location.protocol + '//' + window.location.hostname + ':' + p + '/setup';
      window.location = newUrl;
    }, 2000);
  }, function(err) {
    document.getElementById('port-status').textContent = fmt('Api_ActionFailedFormat', 'Failed: {0}', err.message || err);
  });
}
function toggleAutoStartUser() {
  var current = document.getElementById('autostart-user').textContent.indexOf(t('Api_Enabled', 'Enabled')) === 0;
  http('POST', { action: 'set_auto_start_user', enable: !current }).then(refresh, function(err) {
    document.getElementById('error').textContent = fmt('Api_ActionFailedFormat', 'Failed: {0}', err.message || err);
  });
}
function toggleAutoStartAdmin() {
  var current = document.getElementById('autostart-admin').textContent.indexOf(t('Api_Enabled', 'Enabled')) === 0;
  http('POST', { action: 'set_auto_start_admin', enable: !current }).then(refresh, function(err) {
    document.getElementById('error').textContent = fmt('Api_ActionFailedFormat', 'Failed: {0}', err.message || err);
  });
}
function openPawnioReleases() {
  http('POST', { action: 'open_pawnio_releases' });
}
function openConsole() {
  // AllocConsole happens on the server side; the
  // new console window appears in the background
  // (not focused, not modal) so the browser keeps
  // the user's attention. We just show a small
  // hint in the error/status line telling the
  // user to switch to the new window. If the
  // process already has a console (e.g. a second
  // click) we tell the user that too.
  http('POST', { action: 'open_console' }).then(function(resp) {
    if (resp && resp.data) {
      var note = resp.data.fresh
        ? t('Api_ConsoleOpenedNote', 'Console window opened in the background — switch to it to see logs.')
        : t('Api_ConsoleAlreadyOpen', 'Console was already open.');
      document.getElementById('error').textContent = note;
    }
  }, function(err) {
    document.getElementById('error').textContent = fmt('Api_ActionFailedFormat', 'Failed: {0}', err.message || err);
  });
}
function setLang(code) {
  // Language changes only affect the HTML placeholders
  // (server-templated), so the JS-driven repaint alone
  // is not enough — we need a full reload to pick up
  // the freshly templated page.
  http('POST', { action: 'set_lang', lang: code }).then(function() {
    window.location.reload();
  }, function(err) {
    document.getElementById('error').textContent = fmt('Api_ActionFailedFormat', 'Failed: {0}', err.message || err);
  });
}
function highlightLang(code) {
  var en = document.getElementById('lang-en');
  var zh = document.getElementById('lang-zh');
  if (en) en.className = (code === 'en-US') ? 'lang-btn lang-active' : 'lang-btn secondary';
  if (zh) zh.className = (code === 'zh-CN') ? 'lang-btn lang-active' : 'lang-btn secondary';
}
// Cache the port input so apply() can pre-fill it. We use
// the simplest possible rule: if the input is empty, fill
// it with the current port. The earlier focus/input
// listener design was over-engineered — the WinForms
// WebBrowser control (IE 7 render mode) can auto-focus
// the first input on page load, which would flip a
// touched flag before apply() ever ran, suppressing the
// pre-fill. The empty-input check has no such race and
// degrades gracefully: the moment the user types anything,
// !portInput.value is false, the 2s refresh leaves the
// field alone.
var portInput = document.getElementById('port-input');
document.getElementById('ver').textContent = '—';
function apply(s) {
  if (s && s.strings) I18N = s.strings;
  document.getElementById('port').textContent = s.config.port;
  if (portInput && !portInput.value) {
    portInput.value = s.config.port;
  }
  document.getElementById('port-sub').textContent = fmt('Api_PortSub', 'URL: http://localhost:{0}/api/sysinfo', s.config.port);
  if (s.server_version) {
    document.getElementById('ver').textContent = 'v' + s.server_version;
  }
  document.getElementById('autostart-user').textContent = s.auto_start_user_registered
    ? t('Api_Enabled', 'Enabled')
    : t('Api_Disabled', 'Disabled');
  document.getElementById('autostart-user-btn').textContent = s.auto_start_user_registered
    ? t('Api_BtnDisable', 'Disable')
    : t('Api_BtnEnable', 'Enable');
  document.getElementById('autostart-admin').textContent = s.auto_start_admin_registered
    ? t('Api_Enabled', 'Enabled')
    : t('Api_Disabled', 'Disabled');
  document.getElementById('autostart-admin-btn').textContent = s.auto_start_admin_registered
    ? t('Api_BtnDisable', 'Disable')
    : t('Api_BtnEnable', 'Enable');
  document.getElementById('autostart-admin-btn').disabled = !s.is_elevated;
  document.getElementById('autostart-admin').parentNode.className = 'card ' + (s.is_elevated ? '' : 'warn');
  if (!s.is_elevated) {
    // When the EXE itself isn't running elevated, we
    // can't talk to the Task Scheduler service to
    // register or unregister. The endpoint layer refuses
    // the action with Api_AdminNeededHint as the error
    // body; here we make the UI match by replacing the
    // enable/disable button text with a Need admin
    // label, so the user immediately sees why the
    // button is disabled without having to click.
    document.getElementById('autostart-admin').textContent = t('Api_DisabledAdminHint', 'Disabled (relaunch as admin to enable)');
    document.getElementById('autostart-admin-btn').textContent = t('Api_BtnNeedAdmin', 'Need admin');
  }
  document.getElementById('pawnio').textContent = s.pawnio_installed
    ? t('Api_PawnioInstalled', 'Installed')
    : t('Api_PawnioNotInstalled', 'Not installed');
  document.getElementById('pawnio-sub').textContent = s.pawnio_installed
    ? buildPawnioSub(s, t)
    : t('Api_SubPawnioMissing', 'LibreHardwareMonitor needs PawnIO.sys to read sensors when HVCI is enabled.');
  document.getElementById('card-pawnio').className = 'card ' + (s.pawnio_installed ? 'ok' : 'warn');
  document.getElementById('elevated-note').textContent = s.is_elevated
    ? t('Api_ElevatedNote', 'Running as Administrator. All features available.')
    : t('Api_NotElevatedNote', 'Not running as Administrator. Right-click the EXE → Run as administrator for sensor readings and admin auto-start.');
  // Language card. The current code is whatever the server
  // resolved (cfg.Lang when set, else CurrentUICulture), so
  // we always highlight a known supported value.
  var langCode = (s.config && s.config.lang) ? s.config.lang : 'en-US';
  document.getElementById('lang-value').textContent = langCode;
  document.getElementById('lang-sub').textContent = '';
  highlightLang(langCode);
  document.getElementById('error').textContent = '';
  // PawnIO card sub: three-line layout. We keep
  // the formatting in JS (not in a static template)
  // so we can substitute a no-network marker or
  // an unknown marker at runtime when the
  // corresponding field is missing. textContent
  // + CSS pre-line means the literal newline
  // between fields renders as a real line break.
  function buildPawnioSub(s, t) {
    var lines = [];
    lines.push(t('Api_LabelPawnioPath', 'Install path') + ': ' + (s.pawnio_path || t('Api_PawnioUnknown', 'unknown')));
    // Local version + (latest from GitHub). If the
    // GitHub fetch is still pending or the network
    // is down, s.pawnio_latest_version is null and
    // we surface that explicitly so the user can
    // tell the difference between up-to-date and
    // unknown.
    var localVer = s.pawnio_version || t('Api_PawnioUnknown', 'unknown');
    var latestVer = s.pawnio_latest_version
      ? s.pawnio_latest_version
      : '(' + t('Api_PawnioNoNetwork', 'no network') + ')';
    lines.push(t('Api_LabelPawnioVersion', 'Version') + ': ' + localVer + '   ' +
               t('Api_LabelPawnioLatest', 'Latest (GitHub)') + ': ' + latestVer);
    lines.push(t('Api_LabelPawnioInstallTime', 'Install time') + ': ' + (s.pawnio_install_time || t('Api_PawnioUnknown', 'unknown')));
    return lines.join('\n');
  }
  // Diagnostics card. We set the em-dash for any null/empty
  // field so a missing value (stripped EXE, no start time)
  // reads as a friendly dash, not undefined or null.
  // The start_time comes over the wire as ISO 8601 (round-
  // trip o format); toLocaleString() renders it in the
  // user's locale, which is what they expect for a wall
  // clock display.
  function setDiag(id, val) {
    var el = document.getElementById(id);
    if (el) el.textContent = (val == null || val === '') ? '—' : val;
  }
  setDiag('diag-runmode', s.run_mode === 'Admin'
    ? t('Api_RunModeAdmin', 'Admin (LHM enabled)')
    : t('Api_RunModeUser', 'User (no admin)'));
  setDiag('diag-pid', s.process_id);
  setDiag('diag-exepath', s.exe_path);
  setDiag('diag-starttime', s.start_time ? new Date(s.start_time).toLocaleString() : null);
  setDiag('diag-arch', s.architecture);
  setDiag('diag-dotnet', s.dotnet_version);
}
function refresh() {
  http('GET').then(apply, function(err) {
    document.getElementById('error').textContent = fmt('Api_GenericError', 'Error: {0}', err.message || err);
  });
}
refresh();
setInterval(refresh, 2000);
</script>
</body>
</html>";
        }

        // -----------------------------------------------------------------
        //  i18n helpers
        // -----------------------------------------------------------------

        /// <summary>
        /// Resolve the active UI culture to a non-empty BCP-47
        /// code. Mirrors <see cref="Strings.CurrentCultureName"/>
        /// but fills in <see cref="Strings.DefaultCulture"/>
        /// when the resolution chain lands on the invariant
        /// (which happens when the user picks an unsupported
        /// culture like <c>ja-JP</c> — <c>Strings.cs</c>
        /// deliberately returns "" for that, but the
        /// <c>&lt;html lang&gt;</c> attribute and the language
        /// picker need a code to compare against).
        /// </summary>
        private static string ResolveCurrentCultureName(ServerConfig cfg)
        {
            if (cfg != null && !string.IsNullOrWhiteSpace(cfg.Lang))
            {
                var resolved = Strings.ResolveCulture(cfg.Lang).Name;
                if (!string.IsNullOrEmpty(resolved)) return resolved;
            }
            var current = Strings.CurrentCultureName();
            return string.IsNullOrEmpty(current) ? Strings.DefaultCulture : current;
        }

        /// <summary>
        /// Build the flat <c>key → value</c> dictionary that
        /// drives every <c>{{Api_*}}</c> placeholder in
        /// <see cref="BuildSetupHtml"/>. The English fallback
        /// is hard-coded here so a partially-translated
        /// <c>Strings.&lt;culture&gt;.resx</c> still renders
        /// cleanly — <see cref="Strings.Get"/> returns the
        /// fallback when the key is absent.
        ///
        /// <para>
        /// <b>Adding a new label?</b> Add the <c>&lt;data&gt;</c>
        /// row to both <c>Strings.resx</c> and
        /// <c>Strings.zh-CN.resx</c>, then add the
        /// <c>key → fallback</c> entry here and a
        /// <c>{{Api_Key}}</c> token in the template.
        /// </para>
        ///
        /// <para>
        /// <paramref name="currentPort"/> is templated into
        /// <c>Api_PortCurrent</c>, which is the <c>value</c>
        /// attribute on the port input. Rendering this on
        /// the server is a deliberate fallback: the WinForms
        /// <c>WebBrowser</c> control runs in IE 7 quirks mode
        /// by default, which (a) doesn't render the
        /// <c>placeholder</c> attribute, and (b) can stumble
        /// on the ES6 <c>Promise</c> in the page's JS — both
        /// make a JS-only pre-fill unreliable. The server-side
        /// <c>value</c> attribute paints the field on the
        /// very first render, no script needed.
        /// </para>
        /// </summary>
        private static System.Collections.Generic.Dictionary<string, string> BuildStrings(string cultureName, int currentPort)
        {
            // The English-fallback list is the contract for
            // the HTML template. Keep it in sync with the
            // {{Api_*}} tokens in BuildSetupHtml().
            var map = new System.Collections.Generic.Dictionary<string, string>(StringComparer.Ordinal)
            {
                ["Api_PageTitle"] = Strings.Get("Api_PageTitle", cultureName, "PerfectWall Server — Setup"),
                ["Api_LabelPort"] = Strings.Get("Api_LabelPort", cultureName, "Listening port"),
                ["Api_LabelUserAutoStart"] = Strings.Get("Api_LabelUserAutoStart", cultureName, "User-mode auto-start"),
                ["Api_LabelAdminAutoStart"] = Strings.Get("Api_LabelAdminAutoStart", cultureName, "Admin-mode auto-start"),
                ["Api_LabelPawnio"] = Strings.Get("Api_LabelPawnio", cultureName, "PawnIO"),
                // PawnIO card sub 3-line labels. These
                // four keys are also referenced by the
                // JS buildPawnioSub() function; if we
                // forget to ship them in the strings
                // dict the JS falls back to its hard-
                // coded English second argument, so a
                // bug here would silently break the
                // Chinese version of the PawnIO card
                // without any compile-time warning.
                // Keep this list in sync with the
                // resx entries.
                ["Api_LabelPawnioPath"] = Strings.Get("Api_LabelPawnioPath", cultureName, "Install path"),
                ["Api_LabelPawnioVersion"] = Strings.Get("Api_LabelPawnioVersion", cultureName, "Version"),
                ["Api_LabelPawnioLatest"] = Strings.Get("Api_LabelPawnioLatest", cultureName, "Latest (GitHub)"),
                ["Api_LabelPawnioInstallTime"] = Strings.Get("Api_LabelPawnioInstallTime", cultureName, "Install time"),
                ["Api_PawnioNoNetwork"] = Strings.Get("Api_PawnioNoNetwork", cultureName, "no network"),
                ["Api_PawnioUnknown"] = Strings.Get("Api_PawnioUnknown", cultureName, "unknown"),
                ["Api_SubUserAutoStart"] = Strings.Get("Api_SubUserAutoStart", cultureName, "HKCU\\…\\Run, no admin required"),
                ["Api_SubAdminAutoStart"] = Strings.Get("Api_SubAdminAutoStart", cultureName, "HKLM\\…\\Run, requires admin (right-click EXE → Run as administrator)"),
                ["Api_BtnSave"] = Strings.Get("Api_BtnSave", cultureName, "Save & restart listener"),
                ["Api_PortInputPlaceholder"] = Strings.Get("Api_PortInputPlaceholder", cultureName, "1024-65535"),
                ["Api_BtnToggle"] = Strings.Get("Api_BtnToggle", cultureName, "Toggle"),
                ["Api_BtnOpenPawnio"] = Strings.Get("Api_BtnOpenPawnio", cultureName, "Open releases page"),
                ["Api_BtnOpenConsole"] = Strings.Get("Api_BtnOpenConsole", cultureName, "Open console"),
                ["Api_ConsoleOpenedNote"] = Strings.Get("Api_ConsoleOpenedNote", cultureName, "Console window opened in the background — switch to it to see logs."),
                ["Api_ConsoleAlreadyOpen"] = Strings.Get("Api_ConsoleAlreadyOpen", cultureName, "Console was already open."),
                ["Api_Enabled"] = Strings.Get("Api_Enabled", cultureName, "Enabled"),
                ["Api_Disabled"] = Strings.Get("Api_Disabled", cultureName, "Disabled"),
                ["Api_DisabledAdminHint"] = Strings.Get("Api_DisabledAdminHint", cultureName, "Disabled (relaunch as admin to enable)"),
                ["Api_PawnioInstalled"] = Strings.Get("Api_PawnioInstalled", cultureName, "Installed"),
                ["Api_PawnioNotInstalled"] = Strings.Get("Api_PawnioNotInstalled", cultureName, "Not installed"),
                ["Api_BtnEnable"] = Strings.Get("Api_BtnEnable", cultureName, "Enable"),
                ["Api_BtnDisable"] = Strings.Get("Api_BtnDisable", cultureName, "Disable"),
                ["Api_PortSub"] = Strings.Get("Api_PortSub", cultureName, "URL: http://localhost:{0}/api/sysinfo"),
                ["Api_ElevatedNote"] = Strings.Get("Api_ElevatedNote", cultureName, "Running as Administrator. All features available."),
                ["Api_NotElevatedNote"] = Strings.Get("Api_NotElevatedNote", cultureName, "Not running as Administrator. Right-click the EXE → Run as administrator for sensor readings and admin auto-start."),
                ["Api_InvalidPortStatus"] = Strings.Get("Api_InvalidPortStatus", cultureName, "Invalid port (must be 1024-65535)."),
                ["Api_SavingStatus"] = Strings.Get("Api_SavingStatus", cultureName, "Saving…"),
                ["Api_DefaultSaved"] = Strings.Get("Api_DefaultSaved", cultureName, "Saved."),
                ["Api_GenericError"] = Strings.Get("Api_GenericError", cultureName, "Error: {0}"),
                ["Api_ActionFailedFormat"] = Strings.Get("Api_ActionFailedFormat", cultureName, "Failed: {0}"),
                ["Api_LangSwitcherLabel"] = Strings.Get("Api_LangSwitcherLabel", cultureName, "Language"),
                ["Api_LangEn"] = Strings.Get("Api_LangEn", cultureName, "English"),
                ["Api_LangZhCn"] = Strings.Get("Api_LangZhCn", cultureName, "中文"),
                // Diagnostics card.
                ["Api_LabelDiagnostics"] = Strings.Get("Api_LabelDiagnostics", cultureName, "Diagnostics"),
                ["Api_LabelRunMode"] = Strings.Get("Api_LabelRunMode", cultureName, "Run mode"),
                ["Api_LabelProcessId"] = Strings.Get("Api_LabelProcessId", cultureName, "Process ID"),
                ["Api_LabelExePath"] = Strings.Get("Api_LabelExePath", cultureName, "EXE path"),
                ["Api_LabelStartTime"] = Strings.Get("Api_LabelStartTime", cultureName, "Started at"),
                ["Api_LabelArchitecture"] = Strings.Get("Api_LabelArchitecture", cultureName, "Architecture"),
                ["Api_LabelDotnetVersion"] = Strings.Get("Api_LabelDotnetVersion", cultureName, ".NET runtime"),
                ["Api_RunModeUser"] = Strings.Get("Api_RunModeUser", cultureName, "User (no admin)"),
                ["Api_RunModeAdmin"] = Strings.Get("Api_RunModeAdmin", cultureName, "Admin (LHM enabled)"),
                ["Api_AdminNeededHint"] = Strings.Get("Api_AdminNeededHint", cultureName, "Administrator required: right-click the EXE → Run as administrator, then retry"),
                ["Api_BtnNeedAdmin"] = Strings.Get("Api_BtnNeedAdmin", cultureName, "Need admin"),
            };
            // Current port for the <input value="...">
            // pre-fill. InvariantCulture so the integer
            // serialises as "27420", never "27420,00" on a
            // comma-locale machine.
            map["Api_PortCurrent"] = currentPort.ToString(System.Globalization.CultureInfo.InvariantCulture);
            // <html lang> takes a BCP-47 primary tag. "zh-CN"
            // passes through (the rest of the codebase uses
            // full culture codes); "en-US" maps to the
            // shorter "en" for HTML conformance.
            map["Api_HtmlLang"] = string.Equals(cultureName, "zh-CN", StringComparison.OrdinalIgnoreCase)
                ? "zh-CN"
                : "en";
            return map;
        }

        /// <summary>
        /// Substitute every <c>{{Key}}</c> placeholder in
        /// <paramref name="template"/> with the matching
        /// value from <paramref name="strings"/>. The
        /// <c>{{ }}</c> syntax is picked so it cannot
        /// accidentally collide with the C# string-format
        /// <c>{0}</c> tokens, the JS regex <c>\{(\d+)\}</c>
        /// tokens, or any other brace pair in the template.
        /// Missing keys are left as-is (the browser renders
        /// them literally) so a missing translation is
        /// obvious in QA.
        ///
        /// <para>
        /// The implementation is a single-pass scan
        /// rather than a per-key <see cref="StringBuilder.Replace"/>
        /// loop. The previous loop was vulnerable to
        /// double-substitution: a translation value
        /// containing the literal text
        /// <c>{{Api_SomeKey}}</c> would be replaced again
        /// when the loop reached that key. Today no
        /// <c>Strings.resx</c> value contains
        /// <c>{{...}}</c>, but any future translation that
        /// did would be silently corrupted.
        /// </para>
        /// </summary>
        private static string ApplyPlaceholders(string template, System.Collections.Generic.Dictionary<string, string> strings)
        {
            if (strings == null || strings.Count == 0) return template;
            if (string.IsNullOrEmpty(template)) return template;
            var sb = new System.Text.StringBuilder(template.Length);
            int i = 0;
            int len = template.Length;
            while (i < len)
            {
                // Look for the start of a placeholder
                // token. "{{x}}" is 3 chars minimum
                // (two braces + 1 char key).
                if (i + 2 < len && template[i] == '{' && template[i + 1] == '{')
                {
                    int closeIdx = template.IndexOf("}}", i + 2, StringComparison.Ordinal);
                    if (closeIdx > i + 2)
                    {
                        var key = template.Substring(i + 2, closeIdx - (i + 2));
                        if (strings.TryGetValue(key, out var value))
                        {
                            sb.Append(value ?? string.Empty);
                            i = closeIdx + 2;
                            continue;
                        }
                    }
                }
                sb.Append(template[i]);
                i++;
            }
            return sb.ToString();
        }

        // -----------------------------------------------------------------
        //  GET /api/setup
        // -----------------------------------------------------------------

        private static async Task GetState(
            HttpContext ctx,
            Func<ServerConfig> configGetter,
            Func<HardwareMonitorService.RunMode> runModeGetter)
        {
            if (IsRestartScheduled)
            {
                await ctx.WriteJsonAsync(new
                {
                    success = false,
                    error = "server is restarting; retry shortly"
                }, 503);
                return;
            }
            var s = SetupService.Inspect(runModeGetter());
            var culture = ResolveCurrentCultureName(s.Config);
            var strings = BuildStrings(culture, s.Config.Port);
            // ISO 8601 ("o" round-trip format) is locale-agnostic
            // and JavaScript Date can parse it directly. The JS
            // apply() formats the timestamp for display in the
            // user's locale, so we keep the wire format neutral.
            var startTimeIso = s.StartTime.HasValue
                ? s.StartTime.Value.ToString("o", System.Globalization.CultureInfo.InvariantCulture)
                : null;
            await ctx.WriteJsonAsync(new
            {
                config = new
                {
                    port = s.Config.Port,
                    log_level = s.Config.LogLevel,
                    // The resolved (non-empty) culture name.
                    // The JS uses this to pick the active
                    // language button. The raw
                    // ServerConfig.Lang (which may be "")
                    // is intentionally not exposed — the
                    // resolved value is what the user sees.
                    lang = culture,
                    // The list of selectable codes. The
                    // language picker highlights one of
                    // these; any other value would land on
                    // the whitelist and be normalised by
                    // set_lang before persisting.
                    supported_languages = Strings.SupportedCultures
                },
                strings = strings,
                server_version = ServerVersionString(),
                is_elevated = s.IsElevated,
                auto_start_user_registered = s.AutoStartUserRegistered,
                // The "registered" check now resolves to the
                // Task Scheduler entry. The old HKLM\…\Run
                // field is gone — see SetAutoStartAdminViaTaskScheduler
                // which removes the legacy entry as part of
                // migration.
                auto_start_admin_registered = s.AutoStartAdminRegistered,
                pawnio_installed = s.PawnioInstalled,
                pawnio_path = s.PawnioPath,
                pawnio_version = s.PawnioVersion,
                // mtime of the .sys on disk, UTC
                pawnio_install_time = s.PawnioInstallTime,
                // Latest PawnIO release from GitHub;
                // null on first call or when the
                // background fetch can't reach the
                // API. The UI falls back to
                // "(无网络)" / "(no network)" in that
                // case so the user can tell the
                // difference between "we know we're
                // up to date" and "we don't know".
                pawnio_latest_version = s.PawnioLatestVersion,
                lhm_will_work_with_pawnio = s.LhmWillWorkWithPawnio,
                // Diagnostics card payload. Every field
                // tolerates a null / empty value — the JS
                // renders "—" when the field is missing
                // (e.g. start time on a stripped EXE).
                // OS version is intentionally omitted —
                // Environment.OSVersion on a .NET Framework
                // 4.8 EXE without a supported-OS manifest
                // returns the framework's compatibility
                // baseline (6.2.9200 = Windows 8) instead
                // of the actual running Windows build, so
                // the displayed value was misleading. A
                // correct value needs P/Invoke into
                // RtlGetVersion, which is out of scope for
                // a setup page; the row was just removed.
                run_mode = s.RunMode.ToString(),
                process_id = s.ProcessId,
                exe_path = s.ExePath,
                start_time = startTimeIso,
                architecture = s.Architecture,
                dotnet_version = s.DotNetVersion
            });
        }

        /// <summary>
        /// Pull the assembly informational version once
        /// and cache it for the process lifetime. Falls
        /// back to the assembly version when the
        /// informational version attribute is missing
        /// (which it usually is in a debug build).
        /// </summary>
        private static string _cachedVersion;
        private static string ServerVersionString()
        {
            if (_cachedVersion != null) return _cachedVersion;
            try
            {
                var asm = typeof(SetupEndpoints).Assembly;
                var info = asm.GetCustomAttributes(typeof(System.Reflection.AssemblyInformationalVersionAttribute), false);
                if (info.Length > 0)
                {
                    _cachedVersion = ((System.Reflection.AssemblyInformationalVersionAttribute)info[0]).InformationalVersion;
                    return _cachedVersion;
                }
                _cachedVersion = asm.GetName().Version?.ToString() ?? "0.0.0";
                return _cachedVersion;
            }
            catch
            {
                _cachedVersion = "0.0.0";
                return _cachedVersion;
            }
        }

        // -----------------------------------------------------------------
        //  POST /api/setup
        // -----------------------------------------------------------------

        private static async Task Update(
            HttpContext ctx,
            Func<ServerConfig> configGetter,
            Action<ServerConfig> configSetter,
            Func<HardwareMonitorService.RunMode> runModeGetter)
        {
            if (IsRestartScheduled)
            {
                await ctx.WriteJsonAsync(new
                {
                    success = false,
                    error = "server is restarting; retry shortly"
                }, 503);
                return;
            }
            try
            {
                var body = ctx.ReadBody();
                if (string.IsNullOrEmpty(body))
                {
                    await ctx.WriteJsonAsync(new { success = false, error = "empty body" }, 400);
                    return;
                }
                var req = JsonConvert.DeserializeObject<SetupRequest>(body);
                if (req == null || string.IsNullOrEmpty(req.Action))
                {
                    await ctx.WriteJsonAsync(new { success = false, error = "missing action" }, 400);
                    return;
                }
                switch (req.Action)
                {
                    case "set_port":
                        if (req.Port < 1024 || req.Port > 65535)
                        {
                            // Return the same Api_InvalidPortStatus
                            // key the HTML page shows, so the
                            // inline error message and the JSON
                            // error field are guaranteed to match.
                            await ctx.WriteJsonAsync(new
                            {
                                success = false,
                                error = Strings.Get("Api_InvalidPortStatus", Strings.CurrentCultureName())
                            }, 400);
                            return;
                        }
                        var cfg = configGetter();
                        cfg.Port = req.Port;
                        cfg.Save();
                        configSetter(cfg);
                        // The HTTP listener is bound to the old
                        // port and can't be rebound in-process on
                        // .NET Framework's HttpListener. We
                        // self-restart instead: spawn a new copy
                        // of the EXE with the original args, then
                        // ask the caller to give us a moment
                        // before tearing down the listener. The
                        // front-end sees the new state and
                        // refreshes the URL it points to.
                        SelfRestart();
                        await ctx.WriteJsonAsync(new
                        {
                            success = true,
                            message = "Port saved. The server is restarting on the new port; this page will become unreachable in a few seconds.",
                            new_port = req.Port
                        });
                        return;

                    case "set_auto_start_user":
                        SetupService.SetAutoStartUser(req.Enable);
                        await GetState(ctx, configGetter, runModeGetter);
                        return;

                    case "set_auto_start_admin":
                        // The Task Scheduler approach needs an
                        // already-elevated EXE: the Schedule
                        // service accepts task create/delete from
                        // any process that holds the matching
                        // privilege, but the in-process "I have
                        // an admin token" check is the simplest
                        // gate. If we don't enforce this here,
                        // schtasks.exe fails with E_ACCESSDENIED
                        // and the user sees a generic Windows
                        // error instead of the actionable hint.
                        if (!PerfectWall.Server.Utils.ElevationHelper.IsElevated())
                        {
                            await ctx.WriteJsonAsync(new
                            {
                                success = false,
                                error = Strings.Get("Api_AdminNeededHint", Strings.CurrentCultureName())
                            }, 400);
                            return;
                        }
                        if (req.Enable)
                        {
                            try
                            {
                                SetupService.SetAutoStartAdminViaTaskScheduler(System.Reflection.Assembly.GetExecutingAssembly().Location);
                            }
                            catch (Exception ex)
                            {
                                await ctx.WriteJsonAsync(new { success = false, error = ex.Message }, 500);
                                return;
                            }
                        }
                        else
                        {
                            try
                            {
                                SetupService.UnsetAutoStartAdminViaTaskScheduler();
                            }
                            catch (Exception ex)
                            {
                                await ctx.WriteJsonAsync(new { success = false, error = ex.Message }, 500);
                                return;
                            }
                        }
                        await GetState(ctx, configGetter, runModeGetter);
                        return;

                    case "open_pawnio_releases":
                        SetupService.OpenPawnioReleasesPage();
                        await ctx.WriteJsonAsync(new { success = true, data = new { opened = true } });
                        return;

                    case "open_console":
                        // AllocConsole on demand. The
                        // button in the setup page is
                        // how a user who launched the
                        // EXE as WinExe (no console)
                        // gets a terminal back. The
                        // call is idempotent: clicking
                        // twice is a no-op.
                        var freshConsole = SetupService.OpenConsole();
                        await ctx.WriteJsonAsync(new { success = true, data = new { console_opened = true, fresh = freshConsole } });
                        return;

                    case "set_lang":
                        var cfgLang = configGetter();
                        // Normalise the requested language to a
                        // supported culture code. ResolveCulture
                        // handles the parent-culture fallback
                        // (e.g. "zh-Hans" → "zh-CN") and the
                        // whitelist check (an unsupported value
                        // falls through to the invariant). An
                        // empty string means "follow the OS" —
                        // we persist that verbatim.
                        var resolvedLang = Strings.ResolveCulture(req.Lang);
                        var langCode = string.IsNullOrEmpty(resolvedLang.Name) ? string.Empty : resolvedLang.Name;
                        cfgLang.Lang = langCode;
                        try { cfgLang.Save(); }
                        catch (Exception ex)
                        {
                            await ctx.WriteJsonAsync(new { success = false, error = ex.Message }, 500);
                            return;
                        }
                        configSetter(cfgLang);
                        // Flip the live UI culture so subsequent
                        // WinForms / console strings access picks
                        // up the new language immediately. The
                        // /setup HTML re-fetches its strings on
                        // the next GET (and the JS does
                        // window.location.reload() right after
                        // this POST resolves, so the user sees
                        // the new placeholders without delay).
                        //
                        // IMPORTANT: do NOT call SelfRestart()
                        // here. Unlike set_port, language is a
                        // UI-only change — the listener, the
                        // registry entries, and the hardware
                        // service are all language-agnostic.
                        if (!string.IsNullOrEmpty(langCode))
                        {
                            try
                            {
                                System.Globalization.CultureInfo.CurrentUICulture = resolvedLang;
                            }
                            catch (Exception ex)
                            {
                                // Should not happen — we
                                // resolved through
                                // CultureInfo already. Log
                                // and continue; the next
                                // EXE restart will retry
                                // with a fresh process.
                                Console.Error.WriteLine($"[Lang] failed to set CurrentUICulture: {ex.Message}");
                            }
                        }
                        await GetState(ctx, configGetter, runModeGetter);
                        return;

                    default:
                        await ctx.WriteJsonAsync(new { success = false, error = "unknown action: " + req.Action }, 400);
                        return;
                }
            }
            catch (Exception ex)
            {
                await ctx.WriteJsonAsync(new { success = false, error = ex.Message }, 500);
            }
        }

        private sealed class SetupRequest
        {
            [JsonProperty("action")] public string Action { get; set; }
            [JsonProperty("port")] public int Port { get; set; }
            [JsonProperty("enable")] public bool Enable { get; set; }
            // New: language code sent by set_lang. Accepts
            // any string; the server normalises via
            // Strings.ResolveCulture before persisting.
            [JsonProperty("lang")] public string Lang { get; set; }
        }

        /// <summary>
        /// Re-launch the same EXE with the same CLI args
        /// after a short grace period. The current process
        /// exits via <see cref="Environment.Exit"/> so the
        /// wallpaper's spawn loop (or the user's manual
        /// restart) sees a clean process exit.
        ///
        /// We use a background thread so the HTTP handler
        /// can return its JSON response first; the thread
        /// then waits, spawns, and exits. This avoids the
        /// race where the new EXE binds the port before
        /// we've told the client the rebind happened.
        ///
        /// <para>
        /// Sets <see cref="_restartScheduled"/> so any
        /// in-flight /api/setup/* call after this point
        /// short-circuits with 503 — saves the user from
        /// a half-finished response or a state-mutation
        /// race with the new EXE.
        /// </para>
        /// </summary>
        private static void SelfRestart()
        {
            // CompareExchange so a concurrent caller doesn't
            // spawn two restart threads.
            if (System.Threading.Interlocked.CompareExchange(ref _restartScheduled, 1, 0) != 0)
            {
                return;
            }
            try
            {
                var exe = System.Diagnostics.Process.GetCurrentProcess().MainModule?.FileName;
                if (string.IsNullOrEmpty(exe) || !System.IO.File.Exists(exe))
                {
                    return;
                }
                var args = Environment.GetCommandLineArgs();
                // Drop argv[0] which is the exe path itself;
                // ProcessStartInfo.Arguments reuses it from
                // FileName.
                if (args.Length > 0) args = args.Skip(1).ToArray();
                var t = new System.Threading.Thread(() =>
                {
                    try
                    {
                        System.Threading.Thread.Sleep(SelfRestartDelayMs);
                        var psi = new System.Diagnostics.ProcessStartInfo
                        {
                            FileName = exe,
                            UseShellExecute = false,
                            CreateNoWindow = false,
                            // net48 doesn't reliably support
                            // ArgumentList on every runtime;
                            // use the older Arguments string
                            // and quote each arg.
                            Arguments = string.Join(" ", args.Select(QuoteArg))
                        };
                        System.Diagnostics.Process.Start(psi);
                    }
                    catch { /* best effort */ }
                    try { Environment.Exit(0); } catch { /* force */ }
                })
                {
                    IsBackground = true,
                    Name = "PerfectWall.SelfRestart"
                };
                t.Start();
            }
            catch { /* best effort */ }
        }

        /// <summary>
        /// Public entry point used by <c>ConsoleMenu.ChangePort</c>
        /// after it persists a new port to
        /// <c>server-config.json</c>. The console flow has
        /// no HTTP response to flush, so we still want the
        /// same deferred-spawn-then-exit behaviour (and the
        /// same <c>_restartScheduled</c> gate) as the
        /// HTTP-driven set_port path.
        /// </summary>
        public static void TriggerSelfRestart() => SelfRestart();

        /// <summary>
        /// Quote a single command-line argument for
        /// <see cref="System.Diagnostics.ProcessStartInfo.Arguments"/>.
        /// Mirrors <c>CommandLineToArgvW</c> rules so paths
        /// with spaces survive the round-trip.
        /// </summary>
        private static string QuoteArg(string a)
        {
            if (string.IsNullOrEmpty(a)) return "\"\"";
            if (a.IndexOfAny(new[] { ' ', '\t', '"' }) < 0) return a;
            var sb = new System.Text.StringBuilder("\"");
            int backslashes = 0;
            foreach (var c in a)
            {
                if (c == '\\') { backslashes++; continue; }
                if (c == '"')
                {
                    sb.Append('\\', backslashes * 2 + 1);
                    sb.Append('"');
                }
                else
                {
                    if (backslashes > 0) sb.Append('\\', backslashes);
                    sb.Append(c);
                }
                backslashes = 0;
            }
            if (backslashes > 0) sb.Append('\\', backslashes);
            sb.Append('"');
            return sb.ToString();
        }
    }
}
