# Build script for the .NET Framework 4.8 server
# Usage: .\scripts\build-dotnet.ps1
#
# Output layout:
#   <repo>/build/   intermediate artefacts (this script overwrites)
#   <repo>/dist/    final shippable payload (this script overwrites)
#
# The csproj writes to <repo>/build/ via <OutputPath>. This
# script then mirrors build/ → dist/ alongside launch-*.cmd
# and the build manifest.

$ErrorActionPreference = "Stop"

$SCRIPT_DIR = Split-Path -Parent $MyInvocation.MyCommand.Path
$PROJECT_DIR = Split-Path -Parent $SCRIPT_DIR
$DOTNET_DIR = Join-Path $PROJECT_DIR "src/server-dotnet"
$DIST_DIR = Join-Path $PROJECT_DIR "dist"
# All server-side artefacts (EXE, DLLs, Loc/, configs)
# go under dist/perfectwall-server/ so the dist/ root
# stays clean for the TypeScript bundle assets
# (bundle.js, default.css, index.html, preview.jpg,
# project.json, plus the style/, source/,
# THIRD_PARTY_LICENSES/, update/ subfolders).
# The user double-clicks dist/perfectwall-server/
# perfectwall-server.exe to launch.
$SERVER_DIST = Join-Path $DIST_DIR "perfectwall-server"
$BUILD_DIR = Join-Path $PROJECT_DIR "build"

Write-Host "Building .NET Framework 4.8 server..."

# Pick the dotnet CLI. Order:
#   1. dotnet on PATH
#   2. C:\Program Files\dotnet\dotnet.exe
$dotnet = $null
if (Get-Command dotnet -ErrorAction SilentlyContinue) { $dotnet = "dotnet" }
elseif (Test-Path "C:\Program Files\dotnet\dotnet.exe") { $dotnet = "C:\Program Files\dotnet\dotnet.exe" }
if (-not $dotnet) {
    Write-Host "dotnet CLI not found. Install .NET 8 SDK from https://dot.net" -ForegroundColor Red
    exit 1
}
Write-Host "Using dotnet: $dotnet"

# Restore + Release build for net48. Build artefacts go to
# <repo>/build/ (configured in perfectwall-server.csproj).
Set-Location $DOTNET_DIR
& $dotnet restore -c Release | Out-Host
& $dotnet build -c Release --no-restore /verbosity:minimal | Out-Host
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

