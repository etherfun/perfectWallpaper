using System;
using System.Threading.Tasks;
using Newtonsoft.Json;
using PerfectWall.Server.Models;
using PerfectWall.Server.Server;
using PerfectWall.Server.Services;

namespace PerfectWall.Server.Endpoints
{
    public static class ConfigEndpoints
    {
        public static void Map(Router router, Func<ServerConfig> configGetter, Action<ServerConfig> configSetter)
        {
            router.Get("/api/config", ctx => Get(ctx, configGetter));
            router.Post("/api/config", ctx => Update(ctx, configGetter, configSetter));
        }

        private static async Task Get(HttpContext ctx, Func<ServerConfig> getter)
        {
            var c = getter();
            await ctx.WriteJsonAsync(ApiResponse<object>.Ok(new ConfigView
            {
                Port = c.Port,
                AutoStart = c.AutoStart,
                LogLevel = c.LogLevel
            }));
        }

        private static async Task Update(HttpContext ctx, Func<ServerConfig> getter, Action<ServerConfig> setter)
        {
            try
            {
                var body = ctx.ReadBody();
                var req = JsonConvert.DeserializeObject<UpdateConfigRequest>(body);
                if (req == null) { await ctx.WriteJsonAsync(ApiResponse<object>.Fail("Invalid body")); return; }
                var c = getter();
                var errors = new System.Collections.Generic.List<string>();
                if (req.Port.HasValue)
                {
                    var v = c.Validate();
                    if (v != null) { await ctx.WriteJsonAsync(ApiResponse<object>.Fail(v)); return; }
                    c.Port = req.Port.Value;
                }
                if (req.AutoStart.HasValue)
                {
                    var prev = c.AutoStart;
                    c.AutoStart = req.AutoStart.Value;
                    // Route the actual registry write through
                    // SetupService so the user-mode and admin-mode
                    // paths share the same error handling.
                    try { SetupService.SetAutoStartUser(c.AutoStart); }
                    catch (Exception ex) { errors.Add(ex.Message); }
                }
                if (!string.IsNullOrEmpty(req.LogLevel)) c.LogLevel = req.LogLevel;
                c.Save();
                setter(c);
                await ctx.WriteJsonAsync(ApiResponse<object>.Ok(new ConfigView
                {
                    Port = c.Port,
                    AutoStart = c.AutoStart,
                    LogLevel = c.LogLevel
                }));
            }
            catch (Exception ex)
            {
                await ctx.WriteJsonAsync(ApiResponse<object>.Fail(ex.Message));
            }
        }
    }
}
