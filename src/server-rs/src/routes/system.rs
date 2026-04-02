use axum::{extract::State, Json};
use chrono::Utc;
use sysinfo::{CpuRefreshKind, MemoryRefreshKind, RefreshKind, System, MINIMUM_CPU_UPDATE_INTERVAL};
use std::sync::Arc;

use super::config::AppStateWithConfig;

#[derive(serde::Serialize)]
pub struct GpuInfo {
    pub id: usize,
    pub model: String,
    pub vendor: String,
    pub vram: u64,
    pub utilization: f32,
    pub temperature: f32,
}

#[cfg(windows)]
fn get_gpu_info_windows() -> Vec<GpuInfo> {
    use hardware_query::GPUInfo;

    match GPUInfo::query_all() {
        Ok(gpus) => {
            gpus.into_iter().enumerate().map(|(idx, gpu)| {
                let vendor_str = match gpu.vendor {
                    hardware_query::GPUVendor::NVIDIA => "NVIDIA",
                    hardware_query::GPUVendor::AMD => "AMD",
                    hardware_query::GPUVendor::Intel => "Intel",
                    hardware_query::GPUVendor::Apple => "Apple",
                    hardware_query::GPUVendor::ARM => "ARM",
                    hardware_query::GPUVendor::Qualcomm => "Qualcomm",
                    hardware_query::GPUVendor::Unknown(ref s) => s,
                };
                GpuInfo {
                    id: idx,
                    model: gpu.model_name,
                    vendor: vendor_str.to_string(),
                    vram: gpu.memory_mb * 1024 * 1024, // Convert MB to bytes
                    utilization: gpu.usage_percent.unwrap_or(0.0),
                    temperature: gpu.temperature.unwrap_or(0.0),
                }
            }).collect()
        }
        Err(_) => {
            vec![GpuInfo {
                id: 0,
                model: "Unknown".to_string(),
                vendor: "Unknown".to_string(),
                vram: 0,
                utilization: 0.0,
                temperature: 0.0,
            }]
        }
    }
}

