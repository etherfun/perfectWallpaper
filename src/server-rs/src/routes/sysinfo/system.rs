use axum::{extract::State, Json};
use chrono::Utc;
use sysinfo::{CpuRefreshKind, MemoryRefreshKind, RefreshKind, System, MINIMUM_CPU_UPDATE_INTERVAL};
use std::sync::Arc;

use super::cpu::{collect_cpu_infos, CpuInfo};
use super::gpu::{collect_gpu_infos, GpuInfo};
use crate::routes::config::AppStateWithConfig;

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

    // Refresh memory info
    sys.refresh_memory();

    // Get memory info
    let total_mem = sys.total_memory();
    let used_mem = sys.used_memory();

    let now = Utc::now().timestamp_millis();

    // Collect detailed CPU info (usage, frequency, cores, ...)
    // via the same helper that powers `GET /api/sysinfo/cpu`,
    // so both endpoints stay in lock-step. CPU temperature
    // fields stay at 0 / `available: false` — see the
    // `cpu.rs` module-level docs for the rationale (no
    // kernel driver, no admin).
    let cpu_info: Vec<CpuInfo> = collect_cpu_infos();

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

    // GPU info via `hardware_query` (no kernel driver, no
    // admin). Same helper that powers `GET /api/sysinfo/gpu`,
    // so the aggregate and per-component endpoints stay in
    // lock-step.
    let gpu_info: Vec<GpuInfo> = collect_gpu_infos();

    let response = serde_json::json!({
        "success": true,
        "data": {
            "cpu": cpu_info,
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
