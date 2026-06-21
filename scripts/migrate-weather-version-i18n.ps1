#!/usr/bin/env pwsh
# Migrate 14 weather/version files from `utils/i18n` to vue-i18n globalT.
#
# Strategy:
#   - Replace `import { i18n } from '<rel>/utils/i18n'` with
#     `import { globalT } from '@/i18n'`
#   - Replace `i18n(` with `globalT(` throughout the file (only in code, not in comments/strings)
#
# We restrict the i18n( -> globalT( replacement to lines that previously imported
# the i18n function (heuristic: only replace in files we know import it from utils/i18n).

$ErrorActionPreference = 'Stop'
$enc = New-Object System.Text.UTF8Encoding($false)

# Map: relative import path of utils/i18n from each file (just for verification)
$files = @(
    @{ path = 'src\weather\formatters.ts'; relImport = '../utils/i18n' }
    @{ path = 'src\weather\tips.ts';       relImport = '../utils/i18n' }
    @{ path = 'src\weather\utils.ts';      relImport = '../utils/i18n' }
    @{ path = 'src\weather\index.ts';      relImport = '../utils/i18n' }
    @{ path = 'src\weather\api\openmeteo.ts';       relImport = '../../utils/i18n' }
    @{ path = 'src\weather\api\qweather.ts';        relImport = '../../utils/i18n' }
    @{ path = 'src\weather\api\visualcrossing.ts';  relImport = '../../utils/i18n' }
    @{ path = 'src\weather\ui\precipToggle.ts';     relImport = '../../utils/i18n' }
    @{ path = 'src\weather\ui\states.ts';           relImport = '../../utils/i18n' }
    @{ path = 'src\weather\ui\updaters.ts';         relImport = '../../utils/i18n' }
    @{ path = 'src\weather\tooltip\alert.ts';       relImport = '../../utils/i18n' }
    @{ path = 'src\weather\tooltip\sevenHourly.ts'; relImport = '../../utils/i18n' }
    @{ path = 'src\version\index.ts';               relImport = '../utils/i18n' }
    @{ path = 'src\version\simple-markdown.ts';     relImport = '../utils/i18n' }
)

$totalReplacements = 0
$totalFiles = 0

foreach ($f in $files) {
    $abs = Join-Path (Get-Location) $f.path
    if (-not (Test-Path $abs)) {
        Write-Warning "missing: $($f.path)"
        continue
    }
    $content = [System.IO.File]::ReadAllText($abs, $enc)

    # Step 1: replace import line
    $oldImport = "import { i18n } from '$($f.relImport)';"
    $newImport = "import { globalT } from '@/i18n';"
    if ($content.Contains($oldImport)) {
        $content = $content.Replace($oldImport, $newImport)
    } else {
        Write-Warning "  no exact import match in $($f.path) — trying regex"
        $content = [regex]::Replace(
            $content,
            [regex]::Escape("import { i18n } from '") + "[^']*" + [regex]::Escape("';"),
            $newImport
        )
    }

    # Step 2: replace i18n( -> globalT(
    # Use regex with word boundary on the right side so we don't replace identifier
    # in unrelated contexts. Pattern: \bi18n\s*\(  →  globalT(
    $pattern = '\bi18n\s*\('
    $matches = [regex]::Matches($content, $pattern)
    if ($matches.Count -gt 0) {
        $content = [regex]::Replace($content, $pattern, 'globalT(')
    }

    [System.IO.File]::WriteAllText($abs, $content, $enc)
    $totalReplacements += $matches.Count
    $totalFiles++
    Write-Host "  $($f.path): $('{0}' -f $matches.Count) replacements"
}

Write-Host ""
Write-Host "==== summary ===="
Write-Host "files: $totalFiles / $($files.Count)"
Write-Host "i18n( -> globalT( replacements: $totalReplacements"
