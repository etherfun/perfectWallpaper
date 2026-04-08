use perfectwall_server::icon_extractor;
use std::path::Path;

fn main() {
    // Try common paths
    let steam_paths = [
        r"C:\Program Files (x86)\Steam\steam.exe",
        r"F:\desktop\GitHub Desktop.lnk",
        r"C:\Program Files\Adobe\Adobe Creative Cloud Experience\CCXProcess.exe",
    ];

    for path_str in steam_paths {
        let path = Path::new(path_str);
        println!("\nTesting: {}", path_str);
        if !path.exists() {
            println!("  File not found");
            continue;
        }
        let result = icon_extractor::extract_all_icons(path);
        match result {
            Ok(icons) => {
                println!("  Found {} icons", icons.len());
                for (i, icon) in icons.iter().take(5).enumerate() {
                    println!("  Icon {}: {}x{} PNG:{}", i, icon.width, icon.height, icon.is_png);
                }
            }
            Err(e) => {
                println!("  Error: {:?}", e);
            }
        }
    }
}
