use axum::{extract::State, Json};
use serde::Deserialize;
use std::sync::Arc;
use tokio::sync::RwLock;

use super::super::config::ServerConfig;
use super::super::AppState;
use super::super::auto_start;

/// Request body for updating configuration
#[derive(Debug, Deserialize)]
pub struct UpdateConfigRequest {
    pub port: Option<u16>,
    pub auto_start: Option<bool>,
    pub log_level: Option<String>,
}

/// Configuration state shared across handlers
#[derive(Clone)]
pub struct ConfigState {
    pub config: Arc<RwLock<ServerConfig>>,
}

impl ConfigState {
    pub fn new(config: ServerConfig) -> Self {
        Self {
            config: Arc::new(RwLock::new(config)),
        }
    }
}

/// Combined state for the application
#[derive(Clone)]
pub struct AppStateWithConfig {
    pub app: Arc<AppState>,
    pub config: Arc<ConfigState>,
}

impl AppStateWithConfig {
    pub fn new(app: AppState, config: ServerConfig) -> Self {
        Self {
            app: Arc::new(app),
            config: Arc::new(ConfigState::new(config)),
        }
    }
}

/// GET /api/config - Get current configuration
pub async fn get_config(
    State(state): State<Arc<AppStateWithConfig>>,
) -> impl axum::response::IntoResponse {
    let config = state.config.config.read().await;
    let now = chrono::Utc::now().timestamp_millis();

    Json(serde_json::json!({
        "success": true,
        "data": {
            "port": config.port,
            "auto_start": config.auto_start,
            "log_level": config.log_level,
        },
        "timestamp": now
    }))
}

/// POST /api/config - Update configuration
pub async fn update_config(
    State(state): State<Arc<AppStateWithConfig>>,
    Json(payload): Json<UpdateConfigRequest>,
) -> impl axum::response::IntoResponse {
    let mut config = state.config.config.write().await;
    let mut errors: Vec<String> = Vec::new();

    // Update port if provided
    if let Some(port) = payload.port {
        match config.update_port(port) {
            Ok(_) => {
                println!("[Config] Port updated to {}", port);
            }
            Err(e) => {
                errors.push(e);
            }
        }
    }

    // Update auto_start if provided
    if let Some(auto_start) = payload.auto_start {
        let previously_enabled = config.auto_start;
        config.auto_start = auto_start;
        println!("[Config] Auto-start updated to {}", auto_start);

        // Actually register/unregister if the value changed
        if auto_start && !previously_enabled {
            if let Err(e) = auto_start::register() {
                errors.push(format!("Failed to register auto-start: {}", e));
            }
        } else if !auto_start && previously_enabled {
            if let Err(e) = auto_start::unregister() {
                errors.push(format!("Failed to unregister auto-start: {}", e));
            }
        }
    }

    // Update log_level if provided
    if let Some(log_level) = payload.log_level {
        config.log_level = log_level;
        println!("[Config] Log level updated");
    }

    // Save if there were no critical errors
    if errors.is_empty() {
        if let Err(e) = config.save() {
            errors.push(e);
        }
    }

    let now = chrono::Utc::now().timestamp_millis();

    if errors.is_empty() {
        Json(serde_json::json!({
            "success": true,
            "data": {
                "port": config.port,
                "auto_start": config.auto_start,
                "log_level": config.log_level,
            },
            "timestamp": now
        }))
    } else {
        Json(serde_json::json!({
            "success": false,
            "error": errors.join("; "),
            "timestamp": now
        }))
    }
}
