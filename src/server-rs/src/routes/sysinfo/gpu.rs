//! GPU info endpoint.
//!
//! Uses the `hardware_query` crate to enumerate GPUs on Windows
//! (vendor / model / utilisation / temperature / VRAM). No
//! kernel driver is loaded, so the `perfectwall-server` process
//! does **not** need administrator privileges and will not
//! trigger Microsoft Defender's vulnerable-driver blocklist
//! (the previous LHM-based implementation loaded WinRing0, which
//! is on that blocklist).
//!
//! JSON contract (preserved verbatim from the LHM era — see
//! `src/systemMonitor/types.ts` and
//! `tests/systemMonitor/cpuPayload.test.ts` for the consumer
//! side of the contract):
//!
//! ```json
//! {
//!   "id": 0,
//!   "model": "NVIDIA GeForce RTX 4080",
//!   "vendor": "NVIDIA|AMD|Intel|Apple|ARM|Qualcomm|Unknown",
//!   "vram": 12884901888,
//!   "utilization": 25.5,
//!   "temperature": 45.0
//! }
//! ```

use axum::Json;
use chrono::Utc;
use serde::Serialize;

#[cfg(windows)]
use hardware_query::GPUInfo;

/// Public JSON shape — must stay byte-for-byte identical to
/// the LHM-era and `hardware_query`-era versions so existing
/// frontends keep working.
#[derive(Debug, Clone, Serialize)]
pub struct GpuInfo {
    pub id: usize,
    /// Full GPU model string.
    pub model: String,
    /// Vendor name: `"NVIDIA"` / `"AMD"` / `"Intel"` /
    /// `"Apple"` / `"ARM"` / `"Qualcomm"` / `"Unknown"`.
    pub vendor: String,
    /// Dedicated video memory in bytes. `0` when `hardware_query`
    /// could not supply a value.
    pub vram: u64,
    /// GPU utilisation in percent (0-100). `0.0` when not
    /// available.
    pub utilization: f32,
    /// GPU core temperature in °C. `0.0` when not available.
    pub temperature: f32,
}

#[cfg(windows)]
fn gpu_vendor_to_string(vendor: &hardware_query::GPUVendor) -> String {
    use hardware_query::GPUVendor;
    match vendor {
        GPUVendor::NVIDIA => "NVIDIA",
        GPUVendor::AMD => "AMD",
        GPUVendor::Intel => "Intel",
        GPUVendor::Apple => "Apple",
        GPUVendor::ARM => "ARM",
        GPUVendor::Qualcomm => "Qualcomm",
        GPUVendor::Unknown(s) => s,
    }
    .to_string()
}

#[cfg(windows)]
fn collect_gpu_infos_windows() -> Vec<GpuInfo> {
    match GPUInfo::query_all() {
        Ok(gpus) => gpus
            .into_iter()
            .enumerate()
            .map(|(idx, gpu)| GpuInfo {
                id: idx,
                model: gpu.model_name,
                vendor: gpu_vendor_to_string(&gpu.vendor),
                // `hardware_query` reports memory in MB; the
                // JSON contract is bytes.
                vram: gpu.memory_mb * 1024 * 1024,
                utilization: gpu.usage_percent.unwrap_or(0.0),
                temperature: gpu.temperature.unwrap_or(0.0),
            })
            .collect(),
        // `hardware_query` failure path: return a single
        // placeholder entry, identical to the LHM era so
        // the frontend keeps getting one element to render
        // (just full of zeros / "Unknown").
        Err(_) => vec![GpuInfo {
            id: 0,
            model: "Unknown".to_string(),
            vendor: "Unknown".to_string(),
            vram: 0,
            utilization: 0.0,
            temperature: 0.0,
        }],
    }
}

/// Entry point used by both `get_gpu_info` and
/// `get_system_info`. Always returns a `Vec<GpuInfo>`; never
/// panics, never returns `None`.
pub fn collect_gpu_infos() -> Vec<GpuInfo> {
    #[cfg(windows)]
    {
        collect_gpu_infos_windows()
    }

    #[cfg(not(windows))]
    {
        // `hardware_query` is Windows-only; other platforms
        // get the same placeholder the LHM failure path
        // produced.
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

/// `GET /api/sysinfo/gpu` — GPU information (array form, to
/// stay symmetrical with the CPU endpoint).
pub async fn get_gpu_info() -> impl axum::response::IntoResponse {
    let now = Utc::now().timestamp_millis();
    let data = collect_gpu_infos();

    Json(serde_json::json!({
        "success": true,
        "data": data,
        "timestamp": now
    }))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn gpu_info_serializes_to_expected_keys() {
        // Regression guard: `tests/systemMonitor/cpuPayload.test.ts`
        // pins the JSON contract. If a field is renamed or
        // removed, the frontend silently breaks. We don't
        // snapshot the full JSON here (the integration tests
        // do that); we just assert the field names we still
        // promise to expose on the wire are present in the
        // serialised form.
        let gpu = GpuInfo {
            id: 0,
            model: "NVIDIA GeForce RTX 4080".to_string(),
            vendor: "NVIDIA".to_string(),
            vram: 16 * 1024 * 1024 * 1024,
            utilization: 25.5,
            temperature: 45.0,
        };
        let json = serde_json::to_value(&gpu).unwrap();
        for key in [
            "id",
            "model",
            "vendor",
            "vram",
            "utilization",
            "temperature",
        ] {
            assert!(
                json.get(key).is_some(),
                "GpuInfo JSON contract: missing field `{key}`"
            );
        }
    }

    #[test]
    fn collect_gpu_infos_returns_at_least_one_placeholder_on_non_windows() {
        // On non-Windows targets `hardware_query` doesn't
        // exist; the function must still return a `Vec` with
        // exactly one placeholder, matching the Windows
        // failure-path shape.
        #[cfg(not(windows))]
        {
            let infos = collect_gpu_infos();
            assert_eq!(infos.len(), 1);
            assert_eq!(infos[0].id, 0);
            assert_eq!(infos[0].model, "Unknown");
            assert_eq!(infos[0].vendor, "Unknown");
            assert_eq!(infos[0].vram, 0);
        }
    }
}
