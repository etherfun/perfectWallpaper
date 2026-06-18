using System;
using System.Linq;
using System.Threading.Tasks;
using PerfectWall.Server.Models;
using PerfectWall.Server.Server;
using PerfectWall.Server.Services;

namespace PerfectWall.Server.Endpoints
{
    /// <summary>
    /// Mounts the sysinfo endpoints. The original
    /// endpoints (<c>/api/sysinfo</c> aggregate + the
    /// per-component ones) are preserved for backwards
    /// compatibility; this revision adds a
    /// <c>/api/sysinfo/disk</c> endpoint for the new
    /// disk-info section and includes the same data in
    /// the aggregate.
    /// </summary>
    public static class SysInfoEndpoints
    {
        public static void Map(Router router, HardwareMonitorService hw, SystemSampler sampler, DiskInfoService disks)
        {
            router.Get("/api/sysinfo", ctx => GetSystemInfo(ctx, hw, sampler, disks));
            router.Get("/api/sysinfo/cpu", ctx => GetCpu(ctx, hw));
            router.Get("/api/sysinfo/gpu", ctx => GetGpu(ctx, hw));
            router.Get("/api/sysinfo/memory", ctx => GetMemory(ctx, hw));
            router.Get("/api/sysinfo/network", ctx => GetNetwork(ctx, sampler));
            router.Get("/api/sysinfo/system", ctx => GetSystem(ctx, hw));
            router.Get("/api/sysinfo/disk", ctx => GetDisk(ctx, hw, disks));

        }

        private static async Task GetSystemInfo(HttpContext ctx, HardwareMonitorService hw, SystemSampler sampler, DiskInfoService disks)
        {
            var now = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds();
            var cpu = hw.CollectCpu();
            var mem = hw.CollectMemory();
            var gpu = hw.CollectGpu();
            var net = sampler.ReadNetwork(now);
            var disk = disks.Collect(hw.CollectStorageActivities());
            var sys = hw.CollectSystem();

            var payload = new AggregateInfo
            {
                Cpu = cpu,
                Memory = mem,
                Gpu = gpu,
                Network = net,
                Disks = disk,
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

        private static async Task GetDisk(HttpContext ctx, HardwareMonitorService hw, DiskInfoService disks)
        {
            // Disk collection can take a few hundred ms
            // on first call (StorageManager.ReloadStorages
            // sends an IDENTIFY DEVICE to every
            // controller). The dashboard polls this
            // endpoint at the same cadence as the others
            // (≈1 Hz); the cost is comparable to a CPU
            // temperature read, so we keep it synchronous
            // on the request thread to preserve JSON
            // shape consistency with the other endpoints.
            // LHM storage sensors are polled here too so
            // the activity readings are available for
            // injection into the disk result.
            var disk = disks.Collect(hw.CollectStorageActivities());
            await ctx.WriteJsonAsync(ApiResponse<DiskSummaryInfo>.Ok(disk));
        }


    }
}
