use axum::{
    extract::Query,
    response::IntoResponse,
    Json,
};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::sync::Mutex;
use once_cell::sync::Lazy;

#[cfg(windows)]
use std::ffi::OsStr;
#[cfg(windows)]
use std::os::windows::ffi::OsStrExt;

#[cfg(windows)]
use windows::Win32::UI::Shell::ShellExecuteW;
#[cfg(windows)]
use windows::Win32::UI::WindowsAndMessaging::SW_SHOW;
#[cfg(windows)]
use windows::Win32::Foundation::HWND;
#[cfg(windows)]
use windows::core::PCWSTR;

// Icon cache with 100 entry limit
static ICON_CACHE: Lazy<Mutex<HashMap<String, String>>> = Lazy::new(|| Mutex::new(HashMap::new()));

const MAX_CACHE_ENTRIES: usize = 100;

#[derive(Debug, Serialize, Deserialize)]
pub struct OpenItemRequest {
    #[serde(rename = "type")]
    pub item_type: String,
    pub path: Option<String>,
    pub url: Option<String>,
}

#[cfg(windows)]
fn to_wide_string(s: &str) -> Vec<u16> {
    OsStr::new(s).encode_wide().chain(std::iter::once(0)).collect()
}

#[cfg(windows)]
pub async fn open_item(Json(payload): Json<OpenItemRequest>) -> impl IntoResponse {
    let result = match payload.item_type.as_str() {
        "url" => {
            if let Some(url) = &payload.url {
                open_url(url)
            } else {
                Json(serde_json::json!({
                    "success": false,
                    "error": "URL is required for type 'url'",
                    "timestamp": chrono::Utc::now().timestamp_millis()
                }))
            }
        }
        "app" | "file" => {
            if let Some(path) = &payload.path {
                open_path(path)
            } else {
                Json(serde_json::json!({
                    "success": false,
                    "error": "Path is required for type 'app' or 'file'",
                    "timestamp": chrono::Utc::now().timestamp_millis()
                }))
            }
        }
        _ => Json(serde_json::json!({
            "success": false,
            "error": "Invalid type. Must be 'app', 'file', or 'url'",
            "timestamp": chrono::Utc::now().timestamp_millis()
        })),
    };

    result
}

#[cfg(windows)]
fn open_url(url: &str) -> Json<serde_json::Value> {
    let wide = to_wide_string(url);
    let result = unsafe {
        ShellExecuteW(
            HWND::default(),
            PCWSTR::null(),
            PCWSTR(wide.as_ptr()),
            PCWSTR::null(),
            PCWSTR::null(),
            SW_SHOW,
        )
    };

    if result.0 as isize > 32 {
        Json(serde_json::json!({
            "success": true,
            "data": { "opened": true },
            "timestamp": chrono::Utc::now().timestamp_millis()
        }))
    } else {
        Json(serde_json::json!({
            "success": false,
            "error": format!("Failed to open URL: error code {}", result.0 as isize),
            "timestamp": chrono::Utc::now().timestamp_millis()
        }))
    }
}

#[cfg(windows)]
fn open_path(path: &str) -> Json<serde_json::Value> {
    let wide = to_wide_string(path);
    let result = unsafe {
        ShellExecuteW(
            HWND::default(),
            PCWSTR::null(),
            PCWSTR(wide.as_ptr()),
            PCWSTR::null(),
            PCWSTR::null(),
            SW_SHOW,
        )
    };

    // Error code 2 = file not found, might be relative path or in PATH
    if result.0 as isize == 2 {
        let ps_result = std::process::Command::new("powershell")
            .args(&["-WindowStyle", "Hidden", "-Command", &format!("Start-Process '{}'", path)])
            .output();

        match ps_result {
            Ok(output) => {
                if output.status.success() {
                    return Json(serde_json::json!({
                        "success": true,
                        "data": { "opened": true },
                        "timestamp": chrono::Utc::now().timestamp_millis()
                    }));
                }
            }
            Err(_) => {}
        }
    }

    if result.0 as isize > 32 {
        Json(serde_json::json!({
            "success": true,
            "data": { "opened": true },
            "timestamp": chrono::Utc::now().timestamp_millis()
        }))
    } else {
        Json(serde_json::json!({
            "success": false,
            "error": format!("Failed to open path: error code {}", result.0 as isize),
            "timestamp": chrono::Utc::now().timestamp_millis()
        }))
    }
}

#[cfg(not(windows))]
pub async fn open_item(Json(_payload): Json<OpenItemRequest>) -> impl IntoResponse {
    Json(serde_json::json!({
        "success": false,
        "error": "This feature is only supported on Windows",
        "timestamp": chrono::Utc::now().timestamp_millis()
    }))
}

#[derive(Debug, Deserialize)]
pub struct SelectFileQuery {
    #[serde(rename = "type")]
    pub file_type: String, // "app" or "file"
}

