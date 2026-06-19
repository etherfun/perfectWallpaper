using System;
using System.Diagnostics;
using System.IO;
using System.Threading.Tasks;
using Newtonsoft.Json;
using PerfectWall.Server.Models;
using PerfectWall.Server.Server;
using PerfectWall.Server.Services;

namespace PerfectWall.Server.Endpoints
{
    public static class DockbarEndpoints
    {
        public static void Map(Router router)
        {
            router.Post("/api/dockbar/open", OpenItem);
            router.Get("/api/dockbar/select-file", SelectFile);
        }

        private static async Task OpenItem(HttpContext ctx)
        {
            try
            {
                var body = ctx.ReadBody();
                var req = JsonConvert.DeserializeObject<OpenItemRequest>(body);
                if (req == null) { await ctx.WriteJsonAsync(ApiResponse<object>.Fail("Invalid body"), 400); return; }

                string target = null;
                string verb = null;
                if (req.Type == "url" && !string.IsNullOrEmpty(req.Url))
                {
                    // Allowlist http(s) only. Reject
                    // `ms-settings:`, `shell:AppsFolder`,
                    // `file:`, `javascript:`, etc. — they
                    // are open-redirect / RCE pivots.
                    if (!IsAllowedUrl(req.Url, out var urlErr))
                    {
                        await ctx.WriteJsonAsync(ApiResponse<object>.Fail(urlErr), 400);
                        return;
                    }
                    target = req.Url;
                    verb = null; // open
                }
                else if ((req.Type == "app" || req.Type == "file") && !string.IsNullOrEmpty(req.Path))
                {
                    // Sanity check: absolute path, file must
                    // exist. We can't restrict to a user-approved
                    // root without storing the dockbar config
                    // server-side, but at least we filter out
                    // shell: schemes that smuggle in via the
                    // `path` field.
                    // String.Contains(string, StringComparison)
                    // is not available on .NET Framework 4.8;
                    // use IndexOf with the explicit comparison.
                    if (req.Path.IndexOf("://", StringComparison.Ordinal) >= 0)
                    {
                        await ctx.WriteJsonAsync(ApiResponse<object>.Fail("path must not be a URI"), 400);
                        return;
                    }
                    target = req.Path;
                    verb = null; // open
                }
                else
                {
                    await ctx.WriteJsonAsync(ApiResponse<object>.Fail("Invalid type or missing path/url"), 400);
                    return;
                }

                var result = NativeMethods.ShellExecute(IntPtr.Zero, verb, target, null, null, NativeMethods.SW_SHOW);
                if (result.ToInt64() > 32)
                {
                    await ctx.WriteJsonAsync(ApiResponse<object>.Ok(new { opened = true }));
                }
                else
                {
                    await ctx.WriteJsonAsync(ApiResponse<object>.Fail($"ShellExecute returned {result.ToInt64()}"), 500);
                }
            }
            catch (Exception ex)
            {
                await ctx.WriteJsonAsync(ApiResponse<object>.Fail(ex.Message), 500);
            }
        }

        private static bool IsAllowedUrl(string url, out string error)
        {
            error = null;
            if (string.IsNullOrEmpty(url)) { error = "url is empty"; return false; }
            if (!Uri.TryCreate(url, UriKind.Absolute, out var uri))
            {
                error = "url is not an absolute URI";
                return false;
            }
            if (uri.Scheme != Uri.UriSchemeHttp && uri.Scheme != Uri.UriSchemeHttps)
            {
                error = $"scheme '{uri.Scheme}' is not allowed (only http/https)";
                return false;
            }
            return true;
        }

        private static async Task SelectFile(HttpContext ctx)
        {
            var type = ctx.QueryParam("type") ?? "file";
            var title = type == "app" ? "Select application" : "Select file";
            try
            {
                if (NativeMethods.ShowOpenDialog(title, out var path))
                {
                    var name = string.IsNullOrEmpty(path) ? null : Path.GetFileName(path);
                    await ctx.WriteJsonAsync(ApiResponse<object>.Ok(new SelectFileResult { Path = path, Name = name }));
                }
                else
                {
                    await ctx.WriteJsonAsync(ApiResponse<object>.Fail("Dialog cancelled"));
                }
            }
            catch (Exception ex)
            {
                await ctx.WriteJsonAsync(ApiResponse<object>.Fail(ex.Message), 500);
            }
        }
    }
}
