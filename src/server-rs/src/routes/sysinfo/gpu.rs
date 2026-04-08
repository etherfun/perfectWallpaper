use axum::Json;
use chrono::Utc;

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
                    vram: gpu.memory_mb * 1024 * 1024,
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
