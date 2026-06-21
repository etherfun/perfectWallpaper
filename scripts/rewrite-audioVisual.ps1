$path = 'D:\SOFT\steam\steamapps\common\wallpaper_engine\projects\myprojects\perfectwall\src\propertyHandlers\audioVisualPropertyHandler.ts'
$content = Get-Content $path -Raw

# Replace `config.X =` (where X is a single lowercase identifier, NOT config.runtime) with `patch.X =`
$content = [regex]::Replace($content, '(?m)^(\s*)config\.([a-z_][a-z_0-9]*)(\s*=)', '$1patch.$2$3')

# Insert store/patch decl after the line `const wallpaper = config.runtime.wallpaper;`
$anchor = 'const wallpaper = config.runtime.wallpaper;'
$insert = "`n    const store = useConfigStore();`n    const patch: Record<string, unknown> = {};"
if ($content -notmatch 'const store = useConfigStore\(\)') {
    $content = $content.Replace($anchor, $anchor + $insert)
}

# Append batched patch before the final closing brace of the function.
# Anchor: `logInitComplete('[AudioVisual]', ...)`
$appendAnchor = "logInitComplete('[AudioVisual]', '闊抽鍙鍖?', FirstLoad);"
if ($content -notmatch 'if \(Object\.keys\(patch\)\.length > 0\)') {
    $append = "`n`n    if (Object.keys(patch).length > 0) {`n        store.`$patch(patch);`n    }"
    $content = $content.Replace($appendAnchor, $appendAnchor + $append)
}

# Replace import: add useConfigStore alongside config import
$content = $content.Replace(
    "import { config } from '@/utils/config';",
    "import { useConfigStore } from '@/stores/config';`r`nimport { config } from '@/utils/config'; // config.runtime preserved for runtime.param / runtime.PWLineParam (Stage 3.5-B)"
)

Set-Content -Path $path -Value $content -NoNewline
Write-Host "=== after rewrite ==="
Write-Host "patch.X count: $(([regex]::Matches($content, 'patch\.[a-z_][a-z_0-9]*\s*=')).Count)"
Write-Host "useConfigStore count: $(([regex]::Matches($content, 'useConfigStore')).Count)"
Write-Host "store.`$patch count: $(([regex]::Matches($content, 'store\.\`$patch')).Count)"
