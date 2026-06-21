#!/usr/bin/env pwsh
# Stage 3-A bulk migration: replace `import { i18n } from '...utils/i18n'`
# with `import { globalT } from '@/i18n'` in systemMonitor files, then replace
# every `i18n(` call with `globalT(`. Same regex pattern as stage 2.

$ErrorActionPreference = 'Stop'
$enc = New-Object System.Text.UTF8Encoding($false)

$files = @(
    @{ path = 'src\systemMonitor\SystemMonitor.ts'; relImport = '@/utils/i18n' }
    @{ path = 'src\systemMonitor\cardRenderer.ts'; relImport = '@/utils/i18n' }
)

foreach ($f in $files) {
    $abs = Join-Path (Get-Location) $f.path
    if (-not (Test-Path $abs)) { Write-Warning "missing: $($f.path)"; continue }

    $content = [System.IO.File]::ReadAllText($abs, $enc)

    $oldImport = "import { i18n } from $($f.relImport.Replace('/', '\'));"
    $newImport = "import { globalT } from '@/i18n';"

    if ($content.Contains($oldImport)) {
        $content = $content.Replace($oldImport, $newImport)
    } else {
        # Generic pattern fallback
        $content = [regex]::Replace(
            $content,
            "import\s*\{\s*i18n\s*\}\s*from\s*'[^']*';",
            $newImport
        )
    }

    $pattern = '\bi18n\s*\('
    $matches = [regex]::Matches($content, $pattern)
    if ($matches.Count -gt 0) {
        $content = [regex]::Replace($content, $pattern, 'globalT(')
    }

    [System.IO.File]::WriteAllText($abs, $content, $enc)
    Write-Host "  $($f.path): $($matches.Count) i18n( -> globalT( replacements"
}
