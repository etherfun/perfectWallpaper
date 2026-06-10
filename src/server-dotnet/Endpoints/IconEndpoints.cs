using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Threading.Tasks;
using Newtonsoft.Json;
using PerfectWall.Server.Models;
using PerfectWall.Server.Server;
using PerfectWall.Server.Services;

namespace PerfectWall.Server.Endpoints
{
    public static class IconEndpoints
    {
        private static readonly IconCache Cache = new IconCache();

        public static void Map(Router router)
        {
            router.Get("/api/icon", GetIcon);
            router.Get("/api/icon/all", GetAllIcons);
            router.Post("/api/icon/upload", UploadCustomIcon);
            router.Post("/api/icon/cache", ClearCache);
        }

        private static async Task GetIcon(HttpContext ctx)
        {
            var path = ctx.QueryParam("path");
            var bypass = ctx.QueryParam("t") != null;
            if (!bypass && Cache.TryGet(path, out var cached))
            {
                await ctx.WriteJsonAsync(ApiResponse<object>.Ok(new IconData { Icon = cached, Cached = true }));
                return;
            }

            string icon;
            try
            {
                icon = IconExtractor.ExtractLargestAsDataUrl(path);
                if (icon == null) icon = DefaultSvg();
            }
            catch
            {
                icon = DefaultSvg();
            }
            Cache.Put(path, icon);
            await ctx.WriteJsonAsync(ApiResponse<object>.Ok(new IconData { Icon = icon, Cached = false }));
        }

        private static async Task GetAllIcons(HttpContext ctx)
        {
            var path = ctx.QueryParam("path");
            try
            {
                var icons = IconExtractor.ExtractAll(path) ?? new List<IconExtractor.IconData>();
                var list = new List<object>();
                foreach (var i in icons)
                {
                    list.Add(new
                    {
                        icon = "data:image/png;base64," + Convert.ToBase64String(i.PngData),
                        width = i.Width,
                        height = i.Height,
                        is_png = i.IsPng
                    });
                }
                await ctx.WriteJsonAsync(ApiResponse<object>.Ok(new AllIconsResult
                {
                    Icons = list,
                    Count = list.Count
                }));
            }
            catch (Exception ex)
            {
                await ctx.WriteJsonAsync(ApiResponse<object>.Fail(ex.Message));
            }
        }

        private static async Task UploadCustomIcon(HttpContext ctx)
        {
            try
            {
                var body = ctx.ReadBody();
                var req = JsonConvert.DeserializeObject<CustomIconRequest>(body);
                if (req == null || string.IsNullOrEmpty(req.Data))
                {
                    await ctx.WriteJsonAsync(ApiResponse<object>.Fail("Invalid request body"));
                    return;
                }
                var mime = req.Type switch
                {
                    "image/png" => "image/png",
                    "image/jpeg" => "image/jpeg",
                    "image/jpg" => "image/jpeg",
                    "image/webp" => "image/webp",
                    "image/gif" => "image/gif",
                    "image/svg+xml" => "image/svg+xml",
                    _ => "image/png"
                };
                var bytes = Convert.FromBase64String(req.Data);
                var dataUrl = $"data:{mime};base64,{Convert.ToBase64String(bytes)}";
                await ctx.WriteJsonAsync(ApiResponse<object>.Ok(new
                {
                    icon = dataUrl,
                    size = bytes.Length
                }));
            }
            catch (Exception ex)
            {
                await ctx.WriteJsonAsync(ApiResponse<object>.Fail(ex.Message));
            }
        }

        private static async Task ClearCache(HttpContext ctx)
        {
            var n = Cache.Clear();
            await ctx.WriteJsonAsync(ApiResponse<object>.Ok(new { cleared = n }));
        }

        private static string DefaultSvg()
        {
            const string svg = "<svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='#fff'><path d='M12 15a3 3 0 1 1-6 0'/></svg>";
            return "data:image/svg+xml;base64," + Convert.ToBase64String(System.Text.Encoding.UTF8.GetBytes(svg));
        }
    }
}
