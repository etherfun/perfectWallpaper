# migrate-config-imports.ps1
# Stage 3.5-A bulk: replace `import { config } from '...utils/config'` with `useConfigStore`,
# and insert `const config = useConfigStore();` after imports.

param([Parameter(Mandatory=$true)][string[]]$Files)

foreach ($file in $Files) {
    $path = Join-Path 'D:\SOFT\steam\steamapps\common\wallpaper_engine\projects\myprojects\perfectwall' $file
    if (-not (Test-Path $path)) { Write-Host "[skip] $file not found"; continue }
    $content = Get-Content $path -Raw

    # Replace the config import with useConfigStore
    $before = $content
    $content = [regex]::Replace($content, "import \{ config \} from ['`"][^'`"]*utils/config['`"];", "import { useConfigStore } from '@/stores/config';")
    # Handle `import { config as xxx } from '...utils/config'`
    $content = [regex]::Replace($content, "import \{ config as (\w+) \} from ['`"][^'`"]*utils/config['`"];", "import { useConfigStore } from '@/stores/config';")

    if ($content -eq $before) {
        Write-Host "[skip] $file — no config import matched"
        continue
    }

    # Skip if `useConfigStore` is already in scope (avoid double declaration)
    if ($content -notmatch 'const config = useConfigStore\(\)') {
        # Find last import; insert `const config = useConfigStore();` after it
        $lastImport = [regex]::Match($content, '(?ms)^(import .+?;\s*$\n)+')
        if ($lastImport.Success) {
            $insertAt = $lastImport.Index + $lastImport.Length
            $content = $content.Insert($insertAt, "`nconst config = useConfigStore();`n")
        }
    }

    Set-Content -Path $path -Value $content -NoNewline
    Write-Host "[done] $file"
}
