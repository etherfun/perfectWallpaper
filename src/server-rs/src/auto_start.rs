//! Windows auto-start registration module
//! Allows the server to register/unregister itself for Windows startup

use std::env;
use std::path::PathBuf;
use std::process::Command;

/// Registry key path for user auto-start programs
const REG_KEY: &str = r"Software\Microsoft\Windows\CurrentVersion\Run";
/// The name of our auto-start entry in the registry
const APP_NAME: &str = "PerfectWallServer";

/// Get the path to the current executable
fn get_exe_path() -> Result<PathBuf, String> {
    env::current_exe()
        .map_err(|e| format!("Failed to get executable path: {}", e))
}

/// Register the application to start automatically with Windows
#[cfg(windows)]
pub fn register() -> Result<(), String> {
    let exe_path = get_exe_path()?;
    let exe_path_str = exe_path.to_string_lossy();

    // Use reg command to add to registry
    // Using cmd /c to run the reg command
    let output = Command::new("cmd")
        .args([
            "/c",
            "reg",
            "add",
            &format!(r"HKCU\{}", REG_KEY),
            "/v",
            APP_NAME,
            "/t",
            "REG_SZ",
            "/d",
            &exe_path_str,
            "/f",
        ])
        .output()
        .map_err(|e| format!("Failed to execute registry command: {}", e))?;

    if output.status.success() {
        println!("[AutoStart] Registered successfully: {}", exe_path_str);
        Ok(())
    } else {
        let stderr = String::from_utf8_lossy(&output.stderr);
        Err(format!("Failed to register auto-start: {}", stderr))
    }
}

/// Unregister the application from Windows auto-start
#[cfg(windows)]
pub fn unregister() -> Result<(), String> {
    let output = Command::new("cmd")
        .args([
            "/c",
            "reg",
            "delete",
            &format!(r"HKCU\{}", REG_KEY),
            "/v",
            APP_NAME,
            "/f",
        ])
        .output()
        .map_err(|e| format!("Failed to execute registry command: {}", e))?;

    if output.status.success() {
        println!("[AutoStart] Unregistered successfully");
        Ok(())
    } else {
        let stderr = String::from_utf8_lossy(&output.stderr);
        // It's not an error if the key doesn't exist
        if stderr.contains("unable to find") || stderr.contains("cannot find") {
            println!("[AutoStart] Entry not found, nothing to unregister");
            Ok(())
        } else {
            Err(format!("Failed to unregister auto-start: {}", stderr))
        }
    }
}

/// Check if the application is registered for auto-start
#[cfg(windows)]
#[allow(dead_code)]
pub fn is_registered() -> bool {
    let output = Command::new("cmd")
        .args([
            "/c",
            "reg",
            "query",
            &format!(r"HKCU\{}", REG_KEY),
            "/v",
            APP_NAME,
        ])
        .output();

    match output {
        Ok(output) => output.status.success(),
        Err(_) => false,
    }
}

/// Check if auto-start is enabled (non-Windows platforms)
#[cfg(not(windows))]
pub fn is_registered() -> bool {
    false
}

/// Register for auto-start (non-Windows platforms - no-op)
#[cfg(not(windows))]
pub fn register() -> Result<(), String> {
    println!("[AutoStart] Auto-start is only supported on Windows");
    Ok(())
}

/// Unregister from auto-start (non-Windows platforms - no-op)
#[cfg(not(windows))]
pub fn unregister() -> Result<(), String> {
    println!("[AutoStart] Auto-start is only supported on Windows");
    Ok(())
}
