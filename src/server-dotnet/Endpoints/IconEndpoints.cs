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
            // Only bypass the cache when the client
            // passes the magic value `bypass`. Any
            // other value (or no value) hits the
            // cache. The previous code accepted any
            // non-empty `?t=` as a bypass, which a
            // user could trip accidentally by adding
            // `?t=${Date.now()}` for a one-off
            // refresh and then forgetting to remove
            // it on the next click — they'd bypass
            // the cache forever.
            var bypass = ctx.QueryParam("t") == "bypass";
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
                // Cap request size before allocating. A 50 MB
                // base64 blob in the request body would otherwise
                // allocate ~50 MB of `string` memory on this
                // thread. Note: ContentLength64 is -1 for
                // chunked transfer-encoding; ReadBody() in
                // HttpServer enforces the cap cumulatively
                // (see ReadBody) so chunked bodies are also
                // bounded.
                if (ctx.Request.ContentLength64 is long len && len > 16 * 1024 * 1024)
                {
                    await ctx.WriteJsonAsync(ApiResponse<object>.Fail("Request body exceeds 16 MB limit"), 413);
                    return;
                }

                var body = ctx.ReadBody();
                var req = JsonConvert.DeserializeObject<CustomIconRequest>(body);
                if (req == null || string.IsNullOrEmpty(req.Data))
                {
                    await ctx.WriteJsonAsync(ApiResponse<object>.Fail("Invalid request body"), 400);
                    return;
                }
                // Reject oversized base64 *before* decoding.
                // Base64 inflates by 4/3, so a 1.2 GB raw
                // string would decode to 900 MB. The decoded
                // cap is 8 MB → encoded cap is 8 MB * 4 / 3 =
                // ~10.7 MB. Round up to 11 MB to keep the
                // check simple. The previous code decoded
                // first, allocating the full input before
                // checking the limit — turning the 8 MB cap
                // into dead code.
                const int MaxDecodedBytes = 8 * 1024 * 1024;
                const long MaxEncodedChars = 11L * 1024 * 1024;
                if (req.Data.Length > MaxEncodedChars)
                {
                    await ctx.WriteJsonAsync(
                        ApiResponse<object>.Fail($"Encoded icon exceeds {MaxDecodedBytes / 1024 / 1024} MB limit"),
                        413);
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
                byte[] bytes;
                try { bytes = Convert.FromBase64String(req.Data); }
                catch (FormatException)
                {
                    // Don't echo the exception message —
                    // FormatException's Message includes
                    // positional text like
                    // "Invalid character '.' at position 13"
                    // which can leak snippet data from a
                    // malicious payload.
                    await ctx.WriteJsonAsync(ApiResponse<object>.Fail("Invalid base64 payload"), 400);
                    return;
                }
                if (bytes.LongLength > MaxDecodedBytes)
                {
                    await ctx.WriteJsonAsync(
                        ApiResponse<object>.Fail($"Decoded icon exceeds {MaxDecodedBytes / 1024 / 1024} MB limit"),
                        413);
                    return;
                }
                // The dockbar persists custom icons in
                // `localStorage` on the client (see
                // `src/dockbar/iconCache.ts`), so the server
                // intentionally does not store the bytes. We
                // round-trip the data URL back so the client
                // gets a normalised value (validated base64 +
                // resolved mime). If we ever add server-side
                // persistence, this is the place to write to
                // `IconCache` or a file under `dist/icons/`.
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