pub async fn get_system_info(
    State(state): State<Arc<AppStateWithConfig>>,
) -> impl axum::response::IntoResponse {
    let mut sys = System::new_with_specifics(
        RefreshKind::new()
            .with_cpu(CpuRefreshKind::everything())
            .with_memory(MemoryRefreshKind::everything())
    );

    // First CPU refresh - establishes baseline
    sys.refresh_cpu_usage();

    // Wait for accurate calculation
    std::thread::sleep(MINIMUM_CPU_UPDATE_INTERVAL);

    // Second CPU refresh - now accurate
    sys.refresh_cpu_usage();

    // Get memory info
    let total_mem = sys.total_memory();
    let used_mem = sys.used_memory();

    // Get CPU info
    let cpu = sys.cpus();
    let cpu_data = cpu.first();

    let now = Utc::now().timestamp_millis();

    // Get network stats
    let networks = sysinfo::Networks::new_with_refreshed_list();
    let mut total_rx: u64 = 0;
    let mut total_tx: u64 = 0;
    for (_name, data) in &networks {
        total_rx += data.total_received();
        total_tx += data.total_transmitted();
    }

    // Calculate network speed
    let (last_rx, last_tx, last_time) = {
        let cached = state.app.cached_network.read().await;
        *cached
    };

    let (rx, tx) = if last_time > 0 {
        let elapsed = (now - last_time) as f64 / 1000.0;
        if elapsed > 0.0 {
            (
                ((total_rx - last_rx) as f64 / elapsed).max(0.0),
                ((total_tx - last_tx) as f64 / elapsed).max(0.0),
            )
        } else {
            (0.0, 0.0)
        }
    } else {
        (0.0, 0.0)
    };

    {
        let mut cached = state.app.cached_network.write().await;
        *cached = (total_rx, total_tx, now);
    }

    // Get GPU info
    #[cfg(windows)]
    let gpu_info = get_gpu_info_windows();

    #[cfg(not(windows))]
    let gpu_info = vec![GpuInfo {
        id: 0,
        model: "Unknown".to_string(),
        vendor: "Unknown".to_string(),
        vram: 0,
        utilization: 0.0,
        temperature: 0.0,
    }];

    // Detect CPU manufacturer from brand string
    let cpu_manufacturer = cpu_data.map(|c| {
        let brand = c.brand();
        if brand.contains("AMD") { "AMD" }
        else if brand.contains("Intel") { "Intel" }
        else if brand.contains("Apple") { "Apple" }
        else if brand.contains("ARM") { "ARM" }
        else { "Unknown" }
    }).unwrap_or("Unknown");

    let response = serde_json::json!({
        "success": true,
        "data": {
            "cpu": {
                "manufacturer": cpu_manufacturer,
                "brand": cpu_data.map(|c| c.brand()).unwrap_or("Unknown"),
                "speed": cpu_data.map(|c| c.frequency()).unwrap_or(0),
                "cores": cpu.len() as u32,
                "physical_cores": sys.physical_core_count().unwrap_or(1) as u32,
                "usage": sys.global_cpu_info().cpu_usage()
            },
            "memory": {
                "total": total_mem,
                "used": used_mem,
                "free": total_mem - used_mem,
                "used_percent": if total_mem > 0 { (used_mem as f32 / total_mem as f32) * 100.0 } else { 0.0 }
            },
            "gpu": gpu_info,
            "network": { "rx": rx, "tx": tx },
            "system": {
                "hostname": System::host_name().unwrap_or_else(|| "Unknown".to_string()),
                "platform": System::name().unwrap_or_else(|| "Unknown".to_string()),
                "distro": System::long_os_version().unwrap_or_else(|| "Unknown".to_string()),
                "release": System::os_version().unwrap_or_else(|| "Unknown".to_string()),
                "arch": std::env::consts::ARCH,
                "uptime": System::uptime()
            },
            "time": {
                "current": now,
                "timezone": "",
                "uptime": System::uptime()
            }
        },
        "timestamp": now
    });

    Json(response)
}

pub async fn get_cpu_usage() -> impl axum::response::IntoResponse {
    let now = Utc::now().timestamp_millis();

    let mut sys = System::new_with_specifics(
        RefreshKind::new().with_cpu(CpuRefreshKind::everything())
    );

    sys.refresh_cpu_usage();
    std::thread::sleep(MINIMUM_CPU_UPDATE_INTERVAL);
    sys.refresh_cpu_usage();

    let usage = sys.global_cpu_info().cpu_usage();

    Json(serde_json::json!({
        "success": true,
        "data": usage,
        "timestamp": now
    }))
}

pub async fn get_memory_info() -> impl axum::response::IntoResponse {
    let mut sys = System::new_with_specifics(
        RefreshKind::new().with_memory(MemoryRefreshKind::everything())
    );
    sys.refresh_memory();
    let total = sys.total_memory();
    let used = sys.used_memory();
    let now = Utc::now().timestamp_millis();

    Json(serde_json::json!({
        "success": true,
        "data": {
            "total": total,
            "used": used,
            "free": total - used,
            "used_percent": if total > 0 { (used as f32 / total as f32) * 100.0 } else { 0.0 }
        },
        "timestamp": now
    }))
}

pub async fn get_gpu_info() -> impl axum::response::IntoResponse {
    let now = Utc::now().timestamp_millis();

    #[cfg(windows)]
    let gpu = get_gpu_info_windows();

    #[cfg(not(windows))]
    let gpu = vec![GpuInfo {
        id: 0,
        model: "Unknown".to_string(),
        vendor: "Unknown".to_string(),
        vram: 0,
        utilization: 0.0,
        temperature: 0.0,
    }];

    Json(serde_json::json!({
        "success": true,
        "data": gpu,
        "timestamp": now
    }))
}
