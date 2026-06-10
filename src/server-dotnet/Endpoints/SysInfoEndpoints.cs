using System;
using System.Threading.Tasks;
using PerfectWall.Server.Models;
using PerfectWall.Server.Server;
using PerfectWall.Server.Services;

namespace PerfectWall.Server.Endpoints
{
    /// <summary>
    /// Mounts the sysinfo endpoints. The four original
    /// endpoints (<c>/api/sysinfo</c> aggregate + the three
    /// per-component ones) are preserved for backwards
    /// compatibility; this revision adds two more so the
    /// dashboard can poll only the section that changed.
    /// </summary>
    public static class SysInfoEndpoints
    {
        public static void Map(Router router, HardwareMonitorService hw, SystemSampler sampler)
        {
            router.Get("/api/sysinfo", ctx => GetSystemInfo(ctx, hw, sampler));
            router.Get("/api/sysinfo/cpu", ctx => GetCpu(ctx, hw));
            router.Get("/api/sysinfo/gpu", ctx => GetGpu(ctx, hw));
            router.Get("/api/sysinfo/memory", ctx => GetMemory(ctx, hw));
            router.Get("/api/sysinfo/network", ctx => GetNetwork(ctx, sampler));
            router.Get("/api/sysinfo/system", ctx => GetSystem(ctx, hw));
        }

        private static async Task GetSystemInfo(HttpContext ctx, HardwareMonitorService hw, SystemSampler sampler)
        {
            var now = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds();
            var cpu = hw.CollectCpu();
            var mem = hw.CollectMemory();
            var gpu = hw.CollectGpu();
            var net = sampler.ReadNetwork(now);
            var sys = hw.CollectSystem();

            var payload = new AggregateInfo
            {
                Cpu = cpu,
                Memory = mem,
                Gpu = gpu,
                Network = net,
                System = sys,
                Time = new TimeInfo
                {
                    Current = now,
                    Timezone = sys.Timezone,
                    Uptime = sys.Uptime
                }
            };

            await ctx.WriteJsonAsync(ApiResponse<AggregateInfo>.Ok(payload));
        }

        private static async Task GetCpu(HttpContext ctx, HardwareMonitorService hw)
        {
            await ctx.WriteJsonAsync(ApiResponse<object>.Ok(hw.CollectCpu()));
        }

        private static async Task GetGpu(HttpContext ctx, HardwareMonitorService hw)
        {
            await ctx.WriteJsonAsync(ApiResponse<object>.Ok(hw.CollectGpu()));
        }

        private static async Task GetMemory(HttpContext ctx, HardwareMonitorService hw)
        {
            await ctx.WriteJsonAsync(ApiResponse<object>.Ok(hw.CollectMemory()));
        }

        private static async Task GetNetwork(HttpContext ctx, SystemSampler sampler)
        {
            var now = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds();
            var net = sampler.ReadNetwork(now);
            await ctx.WriteJsonAsync(ApiResponse<NetworkInfo>.Ok(net));
        }

        private static async Task GetSystem(HttpContext ctx, HardwareMonitorService hw)
        {
            var sys = hw.CollectSystem();
            await ctx.WriteJsonAsync(ApiResponse<SystemInfo>.Ok(sys));
        }
    }
}
