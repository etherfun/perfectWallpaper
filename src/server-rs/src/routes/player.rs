use axum::{
    extract::Path,
    Json,
};

pub async fn media_control(
    Path(action): Path<String>,
) -> impl axum::response::IntoResponse {
    let (vbs_file, cleanup) = match action.as_str() {
        "play-pause" => ("media_play_pause.vbs", "del"),
        "next" => ("media_next.vbs", "del"),
        "prev" => ("media_prev.vbs", "del"),
        "stop" => ("media_stop.vbs", "del"),
        _ => {
            return Json(serde_json::json!({
                "success": false,
                "error": "Unknown action",
                "timestamp": chrono::Utc::now().timestamp_millis()
            }));
        }
    };

    let vbs_content = match action.as_str() {
        "play-pause" => r#"Set WshShell = CreateObject("WScript.Shell")
WshShell.SendKeys "{MEDIASTOP}"
WScript.Sleep 200
WshShell.SendKeys "{MEDIAPLAYPAUSE}""#,
        "next" => r#"Set WshShell = CreateObject("WScript.Shell")
WshShell.SendKeys "{MEDIANEXTTRACK}""#,
        "prev" => r#"Set WshShell = CreateObject("WScript.Shell")
WshShell.SendKeys "{MEDIAPREVTRACK}""#,
        "stop" => r#"Set WshShell = CreateObject("WScript.Shell")
WshShell.SendKeys "{MEDIASTOP}""#,
        _ => return Json(serde_json::json!({
            "success": false,
            "error": "Unknown action",
            "timestamp": chrono::Utc::now().timestamp_millis()
        }))
    };

    #[cfg(windows)]
    {
        use std::io::Write;

        // Write VBS file to temp
        let temp_dir = std::env::temp_dir();
        let vbs_path = temp_dir.join(vbs_file);

        if let Ok(mut file) = std::fs::File::create(&vbs_path) {
            let _ = file.write_all(vbs_content.as_bytes());
        }

        // Run VBS script
        let output = std::process::Command::new("cscript")
            .args(["//Nologo", &vbs_path.to_string_lossy()])
            .output();

        // Cleanup
        let _ = std::fs::remove_file(&vbs_path);

        match output {
            Ok(out) => {
                if out.status.success() {
                    Json(serde_json::json!({
                        "success": true,
                        "data": null,
                        "timestamp": chrono::Utc::now().timestamp_millis()
                    }))
                } else {
                    let err = String::from_utf8_lossy(&out.stderr);
                    Json(serde_json::json!({
                        "success": false,
                        "error": if err.is_empty() { "Failed to send media key".to_string() } else { err.to_string() },
                        "timestamp": chrono::Utc::now().timestamp_millis()
                    }))
                }
            }
            Err(e) => Json(serde_json::json!({
                "success": false,
                "error": e.to_string(),
                "timestamp": chrono::Utc::now().timestamp_millis()
            })),
        }
    }

    #[cfg(not(windows))]
    {
        Json(serde_json::json!({
            "success": false,
            "error": "Not supported on this platform",
            "timestamp": chrono::Utc::now().timestamp_millis()
        }))
    }
}
