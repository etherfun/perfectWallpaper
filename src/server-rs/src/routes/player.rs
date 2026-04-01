use axum::{
    extract::Path,
    Json,
};

#[cfg(windows)]
const VK_MEDIA_PLAY_PAUSE: u8 = 0xB3;
#[cfg(windows)]
const VK_MEDIA_NEXT_TRACK: u8 = 0xB0;
#[cfg(windows)]
const VK_MEDIA_PREV_TRACK: u8 = 0xB1;
#[cfg(windows)]
const VK_MEDIA_STOP: u8 = 0xB2;
#[cfg(windows)]
const KEYEVENTF_KEYUP: u32 = 0x0002;

#[cfg(windows)]
extern "system" {
    fn keybd_event(bVk: u8, bScan: u8, dwFlags: u32, dwExtraInfo: usize);
}

#[cfg(windows)]
fn send_media_key(key: u8) {
    unsafe {
        keybd_event(key, 0, 0, 0);
        keybd_event(key, 0, KEYEVENTF_KEYUP, 0);
    }
}

pub async fn media_control(
    Path(action): Path<String>,
) -> impl axum::response::IntoResponse {
    match action.as_str() {
        #[cfg(windows)]
        "play-pause" => {
            send_media_key(VK_MEDIA_PLAY_PAUSE);
            Json(serde_json::json!({
                "success": true,
                "data": null,
                "timestamp": chrono::Utc::now().timestamp_millis()
            }))
        }
        #[cfg(windows)]
        "next" => {
            send_media_key(VK_MEDIA_NEXT_TRACK);
            Json(serde_json::json!({
                "success": true,
                "data": null,
                "timestamp": chrono::Utc::now().timestamp_millis()
            }))
        }
        #[cfg(windows)]
        "prev" => {
            send_media_key(VK_MEDIA_PREV_TRACK);
            Json(serde_json::json!({
                "success": true,
                "data": null,
                "timestamp": chrono::Utc::now().timestamp_millis()
            }))
        }
        #[cfg(windows)]
        "stop" => {
            send_media_key(VK_MEDIA_STOP);
            Json(serde_json::json!({
                "success": true,
                "data": null,
                "timestamp": chrono::Utc::now().timestamp_millis()
            }))
        }
        _ => {
            Json(serde_json::json!({
                "success": false,
                "error": "Unknown action",
                "timestamp": chrono::Utc::now().timestamp_millis()
            }))
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