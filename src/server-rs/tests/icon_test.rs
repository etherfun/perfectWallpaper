// Integration test for icon extraction
// Run with: cargo test --test icon_test -- --nocapture

use std::path::Path;

fn main() {
    let paths = [
        "D:\\SOFT\\steam\\steam.exe",
        "C:\\Windows\\System32\\notepad.exe",
        "C:\\Windows\\System32\\shell32.dll",
    ];

    for path in &paths {
        println!("\n========================================");
        println!("Testing: {}", path);
        println!("========================================");

        if !Path::new(path).exists() {
            println!("  File does not exist, skipping...");
            continue;
        }

        // Re-export the function through the binary's module structure
        // This is a bit awkward but necessary for binary packages
        std::process::Command::new("cargo")
            .args(["run", "--example", "extract_test"])
            .current_dir("D:\\SOFT\\steam\\steamapps\\common\\wallpaper_engine\\projects\\myprojects\\perfectwall\\src\\server-rs")
            .status()
            .ok();
    }
}