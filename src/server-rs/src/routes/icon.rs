use axum::{
    extract::Query,
    response::IntoResponse,
    Json,
};
use base64::Engine;
use serde::Deserialize;
use std::collections::HashMap;
use std::sync::Mutex;
use once_cell::sync::Lazy;

use crate::icon_extractor;

// Icon cache with 100 entry limit
static ICON_CACHE: Lazy<Mutex<HashMap<String, String>>> = Lazy::new(|| Mutex::new(HashMap::new()));

const MAX_CACHE_ENTRIES: usize = 100;

#[derive(Debug, Deserialize)]
pub struct IconQuery {
    pub path: String,
    /// Optional cache-busting parameter (e.g., timestamp, random value)
    /// Adding this parameter will bypass the cache and fetch fresh icon
    pub t: Option<String>,
}

pub async fn get_icon(Query(query): Query<IconQuery>) -> impl IntoResponse {
    let path = &query.path;
    let bypass_cache = query.t.is_some();

    // Check cache first (unless bypass is requested)
    if !bypass_cache {
        let cache = ICON_CACHE.lock().unwrap();
        if let Some(cached_icon) = cache.get(path) {
            return Json(serde_json::json!({
                "success": true,
                "data": {
                    "icon": cached_icon,
                    "cached": true
                },
                "timestamp": chrono::Utc::now().timestamp_millis()
            }));
        }
    }

    // Extract icon from file using the dedicated icon_extractor module
    #[cfg(windows)]
    let icon_base64 = match icon_extractor::get_icon_base64(path) {
        Ok(icon) => icon,
        Err(_) => extract_default_icon(),
    };

    #[cfg(not(windows))]
    let icon_base64 = extract_default_icon();

    // Cache the icon
    {
        let mut cache = ICON_CACHE.lock().unwrap();
        if cache.len() >= MAX_CACHE_ENTRIES {
            if let Some(first_key) = cache.keys().next().cloned() {
                cache.remove(&first_key);
            }
        }
        cache.insert(path.clone(), icon_base64.clone());
    }

    Json(serde_json::json!({
        "success": true,
        "data": {
            "icon": icon_base64,
            "cached": false
        },
        "timestamp": chrono::Utc::now().timestamp_millis()
    }))
}

fn extract_default_icon() -> String {
    "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSIjZmZmIj48cGF0aCBkPSJNMTIgMTVhMyAzIDAgMCAxLTYgMGExIDEgMCAwIDEgMS0xIDFhMSAxIDAgMCAxIDEgMWg1YTIuNSAyLjUgMCAwIDAgNS0xdi0yYTIuNSAyLjUgMCAwIDAgNS0xaC0yYTIuNSAyLjUgMCAwIDAgMi41LTEuNXYtMWg0YTIuNSAyLjUgMCAwIDAgMi41LTEuNWgtN2EyLjUgMi41IDAgMCAwLTUgMHYyYTIuNSAyLjUgMCAwIDAgNS0xaC0yYTIuNSAyLjUgMCAwIDAgMi41LTEuNWgtNGEyLjUgMi41IDAgMCAwLTUgMGExIDEgMCAwIDEgMS0xIDFhMSAxIDAgMCAxIDEgMWg2YTIuNSAyLjUgMCAwIDAgNS0hMXYtMGEyLjUgMi41IDAgMCAwLTUgMGgtNGEyLjUgMi41IDAgMCAwLTUgMGExIDEgMCAwIDEgMS0xIDFhMSAxIDAgMCAxIDEgMWg2YTIuNSAyLjUgMCAwIDAgNS0hoTlhMi41IDIuNSAwIDAgMCA1IDFoLTF6Ii8+PC9zdmc+".to_string()
}

