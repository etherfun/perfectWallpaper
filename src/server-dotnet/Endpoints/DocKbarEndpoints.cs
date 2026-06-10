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
                if (req == null) { await ctx.WriteJsonAsync(ApiResponse<object>.Fail("Invalid body")); return; }

                string target = null;
                string verb = null;
                if (req.Type == "url" && !string.IsNullOrEmpty(req.Url))
                {
                    target = req.Url;
                    verb = null; // open
                }
                else if ((req.Type == "app" || req.Type == "file") && !string.IsNullOrEmpty(req.Path))
                {
                    target = req.Path;
                    verb = null; // open
                }
                else
                {
                    await ctx.WriteJsonAsync(ApiResponse<object>.Fail("Invalid type or missing path/url"));
                    return;
                }

                var result = NativeMethods.ShellExecute(IntPtr.Zero, verb, target, null, null, NativeMethods.SW_SHOW);
                if (result.ToInt64() > 32)
                {
                    await ctx.WriteJsonAsync(ApiResponse<object>.Ok(new { opened = true }));
                }
                else
                {
                    await ctx.WriteJsonAsync(ApiResponse<object>.Fail($"ShellExecute returned {result.ToInt64()}"));
                }
            }
            catch (Exception ex)
            {
                await ctx.WriteJsonAsync(ApiResponse<object>.Fail(ex.Message));
            }
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
                await ctx.WriteJsonAsync(ApiResponse<object>.Fail(ex.Message));
            }
        }
    }
}
