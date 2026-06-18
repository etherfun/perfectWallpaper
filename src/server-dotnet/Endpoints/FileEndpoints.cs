using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.IO;
using System.Linq;
using System.Threading.Tasks;
using Newtonsoft.Json;
using PerfectWall.Server.Models;
using PerfectWall.Server.Server;
using PerfectWall.Server.Services;
using PerfectWall.Server.Utils;
using TagLib;

namespace PerfectWall.Server.Endpoints
{
    public static class FileEndpoints
    {
        public static void Map(Router router)
        {
            router.Get("/api/files", ListFiles);
            router.Get("/api/files/audio", StreamAudio);
            router.Get("/api/files/metadata", GetMetadata);
            router.Post("/api/files/player/{action}", MediaControl);
        }

        private static async Task ListFiles(HttpContext ctx)
        {
            var directory = ctx.QueryParam("directory");
            var filter = ctx.QueryParam("filter");
            var err = PathValidator.Validate(directory);
            if (err != null) { await ctx.WriteJsonAsync(ApiResponse<object>.Fail(err), 400); return; }

            if (!Directory.Exists(directory)) { await ctx.WriteJsonAsync(ApiResponse<object>.Fail("Directory not found"), 404); return; }

            try
            {
                var exts = string.IsNullOrEmpty(filter)
                    ? new HashSet<string>(StringComparer.OrdinalIgnoreCase)
                    : new HashSet<string>(
                        filter.Split(',').Select(e => e.Trim().TrimStart('.').ToLowerInvariant()),
                        StringComparer.OrdinalIgnoreCase);

                var files = new List<FileEntry>();
                foreach (var path in Directory.EnumerateFiles(directory))
                {
                    var name = Path.GetFileName(path);
                    if (exts.Count > 0)
                    {
                        var ext = (Path.GetExtension(name) ?? "").TrimStart('.').ToLowerInvariant();
                        if (!exts.Contains(ext)) continue;
                    }
                    files.Add(new FileEntry { Name = name, Path = path });
                }
                files.Sort((a, b) => string.Compare(a.Name, b.Name, StringComparison.OrdinalIgnoreCase));

                await ctx.WriteJsonAsync(ApiResponse<object>.Ok(new FileListResult
                {
                    Directory = directory,
                    Files = files,
                    Count = files.Count
                }));
            }
            catch (Exception ex)
            {
                await ctx.WriteJsonAsync(ApiResponse<object>.Fail(ex.Message), 500);
            }
        }

        private static async Task StreamAudio(HttpContext ctx)
        {
            var path = ctx.QueryParam("path");
            var err = PathValidator.Validate(path);
            if (err != null) { await ctx.WriteJsonAsync(ApiResponse<object>.Fail(err), 400); return; }
            if (!System.IO.File.Exists(path)) { await ctx.WriteJsonAsync(ApiResponse<object>.Fail("File not found"), 404); return; }

            var ext = (Path.GetExtension(path) ?? "").TrimStart('.').ToLowerInvariant();
            var contentType = MapContentType(ext);
            FileInfo fi;
            long totalLength;
            try
            {
                fi = new FileInfo(path);
                totalLength = fi.Length;
            }
            catch (Exception ex)
            {
                await ctx.WriteJsonAsync(ApiResponse<object>.Fail(ex.Message), 500);
                return;
            }

            // Parse `Range: bytes=start-end` so the frontend's
            // <audio> element can seek. Without this the
            // browser refuses to play past the first chunk.
            long start = 0;
            long end = totalLength - 1;
            bool isRange = false;
            var rangeHeader = ctx.Request.Headers["Range"];
            if (!string.IsNullOrEmpty(rangeHeader))
            {
                var parsed = ParseRangeHeader(rangeHeader, totalLength, out var s, out var e);
                if (parsed == RangeParseResult.Invalid)
                {
                    ctx.Response.StatusCode = 416; // Range Not Satisfiable
                    ctx.Response.AddHeader("Content-Range", $"bytes */{totalLength}");
                    ctx.Response.Close();
                    return;
                }
                if (parsed == RangeParseResult.Ok)
                {
                    start = s; end = e; isRange = true;
                }
            }
            var length = end - start + 1;

            try
            {
                ctx.Response.StatusCode = isRange ? 206 : 200;
                ctx.Response.ContentType = contentType;
                ctx.Response.ContentLength64 = length;
                ctx.Response.AddHeader("Access-Control-Allow-Origin", "*");
                ctx.Response.AddHeader("Accept-Ranges", "bytes");
                if (isRange)
                {
                    ctx.Response.AddHeader("Content-Range", $"bytes {start}-{end}/{totalLength}");
                }
                using (var fs = new FileStream(path, FileMode.Open, FileAccess.Read, FileShare.Read, 81920, useAsync: true))
                {
                    if (start > 0) fs.Seek(start, SeekOrigin.Begin);
                    var remaining = length;
                    var buffer = new byte[81920];
                    while (remaining > 0)
                    {
                        var toRead = (int)Math.Min(buffer.Length, remaining);
                        var read = await fs.ReadAsync(buffer, 0, toRead);
                        if (read <= 0) break;
                        await ctx.Response.OutputStream.WriteAsync(buffer, 0, read);
                        remaining -= read;
                    }
                }
                ctx.Response.OutputStream.Close();
            }
            catch (Exception ex)
            {
                Console.Error.WriteLine($"[files/audio] stream failed: {ex.Message}");
                try { ctx.Response.OutputStream.Close(); } catch { /* already closed */ }
            }
        }

        private enum RangeParseResult { Ok, NotPresent, Invalid }

