# backup.ps1 — Sao lưu toàn bộ mã nguồn ra file .zip có đóng dấu thời gian.
#
# Chạy:  powershell -ExecutionPolicy Bypass -File scripts\backup.ps1
# Kết quả: _backup\thuexenhanh_yyyy-MM-dd_HHmmss.zip
#
# Bỏ qua: node_modules, dist, preview_offline.html, .git, *.rar, _backup
# Tự động xoá các bản sao lưu cũ, chỉ giữ lại 20 bản gần nhất.

$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $PSScriptRoot
$backupDir = Join-Path $root "_backup"
$stamp = Get-Date -Format "yyyy-MM-dd_HHmmss"
$zipPath = Join-Path $backupDir "thuexenhanh_$stamp.zip"
$staging = Join-Path $env:TEMP "txn_backup_$stamp"

$exclude = @("node_modules", "dist", ".git", "_backup", ".pnpm-store")
$excludeFiles = @("preview_offline.html")

Write-Host "Dang sao luu tu: $root"

if (-not (Test-Path $backupDir)) {
    New-Item -ItemType Directory -Path $backupDir | Out-Null
}
New-Item -ItemType Directory -Path $staging | Out-Null

try {
    $files = Get-ChildItem -Path $root -Recurse -File -Force | Where-Object {
        $rel = $_.FullName.Substring($root.Length).TrimStart('\')
        $parts = $rel.Split('\')
        $hitDir = $false
        foreach ($d in $exclude) { if ($parts -contains $d) { $hitDir = $true } }
        $hitFile = $excludeFiles -contains $_.Name
        $hitExt = $_.Extension -in @(".rar", ".zip", ".7z")
        (-not $hitDir) -and (-not $hitFile) -and (-not $hitExt)
    }

    if ($files.Count -eq 0) {
        Write-Host "Khong co file nao de sao luu."
        return
    }

    foreach ($f in $files) {
        $rel = $f.FullName.Substring($root.Length).TrimStart('\')
        $dest = Join-Path $staging $rel
        $destDir = Split-Path -Parent $dest
        if (-not (Test-Path $destDir)) { New-Item -ItemType Directory -Path $destDir -Force | Out-Null }
        Copy-Item -Path $f.FullName -Destination $dest -Force
    }

    Compress-Archive -Path (Join-Path $staging "*") -DestinationPath $zipPath -CompressionLevel Optimal

    $sizeMb = [math]::Round((Get-Item $zipPath).Length / 1MB, 2)
    Write-Host ""
    Write-Host "OK - Da sao luu $($files.Count) file"
    Write-Host "     $zipPath  ($sizeMb MB)"
}
finally {
    if (Test-Path $staging) { Remove-Item -Recurse -Force $staging }
}

# Chi giu 20 ban gan nhat
$old = Get-ChildItem -Path $backupDir -Filter "thuexenhanh_*.zip" |
       Sort-Object LastWriteTime -Descending |
       Select-Object -Skip 20
foreach ($o in $old) {
    Remove-Item $o.FullName -Force
    Write-Host "     Da xoa ban cu: $($o.Name)"
}
