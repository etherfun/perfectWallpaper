//! CPU info endpoint.
//!
//! **CPU temperature is intentionally always reported as 0 /
//! `temperature_available: false`.** Modern Windows 10/11 desktop
//! SKUs have had the consumer-grade ACPI thermal-zone WMI class
//! (`MSAcpi_ThermalZoneTemperature`) removed by Microsoft, so
//! neither `sysinfo` nor `wmic` can read it without admin
//! privileges or a third-party kernel driver (e.g. WinRing0 /
//! PawnIO). Both of those trigger Microsoft Defender's
//! vulnerable-driver blocklist, so we deliberately do not load
//! them. The temperature fields stay in the JSON so the
//! `/api/sysinfo` contract is preserved — the frontend's
//! `formatTemperature()` returns `null` for `0.0` and simply
//! hides the `(°C)` suffix.
//!
//! Everything else (usage, frequency, cores) comes from
//! `sysinfo` and works without admin.

use axum::Json;
use chrono::Utc;
use serde::Serialize;
use sysinfo::{CpuRefreshKind, RefreshKind, System, MINIMUM_CPU_UPDATE_INTERVAL};

/// One CPU temperature sensor reading. The struct shape is kept
/// for API compatibility with the previous LHM-backed
/// implementation, but every field is now always 0 / `None` /
/// empty — see the module-level docs for the rationale.
#[derive(Debug, Clone, Serialize)]
pub struct CpuTempComponent {
    /// Sensor name. Always empty in this build.
    pub label: String,
    /// Current temperature (°C). Always 0.0.
    pub temperature: f32,
    /// Session max temperature (°C). Always 0.0.
    pub max: f32,
    /// Critical threshold (°C). Always `None`.
    pub critical: Option<f32>,
}

/// One CPU's full information. Returned as a single-element
/// array to keep the response shape identical to the previous
/// LHM-backed code (multi-CPU servers are out of scope).
#[derive(Debug, Clone, Serialize)]
pub struct CpuInfo {
    pub id: usize,
    /// `AMD` / `Intel` / `Apple` / `ARM` / `Unknown`.
    pub manufacturer: String,
    /// Full brand string.
    pub brand: String,
    /// Current frequency in MHz.
    pub speed: u64,
    /// Logical core count (including hyperthreads).
    pub cores: u32,
    /// Physical core count.
    pub physical_cores: u32,
    /// Whole-CPU usage, 0-100.
    pub usage: f32,
    /// Current temperature (°C). Always 0.0 in this build —
    /// see module-level docs.
    pub temperature: f32,
    /// Session max temperature (°C). Always 0.0.
    pub temperature_max: f32,
    /// Critical threshold (°C). Always `None`.
    pub temperature_critical: Option<f32>,
    /// Source sensor label. Always empty.
    pub temperature_label: String,
    /// Whether a valid temperature was read. Always `false`.
    pub temperature_available: bool,
    /// Number of temperature sensors detected. Always 0.
    pub temperature_component_count: u32,
    /// All sensor readings. Always empty.
    pub temperature_components: Vec<CpuTempComponent>,
}

