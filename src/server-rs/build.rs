// Build script to set Windows GUI subsystem for the final binary.
// This only affects the linked executable, not build scripts or proc-macros.
fn main() {
    // /SUBSYSTEM:windows hides the console window on launch.
    // /ENTRY:mainCRTStartup makes it still call main() instead of WinMain().
    println!("cargo:rustc-link-arg=/SUBSYSTEM:windows");
    println!("cargo:rustc-link-arg=/ENTRY:mainCRTStartup");
}
