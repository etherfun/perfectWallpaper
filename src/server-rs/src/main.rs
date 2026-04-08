use axum::{
    Router,
    routing::{get, post},
};
use clap::Parser;
use std::net::SocketAddr;
use tokio::sync::RwLock;
use tower_http::cors::{Any, CorsLayer};
use chrono::Utc;

#[cfg(windows)]
use windows::Win32::System::Console::AllocConsole;

mod auto_start;
mod config;
pub mod icon_extractor;
mod routes;

use config::ServerConfig;
use routes::config::AppStateWithConfig;

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

/// CLI arguments for the server
#[derive(Parser, Debug)]
#[command(name = "perfectwall-server")]
#[command(about = "PerfectWall System Info Server")]
struct Args {
    /// Port to listen on (overrides config file and environment)
    #[arg(short, long)]
    port: Option<u16>,

    /// Enable auto-start on Windows login
    #[arg(long)]
    auto_start: bool,

    /// Remove auto-start registration
    #[arg(long)]
    remove_auto_start: bool,

    /// Don't start the server, just process other commands
    #[arg(long, default_value = "false")]
    no_server: bool,

    /// Enable console window for output (silent by default on Windows)
    #[arg(long)]
    console: bool,
}

fn main() {
    let args = Args::parse();

    // Allocate a console window on Windows when --console is passed
    #[cfg(windows)]
    if args.console {
        // SAFETY: AllocConsole is safe when called once per process
        unsafe { let _ = AllocConsole(); };
    }

    // Handle auto-start registration commands
    if args.auto_start {
        match auto_start::register() {
            Ok(_) => {
                println!("Auto-start enabled successfully");
                std::process::exit(0);
            }
            Err(e) => {
                eprintln!("Failed to enable auto-start: {}", e);
                std::process::exit(1);
            }
        }
    }

    if args.remove_auto_start {
        match auto_start::unregister() {
            Ok(_) => {
                println!("Auto-start disabled successfully");
                std::process::exit(0);
            }
            Err(e) => {
                eprintln!("Failed to disable auto-start: {}", e);
                std::process::exit(1);
            }
        }
    }

    // If no_server is set (and no other action flags), exit
    if args.no_server && !args.auto_start && !args.remove_auto_start {
        println!("Server not started (--no-server specified)");
        std::process::exit(0);
    }

    // Load configuration from file
    let mut server_config = ServerConfig::load();

    // CLI arguments override config file
    if let Some(port) = args.port {
        if let Err(e) = server_config.update_port(port) {
            eprintln!("Invalid port from CLI: {}", e);
            std::process::exit(1);
        }
        println!("[Config] Port overridden by CLI: {}", port);
    }

    // Environment variable overrides everything
    if let Ok(env_port) = std::env::var("PORT") {
        if let Ok(port) = env_port.parse::<u16>() {
            if server_config.update_port(port).is_ok() {
                println!("[Config] Port overridden by environment: {}", port);
            }
        }
    }

    let port = server_config.port;
    let cors = CorsLayer::new()
        .allow_origin(Any)
        .allow_methods(Any)
        .allow_headers(Any);

    let app_state = AppState {
        cached_network: RwLock::new((0, 0, 0)),
        cached_cpu: RwLock::new((0.0, 0)),
    };

    let state = std::sync::Arc::new(AppStateWithConfig::new(app_state, server_config));

    let app = Router::new()
        // System info routes
        .route("/api/sysinfo", get(routes::sysinfo::get_system_info))
        .route("/api/sysinfo/cpu", get(routes::sysinfo::get_cpu_usage))
        .route("/api/sysinfo/memory", get(routes::sysinfo::get_memory_info))
        .route("/api/sysinfo/gpu", get(routes::sysinfo::get_gpu_info))
        // File routes
        .route("/api/files", get(routes::files::list_files))
        .route("/api/files/audio", get(routes::files::stream_audio))
        .route("/api/files/metadata", get(routes::files::get_metadata))
        .route("/api/files/player/:action", post(routes::files::media_control))
        // Icon routes
        .route("/api/icon", get(routes::icon::get_icon))
        .route("/api/icon/all", get(routes::icon::get_all_icons))
        .route("/api/icon/upload", post(routes::icon::upload_custom_icon))
        .route("/api/icon/cache", post(routes::icon::clear_icon_cache))
        // Config routes
        .route("/api/config", get(routes::config::get_config))
        .route("/api/config", post(routes::config::update_config))
        // Dockbar routes
        .route("/api/dockbar/open", post(routes::dockbar::open_item))
        .route("/api/dockbar/select-file", get(routes::dockbar::select_file))
        .layer(cors)
        .with_state(state);

    let addr = SocketAddr::from(([0, 0, 0, 0], port));
    println!("Server running on http://{}", addr);

    let runtime = tokio::runtime::Runtime::new().unwrap();
    runtime.block_on(async {
        let listener = tokio::net::TcpListener::bind(addr).await.unwrap();
        axum::serve(listener, app).await.unwrap();
    });
}