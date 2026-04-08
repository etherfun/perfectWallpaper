use axum::Json;
use chrono::Utc;
use sysinfo::{CpuRefreshKind, RefreshKind, System, MINIMUM_CPU_UPDATE_INTERVAL};

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