#[cfg(windows)]
pub async fn select_file(Query(query): Query<SelectFileQuery>) -> impl IntoResponse {
    let file_type = query.file_type.clone();

    // Run blocking dialog in spawn_blocking thread pool
    let result = tokio::task::spawn_blocking(move || {
        show_file_dialog(&file_type)
    })
    .await
    .unwrap_or_else(|e| {
        Json(serde_json::json!({
            "success": false,
            "error": format!("Task error: {}", e),
            "timestamp": chrono::Utc::now().timestamp_millis()
        }))
    });

    result
}

#[cfg(windows)]
fn show_file_dialog(file_type: &str) -> Json<serde_json::Value> {
    use windows::Win32::System::Com::{CoInitializeEx, CoCreateInstance, CLSCTX_INPROC_SERVER, COINIT_APARTMENTTHREADED};
    use windows::Win32::UI::Shell::{IFileDialog, FOS_FILEMUSTEXIST, FOS_PATHMUSTEXIST};

    unsafe {
        // Initialize COM as STA
        let _ = CoInitializeEx(None, COINIT_APARTMENTTHREADED);

        // Create file dialog
        let dialog: Result<IFileDialog, _> = CoCreateInstance(&windows::Win32::UI::Shell::FileOpenDialog, None, CLSCTX_INPROC_SERVER);

        match dialog {
            Ok(dialog) => {
                // Set options
                let mut options = dialog.GetOptions().unwrap_or_default();
                options |= FOS_FILEMUSTEXIST | FOS_PATHMUSTEXIST;
                let _ = dialog.SetOptions(options);

                // Set title based on type
                let title = if file_type == "app" {
                    "选择应用程序"
                } else {
                    "选择文件"
                };
                let _ = dialog.SetTitle(&windows::core::HSTRING::from(title));

                // Show dialog
                let hwnd = windows::Win32::Foundation::HWND::default();
                match dialog.Show(hwnd) {
                    Ok(_) => {
                        // Get result
                        match dialog.GetResult() {
                            Ok(result) => {
                                match result.GetDisplayName(windows::Win32::UI::Shell::SIGDN_FILESYSPATH) {
                                    Ok(path_hstring) => {
                                        let path_str = match path_hstring.to_string() {
                                            Ok(s) => s,
                                            Err(e) => {
                                                return Json(serde_json::json!({
                                                    "success": false,
                                                    "error": format!("Failed to convert path: {:?}", e),
                                                    "timestamp": chrono::Utc::now().timestamp_millis()
                                                }));
                                            }
                                        };
                                        let name = std::path::Path::new(&path_str)
                                            .file_name()
                                            .map(|n| n.to_string_lossy().to_string());
                                        Json(serde_json::json!({
                                            "success": true,
                                            "data": {
                                                "path": path_str,
                                                "name": name
                                            },
                                            "timestamp": chrono::Utc::now().timestamp_millis()
                                        }))
                                    }
                                    Err(e) => Json(serde_json::json!({
                                        "success": false,
                                        "error": format!("Failed to get path: {}", e),
                                        "timestamp": chrono::Utc::now().timestamp_millis()
                                    }))
                                }
                            }
                            Err(e) => Json(serde_json::json!({
                                "success": false,
                                "error": format!("Dialog cancelled: {}", e),
                                "timestamp": chrono::Utc::now().timestamp_millis()
                            }))
                        }
                    }
                    Err(e) => Json(serde_json::json!({
                        "success": false,
                        "error": format!("Dialog show failed: {}", e),
                        "timestamp": chrono::Utc::now().timestamp_millis()
                    }))
                }
            }
            Err(e) => Json(serde_json::json!({
                "success": false,
                "error": format!("Failed to create dialog: {}", e),
                "timestamp": chrono::Utc::now().timestamp_millis()
            }))
        }
    }
}

#[cfg(not(windows))]
pub async fn select_file(Query(_query): Query<SelectFileQuery>) -> impl IntoResponse {
    Json(serde_json::json!({
        "success": false,
        "error": "This feature is only supported on Windows",
        "timestamp": chrono::Utc::now().timestamp_millis()
    }))
}

#[derive(Debug, Deserialize)]
pub struct IconQuery {
    pub path: String,
}

