$enc = New-Object System.Text.UTF8Encoding($false)
$content = [System.IO.File]::ReadAllText("sysmon-card-preview.html", $enc)
$lines = $content -split "`r`n"
Write-Host "Total lines: $($lines.Count)"
Write-Host ""
Write-Host "Current CPU/GPU/NET spark-cell lines:"
$out = @()
for ($i = 0; $i -lt $lines.Count; $i++) {
    $L = $lines[$i]
    if ($L -match "spark-cell|data-spark=(cpu|gpu|net)") {
        $line = "L{0,4}: {1}" -f ($i+1), $L.Trim()
        $out += $line
        Write-Output $line
    }
}
$out | Out-File -FilePath "survey.txt" -Encoding utf8