        /// <summary>
        /// Parse an HTTP <c>Range</c> header. Only single-range
        /// <c>bytes=start-end</c> requests are supported (the
        /// frontend never sends multi-range). Returns
        /// <see cref="RangeParseResult.NotPresent"/> when the
        /// header is empty/missing so the caller can fall back
        /// to a full 200 OK response.
        /// </summary>
        private static RangeParseResult ParseRangeHeader(string header, long totalLength, out long start, out long end)
        {
            start = 0; end = totalLength - 1;
            if (string.IsNullOrEmpty(header)) return RangeParseResult.NotPresent;
            const string prefix = "bytes=";
            if (!header.StartsWith(prefix, StringComparison.OrdinalIgnoreCase)) return RangeParseResult.Invalid;
            var spec = header.Substring(prefix.Length).Trim();
            // Reject multi-range (contains comma).
            if (spec.Contains(',')) return RangeParseResult.Invalid;
            var dash = spec.IndexOf('-');
            if (dash < 0) return RangeParseResult.Invalid;
            var startStr = spec.Substring(0, dash).Trim();
            var endStr = spec.Substring(dash + 1).Trim();
            try
            {
                if (startStr.Length == 0)
                {
                    // Suffix range: "bytes=-N" → last N bytes.
                    if (!long.TryParse(endStr, out var suffix) || suffix <= 0) return RangeParseResult.Invalid;
                    start = Math.Max(0, totalLength - suffix);
                    end = totalLength - 1;
                }
                else
                {
                    if (!long.TryParse(startStr, out start)) return RangeParseResult.Invalid;
                    if (endStr.Length == 0) end = totalLength - 1;
                    else if (!long.TryParse(endStr, out end)) return RangeParseResult.Invalid;
                }
            }
            catch { return RangeParseResult.Invalid; }
            if (start < 0 || start >= totalLength || end < start || end >= totalLength)
            {
                return RangeParseResult.Invalid;
            }
            return RangeParseResult.Ok;
        }

        private static string MapContentType(string ext)
        {
            switch (ext)
            {
                case ".mp3": return "audio/mpeg";
                case ".ogg": return "audio/ogg";
                case ".wav": return "audio/wav";
                case ".flac": return "audio/flac";
                case ".m4a": return "audio/mp4";
                case ".aac": return "audio/aac";
                default: return "application/octet-stream";
            }
        }

        private static async Task GetMetadata(HttpContext ctx)
        {
            var path = ctx.QueryParam("path");
            var err = PathValidator.Validate(path);
            if (err != null) { await ctx.WriteJsonAsync(ApiResponse<object>.Fail(err), 400); return; }
            if (!System.IO.File.Exists(path)) { await ctx.WriteJsonAsync(ApiResponse<object>.Fail("File not found"), 404); return; }

            var meta = new AudioMetadata
            {
                Title = Path.GetFileNameWithoutExtension(path) ?? string.Empty,
                Artist = "Unknown Artist",
                Album = "Unknown Album"
            };
            try
            {
                using (var tagFile = TagLib.File.Create(path))
                {
                    var tag = tagFile.Tag;
                    meta.Title = string.IsNullOrEmpty(tag.Title) ? meta.Title : tag.Title;
                    meta.Artist = string.IsNullOrEmpty(tag.FirstAlbumArtist) ? "Unknown Artist" : tag.FirstAlbumArtist;
                    meta.Album = string.IsNullOrEmpty(tag.Album) ? "Unknown Album" : tag.Album;
                    if (tag.Year > 0) meta.Year = (int)tag.Year;
                    if (tag.Track > 0) meta.Track = (int)tag.Track;
                    if (tagFile.Properties != null)
                    {
                        var duration = tagFile.Properties.Duration.TotalSeconds;
                        if (duration > 0) meta.Duration = duration;
                    }
                    if (!string.IsNullOrEmpty(tag.FirstGenre)) meta.Genre = new List<string> { tag.FirstGenre };
                    if (tag.Pictures != null && tag.Pictures.Length > 0)
                    {
                        var pic = tag.Pictures[0];
                        var b64 = Convert.ToBase64String(pic.Data != null && pic.Data.Data != null ? pic.Data.Data : Array.Empty<byte>());
                        meta.Picture = new
                        {
                            format = pic.MimeType ?? "image/jpeg",
                            data = b64
                        };
                    }
                }
            }
            catch
            {
                // leave default metadata
            }
            await ctx.WriteJsonAsync(ApiResponse<object>.Ok(meta));
        }

        private static async Task MediaControl(HttpContext ctx)
        {
            var action = ctx.PathParams.ContainsKey("action") ? ctx.PathParams["action"] : "";
            try
            {
                switch (action)
                {
                    case "play-pause":
                        SendKey(NativeMethods.VK_MEDIA_PLAY_PAUSE);
                        break;
                    case "next":
                        SendKey(NativeMethods.VK_MEDIA_NEXT_TRACK);
                        break;
                    case "prev":
                        SendKey(NativeMethods.VK_MEDIA_PREV_TRACK);
                        break;
                    case "stop":
                        SendKey(NativeMethods.VK_MEDIA_STOP);
                        break;
                    default:
                        await ctx.WriteJsonAsync(ApiResponse<object>.Fail("Unknown action"));
                        return;
                }
                await ctx.WriteJsonAsync(ApiResponse<object>.Ok(new { opened = true }));
            }
            catch (Exception ex)
            {
                await ctx.WriteJsonAsync(ApiResponse<object>.Fail(ex.Message));
            }
        }

        private static void SendKey(byte vk)
        {
            NativeMethods.keybd_event(vk, 0, 0, IntPtr.Zero);
            NativeMethods.keybd_event(vk, 0, NativeMethods.KEYEVENTF_KEYUP, IntPtr.Zero);
        }
    }
}

