use axum::Json;
use chrono::Utc;
use sysinfo::{MemoryRefreshKind, RefreshKind, System};

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
