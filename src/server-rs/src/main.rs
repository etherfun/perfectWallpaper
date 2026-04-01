use axum::{
    Router,
    routing::{get, post},
};
use std::net::SocketAddr;
use std::sync::Arc;
use tokio::sync::RwLock;
use tower_http::cors::{Any, CorsLayer};
use chrono::Utc;

mod error;
mod models;
mod routes;

use models::*;

pub struct AppState {
    pub cached_network: RwLock<(u64, u64, i64)>,
    pub cached_cpu: RwLock<(f32, i64)>,  // (usage, timestamp)
}

#[derive(Clone)]
pub struct ApiResponse<T: serde::Serialize> {
    pub success: bool,
    pub data: Option<T>,
    pub error: Option<String>,
    pub timestamp: i64,
}

impl<T: serde::Serialize> ApiResponse<T> {
    pub fn success(data: T) -> Self {
        Self {
            success: true,
            data: Some(data),
            error: None,
            timestamp: Utc::now().timestamp_millis(),
        }
    }

    pub fn error(msg: String) -> Self {
        Self {
            success: false,
            data: None,
            error: Some(msg),
            timestamp: Utc::now().timestamp_millis(),
        }
    }
}

#[tokio::main]
async fn main() {
    let port = std::env::var("PORT")
        .unwrap_or_else(|_| "3842".to_string())
        .parse::<u16>()
        .unwrap_or(3842);

    let cors = CorsLayer::new()
        .allow_origin(Any)
        .allow_methods(Any)
        .allow_headers(Any);

    let state = Arc::new(AppState {
        cached_network: RwLock::new((0, 0, 0)),
        cached_cpu: RwLock::new((0.0, 0)),
    });

    let app = Router::new()
        .route("/api/system", get(routes::system::get_system_info))
        .route("/api/cpu", get(routes::system::get_cpu_usage))
        .route("/api/memory", get(routes::system::get_memory_info))
        .route("/api/gpu", get(routes::system::get_gpu_info))
        .route("/api/files", get(routes::files::list_files))
        .route("/api/files/audio", get(routes::files::stream_audio))
        .route("/api/files/metadata", get(routes::files::get_metadata))
        .route("/api/player/:action", post(routes::player::media_control))
        .layer(cors)
        .with_state(state);

    let addr = SocketAddr::from(([0, 0, 0, 0], port));
    println!("Server running on http://{}", addr);

    let listener = tokio::net::TcpListener::bind(addr).await.unwrap();
    axum::serve(listener, app).await.unwrap();
}
