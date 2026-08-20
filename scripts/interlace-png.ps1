<#
.SYNOPSIS
    将 PNG 图片批量转换为 Adam7 交错格式（渐进式加载）。

.DESCRIPTION
    Wallpaper Engine 中交错 PNG 可以渐进式加载，提升大图显示体验。
    使用 OptiPNG 的 -i 1 参数实现（Pillow 12.x 不支持写入交错 PNG）。

.PARAMETER Path
    要处理的图片目录（默认: 项目 update/ 目录）。

.PARAMETER OptiPng
    optipng.exe 路径。不指定时自动探测：
    1. PATH 中的 optipng
    2. winget 安装目录 (WinGet\Packages\OptiPNG.*)

.PARAMETER Level
    OptiPNG 优化级别 0-7（默认 2，速度/效果平衡；大图建议 2，小图可用 7）。

.PARAMETER Backup
    处理前将原图备份到 <Path>\.interlace-backup\。

.EXAMPLE
    .\scripts\interlace-png.ps1

.EXAMPLE
    .\scripts\interlace-png.ps1 -Path "source\imgs" -Level 7 -Backup
#>
param(
    [string]$Path = "",
    [string]$OptiPng = "",
    [ValidateRange(0, 7)]
    [int]$Level = 2,
    [switch]$Backup
)

$ErrorActionPreference = "Stop"

# 默认处理项目 update/ 目录
if (-not $Path) {
    $Path = Join-Path $PSScriptRoot "..\update"
}
$Path = (Resolve-Path $Path).Path

# ---- 定位 optipng ----
if (-not $OptiPng) {
    $cmd = Get-Command optipng -ErrorAction SilentlyContinue
    if ($cmd) {
        $OptiPng = $cmd.Source
    } else {
        $OptiPng = Get-ChildItem "$env:LOCALAPPDATA\Microsoft\WinGet\Packages" `
            -Recurse -Filter "optipng.exe" -ErrorAction SilentlyContinue |
            Select-Object -First 1 -ExpandProperty FullName
    }
}
if (-not $OptiPng -or -not (Test-Path $OptiPng)) {
    Write-Error "未找到 optipng.exe，请安装: winget install OptiPNG.OptiPNG 或通过 -OptiPng 指定路径"
    exit 1
}
Write-Host "使用 OptiPNG: $OptiPng"

# ---- 收集 PNG ----
$files = Get-ChildItem $Path -Filter "*.png" -File
if (-not $files) {
    Write-Host "目录中没有 PNG 文件: $Path"
    exit 0
}
Write-Host "找到 $($files.Count) 个 PNG 文件，开始交错化 (level=$Level)..."

# ---- 备份 ----
if ($Backup) {
    $backupDir = Join-Path $Path ".interlace-backup"
    New-Item -ItemType Directory -Force -Path $backupDir | Out-Null
    foreach ($f in $files) {
        Copy-Item $f.FullName (Join-Path $backupDir $f.Name) -Force
    }
    Write-Host "原图已备份到: $backupDir"
}

# ---- 处理 ----
$changed = 0
foreach ($f in $files) {
    $bytes = [System.IO.File]::ReadAllBytes($f.FullName)
    $isInterlaced = $bytes.Length -gt 28 -and $bytes[28] -eq 1
    if ($isInterlaced) {
        Write-Host "[跳过] $($f.Name) 已是交错格式"
        continue
    }
    & $OptiPng -i 1 -o $Level -quiet $f.FullName 2>&1 | Out-Null
    if ($LASTEXITCODE -ne 0) {
        Write-Warning "[失败] $($f.Name) (exit=$LASTEXITCODE)"
        continue
    }
    $newSize = (Get-Item $f.FullName).Length
    $pct = [math]::Round(($newSize - $f.Length) / $f.Length * 100, 1)
    Write-Host "[完成] $($f.Name)  $($f.Length.ToString('N0')) -> $($newSize.ToString('N0')) bytes ($pct%)"
    $changed++
}

Write-Host ""
Write-Host "处理完成: $changed 个文件已交错化，$($files.Count - $changed) 个跳过/失败"