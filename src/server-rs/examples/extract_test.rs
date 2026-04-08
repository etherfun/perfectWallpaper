// Test icon extraction using the actual icon_extractor module
// Run with: cargo run --example extract_test

extern crate perfectwall_server;

fn main() {
    let paths = [
        "D:\\SOFT\\steam\\steam.exe",
        "C:\\Windows\\System32\\shell32.dll",
        "F:\\desktop\\GitHub Desktop.lnk",
    ];

    use perfectwall_server::icon_extractor::extract_all_icons;

    for path in &paths {
        println!("\n========================================");
        println!("Testing: {}", path);
        println!("========================================");

        if !std::path::Path::new(path).exists() {
            println!("  File does not exist, skipping...");
            continue;
        }

        match extract_all_icons(path) {
            Ok(icons) => {
                println!("  SUCCESS! Found {} icons", icons.len());
                for (i, icon) in icons.iter().enumerate() {
                    println!("  Icon {}: {}x{}, PNG={}, {} bytes",
                        i, icon.width, icon.height, icon.is_png, icon.png_data.len());
                }
            }
            Err(e) => {
                println!("  FAILED: {}", e);
            }
        }
    }
}