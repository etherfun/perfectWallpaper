use axum::{
    extract::Query,
    response::IntoResponse,
    Json,
};
use serde::{Deserialize, Serialize};

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
            Some(HWND::default()),
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
            Some(HWND::default()),
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
                match dialog.Show(Some(HWND::default())) {
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