pub async fn get_icon(Query(query): Query<IconQuery>) -> impl IntoResponse {
    let path = &query.path;

    // Check cache first
    {
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

    // Extract icon from file
    let icon_base64 = extract_icon_as_base64(path)
        .unwrap_or_else(|| extract_default_icon());

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

fn extract_icon_as_base64(path: &str) -> Option<String> {
    #[cfg(windows)]
    {
        use windows::Win32::UI::Shell::{SHGetFileInfoW, SHFILEINFOW, SHGFI_ICON, SHGFI_LARGEICON};
        use windows::Win32::UI::WindowsAndMessaging::{DestroyIcon, DrawIcon};
        use windows::Win32::Graphics::Gdi::{GetDC, ReleaseDC, CreateCompatibleDC, CreateCompatibleBitmap, SelectObject, DeleteDC, DeleteObject, GetDIBits, BITMAPINFO, DIB_USAGE};

        let wide_path = to_wide_string(path);
        let mut shfi: SHFILEINFOW = SHFILEINFOW::default();

        let result = unsafe {
            SHGetFileInfoW(
                windows::core::PCWSTR(wide_path.as_ptr()),
                windows::Win32::Storage::FileSystem::FILE_FLAGS_AND_ATTRIBUTES(0),
                Some(&mut shfi),
                std::mem::size_of::<SHFILEINFOW>() as u32,
                SHGFI_ICON | SHGFI_LARGEICON,
            )
        };

        if result == 0 || shfi.hIcon.0 == 0 {
            return None;
        }

        let hicon = shfi.hIcon;
        let png_bytes = unsafe { convert_hicon_to_png(hicon) };
        unsafe { let _ = DestroyIcon(hicon); };

        if !png_bytes.is_empty() {
            use base64::Engine;
            let encoded = base64::engine::general_purpose::STANDARD.encode(&png_bytes);
            return Some(format!("data:image/png;base64,{}", encoded));
        }

        None
    }

    #[cfg(not(windows))]
    {
        None
    }
}

#[cfg(windows)]
unsafe fn convert_hicon_to_png(hicon: windows::Win32::UI::WindowsAndMessaging::HICON) -> Vec<u8> {
    use windows::Win32::Graphics::Gdi::{GetDC, ReleaseDC, CreateCompatibleDC, CreateCompatibleBitmap, SelectObject, DeleteDC, DeleteObject, GetDIBits, BITMAPINFO, DIB_USAGE};
    use windows::Win32::UI::WindowsAndMessaging::DrawIcon;
    use image::{ImageBuffer, Rgba};

    let hdc_screen = GetDC(None);
    let mem_dc = CreateCompatibleDC(hdc_screen);

    let mut bmp: BITMAPINFO = BITMAPINFO::default();
    bmp.bmiHeader.biSize = std::mem::size_of::<BITMAPINFO>() as u32;
    bmp.bmiHeader.biWidth = 32;
    bmp.bmiHeader.biHeight = 32;
    bmp.bmiHeader.biPlanes = 1;
    bmp.bmiHeader.biBitCount = 32;
    bmp.bmiHeader.biCompression = 0;

    let color_bmp = CreateCompatibleBitmap(hdc_screen, 32, 32);
    let old_bmp = SelectObject(mem_dc, color_bmp);

    // Draw the icon onto the memory DC
    let _ = DrawIcon(mem_dc, 0, 0, hicon);

    let mut bits: Vec<u8> = vec![0; 32 * 32 * 4];
    let got_bits = GetDIBits(
        mem_dc,
        color_bmp,
        0,
        32,
        Some(bits.as_mut_ptr() as *mut _),
        &mut bmp,
        DIB_USAGE(0),
    );

    let _ = SelectObject(mem_dc, old_bmp);
    let _ = DeleteObject(color_bmp);
    let _ = DeleteDC(mem_dc);
    let _ = ReleaseDC(None, hdc_screen);

    if got_bits == 0 {
        return vec![];
    }

    // Convert BGRA to RGBA and flip vertically
    let mut rgba_bits: Vec<u8> = Vec::with_capacity(32 * 32 * 4);
    for y in (0..32).rev() {
        for x in 0..32 {
            let i = (y * 32 + x) * 4;
            rgba_bits.push(bits[i + 2]);
            rgba_bits.push(bits[i + 1]);
            rgba_bits.push(bits[i]);
            rgba_bits.push(bits[i + 3]);
        }
    }

    let img: ImageBuffer<Rgba<u8>, Vec<u8>> = ImageBuffer::from_raw(32, 32, rgba_bits).unwrap();
    let mut png_bytes: Vec<u8> = Vec::new();
    let encoder = image::codecs::png::PngEncoder::new(&mut png_bytes);
    use image::ImageEncoder;
    encoder.write_image(&img, 32, 32, image::ColorType::Rgba8).ok();

    png_bytes
}

fn extract_default_icon() -> String {
    "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSIjZmZmIj48cGF0aCBkPSJNMTIgMTVhMyAzIDAgMCAxLTYgMGExIDEgMCAwIDEgMS0xIDFhMSAxIDAgMCAxIDEgMWg1YTIuNSAyLjUgMCAwIDAgNS0xdi0yYTIuNSAyLjUgMCAwIDAgNS0xaC0yYTIuNSAyLjUgMCAwIDAgMi41LTEuNXYtMWg0YTIuNSAyLjUgMCAwIDAgMi41LTEuNWgtN2EyLjUgMi41IDAgMCAwLTUgMHYyYTIuNSAyLjUgMCAwIDAgNS0xaC0yYTIuNSAyLjUgMCAwIDAgMi41LTEuNWgtNGEyLjUgMi41IDAgMCAwLTUgMGExIDEgMCAwIDEgMS0xIDFhMSAxIDAgMCAxIDEgMWg2YTIuNSAyLjUgMCAwIDAgNS0hMXYtMGEyLjUgMi41IDAgMCAwLTUgMGgtNGEyLjUgMi41IDAgMCAwLTUgMGExIDEgMCAwIDEgMS0xIDFhMSAxIDAgMCAxIDEgMWg2YTIuNSAyLjUgMCAwIDAgNS0hoTlhMi41IDIuNSAwIDAgMCA1IDFoLTF6Ii8+PC9zdmc+".to_string()
}
