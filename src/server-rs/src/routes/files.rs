use axum::{
    extract::Query,
    extract::Path as AxumPath,
    response::IntoResponse,
    http::StatusCode,
    Json,
    body::Body,
};
use axum::response::Response;
use lofty::{AudioFile, TaggedFileExt, Accessor};
use std::path::Path;
use bytes::Bytes;

#[derive(Debug, serde::Deserialize)]
pub struct FilesQuery {
    pub directory: String,
    pub filter: Option<String>,
}

#[derive(Debug, serde::Deserialize)]
pub struct AudioQuery {
    pub path: String,
}

#[derive(Debug, serde::Deserialize)]
pub struct MetadataQuery {
    pub path: String,
}

fn is_valid_path(path: &str) -> Result<(), String> {
    if !Path::new(path).is_absolute() {
        return Err("Only absolute paths are allowed".to_string());
    }
    if path.contains("..") || path.contains("~") {
        return Err("Invalid path characters".to_string());
    }
    Ok(())
}

// Media control functions
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
    AxumPath(action): AxumPath<String>,
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

pub async fn list_files(Query(query): Query<FilesQuery>) -> impl IntoResponse {
    let directory = &query.directory;

    if let Err(e) = is_valid_path(directory) {
        return Json(serde_json::json!({
            "success": false,
            "error": e,
            "timestamp": chrono::Utc::now().timestamp_millis()
        }));
    }

    let path = Path::new(directory);
    if !path.exists() {
        return Json(serde_json::json!({
            "success": false,
            "error": "Directory not found",
            "timestamp": chrono::Utc::now().timestamp_millis()
        }));
    }
    if !path.is_dir() {
        return Json(serde_json::json!({
            "success": false,
            "error": "Path is not a directory",
            "timestamp": chrono::Utc::now().timestamp_millis()
        }));
    }

    let entries = match std::fs::read_dir(path) {
        Ok(entries) => entries,
        Err(e) => {
            return Json(serde_json::json!({
                "success": false,
                "error": e.to_string(),
                "timestamp": chrono::Utc::now().timestamp_millis()
            }))
        }
    };

    let mut files: Vec<_> = Vec::new();

    for entry in entries.flatten() {
        if entry.file_type().map(|ft| ft.is_file()).unwrap_or(false) {
            let name = entry.file_name().to_string_lossy().to_string();
            let file_path = entry.path().to_string_lossy().to_string();

            if let Some(ref filter) = query.filter {
                let extensions: Vec<String> = filter
                    .split(',')
                    .map(|ext| ext.trim().to_lowercase().trim_start_matches('.').to_string())
                    .collect();

                let file_ext = Path::new(&name)
                    .extension()
                    .map(|e| e.to_string_lossy().to_lowercase())
                    .unwrap_or_default();

                if !extensions.is_empty() && !extensions.contains(&file_ext) {
                    continue;
                }
            }

            files.push(serde_json::json!({
                "name": name,
                "path": file_path
            }));
        }
    }

    files.sort_by(|a, b| {
        let a_name = a["name"].as_str().unwrap_or("");
        let b_name = b["name"].as_str().unwrap_or("");
        a_name.to_lowercase().cmp(&b_name.to_lowercase())
    });

    let count = files.len();
    let now = chrono::Utc::now().timestamp_millis();

    Json(serde_json::json!({
        "success": true,
        "data": {
            "directory": directory,
            "files": files,
            "count": count
        },
        "timestamp": now
    }))
}

pub async fn stream_audio(Query(query): Query<AudioQuery>) -> impl IntoResponse {
    let file_path = &query.path;

    if let Err(e) = is_valid_path(file_path) {
        return (
            StatusCode::BAD_REQUEST,
            Json(serde_json::json!({
                "success": false,
                "error": e,
                "timestamp": chrono::Utc::now().timestamp_millis()
            }))
        ).into_response();
    }

    let path = Path::new(file_path);
    if !path.exists() {
        return (
            StatusCode::NOT_FOUND,
            Json(serde_json::json!({
                "success": false,
                "error": "File not found",
                "timestamp": chrono::Utc::now().timestamp_millis()
            }))
        ).into_response();
    }
    if !path.is_file() {
        return (
            StatusCode::BAD_REQUEST,
            Json(serde_json::json!({
                "success": false,
                "error": "Path is not a file",
                "timestamp": chrono::Utc::now().timestamp_millis()
            }))
        ).into_response();
    }

    let metadata = match std::fs::metadata(path) {
        Ok(m) => m,
        Err(e) => {
            return (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(serde_json::json!({
                    "success": false,
                    "error": e.to_string(),
                    "timestamp": chrono::Utc::now().timestamp_millis()
                }))
            ).into_response();
        }
    };

    let ext = path
        .extension()
        .map(|e| e.to_string_lossy().to_lowercase())
        .unwrap_or_default();

    let content_type = match ext.as_str() {
        "mp3" => "audio/mpeg",
        "ogg" => "audio/ogg",
        "wav" => "audio/wav",
        "flac" => "audio/flac",
        "m4a" => "audio/mp4",
        "aac" => "audio/aac",
        _ => "application/octet-stream",
    };

    let file_size = metadata.len();

    match tokio::fs::read(path).await {
        Ok(data) => {
            let mut response = Response::new(Body::from(Bytes::from(data)));
            response.headers_mut().insert(
                axum::http::header::CONTENT_TYPE,
                content_type.parse().unwrap(),
            );
            response.headers_mut().insert(
                axum::http::header::CONTENT_LENGTH,
                file_size.to_string().parse().unwrap(),
            );
            response.into_response()
        }
        Err(e) => {
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(serde_json::json!({
                    "success": false,
                    "error": e.to_string(),
                    "timestamp": chrono::Utc::now().timestamp_millis()
                }))
            ).into_response()
        }
    }
}

