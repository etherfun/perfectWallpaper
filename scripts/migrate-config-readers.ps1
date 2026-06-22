# migrate-config-readers.ps1
# Stage 3.5-A: migrate modules that read config.xxx but don't write.
#
# Strategy:
#   1. If file imports `config` from utils/config, replace with `useConfigStore` import.
#   2. If file has any `config.xxx` READS (not writes, not config.runtime, not config.wallpaper_settings):
#      - Insert `const config = useConfigStore();` at top of file (after imports).
#      - Keep runtime/wallpaper_settings accesses untouched (those need separate migration).
#   3. Skip files that only use `config.runtime.*` (handled separately).

param(
    [Parameter(Mandatory=$true)][string[]]$Files
)

foreach ($file in $Files) {
    $path = Join-Path 'D:\SOFT\steam\steamapps\common\wallpaper_engine\projects\myprojects\perfectwall' $file
    if (-not (Test-Path $path)) { Write-Host "[skip] $file not found"; continue }
    $content = Get-Content $path -Raw

    # Find Pinia-eligible config.xxx reads (no runtime, no wallpaper_settings, no assignment)
    $pattern = '(?<![\w\.])(config\.[a-z_][a-z_0-9]*)'
    $matches = [regex]::Matches($content, $pattern)

    $piniaFields = @()
    foreach ($m in $matches) {
        $field = $m.Value
        if ($field -in @('config.runtime','config.wallpaper_settings')) { continue }
        if ($field -match '^\s*config\.\w+\s*$') { } # always match
        $fieldName = $field.Substring(7)  # strip "config."
        if ($fieldName -notmatch '^(runtime|wallpaper_settings)$') {
            $piniaFields += $fieldName
        }
    }
    $piniaFields = $piniaFields | Sort-Object -Unique

    if ($piniaFields.Count -eq 0) {
        Write-Host "[skip] $file — no Pinia-eligible config reads"
        continue
    }

    # Replace `import { config } from '...utils/config';` with `import { useConfigStore } from '@/stores/config';`
    $content = [regex]::Replace($content, "import \{ config \} from ('[^']*utils/config');", "import { useConfigStore } from '@/stores/config';")
    # Also handle `import { config as something } from ...`
    $content = [regex]::Replace($content, "import \{ config as (\w+) \} from ('[^']*utils/config');", "import { useConfigStore } from '@/stores/config'; // alias removed; const `$1 = useConfigStore()")

    # Insert `const config = useConfigStore();` right after the last import line
    if ($content -notmatch 'const config = useConfigStore\(\)') {
        # Find last import statement ending with semicolon
        $insert = "`n`nconst config = useConfigStore();"
        # Place after the last `import ... ;` line
        $regex = [regex]::Match($content, "(?ms)^(.*?)(^[^/].*?;\s*$)", 'Multiline')
        # Simpler: find last import; insert after it.
        $importRegex = [regex]::Match($content, '(?ms)^(import .*?;\s*$\n)+')
        if ($importRegex.Success) {
            $insertAt = $importRegex.Index + $importRegex.Length
            $content = $content.Insert($insertAt, $insert)
        } else {
            # No imports — prepend
            $content = $insert + "`n`n" + $content
        }
    }

    Set-Content -Path $path -Value $content -NoNewline
    Write-Host "[done] $file — added const config = useConfigStore() for $($piniaFields.Count) fields"
}