/// Collect one [`CpuInfo`] per physical CPU. Mainstream PCs
/// return a single-element array (see the multi-CPU note in
/// the previous LHM version of this function; the rationale is
/// unchanged).
pub fn collect_cpu_infos() -> Vec<CpuInfo> {
    let mut sys = System::new_with_specifics(
        RefreshKind::new().with_cpu(CpuRefreshKind::everything()),
    );

    // Two `refresh_cpu_usage` calls spaced by
    // `MINIMUM_CPU_UPDATE_INTERVAL` are required to get a
    // non-zero `global_cpu_info().cpu_usage()` — `sysinfo`
    // computes the delta between two samples. This is the same
    // pattern the previous LHM-backed version used.
    sys.refresh_cpu_usage();
    std::thread::sleep(MINIMUM_CPU_UPDATE_INTERVAL);
    sys.refresh_cpu_usage();

    let cpus = sys.cpus();
    let first = cpus.first();

    let manufacturer = first
        .map(|c| {
            let brand = c.brand();
            if brand.contains("AMD") {
                "AMD"
            } else if brand.contains("Intel") {
                "Intel"
            } else if brand.contains("Apple") {
                "Apple"
            } else if brand.contains("ARM") {
                "ARM"
            } else {
                "Unknown"
            }
        })
        .unwrap_or("Unknown")
        .to_string();

    vec![CpuInfo {
        id: 0,
        manufacturer,
        brand: first.map(|c| c.brand().to_string()).unwrap_or_default(),
        speed: first.map(|c| c.frequency()).unwrap_or(0),
        cores: cpus.len() as u32,
        physical_cores: sys.physical_core_count().unwrap_or(1) as u32,
        usage: sys.global_cpu_info().cpu_usage(),
        // All temperature fields stay at their default
        // (zero / None / empty) values; the API contract is
        // preserved, the frontend simply hides the `(°C)`
        // suffix when `temperature_available` is false.
        temperature: 0.0,
        temperature_max: 0.0,
        temperature_critical: None,
        temperature_label: String::new(),
        temperature_available: false,
        temperature_component_count: 0,
        temperature_components: Vec::new(),
    }]
}

/// `GET /api/sysinfo/cpu` — CPU information (array form, to
/// stay symmetrical with the GPU endpoint).
pub async fn get_cpu_info() -> impl axum::response::IntoResponse {
    let now = Utc::now().timestamp_millis();
    let data = collect_cpu_infos();

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
    fn collect_cpu_infos_returns_single_entry() {
        let infos = collect_cpu_infos();
        assert_eq!(infos.len(), 1);

        let cpu = &infos[0];
        // Manufacturer must be one of the canonical strings.
        assert!(matches!(
            cpu.manufacturer.as_str(),
            "AMD" | "Intel" | "Apple" | "ARM" | "Unknown"
        ));

        // All temperature fields must report "no data" — the
        // whole point of the LHM rollback is that we never
        // touch the kernel, so we never read a sensor.
        assert_eq!(cpu.temperature, 0.0);
        assert_eq!(cpu.temperature_max, 0.0);
        assert!(cpu.temperature_critical.is_none());
        assert!(cpu.temperature_label.is_empty());
        assert!(!cpu.temperature_available);
        assert_eq!(cpu.temperature_component_count, 0);
        assert!(cpu.temperature_components.is_empty());

        // `usage` is a 0-100 percentage and must be finite.
        // We don't pin an exact value (it's a runtime
        // measurement) but it must be in range.
        assert!(cpu.usage.is_finite());
        assert!((0.0..=100.0).contains(&cpu.usage));
    }

    #[test]
    fn cpu_info_serializes_to_expected_keys() {
        // Regression guard: the JSON contract is what
        // `tests/systemMonitor/cpuPayload.test.ts` pins. If
        // a field is renamed, removed, or moved into a
        // nested object, the frontend silently breaks. We
        // don't snapshot the full JSON here (the integration
        // tests in `tests/systemMonitor/` do that); we just
        // assert the field names we still promise to expose
        // on the wire are present in the serialised form.
        let cpu = CpuInfo {
            id: 0,
            manufacturer: "AMD".to_string(),
            brand: "AMD Ryzen 9 7845HX".to_string(),
            speed: 2011,
            cores: 24,
            physical_cores: 12,
            usage: 13.5,
            temperature: 0.0,
            temperature_max: 0.0,
            temperature_critical: None,
            temperature_label: String::new(),
            temperature_available: false,
            temperature_component_count: 0,
            temperature_components: Vec::new(),
        };
        let json = serde_json::to_value(&cpu).unwrap();

        for key in [
            "id",
            "manufacturer",
            "brand",
            "speed",
            "cores",
            "physical_cores",
            "usage",
            "temperature",
            "temperature_max",
            "temperature_critical",
            "temperature_label",
            "temperature_available",
            "temperature_component_count",
            "temperature_components",
        ] {
            assert!(
                json.get(key).is_some(),
                "CpuInfo JSON contract: missing field `{key}`"
            );
        }
    }
}
