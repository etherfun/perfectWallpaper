import {
  cpu,
  cpuCurrentSpeed,
  mem,
  graphics,
  networkStats,
  system,
  time
} from 'systeminformation';

export interface SystemInfo {
  cpu: {
    manufacturer: string;
    brand: string;
    speed: number;
    cores: number;
    physicalCores: number;
    usage: number;
  };
  memory: {
    total: number;
    used: number;
    free: number;
    usedPercent: number;
  };
  gpu: {
    id: number;
    model: string;
    vendor: string;
    vram: number;
    utilization: number;
    temperature: number;
  }[];
  network: {
    rx: number;
    tx: number;
  };
  system: {
    hostname: string;
    platform: string;
    distro: string;
    release: string;
    arch: string;
    uptime: number;
  };
  time: {
    current: number;
    timezone: string;
    uptime: number;
  };
}

let cachedNetworkStats: { rx: number; tx: number } | null = null;
let lastNetworkCheck = 0;

export async function getSystemInfo(): Promise<SystemInfo> {
  const [cpuData, cpuSpeed, memData, graphicsData, networkData, systemData, timeData] = await Promise.all([
    cpu(),
    cpuCurrentSpeed(),
    mem(),
    graphics(),
    networkStats(),
    system(),
    time()
  ]);

  // Calculate network traffic (bytes per second since last call)
  const now = Date.now();
  const currentRx = networkData.reduce((sum, n) => sum + (n.rx_bytes || 0), 0);
  const currentTx = networkData.reduce((sum, n) => sum + (n.tx_bytes || 0), 0);

  let networkSpeed = { rx: 0, tx: 0 };
  if (cachedNetworkStats && lastNetworkCheck > 0) {
    const elapsed = (now - lastNetworkCheck) / 1000;
    if (elapsed > 0) {
      networkSpeed = {
        rx: Math.max(0, (currentRx - cachedNetworkStats.rx) / elapsed),
        tx: Math.max(0, (currentTx - cachedNetworkStats.tx) / elapsed)
      };
    }
  }
  cachedNetworkStats = { rx: currentRx, tx: currentTx };
  lastNetworkCheck = now;

  // Get GPU info
  const gpus = graphicsData.controllers.map((gpu, index) => ({
    id: index,
    model: gpu.model || 'Unknown',
    vendor: gpu.vendor || 'Unknown',
    vram: gpu.vram || 0,
    utilization: gpu.utilizationGpu || 0,
    temperature: gpu.temperatureGpu || 0
  }));

  return {
    cpu: {
      manufacturer: (cpuData as any).manufacturer || 'Unknown',
      brand: (cpuData as any).brand || 'Unknown',
      speed: cpuSpeed.avg || 0,
      cores: (cpuData as any).cores || 0,
      physicalCores: (cpuData as any).physicalCores || 0,
      usage: (cpuData as any).currentLoad || 0
    },
    memory: {
      total: memData.total,
      used: memData.used,
      free: memData.free,
      usedPercent: (memData.used / memData.total) * 100
    },
    gpu: gpus,
    network: networkSpeed,
    system: {
      hostname: (systemData as any).hostname || 'Unknown',
      platform: (systemData as any).platform || 'Unknown',
      distro: (systemData as any).distro || 'Unknown',
      release: (systemData as any).release || 'Unknown',
      arch: (systemData as any).arch || 'Unknown',
      uptime: (systemData as any).uptime || 0
    },
    time: {
      current: timeData.current,
      timezone: timeData.timezone || 'Unknown',
      uptime: timeData.uptime || 0
    }
  };
}

// Get CPU usage only (lightweight)
export async function getCpuUsage(): Promise<number> {
  const cpuData = await cpu();
  return (cpuData as any).currentLoad || 0;
}

// Get memory info only (lightweight)
export async function getMemoryInfo(): Promise<{ total: number; used: number; free: number; usedPercent: number }> {
  const memData = await mem();
  return {
    total: memData.total,
    used: memData.used,
    free: memData.free,
    usedPercent: (memData.used / memData.total) * 100
  };
}

// Get GPU info only (lightweight)
export async function getGpuInfo(): Promise<SystemInfo['gpu']> {
  const graphicsData = await graphics();
  return graphicsData.controllers.map((gpu, index) => ({
    id: index,
    model: gpu.model || 'Unknown',
    vendor: gpu.vendor || 'Unknown',
    vram: gpu.vram || 0,
    utilization: gpu.utilizationGpu || 0,
    temperature: gpu.temperatureGpu || 0
  }));
}
