#!/bin/bash
# Build script for Rust server
# Usage: ./scripts/build-rust.sh

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
SERVER_RS_DIR="$PROJECT_DIR/src/server-rs"
DIST_DIR="$PROJECT_DIR/dist"

echo "Building Rust server..."

cd "$SERVER_RS_DIR"

# Build release
cargo build --release

# Copy exe to dist
cp "target/release/perfectwall-server.exe" "$DIST_DIR/"

# Show size
echo ""
echo "Build complete!"
echo "Output: $DIST_DIR/perfectwall-server.exe"
ls -lh "$DIST_DIR/perfectwall-server.exe"
