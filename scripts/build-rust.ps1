# Build script for Rust server
# Usage: .\scripts\build-rust.ps1

$ErrorActionPreference = "Stop"

$SCRIPT_DIR = Split-Path -Parent $MyInvocation.MyCommand.Path
$PROJECT_DIR = Split-Path -Parent $SCRIPT_DIR
$SERVER_RS_DIR = Join-Path $PROJECT_DIR "src/server-rs"
$DIST_DIR = Join-Path $PROJECT_DIR "dist"

Write-Host "Building Rust server..."

# `lhm-sys` (Windows-only) statically links an AOT-compiled C# bridge
# over LibreHardwareMonitor. The C# bridge is built with .NET 8, so the
# .NET 8 SDK is required at *build* time on Windows. No .NET runtime
# is needed at runtime — the bridge is baked into the binary.
# Build release
Set-Location $SERVER_RS_DIR
cargo build --release

# Copy exe to dist
$EXE_PATH = Join-Path $SERVER_RS_DIR "target/release/perfectwall-server.exe"
Copy-Item $EXE_PATH $DIST_DIR/ -Force

# Show size
Write-Host ""
Write-Host "Build complete!"
Write-Host "Output: $DIST_DIR/perfectwall-server.exe"
Get-Item (Join-Path $DIST_DIR "perfectwall-server.exe") | ForEach-Object { Write-Host ("Size: {0:N2} KB" -f ($_.Length / 1KB)) }