# dist/ is a SHARED directory: `yarn build` (esbuild +
# sass) puts index.html, bundle.js, default.css, etc. into
# it, and this script adds the .NET sidecar under
# dist/perfectwall-server/. We must NOT wipe dist/ on every
# server rebuild — that would delete the TS bundle.
# Instead, sweep only the files this script
# itself owns (under $SERVER_DIST), with a strict allowlist
# of file names, and never touch any other artefact.
#
# One-time migration cleanup: the server used to ship
# flat at the dist/ root (pre-2026-06). On a fresh layout
# sweep, also remove the matching old top-level files so
# the migration is automatic. This is gated on
# Test-Path (a file at the old location AND the new
# perfectwall-server/ subdir), so it never runs on a
# clean tree and never deletes a *legitimately* named
# file (e.g. a project.json that happens to share a name
# with one of our allowlisted artefacts) at dist/ root.
$OWN_FILES = @(
    'perfectwall-server.exe',
    'perfectwall-server.exe.config',
    'perfectwall-server.deps.json',
    'perfectwall-server.runtimeconfig.json',
    'server-config.json',
    'App.config',
    'launch-elevated.cmd',
    'launch-user.cmd'
)
# Loc/ holds the per-culture .resx files for the GUI
# (see src/server-dotnet/Loc/Strings.cs). The setup
# page reads them at runtime via ResourceManager, so
# we mirror the folder verbatim. Adding a new
# language = drop a Strings.<culture>.resx file in
# src/server-dotnet/Loc/, no rebuild required.
$OWN_DIRS = @(
    'Loc'
)
# Top-level dependencies the project references
# directly. Default CopyLocal=true in the SDK-style
# csproj already stages these in build/, we just
# mirror them.
$OWN_DLLS = @(
    'LibreHardwareMonitorLib.dll', # primary; its
                                   # `runtimes\win-x64\lib\net472\`
                                   # build is the one the EXE
                                   # actually loads (matches
                                   # <PlatformTarget>x64</PlatformTarget>)
    'Newtonsoft.Json.dll',
    'TagLibSharp.dll'
)
# Transitive managed DLLs the EXE needs at runtime
# but that the SDK's CopyLocal=true only marks as
# "private" for top-level PackageReferences. The
# post-build <Target Name="CopyTransitiveManagedDlls">
# in perfectwall-server.csproj already globs them
# into build/; we mirror them into dist/ here.
# Order matches the alphabetical output of
# Get-ChildItem build/ -Filter *.dll so reviewers
# can scan for missing entries.
$TRANSITIVE_DLLS = @(
    'BlackSharp.Core.dll',                  # core util lib,
                                            # transitive via
                                            # Newtonsoft / LHM
    'DiskInfoToolkit.dll',                  # SMART data reader,
                                            # LHM transitive
    'HidSharp.dll',                         # USB HID enumerator,
                                            # LHM transitive
    'RAMSPDToolkit-NDD.dll',                # RAM SPD reader,
                                            # LHM transitive
    'System.Buffers.dll',                   # BCL shim,
                                            # LHM transitive
    'System.CodeDom.dll',                   # BCL shim,
                                            # LHM transitive
    'System.Diagnostics.DiagnosticSource.dll',
                                            # BCL shim,
                                            # LHM transitive
    'System.Memory.dll',                    # BCL shim,
                                            # LHM transitive
    'System.Numerics.Vectors.dll',          # BCL shim,
                                            # LHM transitive
    'System.Runtime.CompilerServices.Unsafe.dll',
                                            # BCL shim,
                                            # LHM transitive
    'System.Security.AccessControl.dll',    # BCL shim,
                                            # LHM transitive
    'System.Security.Principal.Windows.dll',
                                            # BCL shim,
                                            # LHM transitive
    'System.Threading.AccessControl.dll'    # BCL shim,
                                            # LHM transitive
)
# Historical dead artefacts that the .NET build does NOT
# produce and that should never have been in dist/:
#   perfectwall-server.zip  - ghost from an old NuGet restore
#   perfectwall-server.pdb  - debug symbols, only useful with
#                             a debugger attached
$DEAD_ARTIFACTS = @(
    'perfectwall-server.pdb',
    'perfectwall-server.zip'
)
$stale = $OWN_FILES + $OWN_DLLS + $TRANSITIVE_DLLS + $DEAD_ARTIFACTS
# Ensure both dist/ and dist/perfectwall-server/ exist.
# dist/ is created on first build; the server subdir
# holds everything this script owns.
if (-not (Test-Path $DIST_DIR)) {
    New-Item -ItemType Directory -Path $DIST_DIR | Out-Null
}
if (Test-Path $SERVER_DIST) {
    foreach ($name in $stale) {
        $p = Join-Path $SERVER_DIST $name
        if (Test-Path $p) {
            try { Remove-Item $p -Force -ErrorAction Stop }
            catch { Write-Warning "Could not remove $p — file likely in use. Skipping." }
        }
    }
}
else {
    New-Item -ItemType Directory -Path $SERVER_DIST | Out-Null
}
# One-time migration: if the OLD flat layout is still on
# disk (server files sitting at dist/ root), sweep them
# now that the new dist/perfectwall-server/ tree exists.
# This runs unconditionally on every build — it is a
# no-op once the migration is done (the files no longer
# exist at the old location) and is gated on
# Test-Path $SERVER_DIST above so a user who has, say,
# hand-placed a perfectwall-server.exe at dist/ root for
# some other reason is not silently broken.
$OLD_FLAT = $DIST_DIR  # everything under here, NOT $SERVER_DIST
$OLD_FLAT_FILES = $stale + @('perfectwall-server.sys')
$OLD_FLAT_DIRS  = $OWN_DIRS
foreach ($name in $OLD_FLAT_FILES) {
    $p = Join-Path $OLD_FLAT $name
    if (Test-Path $p) {
        try { Remove-Item $p -Force -ErrorAction Stop }
        catch { Write-Warning "Could not remove legacy flat $p — file likely in use. Skipping." }
    }
}
foreach ($dir in $OLD_FLAT_DIRS) {
    $p = Join-Path $OLD_FLAT $dir
    if (Test-Path $p) {
        try { Remove-Item $p -Recurse -Force -ErrorAction Stop }
        catch { Write-Warning "Could not remove legacy flat $p — folder likely in use. Skipping." }
    }
}
# Mirror only the allowlisted files from build/ → dist/
# perfectwall-server/. We deliberately do NOT use
# `Copy-Item *` because build/ also contains debug
# artefacts (perfectwall-server.pdb) and any future
# Costura leftovers that should not be shipped.
foreach ($name in $OWN_FILES + $OWN_DLLS + $TRANSITIVE_DLLS) {
    $src = Join-Path $BUILD_DIR $name
    $dst = Join-Path $SERVER_DIST $name
    if (Test-Path $src) {
        # Tolerate in-use files: if wallpaper64.exe is
        # still holding perfectwall-server.exe open (the
        # common case when the wallpaper is running), we
        # skip rather than aborting the whole script.
        # The new build will take effect on the next
        # wallpaper restart.
        try { Copy-Item -Path $src -Destination $dst -Force -ErrorAction Stop }
        catch { Write-Warning "Could not refresh $dst — file likely in use. Continuing; the change will apply on next restart." }
    }
}
# Mirror directory bundles. These are read at runtime
# (ResourceManager.CreateFileBasedResourceManager) so
# adding a new culture is just "drop a Strings.<culture>.resx
# into src/server-dotnet/Loc/ and rerun this script".
# We delete the destination folder first so removed
# cultures don't linger in dist/perfectwall-server/.
foreach ($dir in $OWN_DIRS) {
    $src = Join-Path $BUILD_DIR $dir
    $dst = Join-Path $SERVER_DIST $dir
    if (Test-Path $dst) {
        try { Remove-Item $dst -Recurse -Force -ErrorAction Stop }
        catch { Write-Warning "Could not clear $dst — folder likely in use. Continuing; the change will apply on next restart." }
    }
    if (Test-Path $src) {
        try { Copy-Item -Path $src -Destination $dst -Recurse -Force -ErrorAction Stop }
        catch { Write-Warning "Could not refresh $dst — folder likely in use. Continuing; the change will apply on next restart." }
    }
}
# Note: there is no launch-*.cmd in dist/ anymore. The user
# launches perfectwall-server.exe directly from Explorer:
#   * double-click  → user mode
#   * right-click + Run as administrator → admin mode
# The EXE itself auto-detects which mode to use.

Write-Host ""
Write-Host "Build complete!"
Write-Host "Intermediate: $BUILD_DIR/perfectwall-server.exe"
Write-Host "Final:        $SERVER_DIST/perfectwall-server.exe"
$exe = Join-Path $SERVER_DIST "perfectwall-server.exe"
if (Test-Path $exe) {
    Get-Item $exe | ForEach-Object { Write-Host ("EXE size: {0:N2} KB" -f ($_.Length / 1KB)) }
}
# Server payload = everything under $SERVER_DIST only.
# We deliberately do not include the rest of dist/
# (TS bundle, style/, source/, etc.) because that is
# the TypeScript build's territory, not ours.
$serverBytes = if (Test-Path $SERVER_DIST) {
    (Get-ChildItem $SERVER_DIST -Recurse -File | Measure-Object Length -Sum).Sum
} else { 0 }
$buildBytes = (Get-ChildItem $BUILD_DIR -Recurse -File | Measure-Object Length -Sum).Sum
Write-Host ("build/                       size: {0:N2} KB" -f ($buildBytes / 1KB))
Write-Host ("dist/perfectwall-server/     size: {0:N2} KB" -f ($serverBytes / 1KB))