/// Get all icons for a file (for user selection)
pub async fn get_all_icons(Query(query): Query<IconQuery>) -> impl IntoResponse {
    let path = &query.path;

    #[cfg(windows)]
    let icons_result = icon_extractor::extract_all_icons(path);

    #[cfg(not(windows))]
    let icons_result: Result<Vec<icon_extractor::IconData>, _> = Err(icon_extractor::IconError::UnsupportedPlatform);

    match icons_result {
        Ok(icons) => {
            let icon_list: Vec<serde_json::Value> = icons.into_iter().map(|icon| {
                let encoded = base64::engine::general_purpose::STANDARD.encode(&icon.png_data);
                let data_url = format!("data:image/png;base64,{}", encoded);
                serde_json::json!({
                    "icon": data_url,
                    "width": icon.width,
                    "height": icon.height,
                    "is_png": icon.is_png,
                })
            }).collect();

            Json(serde_json::json!({
                "success": true,
                "data": {
                    "icons": icon_list,
                    "count": icon_list.len()
                },
                "timestamp": chrono::Utc::now().timestamp_millis()
            }))
        }
        Err(_) => {
            Json(serde_json::json!({
                "success": false,
                "error": "Failed to extract icons",
                "data": {
                    "icons": [],
                    "count": 0
                },
                "timestamp": chrono::Utc::now().timestamp_millis()
            }))
        }
    }
}

/// Clear icon cache endpoint
pub async fn clear_icon_cache() -> impl IntoResponse {
    let count = {
        let mut cache = ICON_CACHE.lock().unwrap();
        let count = cache.len();
        cache.clear();
        count
    };

    Json(serde_json::json!({
        "success": true,
        "data": {
            "cleared": count
        },
        "timestamp": chrono::Utc::now().timestamp_millis()
    }))
}

/// Upload custom icon request
#[derive(Debug, Deserialize)]
pub struct CustomIconRequest {
    /// Base64 encoded image data (without the data:image/...;base64, prefix)
    pub data: String,
    /// Optional image type (default: "image/png")
    #[serde(rename = "type")]
    pub image_type: Option<String>,
}

impl CustomIconRequest {
    fn mime_type(&self) -> &str {
        match self.image_type.as_deref() {
            Some("image/png") => "image/png",
            Some("image/jpeg") | Some("image/jpg") => "image/jpeg",
            Some("image/webp") => "image/webp",
            Some("image/gif") => "image/gif",
            Some("image/svg+xml") => "image/svg+xml",
            _ => "image/png",
        }
    }
}

/// Upload custom icon and return as data URL
pub async fn upload_custom_icon(Json(payload): Json<CustomIconRequest>) -> impl IntoResponse {
    // Decode base64 data
    let image_data = match base64::engine::general_purpose::STANDARD.decode(&payload.data) {
        Ok(data) => data,
        Err(_) => {
            return Json(serde_json::json!({
                "success": false,
                "error": "Invalid base64 data",
                "timestamp": chrono::Utc::now().timestamp_millis()
            }));
        }
    };

    // Validate image type by checking magic bytes
    let is_valid = match payload.mime_type() {
        "image/png" => image_data.len() >= 8 && image_data[0..8] == [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A],
        "image/jpeg" => image_data.len() >= 3 && image_data[0..2] == [0xFF, 0xD8],
        "image/gif" => image_data.len() >= 6 && (&image_data[0..6] == b"GIF87a" || &image_data[0..6] == b"GIF89a"),
        "image/webp" => image_data.len() >= 12 && &image_data[0..4] == b"RIFF" && &image_data[8..12] == b"WEBP",
        "image/svg+xml" => image_data.len() >= 5 && &image_data[0..5] == b"<svg ",
        _ => false,
    };

    if !is_valid {
        return Json(serde_json::json!({
            "success": false,
            "error": format!("Invalid image data for type {}", payload.mime_type()),
            "timestamp": chrono::Utc::now().timestamp_millis()
        }));
    }

    // Encode back to base64 data URL
    let encoded = base64::engine::general_purpose::STANDARD.encode(&image_data);
    let data_url = format!("data:{};base64,{}", payload.mime_type(), encoded);

    Json(serde_json::json!({
        "success": true,
        "data": {
            "icon": data_url,
            "size": image_data.len()
        },
        "timestamp": chrono::Utc::now().timestamp_millis()
    }))
}
