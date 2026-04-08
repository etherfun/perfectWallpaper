use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;

/// Server configuration structure
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ServerConfig {
    pub port: u16,
    pub auto_start: bool,
    pub log_level: String,
}

impl Default for ServerConfig {
    fn default() -> Self {
        Self {
            port: 27420,
            auto_start: false,
            log_level: "info".to_string(),
        }
    }
}

impl ServerConfig {
    /// Load configuration from file
    pub fn load() -> Self {
        let config_path = Self::config_path();

        if config_path.exists() {
            match fs::read_to_string(&config_path) {
                Ok(content) => {
                    match serde_json::from_str::<ServerConfig>(&content) {
                        Ok(config) => {
                            println!("[Config] Loaded from {}", config_path.display());
                            return config;
                        }
                        Err(e) => {
                            eprintln!("[Config] Failed to parse config file: {}, using defaults", e);
                        }
                    }
                }
                Err(e) => {
                    eprintln!("[Config] Failed to read config file: {}, using defaults", e);
                }
            }
        } else {
            println!("[Config] No config file found at {}, using defaults", config_path.display());
        }

        // Return default config and create default config file
        let default_config = Self::default();
        if let Err(e) = default_config.save() {
            eprintln!("[Config] Failed to create default config file: {}", e);
        }
        default_config
    }

    /// Save configuration to file
    pub fn save(&self) -> Result<(), String> {
        let config_path = Self::config_path();

        // Ensure parent directory exists
        if let Some(parent) = config_path.parent() {
            fs::create_dir_all(parent)
                .map_err(|e| format!("Failed to create config directory: {}", e))?;
        }

        let content = serde_json::to_string_pretty(self)
            .map_err(|e| format!("Failed to serialize config: {}", e))?;

        fs::write(&config_path, content)
            .map_err(|e| format!("Failed to write config file: {}", e))?;

        println!("[Config] Saved to {}", config_path.display());
        Ok(())
    }

    /// Get configuration file path
    fn config_path() -> PathBuf {
        // Config file in the same directory as the executable
        let exe_path = std::env::current_exe()
            .unwrap_or_else(|_| PathBuf::from("."));
        exe_path
            .parent()
            .unwrap_or(&PathBuf::from("."))
            .join("server-config.json")
    }

    /// Validate port number
    pub fn validate_port(port: u16) -> Result<(), String> {
        if port < 1024 {
            return Err("Port must be >= 1024".to_string());
        }
        Ok(())
    }

    /// Update port with validation
    pub fn update_port(&mut self, port: u16) -> Result<(), String> {
        Self::validate_port(port)?;
        self.port = port;
        Ok(())
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_default_config() {
        let config = ServerConfig::default();
        assert_eq!(config.port, 27420);
        assert_eq!(config.auto_start, false);
        assert_eq!(config.log_level, "info");
    }

    #[test]
    fn test_port_validation() {
        assert!(ServerConfig::validate_port(3842).is_ok());
        assert!(ServerConfig::validate_port(80).is_ok());
        assert!(ServerConfig::validate_port(1023).is_err());
        assert!(ServerConfig::validate_port(0).is_err());
    }
}