pub async fn get_metadata(Query(query): Query<MetadataQuery>) -> impl IntoResponse {
    let file_path = &query.path;

    if let Err(e) = is_valid_path(file_path) {
        return Json(serde_json::json!({
            "success": false,
            "error": e,
            "timestamp": chrono::Utc::now().timestamp_millis()
        }));
    }

    let path = Path::new(file_path);
    if !path.exists() {
        return Json(serde_json::json!({
            "success": false,
            "error": "File not found",
            "timestamp": chrono::Utc::now().timestamp_millis()
        }));
    }
    if !path.is_file() {
        return Json(serde_json::json!({
            "success": false,
            "error": "Path is not a file",
            "timestamp": chrono::Utc::now().timestamp_millis()
        }));
    }

    let now = chrono::Utc::now().timestamp_millis();

    match lofty::read_from_path(path) {
        Ok(tagged_file) => {
            let properties = tagged_file.properties();
            let duration = properties.duration().as_secs_f64();

            let (title, artist, album, year, genre, track, picture) =
                if let Some(tag) = tagged_file.primary_tag().or_else(|| tagged_file.first_tag()) {
                    (
                        tag.title().map(|s| s.to_string()).unwrap_or_else(|| {
                            path.file_stem().map(|s| s.to_string_lossy().to_string()).unwrap_or_default()
                        }),
                        tag.artist().map(|s| s.to_string()).unwrap_or_else(|| "Unknown Artist".to_string()),
                        tag.album().map(|s| s.to_string()).unwrap_or_else(|| "Unknown Album".to_string()),
                        tag.year().map(|y| y),
                        tag.genre().map(|s| s.to_string()),
                        tag.track().map(|t| t),
                        tag.pictures().first().map(|p| {
                            serde_json::json!({
                                "format": p.mime_type().map(|m| m.to_string()).unwrap_or_else(|| "image/jpeg".to_string()),
                                "data": base64_encode(p.data())
                            })
                        }),
                    )
                } else {
                    (
                        path.file_stem().map(|s| s.to_string_lossy().to_string()).unwrap_or_default(),
                        "Unknown Artist".to_string(),
                        "Unknown Album".to_string(),
                        None,
                        None,
                        None,
                        None,
                    )
                };

            Json(serde_json::json!({
                "success": true,
                "data": {
                    "title": title,
                    "artist": artist,
                    "album": album,
                    "year": year,
                    "duration": if duration > 0.0 { Some(duration) } else { None },
                    "genre": genre.map(|g| vec![g]),
                    "track": track,
                    "picture": picture
                },
                "timestamp": now
            }))
        }
        Err(_) => {
            Json(serde_json::json!({
                "success": true,
                "data": {
                    "title": path.file_stem().map(|s| s.to_string_lossy().to_string()).unwrap_or_default(),
                    "artist": "Unknown Artist",
                    "album": "Unknown Album",
                    "year": null,
                    "duration": null,
                    "genre": null,
                    "track": null,
                    "picture": null
                },
                "timestamp": now
            }))
        }
    }
}

fn base64_encode(data: &[u8]) -> String {
    const ALPHABET: &[u8] = b"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
    let mut result = String::new();
    let mut i = 0;
    while i < data.len() {
        let b0 = data[i] as usize;
        let b1 = if i + 1 < data.len() { data[i + 1] as usize } else { 0 };
        let b2 = if i + 2 < data.len() { data[i + 2] as usize } else { 0 };

        result.push(ALPHABET[b0 >> 2] as char);
        result.push(ALPHABET[((b0 & 0x03) << 4) | (b1 >> 4)] as char);

        if i + 1 < data.len() {
            result.push(ALPHABET[((b1 & 0x0f) << 2) | (b2 >> 6)] as char);
        } else {
            result.push('=');
        }

        if i + 2 < data.len() {
            result.push(ALPHABET[b2 & 0x3f] as char);
        } else {
            result.push('=');
        }

        i += 3;
    }
    result
}
